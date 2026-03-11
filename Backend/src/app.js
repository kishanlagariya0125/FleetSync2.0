require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const routes = require("./routes"); // src/routes/index.js
const { errorHandler, notFound } = require("./middleware/errorHandler");

const app = express();

/* ───────────────── SECURITY ───────────────── */
app.use(helmet());
app.set("trust proxy", 1);

/* ───────────────── CORS ───────────────── */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (e.g. curl, Postman, same-origin proxy)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === "production") return cb(null, true);
      return cb(new Error("CORS blocked"));
    },
    credentials: true,
  })
);

/* ───────────────── BODY ───────────────── */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* ───────────────── LOGGER ───────────────── */
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
});

/* ───────────────── HEALTH ───────────────── */
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "FleetFlow API",
    env: process.env.NODE_ENV,
    time: new Date().toISOString(),
  });
});

/* ───────────────── ROUTES ───────────────── */
app.use("/api", routes);

/* ───────────────── ERRORS ───────────────── */
app.use(notFound);
app.use(errorHandler);

module.exports = app;