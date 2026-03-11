const router = require("express").Router();
const controller = require("../controllers/analyticsController");
const { authenticate, authorize, requireFleet } = require("../middleware/auth");

router.use(authenticate, requireFleet);

router.get("/dashboard", authorize("OWNER", "MANAGER", "DISPATCHER", "DRIVER", "FINANCE"), controller.dashboard);
router.get("/fuel-summary", authorize("OWNER", "MANAGER", "DISPATCHER", "FINANCE"), controller.fuelSummary);
router.get("/maintenance-summary", authorize("OWNER", "MANAGER", "DISPATCHER", "FINANCE"), controller.maintenanceSummary);
router.get("/trip-stats", authorize("OWNER", "MANAGER", "DISPATCHER", "FINANCE"), controller.tripStats);
router.get("/monthly-costs", authorize("OWNER", "MANAGER", "DISPATCHER", "FINANCE"), controller.monthlyCosts);

module.exports = router;