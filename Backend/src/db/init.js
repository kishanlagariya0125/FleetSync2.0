/**
 * initDB.js — runs on every server start
 *
 * Applies:
 *   1. schema.sql       — CREATE TABLE IF NOT EXISTS  (safe for fresh DBs)
 *   2. migrate_multitenant.sql  — ALTER TABLE IF NOT EXISTS (upgrades old DBs)
 *
 * Both files are sent as a single query to the driver.
 * pg's Pool.query() supports a single string with multiple statements
 * when you connect a raw client (not pool.query). We use pool.connect()
 * so the driver sends all SQL in one session.
 */
const fs = require("fs");
const path = require("path");
const { pool } = require("./connection");

async function runFile(client, label, filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  ${label}: file not found, skipping`);
    return;
  }
  const sql = fs.readFileSync(filePath, "utf8");
  await client.query(sql);
  console.log(`✅ ${label} applied`);
}

async function initDB() {
  const client = await pool.connect();
  try {
    console.log("🔧 Running DB initialisation…");

    await runFile(
      client,
      "Schema (CREATE TABLE IF NOT EXISTS)",
      path.join(__dirname, "schema.sql")
    );

    await runFile(
      client,
      "Migration (multi-tenant upgrade)",
      path.join(__dirname, "migrate_multitenant.sql")
    );

    console.log("✅ Database ready");
  } catch (err) {
    console.error("❌ DB init error:", err.message);
    // Don't crash the server — app can still run if tables already exist
  } finally {
    client.release();
  }
}

module.exports = initDB;