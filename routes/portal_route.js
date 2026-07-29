const express = require("express");
const PortalController = require("../controllers/portalController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  portalTokenVerified,
  requireSuperAdmin,
  requirePatient
} = require("../middlewares/portalAuthMiddleware");

class PortalRoute {
  _route = express.Router();

  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.post("/auth/login", this.loginRoute);
    this._route.get(
      "/auth/me",
      portalTokenVerified,
      this.meRoute
    );

    this._route.get(
      "/admin/masters",
      portalTokenVerified,
      requireSuperAdmin,
      this.mastersRoute
    );
    this._route.post(
      "/admin/staff",
      portalTokenVerified,
      requireSuperAdmin,
      this.createStaffRoute
    );
    this._route.get(
      "/admin/staff",
      portalTokenVerified,
      requireSuperAdmin,
      this.listStaffRoute
    );
    this._route.get(
      "/admin/patients/search",
      portalTokenVerified,
      requireSuperAdmin,
      this.searchPatientsRoute
    );
    this._route.post(
      "/admin/patient-logins",
      portalTokenVerified,
      requireSuperAdmin,
      this.createPatientLoginRoute
    );
    this._route.get(
      "/admin/patient-logins",
      portalTokenVerified,
      requireSuperAdmin,
      this.listPatientLoginsRoute
    );
    this._route.put(
      "/admin/patient-logins/:id/status",
      portalTokenVerified,
      requireSuperAdmin,
      this.togglePatientLoginRoute
    );

    this._route.get(
      "/patient/dashboard",
      portalTokenVerified,
      requirePatient,
      this.patientDashboardRoute
    );
    this._route.get(
      "/patient/profile",
      portalTokenVerified,
      requirePatient,
      this.patientProfileRoute
    );
    this._route.get(
      "/patient/medicines",
      portalTokenVerified,
      requirePatient,
      this.patientMedicinesRoute
    );
    this._route.get(
      "/patient/reports",
      portalTokenVerified,
      requirePatient,
      this.patientReportsRoute
    );
    this._route.get(
      "/patient/treatments",
      portalTokenVerified,
      requirePatient,
      this.patientTreatmentsRoute
    );
  }

  loginRoute = asyncHandler(async (req, res, next) => {
    await new PortalController(req, res, next).loginHandler();
  });

  meRoute = asyncHandler(async (req, res, next) => {
    await new PortalController(req, res, next).meHandler();
  });

  mastersRoute = asyncHandler(async (req, res, next) => {
    await new PortalController(req, res, next).mastersHandler();
  });

  createStaffRoute = asyncHandler(async (req, res, next) => {
    await new PortalController(req, res, next).createStaffHandler();
  });

  listStaffRoute = asyncHandler(async (req, res, next) => {
    await new PortalController(req, res, next).listStaffHandler();
  });

  searchPatientsRoute = asyncHandler(async (req, res, next) => {
    await new PortalController(req, res, next).searchPatientsHandler();
  });

  createPatientLoginRoute = asyncHandler(async (req, res, next) => {
    await new PortalController(req, res, next).createPatientLoginHandler();
  });

  listPatientLoginsRoute = asyncHandler(async (req, res, next) => {
    await new PortalController(req, res, next).listPatientLoginsHandler();
  });

  togglePatientLoginRoute = asyncHandler(async (req, res, next) => {
    await new PortalController(req, res, next).togglePatientLoginHandler();
  });

  patientDashboardRoute = asyncHandler(async (req, res, next) => {
    await new PortalController(req, res, next).patientDashboardHandler();
  });

  patientProfileRoute = asyncHandler(async (req, res, next) => {
    await new PortalController(req, res, next).patientProfileHandler();
  });

  patientMedicinesRoute = asyncHandler(async (req, res, next) => {
    await new PortalController(req, res, next).patientMedicinesHandler();
  });

  patientReportsRoute = asyncHandler(async (req, res, next) => {
    await new PortalController(req, res, next).patientReportsHandler();
  });

  patientTreatmentsRoute = asyncHandler(async (req, res, next) => {
    await new PortalController(req, res, next).patientTreatmentsHandler();
  });
}

module.exports = PortalRoute;
