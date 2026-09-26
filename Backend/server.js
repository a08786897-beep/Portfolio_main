require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const connectDatabase = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const publicRoutes = require("./routes/publicRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const port = Number(process.env.PORT) || 5000;
const rootDirectory = path.resolve(__dirname, "..");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be set to a random value of at least 32 characters.");
}

const allowedOrigins = (process.env.CORS_ORIGINS ||
  "http://localhost:5000,http://127.0.0.1:5000,http://localhost:5502,http://127.0.0.1:5502")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    const error = new Error("This origin is not allowed by the CORS policy.");
    error.status = 403;
    return callback(error);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    success: connected,
    data: { status: connected ? "ok" : "unavailable", database: connected ? "connected" : "disconnected" }
  });
});

app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many login attempts. Please try again later." }
}));
app.use("/api/submissions", rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many submissions. Please try again later." }
}));

app.use("/api/auth", authRoutes);
app.use("/api", publicRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => res.sendFile(path.join(rootDirectory, "index.html")));
app.get("/index.html", (req, res) => res.sendFile(path.join(rootDirectory, "index.html")));
app.get("/admin.html", (req, res) => res.sendFile(path.join(rootDirectory, "admin.html")));
app.get("/styles.css", (req, res) => res.sendFile(path.join(rootDirectory, "styles.css")));
app.get("/favicon.svg", (req, res) => res.sendFile(path.join(rootDirectory, "favicon.svg")));
app.use("/js", express.static(path.join(rootDirectory, "js"), { dotfiles: "deny", fallthrough: false }));
app.use("/assets", express.static(path.join(rootDirectory, "assets"), { dotfiles: "deny", fallthrough: false }));

app.use((req, res) => {
  res.status(404).json({ success: false, message: "The requested resource was not found." });
});
app.use(errorHandler);

async function start() {
  await connectDatabase();
  app.listen(port, () => {
    console.info(`Portfolio is available at http://localhost:${port}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error("Unable to start the portfolio server:", error.message);
    process.exitCode = 1;
  });
}

module.exports = app;
