const Sequelize = require("sequelize");
class CreateStockMySQLConnection {
  constructor() {}

  async initialize() {
    return await this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      let sequelizeProps = {
        host: process.env.MYSQL_HOST,
        port: process.env.MYSQL_PORT,
        dialect: "mysql",
        timezone: "+05:30",
        logging: false,
        define: {
          timestamps: true
        }
      };
      const sequelize = new Sequelize(
        process.env.ENVIRONMENT == 'development' ? process.env.MYSQL_STOCKDBNAME : process.env.MYSQL_STOCKDBNAME_PROD,
        process.env.MYSQL_USERNAME,
        process.env.MYSQL_PASSWORD,
        sequelizeProps
      );
      await sequelize.authenticate();
      console.log(
        `Connected to Stock SQL Database Sucessfully - ${process.env.ENVIRONMENT == 'development' ? process.env.MYSQL_STOCKDBNAME : process.env.MYSQL_STOCKDBNAME_PROD}`
      );
      return sequelize;
    } catch (error) {
      console.error(
        "Unable to connect to the stock mysql database:",
        error.message
      );
    }
  }
}

class StockMySQLConnection {
  static _instance;

  constructor() {}

  static async createConnection() {
    this._instance = await new CreateStockMySQLConnection().initialize();
  }

  static async getInstance() {
    if (this._instance) {
      return this._instance;
    }
    this.createConnection();
    return this._instance;
  }
}

module.exports = StockMySQLConnection;
