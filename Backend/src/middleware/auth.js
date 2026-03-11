const jwt = require("jsonwebtoken");
const { pool } = require("../db/connection");

/* =====================================================
   AUTHENTICATE
   - verifies JWT
   - checks user exists + is_active
   - attaches full user row to req.user (incl. fleet_id)
===================================================== */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const token = header.split(" ")[1];

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }

    const result = await pool.query(
      "SELECT id, name, email, role, fleet_id, is_active FROM users WHERE id = $1",
      [payload.id]
    );

    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: "Account disabled" });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   AUTHORIZE (role check)
   Usage: authorize("OWNER","MANAGER")
   OWNER is allowed everything their subordinates can do
===================================================== */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const role = req.user.role;

    /* OWNER has full access to all routes */
    if (role === "OWNER" || allowedRoles.includes(role)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Forbidden: requires ${allowedRoles.join(" or ")}`,
    });
  };
};

/* =====================================================
   REQUIRE FLEET
   Blocks any user not yet assigned to a fleet.
   This prevents OWNER from accessing fleet data
   before fleet creation completes.
===================================================== */
const requireFleet = (req, res, next) => {
  if (!req.user?.fleet_id) {
    return res.status(403).json({
      success: false,
      message: "You are not assigned to a fleet. Create or join a fleet first.",
      code: "NO_FLEET",
    });
  }
  next();
};

module.exports = { authenticate, authorize, requireFleet };