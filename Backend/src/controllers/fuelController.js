const service = require("../services/fuelService");

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
    res.status(201).json({ success: true, message: "Fuel log created", data });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await service.remove(req.params.id, req.user.fleet_id);
    res.json({ success: true, message: "Fuel log deleted" });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, remove };