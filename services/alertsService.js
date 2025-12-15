const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const { Sequelize } = require("sequelize");
const lodash = require("lodash");
const AWSConnection = require("../connections/aws_connection");
const {
  getAllTasksQuery,
  getTaskDetailsQuery
} = require("../queries/tasktracker_queries");
const {
  createTasksSchema,
  createTaskCommentsSchema,
  editTaskSchema
} = require("../schemas/taskTrakerSchema");
const TaskTrackerModel = require("../models/Master/taskTrackerMaster");
const TaskCommentsModel = require("../models/Master/TaskCommentsModel");
const SiteAlertsMaster = require("../models/Master/siteAlertsMaster");
const {
  createAlertsSchema,
  editAlertsSchema
} = require("../schemas/alertsSchema");

class AlertsService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
  }

  async getAllAlertsRouteService() {
    const data = await this.mysqlConnection
      .query(`SELECT * FROM site_alerts_master`, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching alerts", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return data;
  }

  async createAlertRouteService() {
    const validatedCreateAlertPayload = await createAlertsSchema.validateAsync(
      this._request.body
    );

    const createdAlert = await SiteAlertsMaster.create({
      ...validatedCreateAlertPayload,
      createdBy: this._request?.userDetails?.id
    }).catch(err => {
      console.log("Error while creating alerts", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    return createdAlert;
  }

  async editAlertRouteService() {
    const validatedEditAlertPayload = await editAlertsSchema.validateAsync(
      this._request.body
    );

    const { alertId, ...updateFields } = validatedEditAlertPayload;

    const existingAlert = await SiteAlertsMaster.findByPk(alertId);

    if (!existingAlert) {
      throw new createError.NotFound("Alert not found");
    }

    await existingAlert
      .update({ ...updateFields, updatedBy: this._request?.userDetails?.id })
      .catch(err => {
        console.error("Error while updating alert:", err);
        throw new createError.InternalServerError(
          "Something went wrong while updating the alert."
        );
      });

    return Constants.SUCCESS;
  }

  async deleteAlertRouteService() {
    const alertId = this._request.params.alertId;
    if (!alertId) {
      throw new createError.BadRequest("Alert ID is required");
    }
    const existingAlert = await SiteAlertsMaster.findByPk(alertId);
    if (!existingAlert) {
      throw new createError.NotFound("Alert not found");
    }
    await existingAlert.destroy().catch(err => {
      console.error("Error while deleting alert:", err);
      throw new createError.InternalServerError(
        "Something went wrong while deleting the alert."
      );
    });
    return Constants.DELETED_SUCCESSFULLY;
  }
}

module.exports = AlertsService;
