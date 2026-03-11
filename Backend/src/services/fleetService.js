const { query, getClient } = require("../db/connection");

/* =====================================================
   CREATE FLEET
   Called right after OWNER registration.
   - Creates fleet row
   - Assigns owner
   - Sets owner.fleet_id
===================================================== */
const createFleet = async ({ fleetName, ownerId }) => {
    const client = await getClient();
    try {
        await client.query("BEGIN");

        /* prevent owner creating a second fleet */
        const existing = await client.query(
            "SELECT id FROM fleets WHERE owner_id = $1",
            [ownerId]
        );
        if (existing.rows.length) {
            const err = new Error("You already own a fleet");
            err.status = 409;
            throw err;
        }

        /* create fleet */
        const fRes = await client.query(
            `INSERT INTO fleets (fleet_name, owner_id) VALUES ($1,$2) RETURNING *`,
            [fleetName, ownerId]
        );
        const fleet = fRes.rows[0];

        /* assign fleet to owner user */
        await client.query(
            "UPDATE users SET fleet_id = $1 WHERE id = $2",
            [fleet.id, ownerId]
        );

        await client.query("COMMIT");
        return fleet;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

/* =====================================================
   GET FLEET INFO (for current user's fleet)
===================================================== */
const getFleetInfo = async (fleetId) => {
    const result = await query(
        `SELECT f.*,
            u.name  AS owner_name,
            u.email AS owner_email,
            (SELECT COUNT(*) FROM users WHERE fleet_id=f.id) AS member_count
     FROM fleets f
     LEFT JOIN users u ON u.id = f.owner_id
     WHERE f.id = $1`,
        [fleetId]
    );

    if (!result.rows.length) {
        const err = new Error("Fleet not found");
        err.status = 404;
        throw err;
    }
    return result.rows[0];
};

/* =====================================================
   ASSIGN ROLE MEMBER
   OWNER assigns manager/dispatcher/finance to fleet.
   Rules:
     - target user must exist
     - target user must NOT already belong to another fleet
     - only one MANAGER / DISPATCHER / FINANCE per fleet
===================================================== */
const assignMember = async ({ fleetId, ownerId, email, role }) => {
    const ASSIGNABLE = ["MANAGER", "DISPATCHER", "FINANCE"];
    if (!ASSIGNABLE.includes(role)) {
        const err = new Error(`Role must be one of: ${ASSIGNABLE.join(", ")}`);
        err.status = 400;
        throw err;
    }

    const client = await getClient();
    try {
        await client.query("BEGIN");

        /* find target user */
        const uRes = await client.query(
            "SELECT id, fleet_id, role FROM users WHERE email = $1",
            [email]
        );
        if (!uRes.rows.length) {
            const err = new Error("No account found with that email");
            err.status = 404;
            throw err;
        }

        const target = uRes.rows[0];

        /* prevent multi-fleet membership */
        if (target.fleet_id && target.fleet_id !== fleetId) {
            const err = new Error("User already belongs to another fleet");
            err.status = 409;
            throw err;
        }

        /* already in this fleet with same role */
        if (target.fleet_id === fleetId && target.role === role) {
            const err = new Error(`User is already ${role} of this fleet`);
            err.status = 409;
            throw err;
        }

        /* enforce one-per-fleet for single-seat roles */
        const SINGLE_SEAT = ["MANAGER", "DISPATCHER", "FINANCE"];
        if (SINGLE_SEAT.includes(role)) {
            const existing = await client.query(
                "SELECT id FROM users WHERE fleet_id=$1 AND role=$2",
                [fleetId, role]
            );
            if (existing.rows.length) {
                const err = new Error(`Fleet already has a ${role}. Remove them first.`);
                err.status = 409;
                throw err;
            }
        }

        /* assign */
        await client.query(
            "UPDATE users SET fleet_id=$1, role=$2 WHERE id=$3",
            [fleetId, role, target.id]
        );

        await client.query("COMMIT");

        const updated = await query(
            "SELECT id, name, email, role, fleet_id, is_active FROM users WHERE id=$1",
            [target.id]
        );
        return updated.rows[0];
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

/* =====================================================
   ADD DRIVER TO FLEET
   OWNER or MANAGER adds a driver (user with DRIVER role or email).
   - If user exists → assign fleet & driver profile
   - Creates driver profile row
===================================================== */
const addDriver = async ({ fleetId, email, name, licenseNumber, licenseExpiry }) => {
    const client = await getClient();
    try {
        await client.query("BEGIN");

        /* lookup user by email */
        const uRes = await client.query(
            "SELECT id, fleet_id, role FROM users WHERE email = $1",
            [email]
        );
        if (!uRes.rows.length) {
            const err = new Error("No account found with that email");
            err.status = 404;
            throw err;
        }

        const target = uRes.rows[0];

        if (target.fleet_id && target.fleet_id !== fleetId) {
            const err = new Error("User already belongs to another fleet");
            err.status = 409;
            throw err;
        }

        /* assign DRIVER role + fleet */
        await client.query(
            "UPDATE users SET fleet_id=$1, role='DRIVER' WHERE id=$2",
            [fleetId, target.id]
        );

        /* check for existing driver profile */
        const existing = await client.query(
            "SELECT id FROM drivers WHERE user_id=$1",
            [target.id]
        );

        let driver;
        if (existing.rows.length) {
            /* update existing profile */
            const dRes = await client.query(
                `UPDATE drivers
         SET fleet_id=$1, name=$2, license_number=$3, license_expiry=$4
         WHERE user_id=$5
         RETURNING *`,
                [fleetId, name, licenseNumber, licenseExpiry, target.id]
            );
            driver = dRes.rows[0];
        } else {
            /* create new profile */
            const dRes = await client.query(
                `INSERT INTO drivers (fleet_id, user_id, name, license_number, license_expiry)
         VALUES ($1,$2,$3,$4,$5)
         RETURNING *`,
                [fleetId, target.id, name, licenseNumber, licenseExpiry]
            );
            driver = dRes.rows[0];
        }

        await client.query("COMMIT");
        return driver;
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
};

/* =====================================================
   LIST FLEET MEMBERS
===================================================== */
const listMembers = async (fleetId) => {
    const result = await query(
        `SELECT id, name, email, role, is_active, created_at
     FROM users
     WHERE fleet_id = $1
     ORDER BY role, name`,
        [fleetId]
    );
    return result.rows;
};

/* =====================================================
   REMOVE MEMBER FROM FLEET
   (sets fleet_id=null, role='DRIVER' to neutral state)
===================================================== */
const removeMember = async (fleetId, userId) => {
    /* don't remove OWNER */
    const fleet = await query("SELECT owner_id FROM fleets WHERE id=$1", [fleetId]);
    if (fleet.rows[0]?.owner_id === parseInt(userId)) {
        const err = new Error("Cannot remove fleet owner");
        err.status = 400;
        throw err;
    }

    const result = await query(
        `UPDATE users
     SET fleet_id = NULL, role = 'DRIVER'
     WHERE id = $1 AND fleet_id = $2
     RETURNING id, name, email`,
        [userId, fleetId]
    );

    if (!result.rows.length) {
        const err = new Error("Member not found in this fleet");
        err.status = 404;
        throw err;
    }

    /* also clear their driver profile's fleet_id */
    await query(
        "UPDATE drivers SET fleet_id = NULL WHERE user_id = $1",
        [userId]
    );

    return result.rows[0];
};

module.exports = {
    createFleet,
    getFleetInfo,
    assignMember,
    addDriver,
    listMembers,
    removeMember,
};
