const router = require("express").Router();
const controller = require("../controllers/authController");
const { authenticate, authorize, requireFleet } = require("../middleware/auth");

/* POST /api/auth/register — create account (no fleet yet) */
router.post("/register", controller.register);

/* POST /api/auth/register-owner — create OWNER account + fleet in one step */
router.post("/register-owner", controller.registerOwner);

/* POST /api/auth/login */
router.post("/login", controller.login);

/* GET /api/auth/me */
router.get("/me", authenticate, controller.getMe);

/* GET /api/auth/lookup?email=... — check if email has an account */
router.get("/lookup", authenticate, controller.lookupByEmail);

/* GET /api/auth/users — list fleet members (OWNER/MANAGER) */
router.get(
   "/users",
   authenticate,
   requireFleet,
   authorize("OWNER", "MANAGER"),
   controller.listUsers
);

/* PATCH /api/auth/users/:id/status — activate/deactivate (OWNER/MANAGER) */
router.patch(
   "/users/:id/status",
   authenticate,
   requireFleet,
   authorize("OWNER", "MANAGER"),
   controller.setActive
);

module.exports = router;