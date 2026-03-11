const router = require("express").Router();
const controller = require("../controllers/fleetController");
const { authenticate, authorize, requireFleet } = require("../middleware/auth");

router.use(authenticate);

/* POST /api/fleet — create fleet (OWNER who has no fleet yet) */
router.post("/", authorize("OWNER"), controller.createFleet);

/* All routes below require an existing fleet */
router.use(requireFleet);

/* GET /api/fleet/me */
router.get("/me", controller.getMyFleet);

/* GET /api/fleet/members */
router.get("/members", authorize("OWNER", "MANAGER"), controller.listMembers);

/* POST /api/fleet/assign — assign MANAGER / DISPATCHER / FINANCE */
router.post("/assign", authorize("OWNER"), controller.assignMember);

/* POST /api/fleet/drivers — add driver to fleet */
router.post("/drivers", authorize("OWNER", "MANAGER"), controller.addDriver);

/* DELETE /api/fleet/members/:userId */
router.delete("/members/:userId", authorize("OWNER"), controller.removeMember);

module.exports = router;
