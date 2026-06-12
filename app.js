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
    const useHttps = process.env.USE_HTTPS !== "false";

    // Required when running behind nginx / load balancer (api.originshms.com)
    this.app.set("trust proxy", 1);

    this.app.use(
      cors({
        exposedHeaders: ["filename", "Content-Disposition"],
        origin: [
          "http://localhost:3001",
          "https://localhost:3001",
          "http://localhost:3000",
          "https://localhost:3000",
          "http://13.234.149.138:42000",
          "https://hms-app-alpha.vercel.app",
          "http://originshms.com",
          "https://originshms.com",
          "http://www.originshms.com",
          "https://www.originshms.com"
        ],
        credentials: true
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
          secure: useHttps,
          sameSite: useHttps ? "None" : "Lax"
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

    this.app.get("/health", (req, res) => {
      res.status(200).json({ status: "ok" });
    });

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
    const port = Number(process.env.PORT) || 3000;
    const host = process.env.HOST || "0.0.0.0";
    const useHttps = process.env.USE_HTTPS !== "false";

    const onListen = (protocol, listenPort) => err => {
      if (err) {
        throw new Error("Application Could not Start", err);
      }
      console.log(
        `Application Running on ${protocol}://${host}:${listenPort} (USE_HTTPS=${useHttps})`
      );
    };

    if (useHttps) {
      const certDir = path.join(__dirname, "cert");
      const keyPath = path.join(certDir, "key.pem");
      const certPath = path.join(certDir, "cert.pem");

      if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
        throw new Error(
          `SSL cert files missing in ${certDir}. Set USE_HTTPS=false when running behind nginx.`
        );
      }

      https
        .createServer(
          {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath)
          },
          this.app
        )
        .listen(port, host, onListen("https", port));
      return;
    }

    http.createServer(this.app).listen(port, host, onListen("http", port));
  }
}

module.exports = App;
