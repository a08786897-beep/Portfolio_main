require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const connectDatabase = require("./config/db");
const publicRoutes = require("./routes/publicRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const port = Number(process.env.PORT) || 5000;
const rootDirectory = path.resolve(__dirname, "..");

const allowedOrigins = (process.env.CORS_ORIGINS ||
  "http://localhost:5000,http://127.0.0.1:5000,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5502,http://127.0.0.1:5502")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      "img-src": ["'self'", "data:", "http:", "https:"]
    }
  }
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    const error = new Error("This origin is not allowed by the CORS policy.");
    error.status = 403;
    return callback(error);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    success: connected,
    data: { status: connected ? "ok" : "unavailable", database: connected ? "connected" : "disconnected" }
  });
});

app.use("/api/submissions", rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { success: false, message: "Too many submissions. Please try again later." }
}));

app.use("/api", publicRoutes);
app.use("/api/submissions", submissionRoutes);

app.get("/", (req, res) => res.sendFile(path.join(rootDirectory, "index.html")));
app.get("/index.html", (req, res) => res.sendFile(path.join(rootDirectory, "index.html")));
app.get("/styles.css", (req, res) => res.sendFile(path.join(rootDirectory, "styles.css")));
app.get("/favicon.svg", (req, res) => res.sendFile(path.join(rootDirectory, "favicon.svg")));
app.use("/js", express.static(path.join(rootDirectory, "js"), { dotfiles: "deny", fallthrough: false }));
app.use("/assets", express.static(path.join(rootDirectory, "assets"), { dotfiles: "deny" }));

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
