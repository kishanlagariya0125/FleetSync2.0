const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../db/connection");
const fleetService = require("../services/fleetService");

/* ─── TOKEN ─── */
const signToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
  );

/* safe user shape (no password) */
const safe = (u) => {
  const { password, ...rest } = u;
  return rest;
};

/* =====================================================
   REGISTER — creates account only, no fleet yet
   POST /api/auth/register
   Body: { name, email, password, role }
   role defaults to "DRIVER" (or any non-OWNER role)
===================================================== */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "name, email and password are required" });
    }

    /* OWNER must use /register-owner */
    const validRoles = ["MANAGER", "DISPATCHER", "DRIVER", "FINANCE"];
    const userRole = validRoles.includes(role?.toUpperCase()) ? role.toUpperCase() : "DRIVER";

    /* duplicate email */
    const exists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.rows.length) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1,$2,$3,$4)
       RETURNING id, name, email, role, fleet_id, is_active, created_at`,
      [name, email, hashed, userRole]
    );

    const user = result.rows[0];
    const token = signToken(user);

    res.status(201).json({ success: true, message: "Account created", data: { user, token } });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   REGISTER AS FLEET OWNER
   POST /api/auth/register-owner
   Body: { name, email, password, fleetName }
   Creates user with role=OWNER, then creates fleet.
===================================================== */
const registerOwner = async (req, res, next) => {
  try {
    const { name, email, password, fleetName } = req.body;

    if (!name || !email || !password || !fleetName) {
      return res.status(400).json({
        success: false,
        message: "name, email, password, fleetName are required",
      });
    }

    const exists = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (exists.rows.length) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    /* create OWNER account (fleet_id still null) */
    const uRes = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1,$2,$3,'OWNER')
       RETURNING id, name, email, role, fleet_id, is_active, created_at`,
      [name, email, hashed]
    );
    const user = uRes.rows[0];

    /* create fleet & update user.fleet_id atomically */
    const fleet = await fleetService.createFleet({ fleetName, ownerId: user.id });

    /* re-fetch user with fleet_id filled */
    const uRefetch = await pool.query(
      `SELECT id, name, email, role, fleet_id, is_active, created_at FROM users WHERE id=$1`,
      [user.id]
    );
    const fullUser = uRefetch.rows[0];
    const token = signToken(fullUser);

    res.status(201).json({
      success: true,
      message: "Fleet owner account created",
      data: { user: fullUser, fleet, token },
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   LOGIN
   POST /api/auth/login
===================================================== */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password required" });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: "Account disabled. Contact your fleet manager." });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const safeUser = safe(user);
    const token = signToken(safeUser);

    res.json({ success: true, message: "Login successful", data: { user: safeUser, token } });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   GET CURRENT USER
   GET /api/auth/me
===================================================== */
const getMe = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, fleet_id, is_active, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   LIST USERS IN SAME FLEET (OWNER / MANAGER)
   GET /api/auth/users
===================================================== */
const listUsers = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, fleet_id, is_active, created_at
       FROM users
       WHERE fleet_id = $1
       ORDER BY role, name`,
      [req.user.fleet_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   ACTIVATE / DEACTIVATE USER (OWNER / MANAGER)
   Only within same fleet
===================================================== */
const setActive = async (req, res, next) => {
  try {
    const { is_active } = req.body;

    const result = await pool.query(
      `UPDATE users SET is_active=$1
       WHERE id=$2 AND fleet_id=$3
       RETURNING id, name, email, role, is_active`,
      [is_active, req.params.id, req.user.fleet_id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "User not found in your fleet" });
    }

    res.json({ success: true, message: "User status updated", data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   LOOKUP USER BY EMAIL
   Used by fleet owner to verify an email exists before assigning
===================================================== */
const lookupByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "email query required" });

    const result = await pool.query(
      `SELECT id, name, email, role, fleet_id FROM users WHERE email=$1`,
      [email]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "No account found with that email" });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, registerOwner, login, getMe, listUsers, setActive, lookupByEmail };