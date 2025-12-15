const express = require("express");
const MasterDataController = require("../controllers/masterDataController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  tokenVerified,
  checkActiveSession
} = require("../middlewares/authMiddlewares");

class ManageMasterDataRoute {
    _route = express.Router();
    constructor() {
        this.intializeRoutes();
    }

    async intializeRoutes() {
        // Appointment Reasons
        this._route.get(
            "/appointments/getAllAppointmentReasons",
            checkActiveSession,
            tokenVerified,
            this.getAllAppointmentReasonsRoute
        );

        this._route.post(
            "/appointments/addNewAppointmentReason",
            checkActiveSession,
            tokenVerified,
            this.addNewAppointmentReasonRoute
        );

        this._route.post(
            "/appointments/editAppointmentReason",
            checkActiveSession,
            tokenVerified,
            this.editAppointmentReasonRoute
        );

        this._route.delete(
            "/appointments/deleteAppointmentReason/:id",
            checkActiveSession,
            tokenVerified,
            this.deleteAppointmentReasonRoute
        )

        // Lab Test Groups
        this._route.get(
            "/labTestGroup/getAllLabTestGroups",
            checkActiveSession,
            tokenVerified,
            this.getAllLabTestGroupsRoute
        );

        this._route.post(
            "/labTestGroup/addNewLabTestGroup",
            checkActiveSession,
            tokenVerified,
            this.addNewLabTestGroupRoute
        );

        this._route.post(
            "/labTestGroup/editLabTestGroup",
            checkActiveSession,
            tokenVerified,
            this.editLabTestGroupRoute
        );

        this._route.delete(
            "/labTestGroup/deleteLabTestGroup/:id",
            checkActiveSession,
            tokenVerified,
            this.deleteLabTestGroupRoute
        )

        // Lab Test Sample Type
        this._route.get(
            "/labTestSampleType/getAllLabTestSampleTypes",
            checkActiveSession,
            tokenVerified,
            this.getAllLabTestSampleTypesRoute
        );

        this._route.post(
            "/labTestSampleType/addNewLabTestSampleType",
            checkActiveSession,
            tokenVerified,
            this.addNewLabTestSampleTypeRoute
        );

        this._route.post(
            "/labTestSampleType/editLabTestSampleType",
            checkActiveSession,
            tokenVerified,
            this.editLabTestSampleTypeRoute
        );

        this._route.delete(
            "/labTestSampleType/deleteLabTestSampleType/:id",
            checkActiveSession,
            tokenVerified,
            this.deleteLabTestSampleTypeRoute
        );

        // Lab Test Master
        this._route.get(
            "/labTests/getAllLabTestsList",
            checkActiveSession,
            tokenVerified,
            this.getAllLabTestsRoute
        );

        this._route.post(
            "/labTests/addNewLabTest",
            checkActiveSession,
            tokenVerified,
            this.addNewLabTestRoute
        );

        this._route.post(
            "/labTests/editLabTest",
            checkActiveSession,
            tokenVerified,
            this.editLabTestRoute
        );

        // Scan Master
        this._route.get(
            "/scans/getAllScansList",
            checkActiveSession,
            tokenVerified,
            this.getAllScansRoute
        );

        this._route.post(
            "/scans/addNewScan",
            checkActiveSession,
            tokenVerified,
            this.addNewScanRoute
        );

        this._route.post(
            "/scans/editScan",
            checkActiveSession,
            tokenVerified,
            this.editScanRoute
        );

        // Embryology Master
        this._route.get(
            "/embryology/getAllEmbryologyList",
            checkActiveSession,
            tokenVerified,
            this.getAllEmbryologyRoute
        );

        this._route.post(
            "/embryology/addNewEmbryology",
            checkActiveSession,
            tokenVerified,
            this.addNewEmbryologyRoute
        );

        this._route.post(
            "/embryology/editEmbryology",
            checkActiveSession,
            tokenVerified,
            this.editEmbryologyRoute
        );

        //items master
        this._route.get(
            "/pharmacy/getAllPharmacyItems",
            checkActiveSession,
            tokenVerified,
            this.getAllPharmacyItemsRoute
        );

        this._route.post(
            "/pharmacy/addNewPharmacyItem",
            checkActiveSession,
            tokenVerified,
            this.addNewPharmacyItemRoute
        );

        this._route.post(
            "/pharmacy/editPharmacyItem",
            checkActiveSession,
            tokenVerified,
            this.editPharmacyItemRoute
        );
        
        // incident management
        this._route.get(
            "/incident/getAllIncidentsList",
            checkActiveSession,
            tokenVerified,
            this.getAllIncidentsListRoute
        );

        this._route.post(
            "/incident/addNewIncident",
            checkActiveSession,
            tokenVerified,
            this.addNewIncidentRoute
        );

        this._route.post(
            "/incident/editIncident",
            checkActiveSession,
            tokenVerified,
            this.editIncidentRoute
        );

        // department master
        this._route.get(
            "/department/getDepartmentsList",
            checkActiveSession,
            tokenVerified,
            this.getDepartmentsList
        );

        this._route.post(
            "/department/addNewDepartment",
            checkActiveSession,
            tokenVerified,
            this.addNewDepartment
        );

        this._route.post(
            "/department/editDepartment",
            checkActiveSession,
            tokenVerified,
            this.editDepartment
        );

        // vendor master
        this._route.get(
            "/vendors/getAllVendorsList",
            checkActiveSession,
            tokenVerified,
            this.getVendorsList
        );

        this._route.get(
            "/vendors/getAllVendorsList/:departmentId",
            checkActiveSession,
            tokenVerified,
            this.getVendorsListByDepartmentId
        );

        this._route.post(
            "/vendors/addNewVendor",
            checkActiveSession,
            tokenVerified,
            this.addNewVendor
        );

        this._route.post(
            "/vendors/editVendor",
            checkActiveSession,
            tokenVerified,
            this.editVendor
        );

        // Supplies Master
         this._route.get(
            "/supplies/getAllSuppliesList",
            checkActiveSession,
            tokenVerified,
            this.getAllSuppliesList
        );

        this._route.get(
            "/supplies/getAllSuppliesList/:departmentId",
            checkActiveSession,
            tokenVerified,
            this.getAllSuppliesListByDepartmentId
        );

        this._route.post(
            "/supplies/addNewSupplyItem",
            checkActiveSession,
            tokenVerified,
            this.addNewSupplyItem
        );

        this._route.post(
            "/supplies/editSupplyItem",
            checkActiveSession,
            tokenVerified,
            this.editSupplyItem
        );

        //referrals
        this._route.get(
            "/referrals/getAllReferrals",
            checkActiveSession,
            tokenVerified,
            this.getAllReferralsRoute
        );

        this._route.post(
            "/referrals/addReferral",
            checkActiveSession,
            tokenVerified,
            this.addReferralRoute
        );

        this._route.post(
            "/referrals/editReferral",
            checkActiveSession,
            tokenVerified,
            this.editReferralRoute
        );

        //cities
        this._route.get(
            "/cities/getAllcities",
            checkActiveSession,
            tokenVerified,
            this.getAllCitiesRoute
        );

        this._route.post(
            "/cities/addCity",
            checkActiveSession,
            tokenVerified,
            this.addCityRoute
        );

        this._route.post(
            "/cities/editcity",
            checkActiveSession,
            tokenVerified,
            this.editcityRoute
        );

        // Default OT Scheduler Persons
        this._route.get(
            "/otRecord/getDefaultPersonsList",
            checkActiveSession,
            tokenVerified,
            this.getOtDefaultPersonsList
        );

        this._route.post(
            "/otRecord/saveDefaultPerson",
            checkActiveSession,
            tokenVerified,
            this.saveOtDefaultperson
        );

        this._route.post(
            "/otRecord/editDefaultPerson",
            checkActiveSession,
            tokenVerified,
            this.editOtDefaultPerson
        );
    }   
    
    // Appointment Reasons
    getAllAppointmentReasonsRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.getAllAppointmentReasonsHandler();
    });

    addNewAppointmentReasonRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.addNewAppointmentReasonController();
    });

    editAppointmentReasonRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.editAppointmentReasonController();
    });

    deleteAppointmentReasonRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.deleteAppointmentReasonController();
    });

    // Lab Test Groups
    getAllLabTestGroupsRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.getLabTestGroupsController();
    });

    addNewLabTestGroupRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.addLabTestGroupController();
    });

    editLabTestGroupRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.editLabTestGroupController();
    });

    deleteLabTestGroupRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.deleteLabTestGroupController();
    });

    // Lab Test Sample Type
    getAllLabTestSampleTypesRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.getLabTestSampleTypeController();
    });

    addNewLabTestSampleTypeRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.addLabTestSampleTypeController();
    });

    editLabTestSampleTypeRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.editLabTestSampleTypeController();
    });

    deleteLabTestSampleTypeRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.deleteLabTestSampleTypeController();
    });

    // Lab Tests Master
    getAllLabTestsRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.getLabTestsController();
    });

    addNewLabTestRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.addLabTestController();
    });

    editLabTestRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.editLabTestController();
    });

    //Scans Master
    getAllScansRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.getAllScansController();
    });

    addNewScanRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.addNewScanController();
    });

    editScanRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.editScanController();
    });

    //Embryology Master
    getAllEmbryologyRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.getAllEmbryologyController();
    });

    addNewEmbryologyRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.addNewEmbryologyController();
    });

    editEmbryologyRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.editEmbryologyController();
    });

    //items (pharmacy medications) Master
    getAllPharmacyItemsRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.getAllPharmacyItemsController();
    });

    addNewPharmacyItemRoute= asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.addNewPharmacyItemController();
    });

    editPharmacyItemRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.editPharmacyItemController();
    });
    
    // incident management
    getAllIncidentsListRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.getAllIncidentHandler();
    });

    addNewIncidentRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.addNewIncidentHandler();
    });

    editIncidentRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.editIncidentHandler();
    });


    // department master
    getDepartmentsList = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.getAllDepartmentsHandler();
    });

    addNewDepartment = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.addNewDepartmentHandler();
    });

    editDepartment = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.editDepartmentHandler();
    });

     // vendor master
     getVendorsList = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.getAllVendorsController();
    });

    getVendorsListByDepartmentId = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.getVendorsListByDepartmentIdController();
    });

    addNewVendor = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.addVendorController();
    });

    editVendor = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.editVendorController();
    });

    // Supplies Master
    getAllSuppliesList = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.getAllSuppliesController();
    });

    getAllSuppliesListByDepartmentId = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.getAllSuppliesListByDepartmentIdController();
    });

    addNewSupplyItem = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.addNewSupplyItemController();
    });

    editSupplyItem = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.editSuppliesController();
    });

    //referrals
    getAllReferralsRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.getAllReferralsController();
    });

    addReferralRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.addReferralController();
    });

    editReferralRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.editReferralController();
    });

    //cities

    getAllCitiesRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.getAllCitiesController();
    });

    addCityRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.addCityController();
    });

    editcityRoute = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.editCityController();
    });

    // ot default persons list
    getOtDefaultPersonsList = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.getOtDefaultPersonsListController();
    });

    saveOtDefaultperson = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.saveOtDefaultpersonController();
    });

    editOtDefaultPerson  = asyncHandler(async (req, res, next) => {
        const controllerObj = new MasterDataController(req, res, next);
        await controllerObj.editDefaultPersonController();
    });
}

module.exports = ManageMasterDataRoute;
