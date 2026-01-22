const createError = require("http-errors");
const Constants = require("../constants/constants");
const MySqlConnection = require("../connections/mysql_connection");
const { Sequelize } = require("sequelize");
const AWSConnection = require("../connections/aws_connection");
const PaymentsMasterModel = require("../models/Master/paymentsMaster");
const { getAllPaymentsQuery } = require("../queries/payments_queries");

class PaymentsService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.s3 = AWSConnection.getS3();
    this.bucketName = AWSConnection.getS3BucketName();
    this.currentUserId = this._request?.userDetails?.id;
  }

  async uploadFileToS3(file, paymentId, fileType) {
    try {
      const fileExtension = file.originalname.split(".").pop();
      const uniqueFileName = `${fileType}_${paymentId}_${Date.now()}.${fileExtension}`;
      const key = `payments/${paymentId}/${fileType}/${uniqueFileName}`;

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      };

      const uploadResult = await this.s3.upload(uploadParams).promise();
      return uploadResult.Location;
    } catch (err) {
      console.log(`Error while uploading ${fileType} to S3:`, err);
      throw new Error(`Error while uploading ${fileType}`);
    }
  }

  async createPaymentService() {
    const {
      branchId,
      paymentDate,
      departmentId,
      vendorId,
      amount
    } = this._request.body;

    if (!branchId || !paymentDate || !departmentId || !vendorId || !amount) {
      throw new createError.BadRequest("Missing required fields");
    }

    return await this.mysqlConnection.transaction(async t => {
      // Create payment record
      const payment = await PaymentsMasterModel.create(
        {
          branchId: parseInt(branchId),
          paymentDate,
          departmentId: parseInt(departmentId),
          vendorId: parseInt(vendorId),
          amount: parseFloat(amount),
          createdBy: this.currentUserId
        },
        { transaction: t }
      ).catch(err => {
        console.log("Error while creating payment", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      let invoiceUrl = null;
      let receiptUrl = null;

      // Upload invoice file if provided
      if (this._request?.files && this._request?.files?.invoiceFile) {
        const invoiceFile = Array.isArray(this._request.files.invoiceFile)
          ? this._request.files.invoiceFile[0]
          : this._request.files.invoiceFile;
        invoiceUrl = await this.uploadFileToS3(
          invoiceFile,
          payment.id,
          "invoice"
        );
      }

      // Upload receipt file if provided
      if (this._request?.files && this._request?.files?.receiptFile) {
        const receiptFile = Array.isArray(this._request.files.receiptFile)
          ? this._request.files.receiptFile[0]
          : this._request.files.receiptFile;
        receiptUrl = await this.uploadFileToS3(
          receiptFile,
          payment.id,
          "receipt"
        );
      }

      // Update payment with file URLs if files were uploaded
      if (invoiceUrl || receiptUrl) {
        await PaymentsMasterModel.update(
          {
            ...(invoiceUrl && { invoiceUrl }),
            ...(receiptUrl && { receiptUrl })
          },
          {
            where: { id: payment.id },
            transaction: t
          }
        ).catch(err => {
          console.log(
            "Error while updating payment with file URLs",
            err.message
          );
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      }

      // Fetch the created payment with all details
      const getPaymentByIdQuery = getAllPaymentsQuery.replace(
        "ORDER BY p.createdAt DESC",
        `WHERE p.id = :paymentId ORDER BY p.createdAt DESC`
      );
      const createdPayment = await this.mysqlConnection.query(
        getPaymentByIdQuery,
        {
          type: Sequelize.QueryTypes.SELECT,
          replacements: { paymentId: payment.id }
        }
      );

      return createdPayment[0] || payment;
    });
  }

  async getAllPaymentsService() {
    try {
      return await this.mysqlConnection.query(getAllPaymentsQuery, {
        type: Sequelize.QueryTypes.SELECT
      });
    } catch (err) {
      console.log("Error while fetching all payments", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }
}

module.exports = PaymentsService;
