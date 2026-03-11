const service = require("../services/vehicleService");

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
    const data = await service.create(req.body, req.user.fleet_id);
    res.status(201).json({ success: true, message: "Vehicle created", data });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body, req.user.fleet_id);
    res.json({ success: true, message: "Vehicle updated", data });
  } catch (err) { next(err); }
};

const setStatus = async (req, res, next) => {
  try {
    const data = await service.setStatus(req.params.id, req.body.status, req.user.fleet_id);
    res.json({ success: true, message: "Status updated", data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.fleet_id);
    res.json({ success: true, message: "Vehicle deleted" });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, update, setStatus, remove };