const TasksService = require("../services/tasksService");
const Constants = require("../constants/constants");

class TasksController {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this._service = new TasksService(request, response, next);
  }

  async getTasksRouteHandler() {
    const data = await this._service.getTasksService();
    this._response.status(200).json({
      status: 200,
      message: Constants.DATA_FETCHED_SUCCESS,
      data
    });
  }

  async getTaskDetailsRouteHandler() {
    const data = await this._service.getTaskDetailsService();
    this._response.status(200).json({
      status: 200,
      message: Constants.DATA_FETCHED_SUCCESS,
      data
    });
  }

  async createTaskRouteHandler() {
    const data = await this._service.createTaskService();
    this._response.status(201).json({
      status: 201,
      message: "Task created successfully",
      data
    });
  }

  async updateTaskRouteHandler() {
    const data = await this._service.updateTaskService();
    this._response.status(200).json({
      status: 200,
      message: "Task updated successfully",
      data
    });
  }

  async updateTaskStatusRouteHandler() {
    const data = await this._service.updateTaskStatusService();
    this._response.status(200).json({
      status: 200,
      message: "Task status updated successfully",
      data
    });
  }

  async deleteTaskRouteHandler() {
    const data = await this._service.deleteTaskService();
    this._response.status(200).json({
      status: 200,
      message: data,
      data: null
    });
  }
}

module.exports = TasksController;
