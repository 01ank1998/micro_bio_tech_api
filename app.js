require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const config = require("config");
const glob = require("glob");
const path = require("path");
const bodyParser = require("body-parser");
const http = require("http").createServer(app);
const rateLimit = require("express-rate-limit");
const authenticator = require("./controllers/auth");
const logger = require("./lib/utils/logger");
const db = require("./lib/utils/db");

app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));

app.use(bodyParser.json({ limit: "50mb" }));

app.use(
  cors({
    origin: function (origin, callback) {
      if (
        config.get("cors.whitelist").indexOf(origin) !== -1 ||
        config.get("cors.allowLocal")
      ) {
        // error - null, allowOrigin - true
        callback(null, true);
      } else {
        app.use(function (err, req, res) {
          res.status(403).json({
            success: false,
            statusCode: "NOT_ALLOWED_BY_CORS",
            message: "You are not allowed to access this resource",
            data: {},
          });
        });
        // error - true, allowOrigin - false
        callback(true, false);
      }
    },
  })
);

app.use(authenticator._fakeAuth);

app.enable("trust proxy");

const limiter = rateLimit({
  windowMs: config.get("rateLimit.minutes") * 60 * 1000, // duration in minutes
  max: config.get("rateLimit.maxRequests"), // limit each IP to n (config.maxRequests) requests per windowMs
  message: {
    success: false,
    statusCode: "TOO_MANY_REQUESTS",
    message: "Too many requests, please try again later",
    data: {},
  },
});
app.use(limiter);

function loadRoutes() {
  glob.sync("./routes/**/*.js").forEach(function (file) {
    app.use("/" + config.get("api.version") + "/", require(path.resolve(file)));
  });
  handle404Error();
}

function loadModels() {
  glob.sync("./models/**/*.js").forEach(function (file) {
    require(path.resolve(file));
  });
}

function handle404Error() {
  app.use(function (req, res) {
    res.status(404).json({
      success: false,
      message: "The requested end point does not exist",
    });
  });
}

function startServer() {
  http.listen(config.get("api.port"));
  logger.info({ description: `server started on ${config.get("api.port")}` });
}

async function initialize() {
  if (app.isAppInitialized) {
    return;
  }
  await db.connect();
  logger.info({ description: "Connected to database." });

  await loadModels();
  logger.info({ description: "All models loaded" });

  await db.setupHelpers();
  logger.info({ description: "Setup database helpers" });

  await loadRoutes();
  logger.info({ description: "All routes loaded" });

  await startServer();
  app.isAppInitialized = true;
}

app.initialize = initialize;

module.exports = app;
