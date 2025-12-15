const IpService = require("../services/ipService");
const Constants = require("../constants/constants");

class IpController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new IpService(this._request, this._response, this._next);
  }

  async getIndentDetailsHandler() {
    const data = await this._service.getIndentDetailsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addNewIndentHandler() {
    const data = await this._service.addNewIndentService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getBuildingsHandler() {
    const data = await this._service.getBuildingsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getFloorsHandler() {
    const data = await this._service.getFloorsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getRoomHandler() {
    const data = await this._service.getRoomService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getBedsHandler() {
    const data = await this._service.getBedsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createIPRegistrationHandler() {
    const data = await this._service.createIPRegistrationService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getActiveIPHandler() {
    const data = await this._service.getActiveIPService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getClosedIPHandler() {
    const data = await this._service.getClosedIPService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getIPDataByIdHandler() {
    const data = await this._service.getIPDataByIdService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createIPNotesHandler() {
    const data = await this._service.createIPNotesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getIPNotesHistoryByIdHandler() {
    const data = await this._service.getIPNotesHistoryByIdService(
      this._request
    );
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async closeIpRegistrationHandler() {
    const data = await this._service.closeIpRegistrationService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async ipRoomChangeHandler() {
    const data = await this._service.ipRoomChangeService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  // ========== LAYOUT MANAGEMENT HANDLERS ==========

  // State handlers
  async createStateHandler() {
    const data = await this._service.createStateService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getStatesHandler() {
    const data = await this._service.getStatesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updateStateHandler() {
    const data = await this._service.updateStateService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  // City handlers
  async createCityHandler() {
    const data = await this._service.createCityService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getCitiesHandler() {
    const data = await this._service.getCitiesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updateCityHandler() {
    const data = await this._service.updateCityService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  // Branch handlers
  async createBranchHandler() {
    const data = await this._service.createBranchService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getBranchesHandler() {
    const data = await this._service.getBranchesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updateBranchHandler() {
    const data = await this._service.updateBranchService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  // Building handlers
  async createBuildingHandler() {
    const data = await this._service.createBuildingService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updateBuildingHandler() {
    const data = await this._service.updateBuildingService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  // Floor handlers
  async createFloorHandler() {
    const data = await this._service.createFloorService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updateFloorHandler() {
    const data = await this._service.updateFloorService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  // Room handlers
  async createRoomHandler() {
    const data = await this._service.createRoomService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updateRoomHandler() {
    const data = await this._service.updateRoomService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  // Bed handlers
  async createBedHandler() {
    const data = await this._service.createBedService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createBedsBulkHandler() {
    const data = await this._service.createBedsBulkService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async updateBedHandler() {
    const data = await this._service.updateBedService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteBedHandler() {
    const data = await this._service.deleteBedService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteRoomHandler() {
    const data = await this._service.deleteRoomService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteFloorHandler() {
    const data = await this._service.deleteFloorService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = IpController;
