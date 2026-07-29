const createError = require("http-errors");
const bcrypt = require("bcrypt");
const { Sequelize } = require("sequelize");
const fs = require("fs");
const path = require("path");
const MySqlConnection = require("../connections/mysql_connection");
const PortalAccountModel = require("../models/Portal/portalAccountModel");
const UserModel = require("../models/Users/userModel");
const UserBranchAssociationModel = require("../models/Users/userBranchAssociation");
const UserProfileModel = require("../models/Users/userProfileModel");
const UserModuleAssociationModel = require("../models/Associations/userModuleAssociations");
const PatientMasterModel = require("../models/Master/patientMaster");
const PortalJwtHelper = require("../utils/portalJwtUtils");
const {
  portalLoginSchema,
  createStaffSchema,
  createPatientLoginSchema
} = require("../schemas/portalSchemas");
const {
  searchPatientsForPortalQuery,
  getPatientProfileQuery,
  getPatientVisitsQuery,
  getPatientTreatmentsQuery,
  getPatientMedicinesQuery,
  getPatientLabReportsQuery,
  getStaffListQuery,
  getPatientLoginsQuery
} = require("../queries/portal_queries");
const Constants = require("../constants/constants");

const SUPER_ADMIN_EMAIL = "info@origins.ivf";
const SUPER_ADMIN_PASSWORD = "ItOrigins@789";

class PortalService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysql = MySqlConnection._instance;
    this.jwt = new PortalJwtHelper();
  }

  static _bootstrapped = false;

  async ensurePortalReady() {
    if (PortalService._bootstrapped) return;
    try {
      await PortalAccountModel.sync();
    } catch (err) {
      console.log("Portal table ensure warning:", err.message);
      try {
        const sqlPath = path.join(
          __dirname,
          "../database/migrations/create_portal_accounts.sql"
        );
        const sql = fs.readFileSync(sqlPath, "utf8");
        await this.mysql.query(sql);
      } catch (sqlErr) {
        console.log("Portal SQL ensure warning:", sqlErr.message);
      }
    }

    const existing = await PortalAccountModel.findOne({
      where: { email: SUPER_ADMIN_EMAIL, accountType: "super_admin" }
    });

    if (!existing) {
      const salt = await bcrypt.genSalt(12);
      const hashed = await bcrypt.hash(SUPER_ADMIN_PASSWORD, salt);
      await PortalAccountModel.create({
        email: SUPER_ADMIN_EMAIL,
        password: hashed,
        accountType: "super_admin",
        fullName: "Origins Super Admin",
        isActive: true,
        createdBy: null
      });
      console.log("Portal super admin seeded:", SUPER_ADMIN_EMAIL);
    }

    PortalService._bootstrapped = true;
  }

  toSafeAccount(account) {
    return {
      id: account.id,
      email: account.email,
      accountType: account.accountType,
      fullName: account.fullName,
      mobileNo: account.mobileNo,
      patientMasterId: account.patientMasterId,
      patientCode: account.patientCode
    };
  }

  async loginService() {
    await this.ensurePortalReady();
    const { email, password } = await portalLoginSchema.validateAsync(
      this._request.body
    );

    const account = await PortalAccountModel.findOne({
      where: { email: email.toLowerCase().trim() }
    });

    if (!account) {
      throw new createError.NotFound(Constants.USER_DOESNOT_EXISTS);
    }
    if (!account.isActive) {
      throw new createError.BadRequest(Constants.USER_BLOCKED_BY_ADMIN);
    }

    const valid = await bcrypt.compare(password, account.password);
    if (!valid) {
      throw new createError.BadRequest(Constants.BAD_CREDENTAILS);
    }

    const safe = this.toSafeAccount(account);
    const accessToken = await this.jwt.getAccessToken(JSON.stringify(safe));

    return { userDetails: safe, accessToken };
  }

  async meService() {
    await this.ensurePortalReady();
    const portal = this._request.portalAccount;
    const account = await PortalAccountModel.findByPk(portal.id);
    if (!account || !account.isActive) {
      throw new createError.Unauthorized(Constants.SESSION_EXPIRED);
    }
    return this.toSafeAccount(account);
  }

  async createStaffService() {
    await this.ensurePortalReady();
    const payload = await createStaffSchema.validateAsync(this._request.body);
    const {
      fullName,
      email,
      userName,
      password,
      roleId,
      aadhaarNo,
      branches,
      modules
    } = payload;

    const emailTaken = await UserModel.findOne({ where: { email } });
    if (emailTaken) {
      throw new createError.Conflict(Constants.EMAIL_TAKEN);
    }
    const userNameTaken = await UserModel.findOne({ where: { userName } });
    if (userNameTaken) {
      throw new createError.Conflict(Constants.USERNAME_TAKEN);
    }
    if (aadhaarNo) {
      const aadhaarTaken = await UserModel.findOne({ where: { aadhaarNo } });
      if (aadhaarTaken) {
        throw new createError.Conflict(Constants.AADHAAR_TAKEN);
      }
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    return await this.mysql.transaction(async t => {
      const user = await UserModel.create(
        {
          fullName,
          email,
          userName,
          password: hashedPassword,
          roleId,
          aadhaarNo: aadhaarNo || null,
          isAdminVerified: 1,
          isEmailVerified: 1,
          isBlocked: 0
        },
        { transaction: t }
      );

      await UserBranchAssociationModel.bulkCreate(
        branches.map(branchId => ({ userId: user.id, branchId })),
        { transaction: t }
      );

      await UserProfileModel.create(
        {
          userId: user.id,
          fullName,
          userName,
          email
        },
        { transaction: t }
      );

      if (modules && modules.length > 0) {
        await UserModuleAssociationModel.bulkCreate(
          modules.map(m => ({
            userId: user.id,
            moduleId: m.moduleId,
            accessType: String(m.accessType).toUpperCase()
          })),
          { transaction: t }
        );
      }

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        userName: user.userName,
        roleId: user.roleId,
        message: "Staff user created and verified for HMS login"
      };
    });
  }

  async listStaffService() {
    await this.ensurePortalReady();
    const rows = await this.mysql.query(getStaffListQuery, {
      type: Sequelize.QueryTypes.SELECT
    });
    return rows || [];
  }

  async searchPatientsService() {
    await this.ensurePortalReady();
    const q = String(this._request.query.q || "").trim();
    const rows = await this.mysql.query(searchPatientsForPortalQuery, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { q }
    });
    return rows || [];
  }

  async createPatientLoginService() {
    await this.ensurePortalReady();
    const {
      patientMasterId,
      email,
      password
    } = await createPatientLoginSchema.validateAsync(this._request.body);

    const patient = await PatientMasterModel.findByPk(patientMasterId);
    if (!patient) {
      throw new createError.BadRequest(
        "Patient does not exist in HMS. Create the patient in the existing system first, then create portal login."
      );
    }

    const existingLogin = await PortalAccountModel.findOne({
      where: { patientMasterId }
    });
    if (existingLogin) {
      throw new createError.Conflict(
        "Portal login already exists for this patient"
      );
    }

    const emailTaken = await PortalAccountModel.findOne({
      where: { email: email.toLowerCase().trim() }
    });
    if (emailTaken) {
      throw new createError.Conflict(Constants.EMAIL_TAKEN);
    }

    const salt = await bcrypt.genSalt(12);
    const hashed = await bcrypt.hash(password, salt);
    const fullName = `${patient.firstName || ""} ${patient.lastName ||
      ""}`.trim();

    const account = await PortalAccountModel.create({
      email: email.toLowerCase().trim(),
      password: hashed,
      accountType: "patient",
      patientMasterId: patient.id,
      patientCode: patient.patientId,
      fullName: fullName || patient.patientId,
      mobileNo: patient.mobileNo,
      isActive: true,
      createdBy: this._request.portalAccount?.id || null
    });

    return {
      id: account.id,
      email: account.email,
      patientMasterId: account.patientMasterId,
      patientCode: account.patientCode,
      fullName: account.fullName,
      message: "Patient portal login created"
    };
  }

  async listPatientLoginsService() {
    await this.ensurePortalReady();
    const rows = await this.mysql.query(getPatientLoginsQuery, {
      type: Sequelize.QueryTypes.SELECT
    });
    return rows || [];
  }

  async togglePatientLoginService() {
    await this.ensurePortalReady();
    const { id } = this._request.params;
    const { isActive } = this._request.body;
    const account = await PortalAccountModel.findOne({
      where: { id, accountType: "patient" }
    });
    if (!account) {
      throw new createError.NotFound("Patient login not found");
    }
    account.isActive = !!isActive;
    await account.save();
    return { id: account.id, isActive: account.isActive };
  }

  getPatientMasterId() {
    return this._request.portalAccount.patientMasterId;
  }

  async patientDashboardService() {
    await this.ensurePortalReady();
    const patientMasterId = this.getPatientMasterId();

    const [
      profileRows,
      visits,
      treatments,
      medicines,
      reports
    ] = await Promise.all([
      this.mysql.query(getPatientProfileQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { patientMasterId }
      }),
      this.mysql.query(getPatientVisitsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { patientMasterId }
      }),
      this.mysql.query(getPatientTreatmentsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { patientMasterId }
      }),
      this.mysql.query(getPatientMedicinesQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { patientMasterId }
      }),
      this.mysql.query(getPatientLabReportsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { patientMasterId }
      })
    ]);

    const profile = profileRows?.[0] || null;
    const activeVisits = (visits || []).filter(v => v.isActive);
    const todayStr = new Date().toISOString().slice(0, 10);
    const isToday = value => {
      if (!value) return false;
      const s = String(value).slice(0, 10);
      return s === todayStr;
    };

    const injectionKeywords = [
      "inject",
      "injection",
      "inj",
      "hcg",
      "fsh",
      "gonal",
      "menopur",
      "ovidrel",
      "lupron",
      "cetrotide",
      "orgalutran",
      "progesterone oil",
      "gonadotropin"
    ];

    const isInjection = med => {
      const hay = `${med.medicineName || ""} ${med.prescriptionDetails ||
        ""}`.toLowerCase();
      return injectionKeywords.some(k => hay.includes(k));
    };

    const todayMedicines = (medicines || []).filter(
      m => isToday(m.appointmentDate) || isToday(m.visitDate)
    );
    // If nothing dated today, surface latest active prescriptions as "today's plan"
    const todaysPlan =
      todayMedicines.length > 0
        ? todayMedicines
        : (medicines || []).slice(0, 5);
    const todayAppointments = (treatments || []).filter(t =>
      isToday(t.appointmentDate)
    );
    const upcoming = (treatments || []).filter(t => {
      if (!t.appointmentDate) return false;
      return new Date(t.appointmentDate) >= new Date(new Date().toDateString());
    });
    const todayInjections = todaysPlan.filter(isInjection);
    const doctorMessage = activeVisits[0]
      ? {
          title: "Care team update",
          body: `Your ${activeVisits[0].packageName ||
            activeVisits[0].visitType ||
            "treatment"} cycle is ongoing. Please follow today's medicines and appointment schedule. Contact the clinic if you have concerns.`,
          from: "Origins Care Team",
          date: todayStr
        }
      : {
          title: "Welcome to Origins",
          body:
            "Your care journey starts here. Check today's medicines, appointments, and reports. Reach out anytime for emergency support.",
          from: "Origins Care Team",
          date: todayStr
        };

    return {
      profile,
      summary: {
        activeVisits: activeVisits.length,
        totalVisits: (visits || []).length,
        prescribedMedicines: (medicines || []).length,
        labReports: (reports || []).length,
        upcomingAppointments: upcoming.length,
        todayMedicines: todaysPlan.length,
        todayAppointments: todayAppointments.length,
        todayInjections: todayInjections.length,
        recentReports: (reports || []).slice(0, 3).length
      },
      activeTreatment: activeVisits[0] || null,
      recentMedicines: (medicines || []).slice(0, 8),
      recentReports: (reports || []).slice(0, 8),
      upcomingAppointments: upcoming.slice(0, 8),
      today: {
        medicines: todaysPlan.slice(0, 8),
        appointments:
          todayAppointments.length > 0
            ? todayAppointments.slice(0, 5)
            : upcoming.slice(0, 3),
        injections: todayInjections.slice(0, 8),
        doctorMessage,
        emergency: {
          phone: process.env.PORTAL_EMERGENCY_PHONE || "18001234567",
          label: "Origins Emergency Helpline"
        }
      }
    };
  }

  async patientMedicinesService() {
    await this.ensurePortalReady();
    const patientMasterId = this.getPatientMasterId();
    const rows = await this.mysql.query(getPatientMedicinesQuery, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { patientMasterId }
    });
    return rows || [];
  }

  async patientReportsService() {
    await this.ensurePortalReady();
    const patientMasterId = this.getPatientMasterId();
    const rows = await this.mysql.query(getPatientLabReportsQuery, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { patientMasterId }
    });
    return rows || [];
  }

  async patientTreatmentsService() {
    await this.ensurePortalReady();
    const patientMasterId = this.getPatientMasterId();
    const [visits, treatments] = await Promise.all([
      this.mysql.query(getPatientVisitsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { patientMasterId }
      }),
      this.mysql.query(getPatientTreatmentsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { patientMasterId }
      })
    ]);
    return { visits: visits || [], appointments: treatments || [] };
  }

  async patientProfileService() {
    await this.ensurePortalReady();
    const patientMasterId = this.getPatientMasterId();
    const rows = await this.mysql.query(getPatientProfileQuery, {
      type: Sequelize.QueryTypes.SELECT,
      replacements: { patientMasterId }
    });
    if (!rows?.length) {
      throw new createError.NotFound(Constants.PATIENT_DOES_NOT_EXIST);
    }
    return rows[0];
  }

  async getRolesAndBranchesService() {
    await this.ensurePortalReady();
    const [roles, branches, modules] = await Promise.all([
      this.mysql.query(`SELECT id, name FROM role_master ORDER BY name ASC`, {
        type: Sequelize.QueryTypes.SELECT
      }),
      this.mysql.query(
        `SELECT id, name, branchCode FROM branch_master WHERE isActive = 1 ORDER BY name ASC`,
        { type: Sequelize.QueryTypes.SELECT }
      ),
      this.mysql.query(
        `SELECT id, name, moduleEnum FROM module_master WHERE isActive = 1 ORDER BY name ASC`,
        { type: Sequelize.QueryTypes.SELECT }
      )
    ]);
    return { roles, branches, modules };
  }
}

module.exports = PortalService;
