const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const {
  createAppointmentReasonSchema,
  editAppointmentReasonSchema
} = require("../schemas/appointmentReasonSchema");
const AppointmentReasonMasterModel = require("../models/Master/appointmentReasonMaster");
const lodash = require("lodash");
const { Sequelize, Op } = require("sequelize");
const {
  getAllAppointmentReasonsQuery,
  getAllLabTestGroupQuery,
  getAllLabTestSampleTypesQuery,
  getAllLabTestsQuery,
  getAllPharmacyItemsQuery,
  getAllIncidentsQuery,
  getDepartmentsListQuery,
  getVendorsListQuery,
  getSuppliesListQuery,
  getVendorsByDepartmentQuery,
  getSuppliesByDepartmentQuery,
  getReferralListQuery,
  getCitiesListQuery,
  getAllScansQuery,
  getAllEmbryologyQuery,
  getOtDefaultPersonQuery
} = require("../queries/master_data_queries");
const {
  createLabTestGroupSchema,
  createLabTestSampleTypeSchema,
  editLabTestGroupSchema,
  editLabTestSampleTypeSchema,
  createLabTestSchema,
  editLabTestSchema,
  addNewPharmacyItemSchema,
  editPharmacyItemSchema,
  createIncidentSchema,
  editIncidentSchema,
  createDepartmentSchema,
  editDepartmentSchema,
  createVendorSchema,
  editVendorSchema,
  createSuppliesSchema,
  editSuppliesSchema,
  createReferralSchema,
  editReferralsSchema,
  createCitySchema,
  editCitySchema,
  createScanSchema,
  editScanSchema,
  createEmbryologySchema,
  editEmbryologySchema,
  saveOtDefaultPersonSchema,
  editOtDefaultPersonSchema
} = require("../schemas/masterDataSchema");
const LabTestGroupMasterModel = require("../models/Master/labTestGroupMaster");
const LabTestSampleTypeMasterModel = require("../models/Master/labTestSampleTypeMaster");
const LabTestMasterModel = require("../models/Master/labTestMaster");
const ItemsMasterModel = require("../models/Master/ItemMaster");
const IncidentMasterModel = require("../models/Master/incidentMaster");
const DepartmentMasterModel = require("../models/Master/departmentMaster");
const VendorMasterModel = require("../models/Master/vendorMaster");
const SuppliesMasterModel = require("../models/Master/suppliesMaster");
const ReferralsMasterModel = require("../models/Master/referralsMaster");
const CityMasterModel = require("../models/Master/citiesMaster");
const LabTestMasterBranchAssociation = require("../models/Master/LabTestMasterBranchAssociation");
const ScanMaster = require("../models/Master/ScanMaster");
const ScanMasterBranchAssociation = require("../models/Master/ScanMasterBranchAssociation");
const EmbryologyMaster = require("../models/Master/EmbryologyMaster");
const EmbryologyMasterBranchAssociation = require("../models/Master/EmbryologyMasterBranchAssociation");
const OtPersonDefaultMasterModel = require("../models/Master/personDefaultOtMasterModel");

class MasterDataService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
  }

  // Appointment Reasons
  async createAppointmentReasonService() {
    const validatedPaylaod = await createAppointmentReasonSchema.validateAsync(
      this._request.body
    );

    const validatedName = validatedPaylaod?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase

    const sameReasonExists = await AppointmentReasonMasterModel.findOne({
      where: Sequelize.where(
        Sequelize.fn(
          "REPLACE",
          Sequelize.fn("LOWER", Sequelize.col("name")),
          " ",
          ""
        ),
        validatedName
      )
    }).catch(err => {
      console.log("Error while getting appointment reason addition", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameReasonExists)) {
      throw new createError.BadRequest(Constants.APPOINTMENT_REASON_EXISTS);
    }

    // Add new Appointment Reason

    await AppointmentReasonMasterModel.create({
      name: validatedPaylaod?.name,
      appointmentCharges: validatedPaylaod?.appointmentCharges,
      isActive: validatedPaylaod?.isActive,
      visit_type: validatedPaylaod?.visit_type,
      isSpouse: validatedPaylaod?.isSpouse,
      createdBy: this._request?.userDetails?.id,
      isOther: validatedPaylaod?.isOther || 0
    }).catch(err => {
      console.log("Error while getting appointment reason addition", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.SUCCESS;
  }

  async editAppointmentReasonService() {
    const validatedPaylaod = await editAppointmentReasonSchema.validateAsync(
      this._request.body
    );
    const validatedName = validatedPaylaod?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase
    // Same name with diff id
    const sameReasonExists = await AppointmentReasonMasterModel.findOne({
      where: {
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn(
              "REPLACE",
              Sequelize.fn("LOWER", Sequelize.col("name")),
              " ",
              ""
            ),
            validatedName
          ),
          { id: { [Op.ne]: validatedPaylaod?.id } }
        ]
      }
    }).catch(err => {
      console.log("Error while update appointment reason", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameReasonExists)) {
      throw new createError.BadRequest(Constants.APPOINTMENT_REASON_EXISTS);
    }

    await AppointmentReasonMasterModel.update(
      {
        name: validatedPaylaod?.name,
        appointmentCharges: validatedPaylaod?.appointmentCharges,
        isActive: validatedPaylaod?.isActive,
        visit_type: validatedPaylaod?.visit_type,
        isSpouse: validatedPaylaod?.isSpouse,
        updatedBy: this._request?.userDetails?.id
      },
      {
        where: {
          id: validatedPaylaod?.id
        }
      }
    ).catch(err => {
      console.log("Error while updating appointment reasons", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getAllAppointmentReasonsService() {
    const data = await this.mysqlConnection
      .query(getAllAppointmentReasonsQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log(
          "Error while getting the appointment Reason Master data",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(data)) {
      return data;
    }
    return [];
  }

  async deleteAppointmentReasonService() {
    const { id } = this._request.params;
    if (!id) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", id)
      );
    }
    await AppointmentReasonMasterModel.update(
      {
        isActive: false
      },
      {
        where: {
          id: id
        }
      }
    ).catch(err => {
      console.log("Error while deleting appointment reason master", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DELETED_SUCCESSFULLY;
  }

  // Lab Test Group
  async createLabTestGroupService() {
    const validatedPaylaod = await createLabTestGroupSchema.validateAsync(
      this._request.body
    );

    const validatedName = validatedPaylaod?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase

    const sameGroupExists = await LabTestGroupMasterModel.findOne({
      where: Sequelize.where(
        Sequelize.fn(
          "REPLACE",
          Sequelize.fn("LOWER", Sequelize.col("name")),
          " ",
          ""
        ),
        validatedName
      )
    }).catch(err => {
      console.log("Error while getting lab test group addition", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameGroupExists)) {
      throw new createError.BadRequest(Constants.LAB_TEST_GROUP_EXISTS);
    }

    // Add new Lab Test Group

    await LabTestGroupMasterModel.create({
      name: validatedPaylaod?.name,
      isActive: validatedPaylaod?.isActive,
      createdBy: this._request?.userDetails?.id
    }).catch(err => {
      console.log("Error while addition of lab test group", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.SUCCESS;
  }

  async editLabTestGroupService() {
    const validatedPaylaod = await editLabTestGroupSchema.validateAsync(
      this._request.body
    );
    const validatedName = validatedPaylaod?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase
    // Same name with diff id
    const sameGroupExists = await LabTestGroupMasterModel.findOne({
      where: {
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn(
              "REPLACE",
              Sequelize.fn("LOWER", Sequelize.col("name")),
              " ",
              ""
            ),
            validatedName
          ),
          { id: { [Op.ne]: validatedPaylaod?.id } }
        ]
      }
    }).catch(err => {
      console.log("Error while update lab test groups", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameGroupExists)) {
      throw new createError.BadRequest(Constants.LAB_TEST_GROUP_EXISTS);
    }

    await LabTestGroupMasterModel.update(
      {
        name: validatedPaylaod?.name,
        isActive: validatedPaylaod?.isActive,
        updatedBy: this._request?.userDetails?.id
      },
      {
        where: {
          id: validatedPaylaod?.id
        }
      }
    ).catch(err => {
      console.log("Error while updating lab test group", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async deleteLabTestGroupService() {
    const { id } = this._request.params;
    if (!id) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", id)
      );
    }
    await LabTestGroupMasterModel.update(
      {
        isActive: false
      },
      {
        where: {
          id: id
        }
      }
    ).catch(err => {
      console.log("Error while deleting lab test group master", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async getLabTestGroupService() {
    const data = await this.mysqlConnection
      .query(getAllLabTestGroupQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting the lab test groups data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(data)) {
      return data;
    }
    return [];
  }

  // Lab Test Sample Type
  async createLabTestSampleTypeService() {
    const validatedPaylaod = await createLabTestSampleTypeSchema.validateAsync(
      this._request.body
    );

    const validatedName = validatedPaylaod?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase

    const sameSampleTypeExists = await LabTestSampleTypeMasterModel.findOne({
      where: Sequelize.where(
        Sequelize.fn(
          "REPLACE",
          Sequelize.fn("LOWER", Sequelize.col("name")),
          " ",
          ""
        ),
        validatedName
      )
    }).catch(err => {
      console.log("Error while getting lab test sampleType addition", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameSampleTypeExists)) {
      throw new createError.BadRequest(Constants.SAMPLE_TYPE_EXISTS);
    }

    // Add new SampleType

    await LabTestSampleTypeMasterModel.create({
      name: validatedPaylaod?.name,
      isActive: validatedPaylaod?.isActive,
      createdBy: this._request?.userDetails?.id
    }).catch(err => {
      console.log("Error while addition of lab test sample Type", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.SUCCESS;
  }

  async editLabTestSampleTypeService() {
    const validatedPaylaod = await editLabTestSampleTypeSchema.validateAsync(
      this._request.body
    );
    const validatedName = validatedPaylaod?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase
    // Same name with diff id
    const sameSampleTypeExists = await LabTestSampleTypeMasterModel.findOne({
      where: {
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn(
              "REPLACE",
              Sequelize.fn("LOWER", Sequelize.col("name")),
              " ",
              ""
            ),
            validatedName
          ),
          { id: { [Op.ne]: validatedPaylaod?.id } }
        ]
      }
    }).catch(err => {
      console.log("Error while update lab test sample", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameSampleTypeExists)) {
      throw new createError.BadRequest(Constants.SAMPLE_TYPE_EXISTS);
    }

    await LabTestSampleTypeMasterModel.update(
      {
        name: validatedPaylaod?.name,
        isActive: validatedPaylaod?.isActive,
        updatedBy: this._request?.userDetails?.id
      },
      {
        where: {
          id: validatedPaylaod?.id
        }
      }
    ).catch(err => {
      console.log("Error while updating lab test sampleType", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async deleteLabTestSampleTypeService() {
    const { id } = this._request.params;
    if (!id) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", id)
      );
    }
    await LabTestSampleTypeMasterModel.update(
      {
        isActive: false
      },
      {
        where: {
          id: id
        }
      }
    ).catch(err => {
      console.log("Error while deleting lab test sample type master", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async getLabTestSampleTypeService() {
    const data = await this.mysqlConnection
      .query(getAllLabTestSampleTypesQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting the lab test sample type data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(data)) {
      return data;
    }
    return [];
  }

  // Lab Test Master
  async createLabTestService() {
    const validatedPayload = await createLabTestSchema.validateAsync(
      this._request.body
    );

    const validatedName = validatedPayload?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase

    const sameNameExists = await LabTestMasterModel.findOne({
      where: Sequelize.where(
        Sequelize.fn(
          "REPLACE",
          Sequelize.fn("LOWER", Sequelize.col("name")),
          " ",
          ""
        ),
        validatedName
      )
    }).catch(err => {
      console.log("Error while getting lab test addition", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return await this.mysqlConnection.transaction(async t => {
      let labTestIdToUse = sameNameExists?.id;

      // If not exists, create new lab test master record
      if (!labTestIdToUse) {
        const createdLabTest = await LabTestMasterModel.create(
          {
            name: validatedPayload?.name,
            createdBy: this._request?.userDetails?.id
          },
          { transaction: t }
        ).catch(err => {
          console.log("Error while addition of lab test", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

        labTestIdToUse = createdLabTest?.id;
      }

      // Always create/update association in branch association table
      const association = await LabTestMasterBranchAssociation.create(
        {
          labTestId: labTestIdToUse,
          branchId: validatedPayload?.branchId,
          isActive: validatedPayload?.isActive,
          createdBy: this._request?.userDetails?.id,
          sampleTypeId: validatedPayload?.sampleTypeId,
          labTestGroupId: validatedPayload?.labTestGroupId,
          amount: validatedPayload?.amount,
          isOutSourced: validatedPayload?.isOutSourced || 0
        },
        { transaction: t }
      ).catch(err => {
        console.log(
          "Error while addition of lab test in lab test branch association",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return Constants.SUCCESS;
    });
  }

  async editLabTestService() {
    const validatedPayload = await editLabTestSchema.validateAsync(
      this._request.body
    );
    const validatedName = validatedPayload?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase
    // Same name with diff id
    const sameNameExists = await LabTestMasterModel.findOne({
      where: {
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn(
              "REPLACE",
              Sequelize.fn("LOWER", Sequelize.col("name")),
              " ",
              ""
            ),
            validatedName
          ),
          { id: { [Op.ne]: validatedPayload?.labTestId } }
        ]
      }
    }).catch(err => {
      console.log("Error while update lab test sample", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameNameExists)) {
      throw new createError.BadRequest(Constants.LAB_TEST_NAME_EXISTS);
    }

    return await this.mysqlConnection.transaction(async t => {
      await LabTestMasterModel.update(
        {
          name: validatedPayload?.name,
          updatedBy: this._request?.userDetails?.id
        },
        {
          where: { id: validatedPayload?.labTestId },
          transaction: t
        }
      ).catch(err => {
        console.log("Error while updating lab test master name", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      const [updatedRows] = await LabTestMasterBranchAssociation.update(
        {
          labTestId: validatedPayload?.labTestId,
          branchId: validatedPayload?.branchId,
          isActive: validatedPayload?.isActive,
          updatedBy: this._request?.userDetails?.id,
          labTestGroupId: validatedPayload?.labTestGroupId,
          sampleTypeId: validatedPayload?.sampleTypeId,
          amount: validatedPayload?.amount,
          isOutSourced: validatedPayload?.isOutSourced
        },
        {
          where: {
            id: validatedPayload?.id
          },
          transaction: t
        }
      ).catch(err => {
        console.log("Error while updating lab test branch association", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (updatedRows === 0) {
        throw new createError.BadRequest(
          "No record found for given labTestId and branchId."
        );
      }

      return Constants.DATA_UPDATED_SUCCESS;
    });
  }

  async getLabTestListService() {
    const data = await this.mysqlConnection
      .query(getAllLabTestsQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting the lab tests data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(data)) {
      return data;
    }
    return [];
  }

  async getAllScansService() {
    const data = await this.mysqlConnection
      .query(getAllScansQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting the scan list data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(data)) {
      return data;
    }
    return [];
  }

  async addNewScanService() {
    const validatedPayload = await createScanSchema.validateAsync(
      this._request.body
    );

    const validatedName = validatedPayload?.name
      .trim()
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase

    const sameNameExists = await ScanMaster.findOne({
      where: Sequelize.where(
        Sequelize.fn(
          "REPLACE",
          Sequelize.fn("LOWER", Sequelize.col("name")),
          " ",
          ""
        ),
        validatedName
      )
    }).catch(err => {
      console.log("Error while getting lab test addition", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return await this.mysqlConnection.transaction(async t => {
      let scanIdToUse;

      if (!lodash.isEmpty(sameNameExists)) {
        scanIdToUse = sameNameExists.id;
      } else {
        const createdScan = await ScanMaster.create(
          {
            name: validatedPayload?.name,
            createdBy: this._request?.userDetails?.id
          },
          { transaction: t }
        ).catch(err => {
          console.log("Error while addition of scan", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

        scanIdToUse = createdScan.id;
      }

      const association = await ScanMasterBranchAssociation.create(
        {
          scanId: scanIdToUse,
          branchId: validatedPayload?.branchId,
          isActive: validatedPayload?.isActive,
          createdBy: this._request?.userDetails?.id,
          isFormFRequired: validatedPayload?.isFormFRequired || 0,
          amount: validatedPayload?.amount
        },
        { transaction: t }
      ).catch(err => {
        console.log(
          "Error while addition of scan in scan master branch association",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return Constants.SUCCESS;
    });
  }

  async editScanService() {
    const validatedPayload = await editScanSchema.validateAsync(
      this._request.body
    );
    const validatedName = validatedPayload?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase
    // Same name with diff id
    const sameNameExists = await ScanMaster.findOne({
      where: {
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn(
              "REPLACE",
              Sequelize.fn("LOWER", Sequelize.col("name")),
              " ",
              ""
            ),
            validatedName
          ),
          { id: { [Op.ne]: validatedPayload?.labTestId } }
        ]
      }
    }).catch(err => {
      console.log("Error while update lab test sample", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameNameExists)) {
      throw new createError.BadRequest(Constants.SCAN_NAME_EXISTS);
    }

    return await this.mysqlConnection.transaction(async t => {
      await ScanMaster.update(
        {
          name: validatedPayload?.name,
          updatedBy: this._request?.userDetails?.id
        },
        {
          where: { id: validatedPayload?.scanId },
          transaction: t
        }
      ).catch(err => {
        console.log("Error while updating Scan master name", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      const [updatedRows] = await ScanMasterBranchAssociation.update(
        {
          scanId: validatedPayload?.scanId,
          branchId: validatedPayload?.branchId,
          isActive: validatedPayload?.isActive,
          updatedBy: this._request?.userDetails?.id,
          amount: validatedPayload?.amount,
          isFormFRequired: validatedPayload?.isFormFRequired
        },
        {
          where: {
            id: validatedPayload?.id
          },
          transaction: t
        }
      ).catch(err => {
        console.log("Error while updating scan master branch association", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (updatedRows === 0) {
        throw new createError.BadRequest(
          "No record found for given scan and branch."
        );
      }

      return Constants.DATA_UPDATED_SUCCESS;
    });
  }

  async getAllEmbryologyService() {
    const data = await this.mysqlConnection
      .query(getAllEmbryologyQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting the embryology data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(data)) {
      return data;
    }
    return [];
  }

  async addNewEmbryologyService() {
    const validatedPayload = await createEmbryologySchema.validateAsync(
      this._request.body
    );

    const validatedName = validatedPayload?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase

    const sameNameExists = await EmbryologyMaster.findOne({
      where: Sequelize.where(
        Sequelize.fn(
          "REPLACE",
          Sequelize.fn("LOWER", Sequelize.col("name")),
          " ",
          ""
        ),
        validatedName
      )
    }).catch(err => {
      console.log("Error while getting Embryology addition", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return await this.mysqlConnection.transaction(async t => {
      let embryologyIdToUse;

      if (!lodash.isEmpty(sameNameExists)) {
        embryologyIdToUse = sameNameExists.id;
      } else {
        const createdEmbryology = await EmbryologyMaster.create(
          {
            name: validatedPayload?.name,
            createdBy: this._request?.userDetails?.id
          },
          { transaction: t }
        ).catch(err => {
          console.log("Error while creating embryology master", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

        embryologyIdToUse = createdEmbryology.id;
      }

      await EmbryologyMasterBranchAssociation.create(
        {
          embryologyId: embryologyIdToUse,
          branchId: validatedPayload?.branchId,
          isActive: validatedPayload?.isActive,
          createdBy: this._request?.userDetails?.id,
          amount: validatedPayload?.amount
        },
        { transaction: t }
      ).catch(err => {
        console.log(
          "Error while addition of Embryology in Embryology master branch association",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return Constants.SUCCESS;
    });
  }

  async editEmbryologyService() {
    const validatedPayload = await editEmbryologySchema.validateAsync(
      this._request.body
    );
    const validatedName = validatedPayload?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase
    // Same name with diff id
    const sameNameExists = await EmbryologyMaster.findOne({
      where: {
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn(
              "REPLACE",
              Sequelize.fn("LOWER", Sequelize.col("name")),
              " ",
              ""
            ),
            validatedName
          ),
          { id: { [Op.ne]: validatedPayload?.labTestId } }
        ]
      }
    }).catch(err => {
      console.log("Error while update lab test sample", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameNameExists)) {
      throw new createError.BadRequest(Constants.EMBRYOLOGY_NAME_EXISTS);
    }

    return await this.mysqlConnection.transaction(async t => {
      await EmbryologyMaster.update(
        {
          name: validatedPayload?.name,
          updatedBy: this._request?.userDetails?.id
        },
        {
          where: { id: validatedPayload?.embryologyId },
          transaction: t
        }
      ).catch(err => {
        console.log("Error while updating Embryology master name", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      const [updatedRows] = await EmbryologyMasterBranchAssociation.update(
        {
          embryologyId: validatedPayload?.embryologyId,
          branchId: validatedPayload?.branchId,
          isActive: validatedPayload?.isActive,
          updatedBy: this._request?.userDetails?.id,
          amount: validatedPayload?.amount
        },
        {
          where: {
            id: validatedPayload?.id
          },
          transaction: t
        }
      ).catch(err => {
        console.log(
          "Error while updating Embryology master branch association",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (updatedRows === 0) {
        throw new createError.BadRequest(
          "No record found for given Embryology and branch."
        );
      }

      return Constants.DATA_UPDATED_SUCCESS;
    });
  }

  async getAllPharmacyItemsService() {
    const data = await this.mysqlConnection
      .query(getAllPharmacyItemsQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting the pharmacy items data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(data)) {
      return data;
    }
    return [];
  }

  async addNewPharmacyItemService() {
    const validatedPayload = await addNewPharmacyItemSchema.validateAsync(
      this._request.body
    );

    const validatedName = validatedPayload?.itemName
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase

    const sameItemNameExists = await ItemsMasterModel.findOne({
      where: Sequelize.where(
        Sequelize.fn(
          "REPLACE",
          Sequelize.fn("LOWER", Sequelize.col("itemName")),
          " ",
          ""
        ),
        validatedName
      )
    }).catch(err => {
      console.log("Error while getting Item details", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameItemNameExists)) {
      throw new createError.BadRequest(Constants.SAME_MEDICATION_NAME_EXISTS);
    }

    // Add new Item in to Item Master table

    await ItemsMasterModel.create({
      itemName: validatedPayload?.itemName,
      inventoryType: validatedPayload?.inventoryType,
      manufacturerName: validatedPayload?.manufacturer ?? null,
      hsnCode: validatedPayload.hsnCode ?? null,
      categoryName: validatedPayload.categoryName ?? null,
      taxCategory: validatedPayload?.taxCategory,
      isActive: validatedPayload?.isActive ?? 1,
      departmentId: validatedPayload?.departmentId,
      createdBy: this._request?.userDetails?.id
    }).catch(err => {
      console.log("Error while addition of new pharmacy item", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.SUCCESS;
  }

  async editPharmacyItemService() {
    const validatedPayload = await editPharmacyItemSchema.validateAsync(
      this._request.body
    );
    const validatedName = validatedPayload?.itemName
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase
    // Same name with diff id
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
          { id: { [Op.ne]: validatedPayload?.id } }
        ]
      }
    }).catch(err => {
      console.log("Error while update Item Master Table", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameItemNameExists)) {
      throw new createError.BadRequest(Constants.SAME_MEDICATION_NAME_EXISTS);
    }

    //update part
    const item = await ItemsMasterModel.findByPk(validatedPayload.id);
    if (!item) {
      throw new createError.NotFound(Constants.ITEM_NOT_FOUND);
    }
    await item.update({
      itemName: validatedPayload.itemName ?? item.itemName,
      inventoryType: validatedPayload.inventoryType ?? item.inventoryType,
      manufacturerName: validatedPayload.manufacturer ?? item.manufacturerName,
      hsnCode: validatedPayload.hsnCode ?? item.hsnCode,
      categoryName: validatedPayload.categoryName ?? item.categoryName,
      taxCategory: validatedPayload.taxCategory ?? item.taxCategory,
      isActive: validatedPayload.isActive ?? item.isActive,
      departmentId: validatedPayload?.departmentId,
      createdBy: validatedPayload.createdBy ?? item.createdBy
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  // Incident Master
  async getAllIncidentList() {
    const data = await this.mysqlConnection
      .query(getAllIncidentsQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting the incident list data", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(data)) {
      return data;
    }
    return [];
  }

  async addNewIncident() {
    const validatedPaylaod = await createIncidentSchema.validateAsync(
      this._request.body
    );

    await IncidentMasterModel.create({
      incidentDate: validatedPaylaod?.incidentDate,
      description: validatedPaylaod?.description,
      action: validatedPaylaod?.action,
      impact: validatedPaylaod?.impact,
      responsibleEmployees: validatedPaylaod?.responsibleEmployees,
      preventiveMeasures: validatedPaylaod?.preventiveMeasures,
      rootCauseAnalysis: validatedPaylaod?.rootCauseAnalysis,
      createdBy: this._request?.userDetails?.id,
      isActive: validatedPaylaod?.isActive ?? 1
    });

    return Constants.SUCCESS;
  }

  async editIncident() {
    const validatedPaylaod = await editIncidentSchema.validateAsync(
      this._request.body
    );

    const item = await IncidentMasterModel.findByPk(validatedPaylaod.id);
    if (!item) {
      throw new createError.NotFound(Constants.INCIDENT_DETAILS_NOT_FOUND);
    }

    await item.update({
      incidentDate: validatedPaylaod?.incidentDate,
      description: validatedPaylaod?.description,
      action: validatedPaylaod?.action,
      impact: validatedPaylaod?.impact,
      responsibleEmployees: validatedPaylaod?.responsibleEmployees,
      preventiveMeasures: validatedPaylaod?.preventiveMeasures,
      rootCauseAnalysis: validatedPaylaod?.rootCauseAnalysis,
      updatedBy: this._request?.userDetails?.id,
      isActive: validatedPaylaod?.isActive ?? 1
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  // Department Master
  async getAllDepartmentsService() {
    const { searchQuery } = this._request.query;
    const trimmedSearchQuery = searchQuery?.trim();
    let query = getDepartmentsListQuery;

    if (!lodash.isEmpty(trimmedSearchQuery)) {
      query += `
        WHERE dm.name LIKE :searchQuery
      `;
    }

    const departmentsData = await this.mysqlConnection
      .query(query, {
        replacements: { searchQuery: `%${trimmedSearchQuery}%` },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting departments", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return departmentsData;
  }

  async addDepartmentService() {
    const validatedPaylaod = await createDepartmentSchema.validateAsync(
      this._request.body
    );
    const validatedName = validatedPaylaod?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase

    const sameNameExists = await DepartmentMasterModel.findOne({
      where: Sequelize.where(
        Sequelize.fn(
          "REPLACE",
          Sequelize.fn("LOWER", Sequelize.col("name")),
          " ",
          ""
        ),
        validatedName
      )
    }).catch(err => {
      console.log("Error while  department addition", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameNameExists)) {
      throw new createError.BadRequest(Constants.DEPARTMENT_NAME_EXISTS);
    }

    await DepartmentMasterModel.create({
      name: validatedPaylaod?.name,
      isActive: validatedPaylaod?.isActive,
      createdBy: this._request?.userDetails?.id
    }).catch(err => {
      console.log("Error while addition of department", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.SUCCESS;
  }

  async editDepartmentService() {
    const validatedPaylaod = await editDepartmentSchema.validateAsync(
      this._request.body
    );
    const validatedName = validatedPaylaod?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase
    // Same name with diff id
    const sameNameExists = await DepartmentMasterModel.findOne({
      where: {
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn(
              "REPLACE",
              Sequelize.fn("LOWER", Sequelize.col("name")),
              " ",
              ""
            ),
            validatedName
          ),
          { id: { [Op.ne]: validatedPaylaod?.id } }
        ]
      }
    }).catch(err => {
      console.log("Error while update department", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameNameExists)) {
      throw new createError.BadRequest(Constants.DEPARTMENT_NAME_EXISTS);
    }

    await DepartmentMasterModel.update(
      {
        name: validatedPaylaod?.name,
        isActive: validatedPaylaod?.isActive,
        updatedBy: this._request?.userDetails?.id
      },
      {
        where: {
          id: validatedPaylaod?.id
        }
      }
    ).catch(err => {
      console.log("Error while updating department", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  // vendor master
  async getAllVendorsListService() {
    const { searchQuery } = this._request.query;
    const trimmedSearchQuery = searchQuery?.trim();
    let query = getVendorsListQuery;

    if (!lodash.isEmpty(trimmedSearchQuery)) {
      query += `
        WHERE vm.name LIKE :searchQuery
      `;
    }

    const vendorsData = await this.mysqlConnection
      .query(query, {
        replacements: { searchQuery: `%${trimmedSearchQuery}%` },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting vendors", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return vendorsData;
  }

  async getVendorsListByDepartmentIdService() {
    const departmentParamId = this._request.params.departmentId;
    const getVendorsByDepartment = await this.mysqlConnection
      .query(getVendorsByDepartmentQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          departmentId: departmentParamId
        }
      })
      .catch(err => {
        console.log("Error while getting vendors data", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return getVendorsByDepartment;
  }

  async addVendorService() {
    const validatedPaylaod = await createVendorSchema.validateAsync(
      this._request.body
    );
    const validatedName = validatedPaylaod?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase

    const sameNameExists = await VendorMasterModel.findOne({
      where: Sequelize.where(
        Sequelize.fn(
          "REPLACE",
          Sequelize.fn("LOWER", Sequelize.col("name")),
          " ",
          ""
        ),
        validatedName
      )
    }).catch(err => {
      console.log("Error while vendor addition", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameNameExists)) {
      throw new createError.BadRequest(Constants.VENDOR_NAME_EXISTS);
    }

    await VendorMasterModel.create({
      name: validatedPaylaod?.name,
      isActive: validatedPaylaod?.isActive,
      departmentId: validatedPaylaod?.departmentId,
      createdBy: this._request?.userDetails?.id
    }).catch(err => {
      console.log("Error while addition of vendor", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.SUCCESS;
  }

  async editVendorService() {
    const validatedPaylaod = await editVendorSchema.validateAsync(
      this._request.body
    );
    const validatedName = validatedPaylaod?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase
    // Same name with diff id
    const sameNameExists = await VendorMasterModel.findOne({
      where: {
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn(
              "REPLACE",
              Sequelize.fn("LOWER", Sequelize.col("name")),
              " ",
              ""
            ),
            validatedName
          ),
          { id: { [Op.ne]: validatedPaylaod?.id } }
        ]
      }
    }).catch(err => {
      console.log("Error while update vendor", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameNameExists)) {
      throw new createError.BadRequest(Constants.VENDOR_NAME_EXISTS);
    }

    await VendorMasterModel.update(
      {
        name: validatedPaylaod?.name,
        isActive: validatedPaylaod?.isActive,
        departmentId: validatedPaylaod?.departmentId,
        updatedBy: this._request?.userDetails?.id
      },
      {
        where: {
          id: validatedPaylaod?.id
        }
      }
    ).catch(err => {
      console.log("Error while updating vendor", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  // supplies master
  async getAllSuppliesListService() {
    const { searchQuery } = this._request.query;
    const trimmedSearchQuery = searchQuery?.trim();
    let query = getSuppliesListQuery;

    if (!lodash.isEmpty(trimmedSearchQuery)) {
      query += `
        WHERE sm.name LIKE :searchQuery
      `;
    }

    const suppliesData = await this.mysqlConnection
      .query(query, {
        replacements: { searchQuery: `%${trimmedSearchQuery}%` },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting supplies", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return suppliesData;
  }

  async getAllSuppliesListByDepartmentIdService() {
    const departmentParamId = this._request.params.departmentId;
    const getSuppliesByDepartment = await this.mysqlConnection
      .query(getSuppliesByDepartmentQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          departmentId: departmentParamId
        }
      })

      .catch(err => {
        console.log("Error while getting supplies data", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return getSuppliesByDepartment;
  }

  async addSuppliesService() {
    const validatedPaylaod = await createSuppliesSchema.validateAsync(
      this._request.body
    );
    const validatedName = validatedPaylaod?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase

    const sameNameExists = await SuppliesMasterModel.findOne({
      where: Sequelize.where(
        Sequelize.fn(
          "REPLACE",
          Sequelize.fn("LOWER", Sequelize.col("name")),
          " ",
          ""
        ),
        validatedName
      )
    }).catch(err => {
      console.log("Error while supplies addition", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameNameExists)) {
      throw new createError.BadRequest(Constants.SUPPLIES_NAME_EXISTS);
    }

    await SuppliesMasterModel.create({
      name: validatedPaylaod?.name,
      isActive: validatedPaylaod?.isActive,
      departmentId: validatedPaylaod?.departmentId,
      createdBy: this._request?.userDetails?.id
    }).catch(err => {
      console.log("Error while addition of supplies", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.SUCCESS;
  }

  async editSuppliesService() {
    const validatedPaylaod = await editSuppliesSchema.validateAsync(
      this._request.body
    );
    const validatedName = validatedPaylaod?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase
    // Same name with diff id
    const sameNameExists = await SuppliesMasterModel.findOne({
      where: {
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn(
              "REPLACE",
              Sequelize.fn("LOWER", Sequelize.col("name")),
              " ",
              ""
            ),
            validatedName
          ),
          { id: { [Op.ne]: validatedPaylaod?.id } }
        ]
      }
    }).catch(err => {
      console.log("Error while update supplies", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameNameExists)) {
      throw new createError.BadRequest(Constants.SUPPLIES_NAME_EXISTS);
    }

    await SuppliesMasterModel.update(
      {
        name: validatedPaylaod?.name,
        isActive: validatedPaylaod?.isActive,
        departmentId: validatedPaylaod?.departmentId,
        updatedBy: this._request?.userDetails?.id
      },
      {
        where: {
          id: validatedPaylaod?.id
        }
      }
    ).catch(err => {
      console.log("Error while updating supplies", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getAllReferralsService() {
    const { searchQuery } = this._request.query;
    const trimmedSearchQuery = searchQuery?.trim();
    let query = getReferralListQuery;

    if (!lodash.isEmpty(trimmedSearchQuery)) {
      query += `
        WHERE rtm.name LIKE :searchQuery
      `;
    }

    const referralsData = await this.mysqlConnection
      .query(query, {
        replacements: { searchQuery: `%${trimmedSearchQuery}%` },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting supplies", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return referralsData;
  }

  async addReferralService() {
    const validatedPayload = await createReferralSchema.validateAsync(
      this._request.body
    );
    const validatedName = validatedPayload?.name
      .replace(/\s+/g, "")
      .toLowerCase(); // remove space and make lowercase

    const sameNameExists = await ReferralsMasterModel.findOne({
      where: Sequelize.where(
        Sequelize.fn(
          "REPLACE",
          Sequelize.fn("LOWER", Sequelize.col("name")),
          " ",
          ""
        ),
        validatedName
      )
    }).catch(err => {
      console.log("Error while referrals addition", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameNameExists)) {
      throw new createError.BadRequest(Constants.REFERRAL_NAME_EXISTS);
    }

    await ReferralsMasterModel.create({
      name: validatedPayload?.name,
      isActive: validatedPayload?.isActive,
      createdBy: this._request?.userDetails?.id
    }).catch(err => {
      console.log("Error while addition of referrals", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.SUCCESS;
  }

  async editReferralService() {
    const validatedPayload = await editReferralsSchema.validateAsync(
      this._request.body
    );

    await ReferralsMasterModel.update(
      {
        name: validatedPayload?.name,
        isActive: validatedPayload?.isActive,
        updatedBy: this._request?.userDetails?.id
      },
      {
        where: {
          id: validatedPayload?.id
        }
      }
    ).catch(err => {
      console.log("Error while updating referrals", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  //cities
  async getAllCitiesService() {
    const { searchQuery } = this._request.query;
    const trimmedSearchQuery = searchQuery?.trim();
    let query = getCitiesListQuery;

    if (!lodash.isEmpty(trimmedSearchQuery)) {
      query += `
        WHERE cm.name LIKE :searchQuery
      `;
    }

    const citiesData = await this.mysqlConnection
      .query(query, {
        replacements: { searchQuery: `%${trimmedSearchQuery}%` },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting cities", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return citiesData;
  }

  async addCityService() {
    const validatedPayload = await createCitySchema.validateAsync(
      this._request.body
    );
    const validatedName = validatedPayload?.name
      .replace(/\s+/g, "")
      .toLowerCase();

    const sameNameExists = await CityMasterModel.findOne({
      where: Sequelize.where(
        Sequelize.fn(
          "REPLACE",
          Sequelize.fn("LOWER", Sequelize.col("name")),
          " ",
          ""
        ),
        validatedName
      )
    }).catch(err => {
      console.log("Error while cities addition", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(sameNameExists)) {
      throw new createError.BadRequest(Constants.CITY_NAME_EXISTS);
    }

    await CityMasterModel.create({
      name: validatedPayload?.name,
      isActive: validatedPayload?.isActive,
      stateId: validatedPayload?.stateId,
      createdBy: this._request?.userDetails?.id
    }).catch(err => {
      console.log("Error while addition of City", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.SUCCESS;
  }

  async editCityService() {
    const validatedPaylaod = await editCitySchema.validateAsync(
      this._request.body
    );

    await CityMasterModel.update(
      {
        name: validatedPaylaod?.name,
        isActive: validatedPaylaod?.isActive,
        stateId: validatedPaylaod?.stateId,
        updatedBy: this._request?.userDetails?.id
      },
      {
        where: {
          id: validatedPaylaod?.id
        }
      }
    ).catch(err => {
      console.log("Error while updating City", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }

  async getOtDefaultPersonsListService() {
    const otDefaultPersonList = await this.mysqlConnection
      .query(getOtDefaultPersonQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log(
          "Error while getting city person default data",
          err.message
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return lodash.isEmpty(otDefaultPersonList) ? [] : otDefaultPersonList;
  }

  async saveOtDefaultpersonService() {
    const validatedPayload = await saveOtDefaultPersonSchema.validateAsync(
      this._request.body
    );

    // Check if Already added for Role and Branch
    const roleAndBranchExists = await OtPersonDefaultMasterModel.findOne({
      where: {
        designationId: validatedPayload?.designationId,
        branchId: validatedPayload?.branchId
      }
    }).catch(err => {
      console.log("Error while finding the ot person default data", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (!lodash.isEmpty(roleAndBranchExists)) {
      throw new createError.BadRequest(Constants.OT_PERSON_DEFAULT_EXIST);
    }

    await OtPersonDefaultMasterModel.create({
      branchId: validatedPayload?.branchId,
      personId: validatedPayload?.personId,
      designationId: validatedPayload?.designationId,
      createdBy: this._request?.userDetails?.id
    }).catch(err => {
      console.log("Error while addition of default person ot list", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.SUCCESS;
  }

  async editOtDefaultPersonController() {
    const validatedPayload = await editOtDefaultPersonSchema.validateAsync(
      this._request.body
    );

    await OtPersonDefaultMasterModel.update(
      {
        personId: validatedPayload?.personId,
        updatedBy: this._request?.userDetails?.id
      },
      {
        where: {
          id: validatedPayload?.id
        }
      }
    ).catch(err => {
      console.log("Error while updating default person list", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    return Constants.DATA_UPDATED_SUCCESS;
  }
}

module.exports = MasterDataService;
