const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const fleetRoutes = require("./fleetRoutes");
const vehicleRoutes = require("./vehicleRoutes");
const driverRoutes = require("./driverRoutes");
const tripRoutes = require("./tripRoutes");
const maintenanceRoutes = require("./maintenanceRoutes");
const fuelRoutes = require("./fuelRoutes");
const analyticsRoutes = require("./analyticsRoutes");

/* AUTH */
router.use("/auth", authRoutes);

/* FLEET MANAGEMENT */
router.use("/fleet", fleetRoutes);

/* CORE MODULES */
router.use("/vehicles", vehicleRoutes);
router.use("/drivers", driverRoutes);
router.use("/trips", tripRoutes);

/* OPERATIONS */
router.use("/maintenance", maintenanceRoutes);
router.use("/fuel", fuelRoutes);

/* ANALYTICS */
router.use("/analytics", analyticsRoutes);

module.exports = router;