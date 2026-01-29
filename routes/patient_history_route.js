const express = require("express");
const PatientHistoryController = require('../controllers/patientHistoryController.js');
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");

class PatientHistoryRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/visits/:patientId",
      checkActiveSession,
      tokenVerified,
      this.getPatientVisitHistoryRoute
    );

    this._route.get(
      "/embryology/:visitId",
      checkActiveSession,
      tokenVerified,
      this.getPatientEmbryologyHistoryRoute
    );

    this._route.get(
      "/consultations/:visitId",
      checkActiveSession,
      tokenVerified,
      this.getPatientConsultationHistoryRoute
    );

    this._route.get(
      "/treatments/:visitId",
      checkActiveSession,
      tokenVerified,
      this.getPatientTreatmentHistoryRoute
    );

    this._route.get(
      "/consultationInformationByAppointmentId/:appointmentId",
      checkActiveSession,
      tokenVerified,
      this.getConsultationInformationByAppointmentIdRoute
    );

    this._route.get(
      "/treatmentInformationByAppointmentId/:appointmentId",
      checkActiveSession,
      tokenVerified,
      this.getTreatmentInformationByAppointmentIdRoute
    );

    
    this._route.get(
      "/getFormFTemplatesByPatientId/:patientId",
      checkActiveSession,
      tokenVerified,
      this.getFormFTemplatesByPatientId
    );

    this._route.get(
      "/getFormFTemplatesByScanAppointment",
      checkActiveSession,
      tokenVerified,
      this.getFormFTemplatesByScanAppointment
    );

    this._route.get(
      "/getPrescriptionDetailsByTreatmentCycleIdFollicular/:treatmentCycleId",
      checkActiveSession,
      tokenVerified,
      this.getPrescriptionDetailsByTreatmentCycleIdFollicular
    );

    this._route.get(
      "/getPaymentHistoryByVisitId/:visitId",
      checkActiveSession,
      tokenVerified,
      this.getPaymentHistoryByVisitId
    );

    this._route.get(
      "/getNotesHistoryByVisitId/:visitId",
      checkActiveSession,
      tokenVerified,
      this.getNotesHistoryByVisitId
    );

    // Update payment record
    this._route.put(
      "/updatePayment/:paymentId",
      checkActiveSession,
      tokenVerified,
      this.updatePaymentHistory
    );

    // Delete payment record
    this._route.delete(
      "/deletePayment/:paymentId",
      checkActiveSession,
      tokenVerified,
      this.deletePaymentHistory
    );
  }

  getPatientVisitHistoryRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientHistoryController(req, res, next);
    await controllerObj.getPatientVisitHistoryController();
  });

  getPatientEmbryologyHistoryRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientHistoryController(req, res, next);
    await controllerObj.getPatientEmbryologyHistoryController();
  });

  getPatientConsultationHistoryRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientHistoryController(req, res, next);
    await controllerObj.getPatientConsultationHistoryController();
  });


  getPatientTreatmentHistoryRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientHistoryController(req, res, next);
    await controllerObj.getPatientTreatmentHistoryController();
  });


  getConsultationInformationByAppointmentIdRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientHistoryController(req, res, next);
    await controllerObj.getConsultationInformationByAppointmentIdController();
  });

  getTreatmentInformationByAppointmentIdRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientHistoryController(req, res, next);
    await controllerObj.getTreatmentInformationByAppointmentIdController();
  });

  getFormFTemplatesByPatientId = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientHistoryController(req, res, next);
    await controllerObj.getFormFTemplateByPatientIdController();
  });

  getFormFTemplatesByScanAppointment= asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientHistoryController(req, res, next);
    await controllerObj.getFormFTemplatesByScanAppointmentHandler();
  });

  getPrescriptionDetailsByTreatmentCycleIdFollicular = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientHistoryController(req, res, next);
    await controllerObj.getPrescriptionDetailsByTreatmentCycleIdFollicularHandler();
  });

  getPaymentHistoryByVisitId  = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientHistoryController(req, res, next);
    await controllerObj.getPaymentHistoryByVisitIdHandler();
  });

  getNotesHistoryByVisitId  = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientHistoryController(req, res, next);
    await controllerObj.getNotesHistoryByVisitIdHandler();
  });

  updatePaymentHistory = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientHistoryController(req, res, next);
    await controllerObj.updatePaymentHistoryHandler();
  });

  deletePaymentHistory = asyncHandler(async (req, res, next) => {
    const controllerObj = new PatientHistoryController(req, res, next);
    await controllerObj.deletePaymentHistoryHandler();
  });
}

module.exports = PatientHistoryRoute;
