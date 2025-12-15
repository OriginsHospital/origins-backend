const Sequelize = require("sequelize");
const MySqlConnection = require("../../connections/mysql_connection");

const VisitDonarsAssociation = MySqlConnection._instance.define(
  "visitDonarsAssociation",
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
    patientId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    treatmentTypeId: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    donarName: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: false
    },
    age: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    mobileNumber: {
      type: Sequelize.DataTypes.STRING(15),
      allowNull: true
    },
    kyc: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    marriageCertificate: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    birthCertificate: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    aadhaar: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    donarPhotoUrl: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    donarSignatureUrl: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    bloodGroup: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    form24b: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    insuranceCertificate: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    spouseAadharCard: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    artBankCertificate: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    anaesthesiaConsent: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    form13: {
      type: Sequelize.DataTypes.STRING(255),
      allowNull: true
    },
    createdAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    },
    createdBy: {
      type: Sequelize.DataTypes.INTEGER,
      allowNull: false
    },
    updatedAt: {
      type: Sequelize.DataTypes.DATE,
      allowNull: false
    }
  },
  {
    tableName: "visit_donars_associations"
  }
);

module.exports = VisitDonarsAssociation;
