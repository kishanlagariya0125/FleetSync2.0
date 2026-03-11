const { query } = require("../db/connection");

const VALID_STATUSES = ["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"];

/* ───────────────── GET ALL (fleet-scoped) ───────────────── */
const getAll = async (filters = {}, fleetId) => {
  const params = [fleetId];
  const where = ["v.fleet_id = $1"];

  if (filters.status) {
    params.push(filters.status);
    where.push(`v.status = $${params.length}`);
  }

  const sql = `
    SELECT v.*,
           COUNT(t.id) FILTER (WHERE t.status='COMPLETED') AS total_trips
    FROM vehicles v
    LEFT JOIN trips t ON t.vehicle_id = v.id
    WHERE ${where.join(" AND ")}
    GROUP BY v.id
    ORDER BY v.created_at DESC
  `;

  const result = await query(sql, params);
  return result.rows;
};

/* ───────────────── GET BY ID (fleet-scoped) ───────────────── */
const getById = async (id, fleetId) => {
  const result = await query(
    `SELECT v.*,
            COUNT(t.id) FILTER (WHERE t.status='COMPLETED') AS total_trips,
            COALESCE(SUM(m.cost),0) AS total_maintenance_cost,
            COALESCE(SUM(f.cost),0) AS total_fuel_cost
     FROM vehicles v
     LEFT JOIN trips t ON t.vehicle_id = v.id
     LEFT JOIN maintenance_logs m ON m.vehicle_id = v.id
     LEFT JOIN fuel_logs f ON f.vehicle_id = v.id
     WHERE v.id = $1 AND v.fleet_id = $2
     GROUP BY v.id`,
    [id, fleetId]
  );

  if (!result.rows.length) {
    const err = new Error("Vehicle not found");
    err.status = 404;
    throw err;
  }
  return result.rows[0];
};

/* ───────────────── CREATE ───────────────── */
const create = async (data, fleetId) => {
  const { name, plate_number, capacity, status } = data;

  if (!name || !plate_number || !capacity) {
    const err = new Error("name, plate_number, capacity required");
    err.status = 400;
    throw err;
  }

  const result = await query(
    `INSERT INTO vehicles (fleet_id, name, plate_number, capacity, status)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [fleetId, name, plate_number, capacity, status || "AVAILABLE"]
  );
  return result.rows[0];
};

/* ───────────────── UPDATE ───────────────── */
const update = async (id, data, fleetId) => {
  const fields = ["name", "plate_number", "capacity", "status"];
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
    `UPDATE vehicles
     SET ${updates.join(", ")}
     WHERE id = $${params.length - 1} AND fleet_id = $${params.length}
     RETURNING *`,
    params
  );

  if (!result.rows.length) {
    const err = new Error("Vehicle not found");
    err.status = 404;
    throw err;
  }
  return result.rows[0];
};

/* ───────────────── SET STATUS ───────────────── */
const setStatus = async (id, status, fleetId) => {
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
    err.status = 400;
    throw err;
  }

  if (status === "ON_TRIP") {
    const err = new Error("Cannot manually set ON_TRIP. Dispatch a trip instead.");
    err.status = 400;
    throw err;
  }

  const result = await query(
    `UPDATE vehicles SET status=$1 WHERE id=$2 AND fleet_id=$3 RETURNING *`,
    [status, id, fleetId]
  );

  if (!result.rows.length) {
    const err = new Error("Vehicle not found");
    err.status = 404;
    throw err;
  }
  return result.rows[0];
};

/* ───────────────── DELETE ───────────────── */
const remove = async (id, fleetId) => {
  const vehicle = await query(
    "SELECT status FROM vehicles WHERE id=$1 AND fleet_id=$2",
    [id, fleetId]
  );

  if (!vehicle.rows.length) {
    const err = new Error("Vehicle not found");
    err.status = 404;
    throw err;
  }

  if (vehicle.rows[0].status === "ON_TRIP") {
    const err = new Error("Cannot delete vehicle currently ON_TRIP");
    err.status = 409;
    throw err;
  }

  await query("DELETE FROM vehicles WHERE id=$1 AND fleet_id=$2", [id, fleetId]);
};

module.exports = { getAll, getById, create, update, setStatus, remove };