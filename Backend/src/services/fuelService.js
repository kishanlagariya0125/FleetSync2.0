const { query } = require("../db/connection");

/* ───────────────── GET ALL (fleet-scoped) ───────────────── */
const getAll = async (filters = {}, fleetId) => {
  const params = [fleetId];
  const where = ["f.fleet_id = $1"];

  if (filters.vehicle_id) {
    params.push(filters.vehicle_id);
    where.push(`f.vehicle_id = $${params.length}`);
  }

  if (filters.trip_id) {
    params.push(filters.trip_id);
    where.push(`f.trip_id = $${params.length}`);
  }

  const sql = `
    SELECT f.*,
           v.name AS vehicle_name, v.plate_number,
           t.id   AS trip_ref,
           u.name AS created_by_name
    FROM fuel_logs f
    JOIN  vehicles v ON v.id = f.vehicle_id
    LEFT JOIN trips t ON t.id = f.trip_id
    LEFT JOIN users u ON u.id = f.created_by
    WHERE ${where.join(" AND ")}
    ORDER BY f.created_at DESC
  `;

  const result = await query(sql, params);
  return result.rows;
};

/* ───────────────── GET BY ID (fleet-scoped) ───────────────── */
const getById = async (id, fleetId) => {
  const result = await query(
    `SELECT f.*,
            v.name AS vehicle_name, v.plate_number,
            t.id   AS trip_ref,
            u.name AS created_by_name
     FROM fuel_logs f
     JOIN  vehicles v ON v.id = f.vehicle_id
     LEFT JOIN trips t ON t.id = f.trip_id
     LEFT JOIN users u ON u.id = f.created_by
     WHERE f.id = $1 AND f.fleet_id = $2`,
    [id, fleetId]
  );

  if (!result.rows.length) {
    const err = new Error("Fuel log not found");
    err.status = 404;
    throw err;
  }
  return result.rows[0];
};

/* ───────────────── CREATE ───────────────── */
const create = async (data, userId, fleetId) => {
  const { vehicle_id, trip_id, liters, cost } = data;

  if (!vehicle_id || !liters || !cost) {
    const err = new Error("vehicle_id, liters, cost required");
    err.status = 400;
    throw err;
  }

  /* vehicle must belong to same fleet */
  const v = await query("SELECT id FROM vehicles WHERE id=$1 AND fleet_id=$2", [vehicle_id, fleetId]);
  if (!v.rows.length) {
    const err = new Error("Vehicle not found in your fleet");
    err.status = 404;
    throw err;
  }

  if (trip_id) {
    const t = await query(
      "SELECT id FROM trips WHERE id=$1 AND vehicle_id=$2 AND fleet_id=$3",
      [trip_id, vehicle_id, fleetId]
    );
    if (!t.rows.length) {
      const err = new Error("Trip not found or does not belong to this vehicle/fleet");
      err.status = 400;
      throw err;
    }
  }

  const result = await query(
    `INSERT INTO fuel_logs (fleet_id, vehicle_id, trip_id, liters, cost, created_by)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [fleetId, vehicle_id, trip_id || null, liters, cost, userId || null]
  );
  return result.rows[0];
};

/* ───────────────── REMOVE ───────────────── */
const remove = async (id, fleetId) => {
  const result = await query(
    "DELETE FROM fuel_logs WHERE id=$1 AND fleet_id=$2 RETURNING id",
    [id, fleetId]
  );
  if (!result.rows.length) {
    const err = new Error("Fuel log not found");
    err.status = 404;
    throw err;
  }
};

module.exports = { getAll, getById, create, remove };