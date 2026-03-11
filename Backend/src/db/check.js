const pool = require("./connection");

(async () => {
  const res = await pool.query(
    `SELECT tablename FROM pg_tables WHERE schemaname='public'`
  );
  console.log("Tables:", res.rows);
  process.exit();
})();