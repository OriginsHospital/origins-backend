const lodash = require("lodash");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const { Sequelize, Op } = require("sequelize");
const TaxCategoryMasterModel = require("../models/Master/TaxCategoryMasterModel");
const StockMySQLConnection = require("../connections/stock_mysql_connection");
const {
  getTaxCategoryQuery,
  getInventoryTypeQuery,
  getSupplierQuery,
  getManufacturerQuery,
  getPharmacyListByDateQuery,
  getGrnListQuery,
  pharmacyPurchaseAndStockReductionQuery,
  reduceQuantityQuery,
  geneatePaymentBreakUpDetailsQuery,
  grnItemsReturnHistoryQuery,
  getGrnItemsQuery,
  updateGrnMasterPaymentStatus,
  checkGrnPaymentStatus,
  itemInfoByLineBillId
} = require("../queries/pharmacy_queries");
const {
  createTaxCategorySchema,
  editTaxCategorySchema,
  editInventoryTypeSchema,
  createInventoryTypeSchema,
  createSupplierSchema,
  editSupplierSchema,
  createManufacturerSchema,
  editManufacturerSchema,
  updatePharmacyDetailsSchema,
  saveGrnDetailsSchema,
  generatePaymentBreakUpSchema,
  returnGrnItemsSchema,
  saveGrnPaymentsSchema
} = require("../schemas/pharmacySchema");
const InventoryTypeMasterModel = require("../models/Master/InventoryTypeMasterModel");
const SupplierMasterModel = require("../models/Master/SupplierMasterModel");
const ManufacturerMasterModel = require("../models/Master/ManufacturerMasterModel");
const ConsultationAppointmentLineBillsAssociationsModel = require("../models/Associations/consultationAppointmentLineBillsAssociations");
const TreatmentAppointmentLineBillsAssociationModel = require("../models/Associations/treatmentAppointmentLineBillsAssociations");
const GrnPaymentAssociationsModel = require("../models/Associations/grnPaymentAssociations");
const GrnItemsAssociationsModel = require("../models/Associations/grnItemsAssociations");
const GrnDetailsMasterModel = require("../models/Master/grnDetailsMaster");
const ItemsMasterModel = require("../models/Master/ItemMaster");
const PharmacyPurchaseDetailsTemp = require("../models/Order/pharmacyPurchaseDetailsTemp");
const GrnItemsReturnModel = require("../models/Master/GrnItemsReturnsModel");
const GrnPaymentsMasterModel = require("../models/Master/grnPaymentsMaster");
const moment = require("moment-timezone");
class PharmacyService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.stocksqlConnection = StockMySQLConnection._instance;
  }

  async getTaxCategoryService() {
    const taxCategoryData = await this.stocksqlConnection
      .query(getTaxCategoryQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("error while fetching tax category list", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return taxCategoryData;
  }

  async createTaxCategoryService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedData = await createTaxCategorySchema.validateAsync(
      this._request.body
    );
    validatedData.createdBy = createdByUserId;

    const createdTaxCategoryData = await TaxCategoryMasterModel.create(
      validatedData
    ).catch(err => {
      console.log("Error while creating new tax category", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return createdTaxCategoryData.dataValues;
  }

  async editTaxCategoryService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedEditData = await editTaxCategorySchema.validateAsync(
      this._request.body
    );
    validatedEditData.createdBy = createdByUserId;

    const existingTaxCategory = await TaxCategoryMasterModel.findOne({
      where: { id: validatedEditData.id }
    }).catch(err => {
      console.log(
        "Error while getting existing tax category Details",
        err.message
      );
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!existingTaxCategory) {
      throw new createError.BadRequest(Constants.TAX_CATEGORY_DOES_NOT_EXIST);
    }

    await TaxCategoryMasterModel.update(
      {
        categoryName: validatedEditData.categoryName,
        taxPercent: validatedEditData.taxPercent,
        createdBy: createdByUserId
      },
      { where: { id: existingTaxCategory.dataValues.id } }
    ).catch(err => {
      console.log("Error while updating existing tax category Details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getInventoryTypeService() {
    const inventoryTypeData = await this.stocksqlConnection
      .query(getInventoryTypeQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("error while fetching inventory type list", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return inventoryTypeData;
  }

  async createInventoryTypeService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedData = await createInventoryTypeSchema.validateAsync(
      this._request.body
    );
    validatedData.createdBy = createdByUserId;

    const createdInventoryTypeData = await InventoryTypeMasterModel.create(
      validatedData
    ).catch(err => {
      console.log("Error while creating new inventory type", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return createdInventoryTypeData.dataValues;
  }

  async editInventoryTypeService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedEditData = await editInventoryTypeSchema.validateAsync(
      this._request.body
    );
    validatedEditData.createdBy = createdByUserId;

    const existingInventoryType = await InventoryTypeMasterModel.findOne({
      where: { id: validatedEditData.id }
    }).catch(err => {
      console.log(
        "Error while getting existing inventory type Details",
        err.message
      );
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!existingInventoryType) {
      throw new createError.BadRequest(Constants.INVENTORY_TYPE_DOES_NOT_EXIST);
    }

    await InventoryTypeMasterModel.update(
      {
        name: validatedEditData.name,
        createdBy: createdByUserId
      },
      { where: { id: existingInventoryType.dataValues.id } }
    ).catch(err => {
      console.log("Error while updating existing inventory type Details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getSupplierService() {
    const supplierData = await this.stocksqlConnection
      .query(getSupplierQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("error while fetching supplier list", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return supplierData;
  }

  async createSupplierService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedData = await createSupplierSchema.validateAsync(
      this._request.body
    );
    validatedData.createdBy = createdByUserId;
    validatedData.isActive = 1;

    const validatedName = validatedData?.supplier
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase

    const sameNameExists = await SupplierMasterModel.findOne({
      where: Sequelize.where(
        Sequelize.fn(
          "REPLACE",
          Sequelize.fn("LOWER", Sequelize.col("supplier")),
          " ",
          ""
        ),
        validatedName
      )
    }).catch(err => {
      console.log("Error while supplier addition", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameNameExists)) {
      throw new createError.BadRequest(Constants.SUPPLIER_NAME_EXISTS);
    }

    const createdSupplierData = await SupplierMasterModel.create(
      validatedData
    ).catch(err => {
      console.log("Error while creating new supplier", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return createdSupplierData.dataValues;
  }

  async editSupplierService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedEditData = await editSupplierSchema.validateAsync(
      this._request.body
    );
    validatedEditData.createdBy = createdByUserId;

    const validatedName = validatedEditData?.supplier
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase

    const sameNameExists = await SupplierMasterModel.findOne({
      where: {
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn(
              "REPLACE",
              Sequelize.fn("LOWER", Sequelize.col("supplier")),
              " ",
              ""
            ),
            validatedName
          ),
          { id: { [Op.ne]: validatedEditData?.id } }
        ]
      }
    }).catch(err => {
      console.log("Error while supplier addition", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameNameExists)) {
      throw new createError.BadRequest(Constants.SUPPLIER_NAME_EXISTS);
    }

    const existingSupplier = await SupplierMasterModel.findOne({
      where: { id: validatedEditData.id }
    }).catch(err => {
      console.log("Error while getting existing supplier details", err.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!existingSupplier) {
      throw new createError.BadRequest(Constants.SUPPLIER_DOES_NOT_EXIST);
    }

    await SupplierMasterModel.update(
      {
        supplier: validatedEditData.supplier,
        gstNumber: validatedEditData.gstNumber,
        contactPerson: validatedEditData.contactPerson,
        contactNumber: validatedEditData.contactNumber,
        emailId: validatedEditData.emailId,
        tinNumber: validatedEditData.tinNumber,
        panNumber: validatedEditData.panNumber,
        dlNumber: validatedEditData.dlNumber,
        address: validatedEditData.address,
        accountDetails: validatedEditData.accountDetails,
        remarks: validatedEditData.remarks,
        isActive: validatedEditData.isActive,
        createdBy: createdByUserId
      },
      { where: { id: existingSupplier.dataValues.id } }
    ).catch(err => {
      console.log("Error while updating existing supplier details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getManufacturerService() {
    const manufacturerData = await this.stocksqlConnection
      .query(getManufacturerQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("error while fetching manufacturer list", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return manufacturerData;
  }

  async createManufacturerService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedData = await createManufacturerSchema.validateAsync(
      this._request.body
    );
    validatedData.createdBy = createdByUserId;
    validatedData.isActive = 1;

    const createdManufacturerData = await ManufacturerMasterModel.create(
      validatedData
    ).catch(err => {
      console.log("Error while creating new manufacturer", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return createdManufacturerData.dataValues;
  }

  async editManufacturerService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedEditData = await editManufacturerSchema.validateAsync(
      this._request.body
    );
    validatedEditData.createdBy = createdByUserId;

    const existingManufacturer = await ManufacturerMasterModel.findOne({
      where: { id: validatedEditData.id }
    }).catch(err => {
      console.log(
        "Error while getting existing manufacturer details",
        err.message
      );
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!existingManufacturer) {
      throw new createError.BadRequest(Constants.MANUFACTURER_DOES_NOT_EXIST);
    }

    await ManufacturerMasterModel.update(
      {
        manufacturer: validatedEditData.manufacturer,
        address: validatedEditData.address,
        contactNumber: validatedEditData.contactNumber,
        emailId: validatedEditData.emailId,
        isActive: validatedEditData.isActive,
        createdBy: createdByUserId
      },
      { where: { id: existingManufacturer.dataValues.id } }
    ).catch(err => {
      console.log("Error while updating existing manufacturer details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getPharmacyByDateService() {
    const { date, branch } = this._request.query;
    if (lodash.isEmpty(date.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "date")
      );
    }
    if (lodash.isEmpty(branch.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "branch")
      );
    }
    return await this.mysqlConnection
      .query(getPharmacyListByDateQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          date: date,
          branchId: +branch
        }
      })
      .catch(err => {
        console.log("Error while fetching pharmacy by date", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  // To Calculate which item should be picked from which GRN during PACKGED stage
  async pharmacyPurchaseAndStockReduction(
    id,
    type,
    purchaseQuantity,
    itemPurchaseInformation
  ) {
    const insertPayload = {
      refId: id,
      purchaseDetails: JSON.stringify(itemPurchaseInformation),
      purchaseQuantity,
      type
    };

    // Adding in temp table: In Case retrun some items in packed Stage, we can track here
    await this.stocksqlConnection.transaction(async t => {
      await PharmacyPurchaseDetailsTemp.destroy({
        where: {
          refId: id
        },
        transaction: t
      }).catch(err => {
        console.log("error deleting purchase details temp", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await PharmacyPurchaseDetailsTemp.create(insertPayload, {
        transaction: t
      }).catch(err => {
        console.log("error while adding purchase temp details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    });

    // Reduction Of Stock when moved to Packed Stage
    const stockReduction = itemPurchaseInformation.map(data => {
      return this.mysqlConnection
        .query(reduceQuantityQuery, {
          replacements: {
            id,
            reduceQuantity: data.usedQuantity,
            type,
            grnId: data.grnId
          }
        })
        .catch(err => {
          console.log("error while reducing the quantity ", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    });
    await Promise.all(stockReduction);
  }

  async generateBreakUpDetailsLogic(entries) {
    // If quantity is reduced, modify the temp table
    for (const entry of entries) {
      const { id, type, itemPurchaseInformation, purchaseQuantity } = entry;

      const insertPayload = {
        refId: id,
        purchaseDetails: JSON.stringify(itemPurchaseInformation),
        purchaseQuantity,
        type
      };

      // Adding in temp table: In Case retrun some items in packed Stage, we can track here
      await this.stocksqlConnection.transaction(async t => {
        await PharmacyPurchaseDetailsTemp.destroy({
          where: {
            refId: id
          },
          transaction: t
        }).catch(err => {
          console.log("error deleting purchase details temp", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

        await PharmacyPurchaseDetailsTemp.create(insertPayload, {
          transaction: t
        }).catch(err => {
          console.log("error while adding purchase temp details", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      });

      if (entry?.type == "Treatment") {
        await TreatmentAppointmentLineBillsAssociationModel.update(
          {
            purchaseQuantity: entry?.purchaseQuantity
          },
          {
            where: {
              id: entry.id
            }
          }
        );
      } else if (entry?.type == "Consultation") {
        await ConsultationAppointmentLineBillsAssociationsModel.update(
          {
            purchaseQuantity: entry?.purchaseQuantity
          },
          {
            where: {
              id: entry.id
            }
          }
        );
      }
    }

    // Generate payment breakUp For current entries: Move to Packed Stage/Modify the quantity
    let breakUpDetails = [];

    const entryPromises = entries.map(async entry => {
      const { id, type } = entry ?? {};
      let purchaseDetails = entry?.itemPurchaseInformation;
      let totalCost = 0;
      purchaseDetails = purchaseDetails.filter(item => item?.usedQuantity != 0);
      let itemDetailedInfo = purchaseDetails.map(item => {
        totalCost = totalCost + +item?.usedQuantity * +item?.mrpPerTablet;
        return {
          grnId: item.grnId,
          usedQuantity: item.usedQuantity,
          returnedQuantity: item?.returnedQuantity,
          mrpPerTablet: item.mrpPerTablet,
          expiryDate: item.expiryDate,
          initialUsedQuantity: item?.initialUsedQuantity,
          batchNo: item?.batchNo
        };
      });
      console.log("itemDetailedInfo", entry);
      let itemInfo = await this.mysqlConnection
        .query(itemInfoByLineBillId, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            id: id,
            type: type
          }
        })
        .catch(err => {
          console.log("Error while fetching item info by Reference Id", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      breakUpDetails.push({
        refId: entry.id,
        type: entry.type,
        itemName: !lodash.isEmpty(itemInfo) ? itemInfo[0]?.itemName : "",
        purchaseDetails: itemDetailedInfo,
        totalCost: totalCost
      });
    });
    await Promise.all(entryPromises);
    return breakUpDetails;
  }

  async generatePaymentBreakUpService() {
    const entries = await generatePaymentBreakUpSchema.validateAsync(
      this._request.body.generateBreakUp
    );
    return await this.generateBreakUpDetailsLogic(entries);
  }

  // Generate Payment Breakup and track returned items
  async updatePharmacyDetailsService() {
    try {
      const entries = await updatePharmacyDetailsSchema.validateAsync(
        this._request.body.movetopackedstage
      );
      for (const entry of entries) {
        const { id, type, purchaseQuantity, itemPurchaseInformation } =
          entry ?? {};

        // Update Purchase Quantity in the Line Bills Table
        let updateModel;
        if (type === "Treatment") {
          updateModel = TreatmentAppointmentLineBillsAssociationModel;
        } else if (type === "Consultation") {
          updateModel = ConsultationAppointmentLineBillsAssociationsModel;
        } else {
          throw new createError.BadRequest(Constants.INVALID_OPERATION);
        }

        await updateModel
          .update({ purchaseQuantity }, { where: { id } })
          .catch(err => {
            console.log("Error while updating the pharmacy details", err);
            throw new createError.InternalServerError(
              Constants.SOMETHING_ERROR_OCCURRED
            );
          });

        await this.pharmacyPurchaseAndStockReduction(
          id,
          type,
          purchaseQuantity,
          itemPurchaseInformation
        );
      }
      // returning default payment breakup with default presribed Quantity
      return await this.generateBreakUpDetailsLogic(entries);
    } catch (err) {
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async saveGrnDetailsService() {
    const grnPayload = await saveGrnDetailsSchema.validateAsync(
      this._request.body
    );

    await this.stocksqlConnection.transaction(async t => {
      let { grnDetails, grnItemDetails, grnPaymentDetails } = grnPayload;

      // Check if invoice number already exists
      if (grnDetails.invoiceNumber && grnDetails.invoiceNumber.trim() !== "") {
        const existingGrn = await GrnDetailsMasterModel.findOne({
          where: { invoiceNumber: grnDetails.invoiceNumber.trim() },
          transaction: t
        });
        if (existingGrn) {
          throw new createError.BadRequest(
            "Invoice number already exists. Please use a unique invoice number."
          );
        }
      }

      const grnData = await GrnDetailsMasterModel.create(grnDetails, {
        transaction: t
      }).catch(err => {
        console.log("error while saving grn details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      let grnId = grnData.dataValues.id;

      // Keep GRN id same as the autoincrement id
      await GrnDetailsMasterModel.update(
        { grnNo: String(grnId) },
        {
          where: { id: grnId },
          transaction: t
        }
      ).catch(err => {
        console.log("error while saving grn details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      grnItemDetails = grnItemDetails.map(item => {
        return {
          ...item,
          intialQuantity: item?.pack * (item?.quantity + item?.freeQuantity),
          totalQuantity: item?.pack * (item?.quantity + item?.freeQuantity),
          grnId
        };
      });

      grnPaymentDetails = { ...grnPaymentDetails, grnId };

      await GrnItemsAssociationsModel.bulkCreate(grnItemDetails, {
        transaction: t
      }).catch(err => {
        console.log("error while saving grn item details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await GrnPaymentAssociationsModel.create(grnPaymentDetails, {
        transaction: t
      }).catch(err => {
        console.log("error while saving grn payment details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return Constants.SUCCESS;
    });
  }

  async getGrnDetailsByIdService() {
    const { id } = this._request.params;
    if (lodash.isEmpty(id.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "id")
      );
    }

    const grnDetails = await GrnDetailsMasterModel.findOne({
      where: {
        id: id
      }
    }).catch(err => {
      console.log("Error while fetching the grn details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    const grnItemDetails = await this.stocksqlConnection
      .query(getGrnItemsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          grnId: id
        }
      })
      .catch(err => {
        console.log("Error while fetching the grn item details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    const grnPaymentDetails = await GrnPaymentAssociationsModel.findOne({
      where: {
        grnId: id
      }
    }).catch(err => {
      console.log("Error while fetching the grn payment details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(grnDetails)) {
      return {
        grnDetails: grnDetails,
        grnItemDetails: grnItemDetails,
        grnPaymentDetails: grnPaymentDetails
      };
    }
    return {};
  }

  async getItemSuggestionService() {
    const { searchText } = this._request.params;
    if (lodash.isEmpty(searchText.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "seachText")
      );
    }
    const data = await ItemsMasterModel.findAll({
      where: {
        itemName: { [Op.like]: "" + `%${searchText}%` + "" }
      }
    }).catch(err => {
      console.log("Error while fetching item Names", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return !lodash.isEmpty(data) ? data : [];
  }

  async getSupplierSuggestionService() {
    const { searchText } = this._request.params;
    if (lodash.isEmpty(searchText.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "seachText")
      );
    }
    const data = await SupplierMasterModel.findAll({
      where: {
        supplier: { [Op.like]: "" + `%${searchText}%` + "" }
      },
      attributes: ["id", "supplier", "emailId", "address", "gstNumber"]
    }).catch(err => {
      console.log("Error while fetching item Names", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return !lodash.isEmpty(data) ? data : [];
  }

  async getGrnListService() {
    const currentUserBranchId = this._request.userDetails.branchDetails.map(
      branch => {
        return branch.id;
      }
    );
    return await this.stocksqlConnection
      .query(getGrnListQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          branchId: currentUserBranchId.map(branch => String(branch))
        }
      })
      .catch(err => {
        console.log("Error while fetching getGrn List", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
  }

  async grnItemsReturnHistoryService() {
    const currentUserBranchId = this._request.userDetails.branchDetails.map(
      branch => {
        return branch.id;
      }
    );
    let data = await this.stocksqlConnection
      .query(grnItemsReturnHistoryQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          branchId: currentUserBranchId.map(branch => String(branch))
        }
      })
      .catch(err => {
        console.log("Error while fetching items return history", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(data)) {
      data = data.map(entry => {
        return {
          ...entry,
          returnDetails: JSON.parse(entry.returnDetails)
        };
      });
    }
    return data;
  }

  async returnGrnItemsService() {
    const returnGrnItemsPayload = await returnGrnItemsSchema.validateAsync(
      this._request.body
    );

    await this.stocksqlConnection.transaction(async t => {
      await GrnItemsReturnModel.create(
        {
          ...returnGrnItemsPayload,
          returnDetails: JSON.stringify(returnGrnItemsPayload.returnDetails)
        },
        {
          transaction: t
        }
      ).catch(err => {
        console.log("Error while adding return details to the grn table", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      const itemsList = await returnGrnItemsPayload.returnDetails.map(
        itemDetail => {
          return itemDetail.itemId;
        }
      );

      await GrnItemsAssociationsModel.update(
        {
          isReturned: 1
        },
        {
          where: {
            grnId: returnGrnItemsPayload.grnId,
            itemId: itemsList.map(id => String(id))
          },
          transaction: t
        }
      ).catch(err => {
        console.log("Error while updating the grnItems isReturned", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    });

    return Constants.SUCCESS;
  }

  async saveGrnPaymentsService() {
    try {
      const grnPaymentsPayload = await saveGrnPaymentsSchema.validateAsync(
        this._request.body
      );
      const grnNumber = grnPaymentsPayload.grnNo;
      const orderId = moment.tz("Asia/Kolkata").format("YYYYMMDDHHmmssSS");
      const updatedPaymentPayload = { ...grnPaymentsPayload, orderId };

      const grnMaster = await this.stocksqlConnection.query(
        checkGrnPaymentStatus,
        {
          replacements: { grnNumber: grnNumber },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      if (grnMaster.length === 0) {
        throw new createError.NotFound("GRN not found.");
      }

      if (grnMaster[0].status !== "DUE") {
        return "Payment already received for this GRN.";
      }

      await this.stocksqlConnection.transaction(async t => {
        await GrnPaymentsMasterModel.create(updatedPaymentPayload, {
          transaction: t
        });

        await this.stocksqlConnection.query(updateGrnMasterPaymentStatus, {
          replacements: { grnNumber: grnNumber },
          transaction: t
        });
      });

      return Constants.GRN_PAYMENT_SUCCESSFULLY_SAVED;
    } catch (err) {
      console.error("Error while saving payments:", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    }
  }

  async showGrnAvailabilityByItemIdService() {
    const { id, type, branchId } = this._request.query;
    if (lodash.isEmpty(id)) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Id")
      );
    }

    if (lodash.isEmpty(branchId)) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Branch Id")
      );
    }

    if (lodash.isEmpty(type.trim())) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "Type")
      );
    }

    let itemInfo = await this.mysqlConnection
      .query(pharmacyPurchaseAndStockReductionQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          id: id,
          type: type,
          branchId: branchId
        }
      })
      .catch(err => {
        console.log("Error while fetching item informarion", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(itemInfo)) {
      throw new createError.BadRequest(Constants.ITEM_NOT_FOUND);
    }
    itemInfo = itemInfo.map(item => {
      return {
        ...item,
        totalQuantity: +item?.totalQuantity
      };
    });
    return {
      id: +id,
      type: type,
      availableGrnInfo: itemInfo
    };
  }
}

module.exports = PharmacyService;
