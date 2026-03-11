const app = require("./app");
const initDB = require("./db/init");

const PORT = process.env.PORT || 5000;

/* Run DB migrations first, then start HTTP server */
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 FleetFlow API running on port ${PORT}`);
  });
}).catch(err => {
  console.error("💥 Fatal startup error:", err.message);
  process.exit(1);
});