const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const createError = require("http-errors");
var session = require("express-session");
const { errorHandler } = require("./middlewares/errorHandlers");
const IndexRoute = require("./routes/index");
const RedisConnection = require("./connections/redis_connection");
const RedisStore = require("connect-redis").default;
const { v4: uuid4 } = require("uuid");
const cookieParser = require("cookie-parser");
const http = require("http");
const https = require("https");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");
const CronService = require("./services/cronService");
const morgan = require("morgan");

let redisStore = new RedisStore({
  client: RedisConnection._instance,
  prefix: "sess:"
});
class App {
  constructor() {
    this.app = express();
  }

  async startApp() {
    const allowedOrigins = [
      "http://localhost:3001",
      "https://localhost:3001",
      "http://localhost:3000",
      "https://localhost:3000",
      "http://localhost:3002",
      "https://localhost:3002",
      "http://localhost",
      "https://localhost",
      "capacitor://localhost",
      "ionic://localhost",
      "http://13.234.149.138:42000",
      "https://hms-app-alpha.vercel.app",
      "https://www.originshms.com",
      "https://originshms.com"
    ];

    this.app.use(
      cors({
        exposedHeaders: ["filename", "Content-Disposition"],
        origin: (origin, callback) => {
          if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          return callback(null, false);
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "Access-Control-Allow-Origin",
          "Access-Control-Allow-Credentials",
          "Access-Control-Allow-Credential"
        ]
      })
    );
    this.app.use(cookieParser());

    morgan.token("req-body", req => {
      return JSON.stringify(req.body);
    });
    this.app.use(morgan(":method :url :status :response-time ms - :req-body"));

    this.app.use(bodyParser.json({ limit: "50mb" }));
    this.app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
    this.app.use(
      session({
        cookie: {
          httpOnly: true,
          maxAge: +process.env.IDLE_SESSION_TIMEOUT,
          secure: true,
          sameSite: "None"
        },
        resave: false,
        rolling: true,
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET_KEY,
        store: redisStore,
        name: process.env.SESSION_COOKIE_NAME,
        genid: function(req) {
          return `${uuid4()}${req.user}`;
        }
      })
    );

    // Set Cookies For testing
    this.app.get("/test", async (req, res, next) => {
      const hostHeader = req.headers["host"] || "Default Host";
      req.session.message = "Welcome To testing";
      // console.log(req.session);
      const forwardedFor = req.headers["x-forwarded-for"] || "::0";

      res.send({
        message: `Test Route Called From IP Address ${forwardedFor} and Host ${hostHeader}`
      });
    });

    // Check Cookies For testing
    this.app.get("/check-cookie", (req, res) => {
      const cookies = req.headers.cookie;
      if (cookies) {
        res.send(`Received Cookies: ${cookies}`);
      } else {
        res.send("No cookies received");
      }
    });

    await new IndexRoute(this.app).intializeRoutes();

    this.app.use(async (req, res, next) => {
      next(createError.NotFound("Page Not Found"));
    });

    this.app.use(errorHandler);
  }

  async listen() {
    const sslServer = https.createServer(
      {
        key: fs.readFileSync(path.join(__dirname, "cert", "key.pem")),
        cert: fs.readFileSync(path.join(__dirname, "cert", "cert.pem"))
      },
      this.app
    );
    sslServer.listen(process.env.PORT, err => {
      if (err) {
        throw new Error("Application Could not Start", err);
      }
      console.log(`Application Running on HTTPS Port ${process.env.PORT}`);
    });

    // Cleartext HTTP for mobile APK / LAN devices (self-signed HTTPS cert is expired
    // and Android rejects it). Default 3003 so it does not collide with HTTPS 3000.
    const httpPort = Number(process.env.HTTP_PORT || 3003);
    if (httpPort && httpPort !== Number(process.env.PORT)) {
      http.createServer(this.app).listen(httpPort, "0.0.0.0", err => {
        if (err) {
          throw new Error("HTTP listener could not start", err);
        }
        console.log(
          `Application Running on HTTP Port ${httpPort} (mobile/LAN)`
        );
      });
    }
  }
}

module.exports = App;
