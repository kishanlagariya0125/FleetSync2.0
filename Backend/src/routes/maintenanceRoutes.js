const router = require("express").Router();
const controller = require("../controllers/maintenanceController");
const { authenticate, authorize, requireFleet } = require("../middleware/auth");

router.use(authenticate, requireFleet);

router.get("/", authorize("OWNER", "MANAGER", "DISPATCHER", "FINANCE"), controller.getAll);
router.get("/:id", authorize("OWNER", "MANAGER", "DISPATCHER", "FINANCE"), controller.getOne);
router.post("/", authorize("OWNER", "MANAGER"), controller.create);
router.put("/:id", authorize("OWNER", "MANAGER"), controller.update);
router.delete("/:id", authorize("OWNER", "MANAGER"), controller.remove);
router.post("/release/:vehicle_id", authorize("OWNER", "MANAGER"), controller.releaseVehicle);

module.exports = router;