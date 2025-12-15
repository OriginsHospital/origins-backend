const createError = require("http-errors");
const Constants = require("../constants/constants");
const {
  saveExpensesSchema,
  editExpensesSchema,
  deleteSubCategorySchema,
  editSubCategorySchema,
  saveSubCategorySchema,
  deleteReceiptSchema
} = require("../schemas/expensesSchema");
const ExpensesMasterModel = require("../models/Master/expensesMaster");
const ExpenseSubCategoryMasterModel = require("../models/Master/expenseSubCategoryMaster");
const {
  getAllExpensesQuery,
  getAllSubCategoriesByCategoryIdQuery,
  getExpenseDetailsByIdQuery
} = require("../queries/expenses_queries");
const MySqlConnection = require("../connections/mysql_connection");
const { Sequelize } = require("sequelize");
const lodash = require("lodash");
const AWSConnection = require("../connections/aws_connection");
const ExpenseReceiptAssociation = require("../models/Associations/expenseReceiptAssociations");

class ExpensesService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.s3 = AWSConnection.getS3();
    this.bucketName = AWSConnection.getS3BucketName();
  }

  async uploadReceiptToS3(file, expenseId) {
    try {
      const uniqueFileName = `${file.originalname.split(".")[0]}_${Date.now()}`;

      const key = `expenses/receipts/${expenseId}/${uniqueFileName}.${file.originalname
        .split(".")
        .pop()}`;

      const uploadParams = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
      };

      const uploadResult = await this.s3.upload(uploadParams).promise();

      return uploadResult.Location;
    } catch (err) {
      console.log("Error while uploading receipt to S3: ", err);
      throw new Error("Error while uploading receipt");
    }
  }

  async saveExpensesService() {
    const validatedExpenseData = await saveExpensesSchema.validateAsync(
      this._request.body
    );
    const createdBy = this._request.userDetails?.id;
    return await this.mysqlConnection.transaction(async t => {
      const expense = await ExpensesMasterModel.create(
        {
          ...validatedExpenseData,
          createdBy
        },
        { transaction: t }
      ).catch(err => {
        console.log("Error while creating expense", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      const receiptUrls = [];

      if (this._request?.files && this._request?.files?.invoiceReceipt) {
        for (const file of this._request.files.invoiceReceipt) {
          const receiptUrl = await this.uploadReceiptToS3(file, expense.id);

          await ExpenseReceiptAssociation.create(
            {
              expenseId: expense.id,
              receiptUrl: receiptUrl,
              uploadedBy: createdBy,
              uploadedAt: new Date()
            },
            { transaction: t }
          ).catch(err => {
            console.log("Error while uploading receipt", err.message);
            throw new createError.InternalServerError(
              Constants.SOMETHING_ERROR_OCCURRED
            );
          });

          receiptUrls.push(receiptUrl);
        }
      }

      return {
        id: expense.id,
        branchId: expense.branchId,
        category: expense.category,
        subCategory: expense.subCategory,
        description: expense.description,
        amount: expense.amount,
        paymentDate: expense.paymentDate,
        createdBy: expense.createdBy,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
        invoiceReceipt: receiptUrls
      };
    });
  }

  async editExpenseService() {
    const validatedExpenseData = await editExpensesSchema.validateAsync(
      this._request.body
    );

    const expense = await ExpensesMasterModel.findByPk(validatedExpenseData.id);

    if (!expense) {
      throw new createError.NotFound(`Expense not found`);
    }

    const updatedBy = this._request.userDetails?.id;

    await this.mysqlConnection.transaction(async t => {
      await ExpensesMasterModel.update(
        { ...validatedExpenseData, updatedBy },
        { where: { id: validatedExpenseData.id }, transaction: t }
      ).catch(err => {
        console.log("Error while updating expense", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      // Upload new receipts
      const newReceiptUrls = [];

      if (this._request?.files && this._request?.files?.invoiceReceipt) {
        for (const file of this._request.files.invoiceReceipt) {
          const receiptUrl = await this.uploadReceiptToS3(
            file,
            validatedExpenseData.id
          );

          await ExpenseReceiptAssociation.create(
            {
              expenseId: validatedExpenseData.id,
              receiptUrl: receiptUrl,
              uploadedBy: updatedBy,
              uploadedAt: new Date()
            },
            { transaction: t }
          ).catch(err => {
            console.log("Error while uploading receipt ", err.message);
            throw new createError.InternalServerError(
              Constants.SOMETHING_ERROR_OCCURRED
            );
          });

          newReceiptUrls.push(receiptUrl);
        }
      }
    });

    // Fetch all receipts for this expense
    const existingReceipts = await ExpenseReceiptAssociation.findAll({
      where: { expenseId: validatedExpenseData.id },
      attributes: ["receiptUrl"]
    });

    const allReceiptUrls = existingReceipts.map(r => r.receiptUrl);

    const updatedExpense = await ExpensesMasterModel.findByPk(
      validatedExpenseData.id
    );

    return {
      id: updatedExpense.id,
      branchId: updatedExpense.branchId,
      category: updatedExpense.category,
      subCategory: updatedExpense.subCategory,
      description: updatedExpense.description,
      amount: updatedExpense.amount,
      paymentDate: updatedExpense.paymentDate,
      createdBy: updatedExpense.createdBy,
      createdAt: updatedExpense.createdAt,
      updatedAt: updatedExpense.updatedAt,
      invoiceReceipt: allReceiptUrls
    };
  }

  async deleteReceiptService() {
    const validatedDeleteReceiptBody = await deleteReceiptSchema.validateAsync(
      this._request.body
    );

    const { expenseId, receiptUrl } = validatedDeleteReceiptBody;
    const expense = await ExpensesMasterModel.findByPk(expenseId);
    if (!expense) {
      throw new createError.NotFound(`Expense not found`);
    }
    const receipt = await ExpenseReceiptAssociation.findOne({
      where: {
        expenseId: expenseId,
        receiptUrl: receiptUrl
      }
    });

    if (!receipt) {
      throw new createError.NotFound(`Receipt not found`);
    }

    return await this.mysqlConnection.transaction(async t => {
      // Delete the receipt from S3
      const key = receiptUrl?.split(".com/")[1];
      const deleteParams = {
        Bucket: this.bucketName,
        Key: key
      };

      await this.s3.deleteObject(deleteParams).promise();

      //delete the receipt from DB
      await ExpenseReceiptAssociation.destroy({
        where: { id: receipt.id },
        transaction: t
      }).catch(err => {
        console.log("Error while deleting receipt", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return Constants.DELETED_SUCCESSFULLY;
    });
  }

  async getAllExpensesService() {
    try {
      return await this.mysqlConnection.query(getAllExpensesQuery, {
        type: Sequelize.QueryTypes.SELECT
      });
    } catch (err) {
      console.log("Error while fetching all expenses ", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async getExpenseDetailsByIdService() {
    const { expenseId } = this._request.params;

    const expense = await ExpensesMasterModel.findByPk(expenseId);
    if (!expense) {
      throw new createError.NotFound(`Expense not found`);
    }

    const expenseDetails = await this.mysqlConnection
      .query(getExpenseDetailsByIdQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          expenseId: expenseId
        }
      })
      .catch(err => {
        console.log("Error while getting the expense details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return expenseDetails || [];
  }

  async getSubCategoryByCategoryIdService() {
    const { id } = this._request.params;
    return await this.mysqlConnection
      .query(getAllSubCategoriesByCategoryIdQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          categoryId: id
        }
      })
      .catch(err => {
        console.log("Error while getting the subcategiry data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async saveSubCategoryService() {
    const payload = await saveSubCategorySchema.validateAsync(
      this._request.body
    );

    const subCategoryName = payload.ledgerName.trim().toLowerCase();

    const exists = await ExpenseSubCategoryMasterModel.findOne({
      where: {
        ledgerName: subCategoryName,
        categoryId: payload.categoryId
      }
    }).catch(err => {
      console.log("Error while saving details of subcategory details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(exists)) {
      throw new createError.BadRequest(Constants.SUB_CATEGORY_ALREADY_EXISTS);
    }

    await ExpenseSubCategoryMasterModel.create(payload).catch(err => {
      console.log("Error while saving subcategory details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.SUCCESS;
  }

  async editSubCategoryService() {
    const editPayload = await editSubCategorySchema.validateAsync(
      this._request.body
    );

    const subCategoryName = editPayload.ledgerName.trim().toLowerCase();
    const exists = await ExpenseSubCategoryMasterModel.findOne({
      where: {
        ledgerName: subCategoryName,
        categoryId: editPayload.categoryId
      }
    }).catch(err => {
      console.log("Error while saving details of subcategory details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(exists)) {
      throw new createError.BadRequest(Constants.SUB_CATEGORY_ALREADY_EXISTS);
    }

    const dataExists = await ExpenseSubCategoryMasterModel.findOne({
      where: {
        id: editPayload.id
      }
    }).catch(err => {
      console.log("Error while getting existing details", err);
    });

    if (lodash.isEmpty(dataExists)) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    await ExpenseSubCategoryMasterModel.update(
      {
        ledgerName: editPayload.ledgerName
      },
      {
        where: {
          categoryId: editPayload.categoryId,
          id: editPayload.id
        }
      }
    ).catch(err => {
      console.log("Error while updating subcategory details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async deleteSubCategoryService() {
    const deletePayload = await deleteSubCategorySchema.validateAsync(
      this._request.body
    );

    const dataExists = await ExpenseSubCategoryMasterModel.findOne({
      where: {
        id: deletePayload.id
      }
    }).catch(err => {
      console.log("Error while getting existing details", err);
    });

    if (lodash.isEmpty(dataExists)) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    await ExpenseSubCategoryMasterModel.destroy({
      where: {
        id: deletePayload.id,
        categoryId: deletePayload.categoryId
      }
    }).catch(err => {
      console.log("Error while deleting subcategory details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.SUCCESS;
  }
}

module.exports = ExpensesService;
