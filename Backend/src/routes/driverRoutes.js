const router = require("express").Router();
const controller = require("../controllers/driverController");
const { authenticate, authorize, requireFleet } = require("../middleware/auth");

router.use(authenticate, requireFleet);

/* LOOKUP — must be before /:id */
router.get("/lookup", authorize("OWNER", "MANAGER", "DISPATCHER"), controller.lookupByEmail);

router.get("/", authorize("OWNER", "MANAGER", "DISPATCHER", "DRIVER", "FINANCE"), controller.getAll);
router.get("/:id", authorize("OWNER", "MANAGER", "DISPATCHER", "DRIVER", "FINANCE"), controller.getOne);
router.post("/", authorize("OWNER", "MANAGER"), controller.create);
router.put("/:id", authorize("OWNER", "MANAGER"), controller.update);
router.patch("/:id/status", authorize("OWNER", "MANAGER"), controller.setStatus);
router.delete("/:id", authorize("OWNER", "MANAGER"), controller.remove);

module.exports = router;