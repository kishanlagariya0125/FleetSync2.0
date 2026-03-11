const pool = require("../db/connection");
const service = require("../services/maintenanceService");

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

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body, req.user.id, req.user.fleet_id);
    res.status(201).json({ success: true, message: "Maintenance logged. Vehicle moved to IN_SHOP", data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body, req.user.fleet_id);
    res.json({ success: true, message: "Maintenance log updated", data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.fleet_id);
    res.json({ success: true, message: "Maintenance log deleted" });
  } catch (err) { next(err); }
};

/* Release vehicle from maintenance — fleet-scoped */
const releaseVehicle = async (req, res, next) => {
  try {
    const result = await pool.query(
      `UPDATE vehicles SET status='AVAILABLE'
       WHERE id=$1 AND fleet_id=$2
       RETURNING *`,
      [req.params.vehicle_id, req.user.fleet_id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: "Vehicle not found in your fleet" });
    }

    res.json({ success: true, message: "Vehicle released to AVAILABLE", data: result.rows[0] });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, remove, releaseVehicle };