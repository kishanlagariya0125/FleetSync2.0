const { query, getClient } = require("../db/connection");

/* ───────────────── GET ALL (fleet-scoped) ───────────────── */
const getAll = async (filters = {}, user) => {
  const fleetId = user.fleet_id;
  const params = [fleetId];
  const where = ["t.fleet_id = $1"];

  if (filters.status) {
    params.push(filters.status);
    where.push(`t.status = $${params.length}`);
  }

  if (filters.vehicle_id) {
    params.push(filters.vehicle_id);
    where.push(`t.vehicle_id = $${params.length}`);
  }

  if (filters.driver_id) {
    params.push(filters.driver_id);
    where.push(`t.driver_id = $${params.length}`);
  }

  /* DRIVER → own trips only */
  if (user?.role === "DRIVER") {
    /* find driver profile by user_id */
    const d = await query(
      "SELECT id FROM drivers WHERE user_id=$1 AND fleet_id=$2",
      [user.id, fleetId]
    );
    if (d.rows.length) {
      params.push(d.rows[0].id);
      where.push(`t.driver_id = $${params.length}`);
    } else {
      return []; /* driver has no profile yet */
    }
  }

  const sql = `
    SELECT t.*,
           v.name AS vehicle_name, v.plate_number, v.capacity,
           d.name AS driver_name,
           u.name AS created_by_name
    FROM trips t
    LEFT JOIN vehicles v ON v.id = t.vehicle_id
    LEFT JOIN drivers  d ON d.id = t.driver_id
    LEFT JOIN users    u ON u.id = t.created_by
    WHERE ${where.join(" AND ")}
    ORDER BY t.created_at DESC
  `;

  const result = await query(sql, params);
  return result.rows;
};

/* ───────────────── GET BY ID (fleet-scoped) ───────────────── */
const getById = async (id, user) => {
  const fleetId = user.fleet_id;

  const result = await query(
    `SELECT t.*,
            v.name AS vehicle_name, v.plate_number, v.capacity,
            d.name AS driver_name,
            u.name AS created_by_name
     FROM trips t
     LEFT JOIN vehicles v ON v.id = t.vehicle_id
     LEFT JOIN drivers  d ON d.id = t.driver_id
     LEFT JOIN users    u ON u.id = t.created_by
     WHERE t.id = $1 AND t.fleet_id = $2`,
    [id, fleetId]
  );

  if (!result.rows.length) {
    const err = new Error("Trip not found");
    err.status = 404;
    throw err;
  }

  const trip = result.rows[0];

  /* DRIVER may only see own trip */
  if (user?.role === "DRIVER") {
    const d = await query("SELECT id FROM drivers WHERE user_id=$1", [user.id]);
    if (!d.rows.length || trip.driver_id !== d.rows[0].id) {
      const err = new Error("Access denied to this trip");
      err.status = 403;
      throw err;
    }
  }

  return trip;
};

/* ───────────────── CREATE (DRAFT) ───────────────── */
const create = async (data, user) => {
  const fleetId = user.fleet_id;
  const { vehicle_id, driver_id, origin, destination, cargo_weight } = data;

  if (!vehicle_id || !driver_id || !origin || !destination || !cargo_weight) {
    const err = new Error("vehicle_id, driver_id, origin, destination, cargo_weight required");
    err.status = 400;
    throw err;
  }

  const client = await getClient();
  try {
    await client.query("BEGIN");

    /* vehicle must belong to same fleet */
    const vRes = await client.query(
      "SELECT id, status, capacity FROM vehicles WHERE id=$1 AND fleet_id=$2 FOR UPDATE",
      [vehicle_id, fleetId]
    );
    if (!vRes.rows.length) throw Object.assign(new Error("Vehicle not found in your fleet"), { status: 404 });

    const vehicle = vRes.rows[0];
    if (vehicle.status !== "AVAILABLE") throw Object.assign(new Error(`Vehicle not available (${vehicle.status})`), { status: 409 });
    if (parseFloat(cargo_weight) > parseFloat(vehicle.capacity)) throw Object.assign(new Error(`Cargo exceeds vehicle capacity (${vehicle.capacity})`), { status: 422 });

    /* driver must belong to same fleet */
    const dRes = await client.query(
      "SELECT id, status, license_expiry FROM drivers WHERE id=$1 AND fleet_id=$2 FOR UPDATE",
      [driver_id, fleetId]
    );
    if (!dRes.rows.length) throw Object.assign(new Error("Driver not found in your fleet"), { status: 404 });

    const driver = dRes.rows[0];
    if (driver.status !== "AVAILABLE") throw Object.assign(new Error(`Driver not available (${driver.status})`), { status: 409 });
    if (driver.license_expiry < new Date()) throw Object.assign(new Error("Driver license expired"), { status: 422 });

    const tRes = await client.query(
      `INSERT INTO trips (fleet_id, vehicle_id, driver_id, origin, destination, cargo_weight, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,'DRAFT',$7)
       RETURNING *`,
      [fleetId, vehicle_id, driver_id, origin, destination, cargo_weight, user.id]
    );

    await client.query("COMMIT");
    return tRes.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* ───────────────── DISPATCH ───────────────── */
const dispatch = async (tripId, fleetId) => {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const tRes = await client.query(
      "SELECT * FROM trips WHERE id=$1 AND fleet_id=$2 FOR UPDATE",
      [tripId, fleetId]
    );
    if (!tRes.rows.length) throw Object.assign(new Error("Trip not found"), { status: 404 });

    const trip = tRes.rows[0];
    if (trip.status !== "DRAFT") throw Object.assign(new Error(`Trip not dispatchable (${trip.status})`), { status: 409 });

    await client.query("UPDATE vehicles SET status='ON_TRIP' WHERE id=$1", [trip.vehicle_id]);
    await client.query("UPDATE drivers SET status='ON_TRIP' WHERE id=$1", [trip.driver_id]);

    const updated = await client.query(
      "UPDATE trips SET status='DISPATCHED', dispatch_time=NOW() WHERE id=$1 RETURNING *",
      [tripId]
    );

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* ───────────────── COMPLETE ───────────────── */
const complete = async (tripId, user) => {
  const fleetId = user.fleet_id;
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const tRes = await client.query(
      "SELECT * FROM trips WHERE id=$1 AND fleet_id=$2 FOR UPDATE",
      [tripId, fleetId]
    );
    if (!tRes.rows.length) throw Object.assign(new Error("Trip not found"), { status: 404 });

    const trip = tRes.rows[0];

    if (user?.role === "DRIVER") {
      const d = await client.query("SELECT id FROM drivers WHERE user_id=$1", [user.id]);
      if (!d.rows.length || trip.driver_id !== d.rows[0].id) {
        throw Object.assign(new Error("You can complete only your trips"), { status: 403 });
      }
    }

    if (trip.status !== "DISPATCHED") throw Object.assign(new Error(`Trip not completable (${trip.status})`), { status: 409 });

    await client.query("UPDATE vehicles SET status='AVAILABLE' WHERE id=$1", [trip.vehicle_id]);
    await client.query("UPDATE drivers SET status='AVAILABLE' WHERE id=$1", [trip.driver_id]);

    const updated = await client.query(
      "UPDATE trips SET status='COMPLETED', complete_time=NOW() WHERE id=$1 RETURNING *",
      [tripId]
    );

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

/* ───────────────── CANCEL ───────────────── */
const cancel = async (tripId, fleetId) => {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const tRes = await client.query(
      "SELECT * FROM trips WHERE id=$1 AND fleet_id=$2 FOR UPDATE",
      [tripId, fleetId]
    );
    if (!tRes.rows.length) throw Object.assign(new Error("Trip not found"), { status: 404 });

    const trip = tRes.rows[0];

    if (!["DRAFT", "DISPATCHED"].includes(trip.status)) {
      throw Object.assign(new Error(`Cannot cancel (${trip.status})`), { status: 409 });
    }

    if (trip.status === "DISPATCHED") {
      await client.query("UPDATE vehicles SET status='AVAILABLE' WHERE id=$1", [trip.vehicle_id]);
      await client.query("UPDATE drivers SET status='AVAILABLE' WHERE id=$1", [trip.driver_id]);
    }

    await client.query("UPDATE trips SET status='CANCELLED' WHERE id=$1", [tripId]);

    await client.query("COMMIT");
    return { message: "Trip cancelled" };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

module.exports = { getAll, getById, create, dispatch, complete, cancel };