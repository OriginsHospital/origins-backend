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
const TaskReferenceImageModel = require("../models/Master/TaskReferenceImageModel");

class TaskTrackerService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.s3 = AWSConnection.getS3();
    this.bucketName = AWSConnection.getS3BucketName();
  }

  async getAllTasksService() {
    const data = await this.mysqlConnection
      .query(getAllTasksQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("error while getting all tasks list", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async createTaskService() {
    const validatedCreateTaskPayload = await createTasksSchema.validateAsync(
      this._request.body
    );

    const createdTask = await TaskTrackerModel.create({
      ...validatedCreateTaskPayload,
      createdBy: this._request?.userDetails?.id,
      status: "pending"
    }).catch(err => {
      console.log("Error while creating tasks", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    return createdTask;
  }

  async createTaskCommentService() {
    const validatedCreateTaskPayload = await createTaskCommentsSchema.validateAsync(
      this._request.body
    );

    const { taskId, commentText } = validatedCreateTaskPayload;

    const isTasksExists = await TaskTrackerModel.findOne({
      where: {
        id: taskId
      }
    }).catch(err => {
      console.log("Error while finding task details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(isTasksExists)) {
      throw new createError.NotFound(Constants.TASK_DOES_NOT_EXIST);
    }

    await TaskCommentsModel.create({
      ...validatedCreateTaskPayload,
      commentedBy: this._request?.userDetails?.id
    }).catch(err => {
      console.log("Error while creating task comments", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.TASK_COMMENT_CREATED_SUCCESSFULLY;
  }

  async getTaskDetailsService() {
    const { taskId } = this._request.params;

    if (!taskId) {
      throw new createError.BadRequest(Constants.PROVIDE_TASK_ID);
    }

    const data = await this.mysqlConnection
      .query(getTaskDetailsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          taskId: taskId
        }
      })
      .catch(err => {
        console.log("error while getting task list", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data[0];
  }

  async editTaskService() {
    const validatedEditTaskPayload = await editTaskSchema.validateAsync(
      this._request.body
    );

    const { taskId, ...updateFields } = validatedEditTaskPayload;

    const existingTask = await TaskTrackerModel.findByPk(taskId);

    if (!existingTask) {
      throw new createError.NotFound("Task not found");
    }

    await existingTask.update(updateFields).catch(err => {
      console.error("Error while updating task:", err);
      throw new createError.InternalServerError(
        "Something went wrong while updating the task."
      );
    });

    return Constants.SUCCESS;
  }

  async uploadTaskReferenceImageToS3(file, taskId) {
    try {
      const uniqueFileName = `${file.originalname.split(".")[0]}_${Date.now()}`;
      const extension = file.originalname.split(".").pop();
      const key = `tasks/referenceImages/${taskId}/${uniqueFileName}.${extension}`;

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      };

      const uploadResult = await this.s3.upload(uploadParams).promise();

      return {
        imageUrl: uploadResult.Location,
        imageKey: key
      };
    } catch (err) {
      console.log("Error while uploading task image to S3: ", err);
      throw new Error("Error while uploading image");
    }
  }

  async addReferenceImagesService() {
    const { taskId } = this._request.params;

    if (!taskId) {
      throw new createError.BadRequest(Constants.PROVIDE_TASK_ID);
    }

    const task = await TaskTrackerModel.findByPk(taskId);

    if (!task) {
      throw new createError.NotFound(Constants.TASK_DOES_NOT_EXIST);
    }

    const uploadedBy = this._request.userDetails?.id;

    if (!this._request?.files || !this._request?.files?.referenceImages) {
      throw new createError.BadRequest(Constants.PROVIDE_REFERENCE_IMAGES);
    }

    return await this.mysqlConnection.transaction(async t => {
      const uploadedImages = [];

      if (this._request?.files && this._request?.files?.referenceImages) {
        for (const file of this._request.files.referenceImages) {
          const {
            imageUrl,
            imageKey
          } = await this.uploadTaskReferenceImageToS3(file, taskId);

          await TaskReferenceImageModel.create(
            {
              taskId,
              imageUrl,
              imageKey,
              uploadedBy
            },
            { transaction: t }
          ).catch(err => {
            console.log(
              "Error while uploading task reference image",
              err.message
            );
            throw new createError.InternalServerError(
              Constants.SOMETHING_ERROR_OCCURRED
            );
          });

          uploadedImages.push({ imageUrl, imageKey });
        }
      }

      return uploadedImages;
    });
  }

  async deleteReferenceImageService() {
    const { imageId } = this._request.params;
    if (!imageId) {
      throw new createError.BadRequest("Reference Image ID is required");
    }
    const imageRecord = await TaskReferenceImageModel.findByPk(imageId);
    if (!imageRecord) {
      throw new createError.NotFound("Reference Image not found");
    }

    try {
      await this.s3
        .deleteObject({ Bucket: this.bucketName, Key: imageRecord.imageKey })
        .promise();
    } catch (err) {
      console.log("Error while deleting image from S3: ", err.message);
    }

    await TaskReferenceImageModel.destroy({ where: { id: imageId } });

    return "Reference image deleted successfully";
  }
}

module.exports = TaskTrackerService;
