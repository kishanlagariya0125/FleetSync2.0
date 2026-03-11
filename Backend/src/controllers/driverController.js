const pool = require("../db/connection");
const service = require("../services/driverService");

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll(req.query, req.user.fleet_id);
    res.json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id, req.user.fleet_id);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

/* LOOKUP DRIVER BY EMAIL — fleet-scoped */
const lookupByEmail = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "email query param required" });

    const userRes = await pool.query(
      "SELECT id, name, role, fleet_id FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (!userRes.rows.length) {
      return res.status(404).json({ success: false, message: `No account found for email: ${email}` });
    }

    const user = userRes.rows[0];

    if (user.role !== "DRIVER") {
      return res.status(422).json({ success: false, message: `User "${user.name}" has role ${user.role}, not DRIVER` });
    }

    /* driver profile must exist and be in same fleet */
    const dRes = await pool.query(
      `SELECT d.*, (d.license_expiry < CURRENT_DATE) AS license_expired
       FROM drivers d
       WHERE d.user_id = $1 AND d.fleet_id = $2`,
      [user.id, req.user.fleet_id]
    );

    if (!dRes.rows.length) {
      return res.status(404).json({
        success: false,
        message: `No driver profile found in your fleet for "${user.name}"`,
      });
    }

    res.json({ success: true, data: { ...dRes.rows[0], user_name: user.name, user_email: email } });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body, req.user.fleet_id);
    res.status(201).json({ success: true, message: "Driver created", data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body, req.user.fleet_id);
    res.json({ success: true, message: "Driver updated", data });
  } catch (err) { next(err); }
};

const setStatus = async (req, res, next) => {
  try {
    const data = await service.setStatus(req.params.id, req.body.status, req.user.fleet_id);
    res.json({ success: true, message: "Driver status updated", data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.fleet_id);
    res.json({ success: true, message: "Driver deleted" });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, lookupByEmail, create, update, setStatus, remove };