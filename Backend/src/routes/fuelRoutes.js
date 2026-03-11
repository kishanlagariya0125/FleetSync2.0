const router = require("express").Router();
const controller = require("../controllers/fuelController");
const { authenticate, authorize, requireFleet } = require("../middleware/auth");

router.use(authenticate, requireFleet);

router.get("/", authorize("OWNER", "MANAGER", "FINANCE", "DISPATCHER"), controller.getAll);
router.get("/:id", authorize("OWNER", "MANAGER", "FINANCE", "DISPATCHER"), controller.getOne);
router.post("/", authorize("OWNER", "MANAGER", "FINANCE"), controller.create);
router.delete("/:id", authorize("OWNER", "MANAGER", "FINANCE"), controller.remove);

module.exports = router;