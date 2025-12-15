const Constants = require("../constants/constants");
const TaskTrackerService = require("../services/taskTrackerService");

class TaskTrackerController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new TaskTrackerService(
      this._request,
      this._response,
      this._next
    );
  }

  async getAllTasksRouteHandler() {
    const data = await this._service.getAllTasksService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createTaskRouteHandler() {
    const data = await this._service.createTaskService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async createTaskCommentRouteHandler() {
    const data = await this._service.createTaskCommentService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async getTaskDetailsRouteHandler() {
    const data = await this._service.getTaskDetailsService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async editTaskRouteHandler() {
    const data = await this._service.editTaskService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async addReferenceImagesHandler() {
    const data = await this._service.addReferenceImagesService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }

  async deleteReferenceImageHandler() {
    const data = await this._service.deleteReferenceImageService(this._request);
    this._response.status(200).send({
      status: 200,
      message: Constants.SUCCESS,
      data: data
    });
  }
}

module.exports = TaskTrackerController;
