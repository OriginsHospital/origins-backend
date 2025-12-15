const redis = require("async-redis");

class RedisConnection {
  _instance;
  constructor() {}

  static async createConnection() {
    this._instance = await new Promise((resolve, reject) => {
      const redisClient = redis.createClient({
        port: process.env.REDIS_PORT,
        host: process.env.REDIS_HOST,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB
      });

      redisClient.on("connect", () => {
        console.log("Redis connection established successfully.");
        resolve(redisClient);
      });

      redisClient.on("error", err => {
        console.error("Error connecting to Redis:", err);
        reject(err);
      });
    });
    return this._instance;
  }

  static async getInstance() {
    if (this._instance) {
      return this._instance;
    }
    this.createConnection();
    return this._instance;
  }
}

module.exports = RedisConnection;
