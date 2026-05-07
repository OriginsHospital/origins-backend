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
  itemInfoByLineBillId,
  verifyGrnItemLineBranchQuery,
  deleteGrnItemLinesForItemBranchQuery,
  getGrnStockLinesForItemBranchQuery,
  reassignGrnStockItemIdForBranchQuery,
  getGrnTransferPreviewByIdQuery,
  getGrnItemStockLinesForTransferQuery,
  getGrnBranchTransferHistoryQuery
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
  saveGrnPaymentsSchema,
  updateGrnStockReportLineSchema,
  updateGrnStockReportItemSummarySchema,
  grnBranchTransferSchema,
  grnBranchTransferPreviewSchema
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
const BranchMasterModel = require("../models/Master/branchMaster");
const GrnBranchTransferMasterModel = require("../models/Master/grnBranchTransferMaster");
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
          batchNo: item?.batchNo,
          nonPurchaseReason: item?.nonPurchaseReason || null
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
        itemName: { [Op.like]: `%${searchText}%` },
        isActive: 1
      },
      order: [["itemName", "ASC"], ["id", "DESC"]]
    }).catch(err => {
      console.log("Error while fetching item Names", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      return [];
    }

    const rows = data.map(d => d.get({ plain: true }));
    const seenNames = new Map();
    const unique = [];
    for (const r of rows) {
      const nameKey = (r.itemName || "").trim().toLowerCase();
      const dedupeKey = nameKey || `__id_${r.id}`;
      if (seenNames.has(dedupeKey)) {
        continue;
      }
      seenNames.set(dedupeKey, true);
      unique.push(r);
    }
    return unique;
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

  async updateGrnStockReportLineService() {
    const payload = await updateGrnStockReportLineSchema.validateAsync(
      this._request.body
    );
    const grnItemAssociationId = parseInt(
      this._request.params.grnItemAssociationId,
      10
    );
    if (Number.isNaN(grnItemAssociationId)) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "grn item association id")
      );
    }

    const verified = await this.stocksqlConnection
      .query(verifyGrnItemLineBranchQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          grnItemAssociationId,
          branchId: payload.branchId
        }
      })
      .catch(err => {
        console.log("Error verifying GRN stock line", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(verified)) {
      throw new createError.NotFound(
        "GRN stock line not found for this branch or already returned."
      );
    }

    const updatePayload = { totalQuantity: payload.totalQuantity };
    if (
      payload.expiryDate !== undefined &&
      payload.expiryDate !== null &&
      payload.expiryDate !== ""
    ) {
      updatePayload.expiryDate = moment(payload.expiryDate).format(
        "YYYY-MM-DD"
      );
    }

    await GrnItemsAssociationsModel.update(updatePayload, {
      where: { id: grnItemAssociationId }
    }).catch(err => {
      console.log("Error updating GRN stock line", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.SUCCESS;
  }

  async deleteGrnStockReportLineService() {
    const grnItemAssociationId = parseInt(
      this._request.params.grnItemAssociationId,
      10
    );
    const branchId = parseInt(this._request.query.branchId, 10);
    if (Number.isNaN(grnItemAssociationId)) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "grn item association id")
      );
    }
    if (Number.isNaN(branchId)) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "branchId")
      );
    }

    const verified = await this.stocksqlConnection
      .query(verifyGrnItemLineBranchQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { grnItemAssociationId, branchId }
      })
      .catch(err => {
        console.log("Error verifying GRN stock line for delete", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(verified)) {
      throw new createError.NotFound(
        "GRN stock line not found for this branch or already returned."
      );
    }

    await GrnItemsAssociationsModel.destroy({
      where: { id: grnItemAssociationId }
    }).catch(err => {
      console.log("Error deleting GRN stock line", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.SUCCESS;
  }

  async deleteGrnStockReportItemService() {
    const itemId = parseInt(this._request.params.itemId, 10);
    const branchId = parseInt(this._request.query.branchId, 10);
    if (Number.isNaN(itemId)) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "item id")
      );
    }
    if (Number.isNaN(branchId)) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{params}", "branchId")
      );
    }

    const queryResult = await this.stocksqlConnection
      .query(deleteGrnItemLinesForItemBranchQuery, {
        replacements: { itemId, branchId }
      })
      .catch(err => {
        console.log("Error deleting GRN stock lines for item", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    const meta = Array.isArray(queryResult) ? queryResult[1] : queryResult;
    const deletedRows =
      meta?.affectedRows ?? (typeof meta === "number" ? meta : 0);

    return {
      deletedRows
    };
  }

  async adjustGrnStockBranchTotalInTransaction(
    itemId,
    branchId,
    targetTotal,
    transaction
  ) {
    const target = Math.round(Number(targetTotal));
    if (Number.isNaN(target) || target < 0) {
      throw new createError.BadRequest("Invalid total quantity.");
    }

    const rows = await this.stocksqlConnection
      .query(getGrnStockLinesForItemBranchQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { itemId, branchId },
        transaction
      })
      .catch(err => {
        console.log("Error fetching GRN stock lines for item", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (rows.length === 0) {
      if (target > 0) {
        throw new createError.BadRequest(
          "No GRN stock lines exist for this item at this branch. Add stock via GRN first."
        );
      }
      return;
    }

    const sum = rows.reduce((acc, r) => acc + Number(r.totalQuantity || 0), 0);
    if (Math.abs(sum - target) < 0.0001) {
      return;
    }

    if (rows.length === 1) {
      await GrnItemsAssociationsModel.update(
        { totalQuantity: target },
        { where: { id: rows[0].id }, transaction }
      ).catch(err => {
        console.log("Error updating GRN stock total", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
      return;
    }

    if (sum === 0) {
      for (let i = 0; i < rows.length; i++) {
        await GrnItemsAssociationsModel.update(
          { totalQuantity: i === 0 ? target : 0 },
          { where: { id: rows[i].id }, transaction }
        ).catch(err => {
          console.log("Error updating GRN stock total", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      }
      return;
    }

    let allocated = 0;
    for (let i = 0; i < rows.length; i++) {
      const isLast = i === rows.length - 1;
      const q = Number(rows[i].totalQuantity || 0);
      const nextQty = isLast
        ? target - allocated
        : Math.round((target * q) / sum);
      allocated += nextQty;
      await GrnItemsAssociationsModel.update(
        { totalQuantity: nextQty },
        { where: { id: rows[i].id }, transaction }
      ).catch(err => {
        console.log("Error updating GRN stock total", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }
  }

  async updateGrnStockReportItemSummaryService() {
    const payload = await updateGrnStockReportItemSummarySchema.validateAsync(
      this._request.body
    );
    const { branchId, itemId } = payload;

    const item = await ItemsMasterModel.findByPk(itemId);
    if (!item) {
      throw new createError.NotFound(Constants.ITEM_NOT_FOUND);
    }

    const trimmedName =
      payload.itemName !== undefined ? String(payload.itemName).trim() : null;

    if (trimmedName && trimmedName !== item.itemName) {
      const validatedName = trimmedName.replace(/\s+/g, "").toLowerCase();
      const sameItemNameExists = await ItemsMasterModel.findOne({
        where: {
          [Op.and]: [
            Sequelize.where(
              Sequelize.fn(
                "REPLACE",
                Sequelize.fn("LOWER", Sequelize.col("itemName")),
                " ",
                ""
              ),
              validatedName
            ),
            { id: { [Op.ne]: itemId } }
          ]
        }
      }).catch(err => {
        console.log("Error while checking duplicate item name", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (!lodash.isEmpty(sameItemNameExists)) {
        throw new createError.BadRequest(Constants.SAME_MEDICATION_NAME_EXISTS);
      }
    }

    const newItemId =
      payload.newItemId !== undefined ? payload.newItemId : itemId;

    await this.stocksqlConnection.transaction(async t => {
      if (trimmedName && trimmedName !== item.itemName) {
        await ItemsMasterModel.update(
          { itemName: trimmedName },
          { where: { id: itemId }, transaction: t }
        ).catch(err => {
          console.log("Error updating item name from GRN stock report", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
      }

      if (payload.totalQuantity !== undefined) {
        await this.adjustGrnStockBranchTotalInTransaction(
          itemId,
          branchId,
          payload.totalQuantity,
          t
        );
      }

      if (newItemId !== itemId) {
        const targetItem = await ItemsMasterModel.findByPk(newItemId, {
          transaction: t
        });
        if (!targetItem) {
          throw new createError.NotFound("Target item ID does not exist.");
        }
        await this.stocksqlConnection
          .query(reassignGrnStockItemIdForBranchQuery, {
            replacements: {
              oldItemId: itemId,
              newItemId,
              branchId
            },
            transaction: t
          })
          .catch(err => {
            console.log("Error reassigning GRN stock item id", err);
            throw new createError.InternalServerError(
              Constants.SOMETHING_ERROR_OCCURRED
            );
          });
      }
    });

    return Constants.SUCCESS;
  }

  async getGrnBranchTransferPreviewService() {
    const { grnId } = await grnBranchTransferPreviewSchema.validateAsync(
      this._request.query
    );
    const currentUserBranchIds = this._request.userDetails.branchDetails.map(
      branch => branch.id
    );

    const rows = await this.stocksqlConnection
      .query(getGrnTransferPreviewByIdQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { grnId }
      })
      .catch(err => {
        console.log("Error while fetching grn transfer preview", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(rows)) {
      throw new createError.NotFound("GRN details not found.");
    }

    const sourceBranchId = Number(rows[0].sourceBranchId);
    if (!currentUserBranchIds.includes(sourceBranchId)) {
      throw new createError.Forbidden(
        "You do not have access to this source branch."
      );
    }

    return {
      grnId: Number(rows[0].grnId),
      grnNo: rows[0].grnNo,
      sourceBranchId,
      sourceBranchName: rows[0].sourceBranchName,
      sourceBranchCode: rows[0].sourceBranchCode,
      invoiceNumber: rows[0].invoiceNumber,
      items: rows.map(r => ({
        itemId: Number(r.itemId),
        itemName: r.itemName,
        availableQuantity: Number(r.availableQuantity || 0)
      }))
    };
  }

  async createGrnBranchTransferService() {
    const payload = await grnBranchTransferSchema.validateAsync(
      this._request.body
    );
    const transferByUserId = this._request?.userDetails?.id;
    const currentUserBranchIds = this._request.userDetails.branchDetails.map(
      branch => branch.id
    );

    return await this.stocksqlConnection.transaction(async t => {
      const sourceGrn = await GrnDetailsMasterModel.findOne({
        where: { id: payload.grnId },
        transaction: t
      });
      if (!sourceGrn) {
        throw new createError.NotFound("Source GRN not found.");
      }

      const sourceBranchId = Number(sourceGrn.branchId);
      if (!currentUserBranchIds.includes(sourceBranchId)) {
        throw new createError.Forbidden(
          "You do not have access to this source branch."
        );
      }

      if (sourceBranchId === Number(payload.destinationBranchId)) {
        throw new createError.BadRequest(
          "Source and destination branches cannot be the same."
        );
      }

      const destinationBranch = await BranchMasterModel.findOne({
        where: { id: payload.destinationBranchId, isActive: 1 }
      }).catch(err => {
        console.log("Error while fetching destination branch", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
      if (!destinationBranch) {
        throw new createError.BadRequest("Destination branch not found.");
      }

      const stockLines = await this.stocksqlConnection
        .query(getGrnItemStockLinesForTransferQuery, {
          type: Sequelize.QueryTypes.SELECT,
          replacements: {
            grnId: payload.grnId,
            itemId: payload.itemId
          },
          transaction: t
        })
        .catch(err => {
          console.log("Error while fetching source grn stock lines", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (lodash.isEmpty(stockLines)) {
        throw new createError.BadRequest(
          "Requested medicine is not available in this GRN."
        );
      }

      const availableQuantity = stockLines.reduce(
        (sum, row) => sum + Number(row.totalQuantity || 0),
        0
      );
      if (availableQuantity < payload.quantity) {
        throw new createError.BadRequest(
          `Insufficient stock. Available: ${availableQuantity}, requested: ${payload.quantity}`
        );
      }

      const destinationPrefix = (destinationBranch.branchCode || "BRN")
        .toString()
        .trim()
        .toUpperCase()
        .slice(0, 3);
      const transferInvoiceNumber = `${destinationPrefix}-${sourceGrn.invoiceNumber}`;

      const transferGrn = await GrnDetailsMasterModel.create(
        {
          branchId: payload.destinationBranchId,
          date: moment().format("YYYY-MM-DD"),
          supplierId: sourceGrn.supplierId,
          supplierEmail: sourceGrn.supplierEmail,
          supplierAddress: sourceGrn.supplierAddress,
          supplierGstNumber: sourceGrn.supplierGstNumber,
          invoiceNumber: transferInvoiceNumber
        },
        { transaction: t }
      ).catch(err => {
        console.log("Error while creating transfer grn master", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await GrnDetailsMasterModel.update(
        { grnNo: String(transferGrn.id) },
        { where: { id: transferGrn.id }, transaction: t }
      );

      let remaining = Number(payload.quantity);
      const destinationRows = [];

      for (const row of stockLines) {
        if (remaining <= 0) {
          break;
        }
        const lineAvailable = Number(row.totalQuantity || 0);
        if (lineAvailable <= 0) {
          continue;
        }
        const moved = Math.min(lineAvailable, remaining);
        remaining -= moved;

        await GrnItemsAssociationsModel.update(
          { totalQuantity: lineAvailable - moved },
          { where: { id: row.id }, transaction: t }
        );

        destinationRows.push({
          grnId: transferGrn.id,
          itemId: row.itemId,
          batchNo: row.batchNo,
          expiryDate: row.expiryDate,
          pack: row.pack,
          quantity: row.quantity,
          freeQuantity: row.freeQuantity,
          intialQuantity: moved,
          totalQuantity: moved,
          mrp: row.mrp,
          rate: row.rate,
          mrpPerTablet: row.mrpPerTablet,
          ratePerTablet: row.ratePerTablet,
          discountPercentage: row.discountPercentage,
          taxPercentage: row.taxPercentage,
          discountAmount: row.discountAmount,
          taxAmount: row.taxAmount,
          amount: row.amount,
          isReturned: 0
        });
      }

      if (remaining > 0) {
        throw new createError.BadRequest(
          "Unable to complete transfer due to stock mismatch."
        );
      }

      await GrnItemsAssociationsModel.bulkCreate(destinationRows, {
        transaction: t
      }).catch(err => {
        console.log("Error while creating destination grn item rows", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await GrnBranchTransferMasterModel.create(
        {
          sourceGrnId: payload.grnId,
          transferGrnId: transferGrn.id,
          sourceBranchId,
          destinationBranchId: payload.destinationBranchId,
          itemId: payload.itemId,
          transferredQuantity: payload.quantity,
          transferDate: moment().format("YYYY-MM-DD HH:mm:ss"),
          transferInvoiceNumber,
          transferredBy: transferByUserId
        },
        { transaction: t }
      ).catch(err => {
        console.log("Error while saving grn transfer log", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return {
        transferGrnId: transferGrn.id,
        transferInvoiceNumber
      };
    });
  }

  async getGrnBranchTransferHistoryService() {
    const currentUserBranchIds = this._request.userDetails.branchDetails.map(
      branch => String(branch.id)
    );
    const rows = await this.stocksqlConnection
      .query(getGrnBranchTransferHistoryQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: { branchId: currentUserBranchIds }
      })
      .catch(err => {
        console.log("Error while fetching grn transfer history", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return rows.map(r => ({
      ...r,
      transferredQuantity: Number(r.transferredQuantity || 0)
    }));
  }
}

module.exports = PharmacyService;
