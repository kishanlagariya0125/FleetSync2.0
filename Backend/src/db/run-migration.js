/**
 * run-migration.js
 * Run from: Backend/
 *   node src/db/run-migration.js
 */
require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const pool = new Pool(
    process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
        : {
            host: process.env.DB_HOST || "localhost",
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || "fleetflow",
            user: process.env.DB_USER || "postgres",
            password: process.env.DB_PASSWORD || "system",
        }
);

(async () => {
    const sql = fs.readFileSync(
        path.join(__dirname, "migrate_multitenant.sql"),
        "utf8"
    );

    try {
        await pool.query(sql);
        console.log("✅ Multi-tenant migration completed successfully!");
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
})();
