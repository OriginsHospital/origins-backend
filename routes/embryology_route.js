const express = require("express");
const EmbryologyController = require("../controllers/embryologyController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");
const multer = require("multer");
const upload = multer();
class EmbryologyRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.get(
      "/getPatientListForEmbryology",
      checkActiveSession,
      tokenVerified,
      this.patientListForEmbryology
    );
    // this._route.get(
    //   "/getEmbryologyDefaultTemplate/:treatmentCycleId",
    //   checkActiveSession,
    //   tokenVerified,
    //   this.getEmbryologyDefaultTemplate
    // );
    this._route.post(
      "/saveEmbryologyTreatment",
      checkActiveSession,
      tokenVerified,
      upload.fields([{ name: "embryologyImage", maxCount: 10 }]),
      this.saveEmbryologyTreatment
    );
    this._route.get(
      "/getEmbryologyDataByTreament/:treatementCycleId",
      checkActiveSession,
      tokenVerified,
      this.getEmbryologyDataByTreamentCycleId
    );
    this._route.put(
      "/editEmbryologyTreatment/:id",
      checkActiveSession,
      tokenVerified,
      upload.single("embryologyImage"),
      this.editEmbryologyTreatment
    );

    this._route.post(
      "/saveEmbryologyConsultation",
      checkActiveSession,
      tokenVerified,
      upload.fields([{ name: "embryologyImage", maxCount: 10 }]),
      this.saveEmrbyologyConsultation
    );
    this._route.get(
      "/getEmbryologyDataByConsultation/:consultationId",
      checkActiveSession,
      tokenVerified,
      this.getEmbryologyDataByConsultationId
    );
    this._route.put(
      "/editEmbryologyConsultation/:id",
      checkActiveSession,
      tokenVerified,
      upload.single("embryologyImage"),
      this.editEmbryologyConsultation
    );

    this._route.get(
      "/getEmbryologyTemplateById",
      checkActiveSession,
      tokenVerified,
      this.getEmbryologyTemplateById
    );

    this._route.get(
      "/downloadEmbryologyReport",
      checkActiveSession,
      tokenVerified,
      this.downloadEmbryologyReport
    );

    this._route.post(
      "/uploadEmbryologyImage",
      checkActiveSession,
      tokenVerified,
      upload.fields([{ name: "embryologyImage", maxCount: 10 }]),
      this.uploadEmbryologyImage
    );

    this._route.delete(
      "/deleteEmbryologyImage",
      checkActiveSession,
      tokenVerified,
      this.deleteEmbryologyImage
    );

     this._route.get(
      "/downloadEmbryologyImagesReport",
      checkActiveSession,
      tokenVerified,
      this.downloadEmbryologyImagesReport
    );

  }

  patientListForEmbryology = asyncHandler(async (req, res, next) => {
    const controllerObj = new EmbryologyController(req, res, next);
    await controllerObj.patientListForEmbryologyHandler();
  });

  // For Treatments
  saveEmbryologyTreatment = asyncHandler(async (req, res, next) => {
    const controllerObj = new EmbryologyController(req, res, next);
    await controllerObj.saveEmbryologyTreatmentHandler();
  });

  getEmbryologyDataByTreamentCycleId = asyncHandler(async (req, res, next) => {
    const controllerObj = new EmbryologyController(req, res, next);
    await controllerObj.getEmbryologyDataByTreamentCycleIdHandler();
  });

  editEmbryologyTreatment = asyncHandler(async (req, res, next) => {
    const controllerObj = new EmbryologyController(req, res, next);
    await controllerObj.editEmbryologyTreatmentHandler();
  });

  // For Consultations
  saveEmrbyologyConsultation = asyncHandler(async (req, res, next) => {
    const controllerObj = new EmbryologyController(req, res, next);
    await controllerObj.saveEmbryologyConsultationHandler();
  });

  getEmbryologyDataByConsultationId = asyncHandler(async (req, res, next) => {
    const controllerObj = new EmbryologyController(req, res, next);
    await controllerObj.getEmbryologyDataByConsultationIdHandler();
  });

  editEmbryologyConsultation = asyncHandler(async (req, res, next) => {
    const controllerObj = new EmbryologyController(req, res, next);
    await controllerObj.editEmbryologyConsultationHandler();
  });

  // getEmbryologyDefaultTemplate = asyncHandler(async (req,res,next) =>{
  //   const controllerObj = new EmbryologyController(req, res, next);
  //   await controllerObj.getEmbryologyDefaultTemplateHandler();
  // })

  getEmbryologyTemplateById = asyncHandler(async (req, res, next) => {
    const controllerObj = new EmbryologyController(req, res, next);
    await controllerObj.getEmbryologyTemplateByIdHandler();
  });

  downloadEmbryologyReport = asyncHandler(async (req, res, next) => {
    const controllerObj = new EmbryologyController(req, res, next);
    await controllerObj.downloadEmbryologyReportHandler();
  });

  uploadEmbryologyImage = asyncHandler(async (req, res, next) => {
    const controllerObj = new EmbryologyController(req, res, next);
    await controllerObj.uploadEmbryologyImageHandler();
  });

  deleteEmbryologyImage = asyncHandler(async (req, res, next) => {
    const controllerObj = new EmbryologyController(req, res, next);
    await controllerObj.deleteEmbryologyImageHandler();
  });

  downloadEmbryologyImagesReport = asyncHandler(async (req, res, next) => {
    const controllerObj = new EmbryologyController(req, res, next);
    await controllerObj.downloadEmbryologyImagesHandler();
  });
}

module.exports = EmbryologyRoute;
