const { query } = require("../db/connection");

const VALID_STATUSES = ["AVAILABLE", "ON_TRIP", "SUSPENDED"];

/* ───────────────── GET ALL (fleet-scoped) ───────────────── */
const getAll = async (filters = {}, fleetId) => {
  const params = [fleetId];
  const where = ["d.fleet_id = $1"];

  if (filters.status) {
    params.push(filters.status);
    where.push(`d.status = $${params.length}`);
  }

  const sql = `
    SELECT d.*,
           u.name AS user_name,
           u.email AS user_email,
           CASE WHEN d.license_expiry < CURRENT_DATE THEN true ELSE false END AS license_expired
    FROM drivers d
    LEFT JOIN users u ON u.id = d.user_id
    WHERE ${where.join(" AND ")}
    ORDER BY d.created_at DESC
  `;

  const result = await query(sql, params);
  return result.rows;
};

/* ───────────────── GET BY ID (fleet-scoped) ───────────────── */
const getById = async (id, fleetId) => {
  const result = await query(
    `SELECT d.*,
            u.name AS user_name,
            u.email AS user_email,
            CASE WHEN d.license_expiry < CURRENT_DATE THEN true ELSE false END AS license_expired
     FROM drivers d
     LEFT JOIN users u ON u.id = d.user_id
     WHERE d.id = $1 AND d.fleet_id = $2`,
    [id, fleetId]
  );

  if (!result.rows.length) {
    const err = new Error("Driver not found");
    err.status = 404;
    throw err;
  }
  return result.rows[0];
};

/* ───────────────── CREATE ───────────────── */
const create = async (data, fleetId) => {
  const { user_id, name, license_number, license_expiry } = data;

  if (!name || !license_number || !license_expiry) {
    const err = new Error("name, license_number, license_expiry required");
    err.status = 400;
    throw err;
  }

  if (user_id) {
    const u = await query("SELECT id FROM users WHERE id=$1 AND fleet_id=$2", [user_id, fleetId]);
    if (!u.rows.length) {
      const err = new Error("Linked user not found in this fleet");
      err.status = 404;
      throw err;
    }
  }

  const result = await query(
    `INSERT INTO drivers (fleet_id, user_id, name, license_number, license_expiry)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [fleetId, user_id || null, name, license_number, license_expiry]
  );
  return result.rows[0];
};

/* ───────────────── UPDATE ───────────────── */
const update = async (id, data, fleetId) => {
  const fields = ["user_id", "name", "license_number", "license_expiry"];
  const updates = [];
  const params = [];

  fields.forEach((f) => {
    if (data[f] !== undefined) {
      params.push(data[f]);
      updates.push(`${f} = $${params.length}`);
    }
  });

  if (!updates.length) {
    const err = new Error("No fields to update");
    err.status = 400;
    throw err;
  }

  params.push(id, fleetId);

  const result = await query(
    `UPDATE drivers
     SET ${updates.join(", ")}, updated_at = CURRENT_TIMESTAMP
     WHERE id = $${params.length - 1} AND fleet_id = $${params.length}
     RETURNING *`,
    params
  );

  if (!result.rows.length) {
    const err = new Error("Driver not found");
    err.status = 404;
    throw err;
  }
  return result.rows[0];
};

/* ───────────────── SET STATUS ───────────────── */
const setStatus = async (id, status, fleetId) => {
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Must be: ${VALID_STATUSES.join(", ")}`);
    err.status = 400;
    throw err;
  }

  if (status === "ON_TRIP") {
    const err = new Error("Driver ON_TRIP is controlled by trip dispatch");
    err.status = 400;
    throw err;
  }

  const result = await query(
    `UPDATE drivers SET status=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 AND fleet_id=$3 RETURNING *`,
    [status, id, fleetId]
  );

  if (!result.rows.length) {
    const err = new Error("Driver not found");
    err.status = 404;
    throw err;
  }
  return result.rows[0];
};

/* ───────────────── REMOVE ───────────────── */
const remove = async (id, fleetId) => {
  const driver = await getById(id, fleetId);

  if (driver.status === "ON_TRIP") {
    const err = new Error("Cannot delete driver currently ON_TRIP");
    err.status = 409;
    throw err;
  }

  await query("DELETE FROM drivers WHERE id=$1 AND fleet_id=$2", [id, fleetId]);
};

module.exports = { getAll, getById, create, update, setStatus, remove };