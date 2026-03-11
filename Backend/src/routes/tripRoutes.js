const router = require("express").Router();
const controller = require("../controllers/tripController");
const { authenticate, authorize, requireFleet } = require("../middleware/auth");

router.use(authenticate, requireFleet);

router.get("/", authorize("OWNER", "MANAGER", "DISPATCHER", "DRIVER"), controller.getAll);
router.get("/:id", authorize("OWNER", "MANAGER", "DISPATCHER", "DRIVER"), controller.getOne);
router.post("/", authorize("OWNER", "MANAGER", "DISPATCHER"), controller.create);
router.post("/:id/dispatch", authorize("OWNER", "MANAGER", "DISPATCHER"), controller.dispatch);
router.post("/:id/complete", authorize("OWNER", "MANAGER", "DISPATCHER", "DRIVER"), controller.complete);
router.post("/:id/cancel", authorize("OWNER", "MANAGER", "DISPATCHER"), controller.cancel);

module.exports = router;