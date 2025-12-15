const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const lodash = require("lodash");
const { Sequelize, Op, where } = require("sequelize");
const { getAllOrdersList } = require("../queries/orders_queries");
const {
  createOrdersSchema,
  placeOrderSchema,
  receiveOrderSchema,
  paidOrderSchema
} = require("../schemas/ordersSchema");
const OrdersMasterModel = require("../models/Master/ordersMaster");
const AWSConnection = require("../connections/aws_connection");
const OrderSupplyItemsModel = require("../models/Master/OrderSupplyItemsModel");

class OrderService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.s3 = AWSConnection.getS3();
    this.bucketName = AWSConnection.getS3BucketName();
  }

  async createOrderService() {
    const validatedPayload = await createOrdersSchema.validateAsync(
      this._request.body
    );

    const { supplyItems, ...orderData } = validatedPayload;

    return await this.mysqlConnection.transaction(async t => {
      const order = await OrdersMasterModel.create(
        {
          ...orderData,
          createdBy: this._request?.userDetails?.id,
          isActive: 1,
          orderStatus: "Ordered"
        },
        { transaction: t }
      ).catch(err => {
        console.log("Error while creating orders", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      const orderSupplyItems = await OrderSupplyItemsModel.bulkCreate(
        supplyItems.map(item => ({
          orderId: order.id,
          supplyItemId: item.supplyItemId,
          quantity: item.quantity
        })),
        { transaction: t }
      ).catch(err => {
        console.log("Error while creating bulk supply item orders", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return { order, orderSupplyItems };
    });
  }

  async getAllOrdersService() {
    const data = await this.mysqlConnection
      .query(getAllOrdersList, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("error while getting orders list", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async placeOrderService() {
    const validatedPayload = await placeOrderSchema.validateAsync(
      this._request.body
    );

    const { orderId, expectedArrivalDate } = validatedPayload;

    const order = await OrdersMasterModel.findOne({
      where: {
        id: orderId,
        isActive: 1
      }
    }).catch(err => {
      console.log("error while getting order", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!order) {
      throw new createError.NotFound(Constants.ORDER_NOT_FOUND);
    }

    await OrdersMasterModel.update(
      {
        orderStatus: "Placed",
        expectedArrivalDate: expectedArrivalDate,
        updatedBy: this._request?.userDetails?.id
      },
      {
        where: {
          id: orderId,
          isActive: 1
        }
      }
    ).catch(err => {
      console.log("Error while placing order", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    return Constants.ORDER_PLACED_SUCCESSFULLY;
  }

  async receiveOrderService() {
    const validatedPayload = await receiveOrderSchema.validateAsync(
      this._request.body
    );

    const { orderId, receivedDate } = validatedPayload;

    if (!this._request.files || !this._request.files?.orderInvoice) {
      throw new createError.BadRequest("Order Invoice File is required!");
    }

    const order = await OrdersMasterModel.findOne({
      where: {
        id: orderId,
        isActive: 1
      }
    }).catch(err => {
      console.log("error while getting order", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!order) {
      throw new createError.NotFound(Constants.ORDER_NOT_FOUND);
    }

    return await this.mysqlConnection.transaction(async t => {
      const file = this._request.files.orderInvoice[0];

      const uniqueFileName = `${Date.now()}_${file.originalname}`;
      const key = `orders/orderInvoices/${orderId}`;
      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      };

      const uploadResult = await this.s3.upload(uploadParams).promise();
      const ImageURL = uploadResult.Location;

      const paramsToSend = {
        receivedDate,
        invoiceUrl: ImageURL,
        updatedBy: this._request?.userDetails?.id,
        orderStatus: "Received"
      };

      await OrdersMasterModel.update(paramsToSend, {
        transaction: t,
        where: {
          id: orderId,
          isActive: 1
        }
      }).catch(err => {
        console.log("Error while uploading receiving Order", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return Constants.ORDER_RECEIVED_SUCCESSFULLY;
    });
  }

  async paidOrderService() {
    const validatedPayload = await paidOrderSchema.validateAsync(
      this._request.body
    );

    const { orderId, paymentAmount, paymentDate } = validatedPayload;

    const order = await OrdersMasterModel.findOne({
      where: {
        id: orderId,
        isActive: 1
      }
    }).catch(err => {
      console.log("error while getting order", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!order) {
      throw new createError.NotFound(Constants.ORDER_NOT_FOUND);
    }

    await OrdersMasterModel.update(
      {
        orderStatus: "Completed",
        paymentDate,
        paymentAmount,
        updatedBy: this._request?.userDetails?.id
      },
      {
        where: {
          id: orderId,
          isActive: 1
        }
      }
    ).catch(err => {
      console.log("Error while paying order", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    return Constants.ORDER_PAID_SUCCESSFULLY;
  }
}

module.exports = OrderService;
