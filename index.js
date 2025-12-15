const MySqlConnection = require("./connections/mysql_connection");
const RedisConnection = require("./connections/redis_connection");
const StockMySQLConnection = require("./connections/stock_mysql_connection");
require("dotenv").config();

const InitializeConnection = async () => {
  try {
    await MySqlConnection.createConnection();
    await StockMySQLConnection.createConnection();
    await RedisConnection.createConnection();
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
};

async function IntializeApp() {
  await InitializeConnection();
  const App = require("./app");
  const app = new App();
  await app.startApp();
  await app.listen();
}

(async function() {
  await IntializeApp();
})();
