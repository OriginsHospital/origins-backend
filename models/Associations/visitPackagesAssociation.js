const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const VisitPackagesAssociation = MySqlConnection._instance.define(
  "visitPackagesAssociation",
  {
    id: {
      type: Sequelize.DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true
    },
    visitId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    doctorSuggestedPackage: {
      type: Sequelize.DataTypes.BIGINT,
      allowNull: false
    },
    marketingPackage: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    registrationDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true,
      default: null
    },
    registrationAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    donorBookingDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    donorBookingAmount: {
      type: Sequelize.DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0
    },
    day1Date: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    day1Amount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    pickUpDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    pickUpAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    hysteroscopyDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    hysteroscopyAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    day5FreezingDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    day5FreezingAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    fetDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    fetAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    eraDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    eraAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    pgtaDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    pgtaAmount: {
      type: Sequelize.DataTypes.BIGINT,
      allowNull: true,
      defaultValue: 0
    },
    uptPositiveDate: {
      type: Sequelize.DataTypes.DATEONLY,
      allowNull: true
    },
    uptPositiveAmount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    discount: {
      type: Sequelize.DataTypes.DECIMAL(10, 2),
      allowNull: true
    }
  },
  {
    tableName: "visit_packages_associations"
  }
);

module.exports = VisitPackagesAssociation;
