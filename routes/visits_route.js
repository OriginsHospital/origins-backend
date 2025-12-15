const express = require("express");
const VisitsController = require("../controllers/visitsController.js");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");
const multer = require("multer");
const upload = multer();
class VisitsRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    this._route.post(
      "/createVisit",
      checkActiveSession,
      tokenVerified,
      this.createVisitRoute
    );
    this._route.put(
      "/editVisit",
      checkActiveSession,
      tokenVerified,
      this.editVisitRoute
    );
    this._route.get(
      "/getVisits/:patientId",
      checkActiveSession,
      tokenVerified,
      this.getVisitRoute
    );
    this._route.post(
      "/closeVisit/:visitId",
      checkActiveSession,
      tokenVerified,
      this.closeVisitRoute
    );
    this._route.post(
      "/closeVisitByConsultation/:visitId",
      checkActiveSession,
      tokenVerified,
      this.closeVisitByConsultationRoute
    );
    this._route.post(
      "/createConsultationOrTreatment",
      checkActiveSession,
      tokenVerified,
      this.createConsultationOrTreatmentRoute
    );
    this._route.get(
      "/getVisitInfo/:visitId",
      checkActiveSession,
      tokenVerified,
      this.getVisitInfoRoute
    );

    //package routes

    // this._route.post(
    //   "/createPackage",
    //   checkActiveSession,
    //   tokenVerified,
    //   this.createPackageRoute
    // );
    this._route.put(
      "/editPackage",
      checkActiveSession,
      tokenVerified,
      this.editPackageRoute
    );
    this._route.get(
      "/getPackages/:visitId",
      checkActiveSession,
      tokenVerified,
      this.getPackageRoute
    );
    this._route.post(
      "/applyDiscountForPackage",
      checkActiveSession,
      tokenVerified,
      this.applyDiscountForPackage
    );

    //donar routes
    this._route.get(
      "/getDonarInformation",
      checkActiveSession,
      tokenVerified,
      this.getDonarInformation
    );

    this._route.get(
      "/getDonarDataByVisitId/:visitId",
      checkActiveSession,
      tokenVerified,
      this.getDonarDataByVisitId
    );

    this._route.post(
      "/saveDonar",
      checkActiveSession,
      tokenVerified,
      upload.fields([
        { name: "marriageCertificate", maxCount: 1 },
        { name: "kyc", maxCount: 1 },
        { name: "birthCertificate", maxCount: 1 },
        { name: "aadhaar", maxCount: 1 },
        { name: "donarPhotoUrl", maxCount: 1 },
        { name: "donarSignatureUrl", maxCount: 1 },
        { name: "form24b", maxCount: 1 },            
        { name: "insuranceCertificate", maxCount: 1 }, 
        { name: "spouseAadharCard", maxCount: 1 },     
        { name: "artBankCertificate", maxCount: 1 },   
        { name: "anaesthesiaConsent", maxCount: 1 },   
        { name: "form13", maxCount: 1 }           
      ]),
      this.saveDonar
    );

    this._route.put(
      "/editDonar",
      checkActiveSession,
      tokenVerified,
      upload.fields([
        { name: "marriageCertificate", maxCount: 1 },
        { name: "kyc", maxCount: 1 },
        { name: "birthCertificate", maxCount: 1 },
        { name: "aadhaar", maxCount: 1 },
        { name: "donarPhotoUrl", maxCount: 1 },
        { name: "donarSignatureUrl", maxCount: 1 },
        { name: "form24b", maxCount: 1 },            
        { name: "insuranceCertificate", maxCount: 1 }, 
        { name: "spouseAadharCard", maxCount: 1 },     
        { name: "artBankCertificate", maxCount: 1 },   
        { name: "anaesthesiaConsent", maxCount: 1 },   
        { name: "form13", maxCount: 1 }     
      ]),
      this.editDonar
    );

    this._route.delete(
      "/deleteDonorFile",
      checkActiveSession,
      tokenVerified,
      this.deleteDonorFile
    );

    this._route.post(
      "/saveHysteroscopy",
      checkActiveSession,
      tokenVerified,
      this.saveHysteroscopyRoute
    );

    this._route.get(
      "/getHysteroscopy",
      checkActiveSession,
      tokenVerified,
      this.getHysteroscopyRoute
    );

    this._route.post(
          "/addHysteroscopyReferenceImages/:hysteroscopyId",
          checkActiveSession,
          tokenVerified,
          upload.fields([{ name: "hysteroscopyReferenceImages", maxCount: 10 }]),
          this.addHysteroscopyReferenceImages
        );
    
        this._route.delete(
          "/deleteHysteroscopyReferenceImage/:imageId",
          checkActiveSession,
          tokenVerified,
          this.deleteHysteroscopyReferenceImage
        );

  }

  createVisitRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.createVisitHandler();
  });

  editVisitRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.editVisitHandler();
  });

  getVisitRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.getVisitHandler();
  });

  closeVisitRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.closeVisitHandler();
  });

  closeVisitByConsultationRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.closeVisitByConsultationHandler();
  });

  createConsultationOrTreatmentRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.createConsultationOrTreatmentHandler();
  });

  getVisitInfoRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.getVisitInfoHandler();
  });

  createPackageRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.createPackageHandler();
  });

  editPackageRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.editPackageHandler();
  });

  getPackageRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.getPackageHandler();
  });

  applyDiscountForPackage = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.applyDiscountForPackageHandler();
  });

  getDonarInformation= asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.getDonarInformationHandler();
  });

  getDonarDataByVisitId= asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.getDonarDataByVisitIdHandler();
  });

  saveDonar = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.saveDonarHandler();
  });

  editDonar = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.editDonarHandler();
  });

  deleteDonorFile = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.deleteDonorFileHandler();
  });

  saveHysteroscopyRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.saveHysteroscopyHandler();
  });

  getHysteroscopyRoute = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.getHysteroscopyHandler();
  });

  addHysteroscopyReferenceImages = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.addHysteroscopyReferenceImagesHandler();
  });

  deleteHysteroscopyReferenceImage = asyncHandler(async (req, res, next) => {
    const controllerObj = new VisitsController(req, res, next);
    await controllerObj.deleteHysteroscopyReferenceImageHandler();
  });
}

module.exports = VisitsRoute;
