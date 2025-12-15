const Sequelize = require("sequelize");
class CreateMySQLConnection {
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
        logging: false,
        timezone: "+05:30",
        define: {
          timestamps: true
        }
      };
      const sequelize = new Sequelize(
        process.env.ENVIRONMENT == 'development' ? process.env.MYSQL_DBNAME : process.env.MYSQL_DBNAME_PROD,
        process.env.MYSQL_USERNAME,
        process.env.MYSQL_PASSWORD,
        sequelizeProps
      );
      await sequelize.authenticate();
      console.log(
        `Connected to My SQL Database Sucessfully - ${process.env.ENVIRONMENT == 'development' ? process.env.MYSQL_DBNAME : process.env.MYSQL_DBNAME_PROD}`
      );
      return sequelize;
    } catch (error) {
      console.error("Unable to connect to the mysql database:", error.message);
    }
  }
}

class MySqlConnection {
  static _instance;

  constructor() {}

  static async createConnection() {
    this._instance = await new CreateMySQLConnection().initialize();
  }

  static async getInstance() {
    if (this._instance) {
      return this._instance;
    }
    this.createConnection();
    return this._instance;
  }
}

module.exports = MySqlConnection;
