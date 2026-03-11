const { query } = require("../db/connection");

/* =========================================================
   All analytics queries are scoped to a single fleetId
========================================================= */

const getDashboard = async (fleetId) => {
  const [fleet, drivers, trips, maintenance, fuel] = await Promise.all([
    query(`
      SELECT
        COUNT(*) FILTER (WHERE status='AVAILABLE') AS available,
        COUNT(*) FILTER (WHERE status='ON_TRIP')   AS on_trip,
        COUNT(*) FILTER (WHERE status='IN_SHOP')   AS in_shop,
        COUNT(*) FILTER (WHERE status='RETIRED')   AS retired,
        COUNT(*) AS total
      FROM vehicles
      WHERE fleet_id = $1
    `, [fleetId]),

    query(`
      SELECT
        COUNT(*) FILTER (WHERE status='AVAILABLE') AS available,
        COUNT(*) FILTER (WHERE status='ON_TRIP')   AS on_trip,
        COUNT(*) FILTER (WHERE status='SUSPENDED') AS suspended,
        COUNT(*) FILTER (WHERE license_expiry < CURRENT_DATE) AS expired
      FROM drivers
      WHERE fleet_id = $1
    `, [fleetId]),

    query(`
      SELECT
        COUNT(*) FILTER (WHERE status='DRAFT')      AS draft,
        COUNT(*) FILTER (WHERE status='DISPATCHED') AS dispatched,
        COUNT(*) FILTER (WHERE status='COMPLETED')  AS completed,
        COUNT(*) FILTER (WHERE status='CANCELLED')  AS cancelled
      FROM trips
      WHERE fleet_id = $1
    `, [fleetId]),

    query(`
      SELECT COUNT(*) AS open_maintenance
      FROM maintenance_logs
      WHERE fleet_id = $1
    `, [fleetId]),

    query(`
      SELECT COALESCE(SUM(cost),0) AS total_fuel_cost
      FROM fuel_logs
      WHERE fleet_id = $1
    `, [fleetId]),
  ]);

  const f = fleet.rows[0];
  const utilization = f.total > 0 ? ((f.on_trip / f.total) * 100).toFixed(1) : "0";

  return {
    fleet: { ...f, utilization_pct: Number(utilization) },
    drivers: drivers.rows[0],
    trips: trips.rows[0],
    maintenance: maintenance.rows[0],
    fuel: fuel.rows[0],
  };
};

/* ─── FUEL EFFICIENCY ─── */
const getFuelEfficiency = async (fleetId, vehicle_id) => {
  const params = [fleetId];
  let where = "f.fleet_id = $1";

  if (vehicle_id) {
    params.push(vehicle_id);
    where += ` AND v.id = $${params.length}`;
  }

  const sql = `
    SELECT v.id, v.name, v.plate_number,
           COALESCE(SUM(f.liters),0) AS total_liters,
           COALESCE(SUM(f.cost),0)   AS total_cost
    FROM vehicles v
    LEFT JOIN fuel_logs f ON f.vehicle_id=v.id AND ${where}
    WHERE v.fleet_id = $1
    GROUP BY v.id
    ORDER BY total_cost DESC
  `;

  const result = await query(sql, params);
  return result.rows;
};

/* ─── COST PER VEHICLE ─── */
const getCostPerKm = async (fleetId, vehicle_id) => {
  const params = [fleetId];
  let extraWhere = "";

  if (vehicle_id) {
    params.push(vehicle_id);
    extraWhere = ` AND v.id = $${params.length}`;
  }

  const sql = `
    SELECT v.id, v.name, v.plate_number,
           COALESCE(SUM(f.cost),0) AS fuel_cost,
           COALESCE(SUM(m.cost),0) AS maintenance_cost,
           COALESCE(SUM(f.cost),0)+COALESCE(SUM(m.cost),0) AS total_cost
    FROM vehicles v
    LEFT JOIN fuel_logs        f ON f.vehicle_id=v.id AND f.fleet_id=$1
    LEFT JOIN maintenance_logs m ON m.vehicle_id=v.id AND m.fleet_id=$1
    WHERE v.fleet_id = $1${extraWhere}
    GROUP BY v.id
    ORDER BY total_cost DESC
  `;

  const result = await query(sql, params);
  return result.rows;
};

/* ─── VEHICLE ROI ─── */
const getVehicleROI = async (fleetId, vehicle_id) => {
  const params = [fleetId];
  let extraWhere = "";

  if (vehicle_id) {
    params.push(vehicle_id);
    extraWhere = ` AND v.id = $${params.length}`;
  }

  const sql = `
    SELECT v.id, v.name, v.plate_number,
           COUNT(t.id) FILTER (WHERE t.status='COMPLETED') AS completed_trips,
           COALESCE(SUM(f.cost),0) AS fuel_cost,
           COALESCE(SUM(m.cost),0) AS maintenance_cost,
           COALESCE(SUM(f.cost),0)+COALESCE(SUM(m.cost),0) AS total_cost
    FROM vehicles v
    LEFT JOIN trips            t ON t.vehicle_id=v.id AND t.fleet_id=$1
    LEFT JOIN fuel_logs        f ON f.vehicle_id=v.id AND f.fleet_id=$1
    LEFT JOIN maintenance_logs m ON m.vehicle_id=v.id AND m.fleet_id=$1
    WHERE v.fleet_id = $1${extraWhere}
    GROUP BY v.id
    ORDER BY completed_trips DESC
  `;

  const result = await query(sql, params);
  return result.rows;
};

/* ─── UTILIZATION ─── */
const getUtilization = async (fleetId) => {
  const result = await query(`
    SELECT
      TO_CHAR(created_at,'YYYY-MM') AS month,
      COUNT(*) FILTER (WHERE status='COMPLETED')  AS completed_trips,
      COUNT(*) FILTER (WHERE status='DISPATCHED') AS active_trips
    FROM trips
    WHERE fleet_id = $1
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `, [fleetId]);

  return result.rows;
};

/* ─── DRIVER PERFORMANCE ─── */
const getDriverPerformance = async (fleetId) => {
  const result = await query(`
    SELECT d.id, d.name, d.status, d.license_expiry,
           COUNT(t.id) FILTER (WHERE t.status='COMPLETED') AS trips_completed,
           COUNT(t.id) FILTER (WHERE t.status='DISPATCHED') AS active_trips,
           CASE WHEN d.license_expiry < CURRENT_DATE THEN true ELSE false END AS license_expired
    FROM drivers d
    LEFT JOIN trips t ON t.driver_id=d.id AND t.fleet_id=$1
    WHERE d.fleet_id = $1
    GROUP BY d.id
    ORDER BY trips_completed DESC
  `, [fleetId]);

  return result.rows;
};

/* ─── MONTHLY FINANCIAL SUMMARY ─── */
const getFinancialSummary = async (fleetId, year) => {
  const y = year || new Date().getFullYear();

  const result = await query(
    `
    SELECT
      TO_CHAR(gs.m,'YYYY-MM') AS month,
      COALESCE(f.fuel,0)  AS fuel_cost,
      COALESCE(m.maint,0) AS maintenance_cost,
      COALESCE(f.fuel,0)+COALESCE(m.maint,0) AS total_cost
    FROM generate_series(
      DATE '${y}-01-01',
      DATE '${y}-12-01',
      INTERVAL '1 month'
    ) gs(m)
    LEFT JOIN (
      SELECT DATE_TRUNC('month',created_at) mo, SUM(cost) AS fuel
      FROM fuel_logs
      WHERE fleet_id=$1 AND EXTRACT(YEAR FROM created_at)=$2
      GROUP BY mo
    ) f ON f.mo=gs.m
    LEFT JOIN (
      SELECT DATE_TRUNC('month',created_at) mo, SUM(cost) AS maint
      FROM maintenance_logs
      WHERE fleet_id=$1 AND EXTRACT(YEAR FROM created_at)=$2
      GROUP BY mo
    ) m ON m.mo=gs.m
    ORDER BY month
    `,
    [fleetId, y]
  );

  return result.rows;
};

module.exports = {
  getDashboard,
  getFuelEfficiency,
  getCostPerKm,
  getVehicleROI,
  getUtilization,
  getDriverPerformance,
  getFinancialSummary,
};