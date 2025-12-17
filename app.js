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
const https = require("https");
const path = require("path");
const fs = require("fs");
const cron = require("node-cron");
const CronService = require("./services/cronService");
const morgan = require("morgan");
const { Server } = require("socket.io");

let redisStore = new RedisStore({
  client: RedisConnection._instance,
  prefix: "sess:"
});
class App {
  constructor() {
    this.app = express();
    this.io = null;
  }

  async startApp() {
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
          "https://www.originshms.com"
        ], // Replace with your frontend domain
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

    // Initialize Socket.io
    this.io = new Server(sslServer, {
      cors: {
        origin: [
          "http://localhost:3001",
          "https://localhost:3001",
          "http://localhost:3000",
          "https://localhost:3000",
          "http://13.234.149.138:42000",
          "https://hms-app-alpha.vercel.app",
          "https://www.originshms.com"
        ],
        credentials: true,
        methods: ["GET", "POST"]
      },
      transports: ["websocket", "polling"],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000
    });

    // Handle connection errors
    this.io.engine.on("connection_error", err => {
      console.error("Socket.io connection error:", err);
    });

    // Initialize Teams Socket handler
    const TeamsSocket = require("./socket/teamsSocket");
    new TeamsSocket(this.io);

    sslServer.listen(process.env.PORT, err => {
      if (err) {
        throw new Error("Application Could not Start", err);
      }
      console.log(`Application Running on Port ${process.env.PORT}`);
      console.log(`Socket.io server initialized for Teams module`);
    });
  }
}

module.exports = App;
