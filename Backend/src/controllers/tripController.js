const service = require("../services/tripService");

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll(req.query, req.user);
    res.json({ success: true, count: data.length, data });
  } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id, req.user);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body, req.user);
    res.status(201).json({ success: true, message: "Trip created", data });
  } catch (err) { next(err); }
};

const dispatch = async (req, res, next) => {
  try {
    const data = await service.dispatch(req.params.id, req.user.fleet_id);
    res.json({ success: true, message: "Trip dispatched", data });
  } catch (err) { next(err); }
};

const complete = async (req, res, next) => {
  try {
    const data = await service.complete(req.params.id, req.user);
    res.json({ success: true, message: "Trip completed", data });
  } catch (err) { next(err); }
};

const cancel = async (req, res, next) => {
  try {
    const data = await service.cancel(req.params.id, req.user.fleet_id);
    res.json({ success: true, message: "Trip cancelled", data });
  } catch (err) { next(err); }
};

module.exports = { getAll, getOne, create, dispatch, complete, cancel };