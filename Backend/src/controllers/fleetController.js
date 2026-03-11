const fleetService = require("../services/fleetService");

/* POST /api/fleet — create fleet (OWNER only) */
const createFleet = async (req, res, next) => {
    try {
        const { fleetName } = req.body;
        if (!fleetName?.trim()) {
            return res.status(400).json({ success: false, message: "fleetName required" });
        }

        const fleet = await fleetService.createFleet({
            fleetName: fleetName.trim(),
            ownerId: req.user.id,
        });

        res.status(201).json({ success: true, message: "Fleet created", data: fleet });
    } catch (err) {
        next(err);
    }
};

/* GET /api/fleet/me — get current user's fleet info */
const getMyFleet = async (req, res, next) => {
    try {
        const fleet = await fleetService.getFleetInfo(req.user.fleet_id);
        res.json({ success: true, data: fleet });
    } catch (err) {
        next(err);
    }
};

/* GET /api/fleet/members — list all fleet members */
const listMembers = async (req, res, next) => {
    try {
        const members = await fleetService.listMembers(req.user.fleet_id);
        res.json({ success: true, data: members });
    } catch (err) {
        next(err);
    }
};

/* POST /api/fleet/assign — assign MANAGER / DISPATCHER / FINANCE */
const assignMember = async (req, res, next) => {
    try {
        const { email, role } = req.body;
        if (!email || !role) {
            return res.status(400).json({ success: false, message: "email and role required" });
        }

        const member = await fleetService.assignMember({
            fleetId: req.user.fleet_id,
            ownerId: req.user.id,
            email,
            role: role.toUpperCase(),
        });

        res.json({ success: true, message: `${role} assigned`, data: member });
    } catch (err) {
        next(err);
    }
};

/* POST /api/fleet/drivers — add driver to fleet */
const addDriver = async (req, res, next) => {
    try {
        const { email, name, license_number, license_expiry } = req.body;
        if (!email || !name || !license_number || !license_expiry) {
            return res.status(400).json({
                success: false,
                message: "email, name, license_number, license_expiry required",
            });
        }

        const driver = await fleetService.addDriver({
            fleetId: req.user.fleet_id,
            email,
            name,
            licenseNumber: license_number,
            licenseExpiry: license_expiry,
        });

        res.status(201).json({ success: true, message: "Driver added", data: driver });
    } catch (err) {
        next(err);
    }
};

/* DELETE /api/fleet/members/:userId — remove member */
const removeMember = async (req, res, next) => {
    try {
        const member = await fleetService.removeMember(req.user.fleet_id, req.params.userId);
        res.json({ success: true, message: "Member removed", data: member });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createFleet,
    getMyFleet,
    listMembers,
    assignMember,
    addDriver,
    removeMember,
};
