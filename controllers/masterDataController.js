const MasterDataService = require("../services/masterDataService");
const Constants = require("../constants/constants");

class MasterDataController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new MasterDataService(
      this._request,
      this._response,
      this._next
    );
  }

  // Appointment Reasons
  async getAllAppointmentReasonsHandler() {
    const data = await this._service.getAllAppointmentReasonsService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addNewAppointmentReasonController() {
    const data = await this._service.createAppointmentReasonService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editAppointmentReasonController() {
    const data = await this._service.editAppointmentReasonService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteAppointmentReasonController() {
    const data = await this._service.deleteAppointmentReasonService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  // Lab Test Groups
  async getLabTestGroupsController() {
    const data = await this._service.getLabTestGroupService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addLabTestGroupController() {
    const data = await this._service.createLabTestGroupService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editLabTestGroupController() {
    const data = await this._service.editLabTestGroupService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteLabTestGroupController() {
    const data = await this._service.deleteLabTestGroupService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  // Lab Test Sample Type
  async getLabTestSampleTypeController() {
    const data = await this._service.getLabTestSampleTypeService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addLabTestSampleTypeController() {
    const data = await this._service.createLabTestSampleTypeService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editLabTestSampleTypeController() {
    const data = await this._service.editLabTestSampleTypeService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteLabTestSampleTypeController() {
    const data = await this._service.deleteLabTestSampleTypeService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  // Lab Tests Master
  async getLabTestsController() {
    const data = await this._service.getLabTestListService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addLabTestController() {
    const data = await this._service.createLabTestService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editLabTestController() {
    const data = await this._service.editLabTestService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  //Scan Master
  async getAllScansController() {
    const data = await this._service.getAllScansService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addNewScanController() {
    const data = await this._service.addNewScanService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editScanController() {
    const data = await this._service.editScanService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  //Embryology Master
  async getAllEmbryologyController() {
    const data = await this._service.getAllEmbryologyService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addNewEmbryologyController() {
    const data = await this._service.addNewEmbryologyService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editEmbryologyController() {
    const data = await this._service.editEmbryologyService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  //Item master
  async getAllPharmacyItemsController() {
    const data = await this._service.getAllPharmacyItemsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addNewPharmacyItemController() {
    const data = await this._service.addNewPharmacyItemService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editPharmacyItemController() {
    const data = await this._service.editPharmacyItemService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAllIncidentHandler() {
    const data = await this._service.getAllIncidentList(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addNewIncidentHandler() {
    const data = await this._service.addNewIncident(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editIncidentHandler() {
    const data = await this._service.editIncident(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAllDepartmentsHandler() {
    const data = await this._service.getAllDepartmentsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addNewDepartmentHandler() {
    const data = await this._service.addDepartmentService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editDepartmentHandler() {
    const data = await this._service.editDepartmentService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAllVendorsController() {
    const data = await this._service.getAllVendorsListService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getVendorsListByDepartmentIdController() {
    const data = await this._service.getVendorsListByDepartmentIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addVendorController() {
    const data = await this._service.addVendorService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editVendorController() {
    const data = await this._service.editVendorService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAllSuppliesController() {
    const data = await this._service.getAllSuppliesListService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAllSuppliesListByDepartmentIdController() {
    const data = await this._service.getAllSuppliesListByDepartmentIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addNewSupplyItemController() {
    const data = await this._service.addSuppliesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editSuppliesController() {
    const data = await this._service.editSuppliesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAllReferralsController() {
    const data = await this._service.getAllReferralsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addReferralController() {
    const data = await this._service.addReferralService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editReferralController() {
    const data = await this._service.editReferralService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getAllCitiesController() {
    const data = await this._service.getAllCitiesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addCityController() {
    const data = await this._service.addCityService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editCityController() {
    const data = await this._service.editCityService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getOtDefaultPersonsListController() {
    const data = await this._service.getOtDefaultPersonsListService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async saveOtDefaultpersonController() {
    const data = await this._service.saveOtDefaultpersonService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editDefaultPersonController() {
    const data = await this._service.editOtDefaultPersonController(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}
module.exports = MasterDataController;
