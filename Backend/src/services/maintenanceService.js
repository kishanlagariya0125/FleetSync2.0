const { query, getClient } = require("../db/connection");

/* ───────────────── GET ALL (fleet-scoped) ───────────────── */
const getAll = async (filters = {}, fleetId) => {
  const params = [fleetId];
  const where = ["m.fleet_id = $1"];

  if (filters.vehicle_id) {
    params.push(filters.vehicle_id);
    where.push(`m.vehicle_id = $${params.length}`);
  }

  const sql = `
    SELECT m.*,
           v.name AS vehicle_name, v.plate_number,
           u.name AS created_by_name
    FROM maintenance_logs m
    JOIN  vehicles v ON v.id = m.vehicle_id
    LEFT JOIN users u ON u.id = m.created_by
    WHERE ${where.join(" AND ")}
    ORDER BY m.created_at DESC
  `;

  const result = await query(sql, params);
  return result.rows;
};

/* ───────────────── GET BY ID (fleet-scoped) ───────────────── */
const getById = async (id, fleetId) => {
  const result = await query(
    `SELECT m.*,
            v.name AS vehicle_name, v.plate_number, v.status AS vehicle_status,
            u.name AS created_by_name
     FROM maintenance_logs m
     JOIN  vehicles v ON v.id = m.vehicle_id
     LEFT JOIN users u ON u.id = m.created_by
     WHERE m.id = $1 AND m.fleet_id = $2`,
    [id, fleetId]
  );

  if (!result.rows.length) {
    const err = new Error("Maintenance log not found");
    err.status = 404;
    throw err;
  }
  return result.rows[0];
};

/* ───────────────── CREATE → sets vehicle IN_SHOP ───────────────── */
const create = async (data, userId, fleetId) => {
  const { vehicle_id, description, cost } = data;

  if (!vehicle_id || !description) {
    const err = new Error("vehicle_id and description required");
    err.status = 400;
    throw err;
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");

    const vRes = await client.query(
      "SELECT id, status FROM vehicles WHERE id=$1 AND fleet_id=$2 FOR UPDATE",
      [vehicle_id, fleetId]
    );

    if (!vRes.rows.length) {
      const err = new Error("Vehicle not found in your fleet");
      err.status = 404;
      throw err;
    }

    if (vRes.rows[0].status === "ON_TRIP") {
      const err = new Error("Cannot log maintenance while vehicle ON_TRIP");
      err.status = 409;
      throw err;
    }

    const mRes = await client.query(
      `INSERT INTO maintenance_logs (fleet_id, vehicle_id, description, cost, created_by)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [fleetId, vehicle_id, description, cost || 0, userId || null]
    );

    await client.query("UPDATE vehicles SET status='IN_SHOP' WHERE id=$1", [vehicle_id]);

    await client.query("COMMIT");
    return mRes.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* ───────────────── UPDATE ───────────────── */
const update = async (id, data, fleetId) => {
  const fields = ["description", "cost"];
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
    `UPDATE maintenance_logs
     SET ${updates.join(", ")}
     WHERE id=$${params.length - 1} AND fleet_id=$${params.length}
     RETURNING *`,
    params
  );

  if (!result.rows.length) {
    const err = new Error("Maintenance log not found");
    err.status = 404;
    throw err;
  }
  return result.rows[0];
};

/* ───────────────── REMOVE → release vehicle ───────────────── */
const remove = async (id, fleetId) => {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const mRes = await client.query(
      "SELECT * FROM maintenance_logs WHERE id=$1 AND fleet_id=$2 FOR UPDATE",
      [id, fleetId]
    );
    if (!mRes.rows.length) {
      const err = new Error("Maintenance log not found");
      err.status = 404;
      throw err;
    }

    const log = mRes.rows[0];
    await client.query("DELETE FROM maintenance_logs WHERE id=$1", [id]);

    const remaining = await client.query(
      "SELECT COUNT(*) FROM maintenance_logs WHERE vehicle_id=$1 AND fleet_id=$2",
      [log.vehicle_id, fleetId]
    );

    if (parseInt(remaining.rows[0].count) === 0) {
      await client.query("UPDATE vehicles SET status='AVAILABLE' WHERE id=$1", [log.vehicle_id]);
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { getAll, getById, create, update, remove };