/* =====================================================
   GLOBAL ERROR HANDLER — FleetFlow 2.0
===================================================== */

const isProd = process.env.NODE_ENV === "production";

/* -----------------------------------------------------
   PostgreSQL Error Mapping
----------------------------------------------------- */
const pgErrors = {
  "23505": "Duplicate value — record already exists",
  "23503": "Referenced record does not exist",
  "23502": "Required field missing",
  "23514": "Invalid value violates constraint",
};

/* -----------------------------------------------------
   MAIN ERROR HANDLER
----------------------------------------------------- */
const errorHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;

  /* ---- LOGGING ---- */
  if (!isProd) {
    console.error("\n🚨 API ERROR");
    console.error("Path:", req.method, req.originalUrl);
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
  } else {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}: ${err.message}`);
  }

  /* ---- PostgreSQL Errors ---- */
  if (err.code && pgErrors[err.code]) {
    return res.status(400).json({
      success: false,
      error: pgErrors[err.code],
    });
  }

  /* ---- JWT Errors ---- */
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Invalid authentication token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Session expired — please login again",
    });
  }

  /* ---- Validation Errors ---- */
  if (err.type === "validation") {
    return res.status(422).json({
      success: false,
      error: err.message,
      fields: err.fields || null,
    });
  }

  /* ---- Default ---- */
  res.status(status).json({
    success: false,
    error: err.message || "Internal server error",
  });
};

/* =====================================================
   404 NOT FOUND
===================================================== */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

module.exports = {
  errorHandler,
  notFound,
};