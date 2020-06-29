/**
 * @type Application Bootstrap
 * @desc API server
 */

/* Import all the required libraries */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const helmet = require("helmet");
const config = require("config");
const glob = require("glob");
const path = require("path");
const bodyParser = require("body-parser");
const http = require("http").createServer(app);
const rateLimit = require("express-rate-limit");
const authenticator = require("./controllers/auth");
const logger = require("./lib/utils/logger");
const db = require("./lib/utils/db");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ limit: "50mb", extended: false }));

// parse application/json
app.use(bodyParser.json({ limit: "50mb" }));

/* Check CORS before proceeding further */
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

/* Add additional http flags in response header for security */
app.use(helmet());

/* Add interceptor middleware to catch all responses sent out */
//app.use(interceptor);

/* Add auth middleware */
app.use(authenticator._fakeAuth); // use _fakeAuth when testing

/* Allow reverse proxy such as NginX, AWS ELB */
app.enable("trust proxy");

/* Apply rate limit to all requests - 429 code will be sent */
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

/* Recursively include all routes inside ./routes */
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

/* Default response for 404 errors */
function handle404Error() {
  app.use(function (req, res) {
    res.status(404).json({
      success: false,
      message: "The requested end point does not exist",
    });
  });
}
/* Start API server on the specified port */
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
