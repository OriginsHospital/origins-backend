const express = require("express");
const ExpensesController = require("../controllers/expensesController");
const { asyncHandler } = require("../middlewares/errorHandlers");
const {
  checkActiveSession,
  tokenVerified
} = require("../middlewares/authMiddlewares.js");
const multer = require('multer');
const upload = multer(); 

class ExpensesRoute {
  _route = express.Router();
  constructor() {
    this.intializeRoutes();
  }

  async intializeRoutes() {
    // Expenses Module
    this._route.post(
      "/saveExpense",
      checkActiveSession,
      tokenVerified,
      upload.fields([{ name: "invoiceReceipt", maxCount: 10 }]),
      this.saveExpenses
    );
    this._route.put(
      "/editExpense",
      checkActiveSession,
      tokenVerified,
      upload.fields([{ name: "invoiceReceipt", maxCount: 10 }]),
      this.editExpense
    );
    this._route.get(
      "/getAllExpenses",
      checkActiveSession,
      tokenVerified,
      this.getAllExpenses
    );

    this._route.get(
      "/getExpenseDetailsById/:expenseId",
      checkActiveSession,
      tokenVerified,
      this.getExpenseDetailsById
    );

    this._route.delete(
      "/deleteReceipt",
      checkActiveSession,
      tokenVerified,
      this.deleteReceipt
    )

    // SubCategory Module
    this._route.get(
      "/getSubCategoryListByCategoryId/:id",
      checkActiveSession,
      tokenVerified,
      this.getSubCategoryByCategoryId
    );

    this._route.post(
      "/saveSubCategory",
      checkActiveSession,
      tokenVerified,
      this.saveSubCategory
    );

    this._route.post(
      "/editSubCategory",
      checkActiveSession,
      tokenVerified,
      this.editSubCategory
    );

    this._route.delete(
      "/deleteSubCategory",
      checkActiveSession,
      tokenVerified,
      this.deleteSubCategory
    );
  }

  saveExpenses = asyncHandler(async (req, res, next) => {
    const controllerObj = new ExpensesController(req, res, next);
    await controllerObj.saveExpensesHandler();
  });

  editExpense = asyncHandler(async (req, res, next) => {
    const controllerObj = new ExpensesController(req, res, next);
    await controllerObj.editExpenseHandler();
  });

  getAllExpenses = asyncHandler(async (req, res, next) => {
    const controllerObj = new ExpensesController(req, res, next);
    await controllerObj.getAllExpensesHandler();
  });

  getExpenseDetailsById = asyncHandler(async (req, res, next) => {
    const controllerObj = new ExpensesController(req, res, next);
    await controllerObj.getExpenseDetailsByIdHandler();
  });

  deleteReceipt = asyncHandler(async (req, res, next) => {
    const controllerObj = new ExpensesController(req, res, next);
    await controllerObj.deleteReceiptHandler();
  });

  getSubCategoryByCategoryId = asyncHandler(async (req, res, next) => {
    const controllerObj = new ExpensesController(req, res, next);
    await controllerObj.getSubCategoryByCategoryIdHandler();
  });

  saveSubCategory = asyncHandler(async (req, res, next) => {
    const controllerObj = new ExpensesController(req, res, next);
    await controllerObj.saveSubCategoryHandler();
  });

  editSubCategory = asyncHandler(async (req, res, next) => {
    const controllerObj = new ExpensesController(req, res, next);
    await controllerObj.editSubCategoryHandler();
  });

  deleteSubCategory = asyncHandler(async (req, res, next) => {
    const controllerObj = new ExpensesController(req, res, next);
    await controllerObj.deleteSubCategoryHandler();
  });
}

module.exports = ExpensesRoute;
