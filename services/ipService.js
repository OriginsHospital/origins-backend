const { QueryTypes, Op, Sequelize } = require("sequelize");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const AWSConnection = require("../connections/aws_connection");
const {
  addNewIndentSchema,
  createIPRegistrationSchema,
  createIPNotesSchema,
  closeIpRegistrationSchema,
  ipRoomChangeSchema
} = require("../schemas/ipSchema");
const ProcedureIndentAssociationModel = require("../models/Associations/procedureIndentAssociation");
const IndentPharmacyAssociationModel = require("../models/Associations/indentPharmacyAssociation");
const { getIndentDetailsQuery } = require("../queries/ip_queries");
const BranchBuildingAssociationModel = require("../models/Associations/branchBuildingAssociation");
const BuildingFloorAssociationModel = require("../models/Associations/buildingFloorAssociationModel");
const FloorRoomAssociationModel = require("../models/Associations/floorRoomAssociationModel");
const RoomBedAssociationModel = require("../models/Associations/roomBedAssociationModel");
const IpMasterModel = require("../models/Master/ipMasterModel");
const PatientMasterModel = require("../models/Master/patientMaster");
const patientVisitsAssociation = require("../models/Associations/patientVisitsAssociation");
const IpNotesAssociationsModel = require("../models/Associations/ipNotesAssociationsModel");
const StateMasterModel = require("../models/Master/stateMaster");
const CityMasterModel = require("../models/Master/citiesMaster");
const BranchMasterModel = require("../models/Master/branchMaster");
const { date } = require("@hapi/joi");

class IpService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
    this.s3 = AWSConnection.getS3();
    this.bucketName = AWSConnection.getS3BucketName();
  }

  async getIndentDetailsService() {
    const indentDetails = await this.mysqlConnection
      .query(getIndentDetailsQuery, {
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while getting Indent details", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    return indentDetails;
  }

  async addNewIndentService() {
    const createdByUserId = this._request?.userDetails?.id;
    console.log(this._request.body);
    const indentData = await addNewIndentSchema.validateAsync(
      this._request.body
    );

    const { patientId, items } = indentData;
    indentData.createdBy = createdByUserId;

    return await this.mysqlConnection.transaction(async t => {
      const patientExists = await this.mysqlConnection
        .query("SELECT id FROM patient_master WHERE id = :patientId", {
          replacements: { patientId },
          type: QueryTypes.SELECT,
          transaction: t
        })
        .catch(err => {
          console.log("Error while uploading Iui Consent", err.message);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!patientExists || patientExists.length === 0) {
        throw new createError.NotFound("Patient not found");
      }

      const activeVisit = await this.mysqlConnection
        .query(
          "select pva.id from patient_visits_association pva where pva.patientId = :patientId and pva.isActive = 1",
          {
            replacements: { patientId },
            type: QueryTypes.SELECT,
            transaction: t
          }
        )
        .catch(err => {
          console.log("Error while uploading Iui Consent", err.message);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!activeVisitId) {
        throw new createError.NotFound("Active visit not found for patient");
      }

      const indentDataToInsert = {
        patientId,
        visitId: activeVisitId,
        createdBy: createdByUserId,
        procedureId: 6
      };

      const indent = await ProcedureIndentAssociationModel.create(
        indentDataToInsert,
        { transaction: t }
      ).catch(err => {
        console.log("Error while uploading Iui Consent", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      const indentItems = items.map(item => ({
        indentId: indent.id,
        itemId: item.itemId,
        prescribedQuantity: item.prescribedQuantity,
        prescribedOn: new Date(),
        createdBy: createdByUserId
      }));

      await IndentPharmacyAssociationModel.bulkCreate(indentItems, {
        transaction: t
      }).catch(err => {
        console.log("Error while uploading Iui Consent", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return "Indent added successfully";
    });
  }

  async getBuildingsService() {
    const { branchId } = this._request.params;
    return await BranchBuildingAssociationModel.findAll({
      where: {
        branchId,
        isActive: true
      },
      order: [["name", "ASC"]]
    }).catch(err => {
      console.log("Error while getting buildings", err.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async getFloorsService() {
    const { buildingId } = this._request.params;
    return await BuildingFloorAssociationModel.findAll({
      where: {
        buildingId,
        isActive: true
      },
      order: [["floorNumber", "ASC"], ["name", "ASC"]]
    }).catch(err => {
      console.log("Error while getting floors", err.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async getRoomService() {
    const { floorId } = this._request.params;
    return await FloorRoomAssociationModel.findAll({
      where: {
        floorId,
        isActive: true
      },
      order: [["roomNumber", "ASC"], ["name", "ASC"]]
    }).catch(err => {
      console.log("Error while getting rooms", err.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async getBedsService() {
    const { roomId } = this._request.params;
    return await RoomBedAssociationModel.findAll({
      where: {
        roomId,
        status: "Available" // Only return available beds for IP creation
      },
      order: [["bedNumber", "ASC"]]
    }).catch(err => {
      console.log("Error while getting beds", err.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async createIPRegistrationService() {
    const createdByUserId = this._request?.userDetails?.id;
    const validatedData = await createIPRegistrationSchema.validateAsync(
      this._request.body
    );
    const {
      branchId,
      patientId,
      procedureId,
      dateOfAdmission,
      timeOfAdmission,
      buildingId,
      floorId,
      roomId,
      bedId,
      packageAmount,
      dateOfDischarge
    } = validatedData;
    return await this.mysqlConnection.transaction(async t => {
      const patient = await PatientMasterModel.findOne({
        where: { id: patientId },
        transaction: t
      }).catch(err => {
        console.log("Error while getting patient", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (!patient) {
        throw new createError.NotFound("Patient not found");
      }

      const activeVisit = await patientVisitsAssociation
        .findOne({
          where: { patientId: patient.id, isActive: true },
          transaction: t
        })
        .catch(err => {
          console.log("Error while getting active visit", err.message);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

      if (!activeVisit) {
        throw new createError.NotFound("Active visit not found");
      }

      const building = await BranchBuildingAssociationModel.findOne({
        where: { id: buildingId },
        transaction: t
      }).catch(err => {
        console.log("Error while getting building", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (!building) {
        throw new createError.NotFound("Building not found");
      }

      const floor = await BuildingFloorAssociationModel.findOne({
        where: { id: floorId },
        transaction: t
      }).catch(err => {
        console.log("Error while getting floor", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (!floor) {
        throw new createError.NotFound("Floor not found");
      }

      const room = await FloorRoomAssociationModel.findOne({
        where: { id: roomId },
        transaction: t
      }).catch(err => {
        console.log("Error while getting room", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (!room) {
        throw new createError.NotFound("Room not found");
      }

      const bed = await RoomBedAssociationModel.findOne({
        where: { id: bedId },
        transaction: t
      }).catch(err => {
        console.log("Error while getting bed", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      if (!bed) {
        throw new createError.NotFound("Bed not found");
      }

      if (bed.isBooked) {
        throw new createError.Conflict("Bed is already booked");
      }

      //mark the bed as booked
      bed.isBooked = true;
      await bed.save({ transaction: t }).catch(err => {
        console.log("Error while saving bed", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      const buildingName = building.name;
      const floorName = floor.name;
      const roomName = room.name;
      const bedName = bed.name;

      const roomCode = buildingName + floorName + roomName + bedName;

      const payload = {
        branchId,
        patientId,
        visitId: activeVisit.id,
        procedureId,
        dateOfAdmission,
        timeOfAdmission,
        packageAmount,
        dateOfDischarge,
        bedId,
        roomCode,
        createdBy: createdByUserId,
        isActive: true
      };

      const createdIpRegistration = await IpMasterModel.create(payload, {
        transaction: t
      }).catch(err => {
        console.log("Error while creating IP registration", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return createdIpRegistration;
    });
  }

  async getActiveIPService() {
    const { branchId } = this._request.query;
    if (!branchId) {
      throw new createError.BadRequest("Branch ID is required");
    }
    return await IpMasterModel.findAll({
      where: { isActive: true, branchId: branchId },
      order: [["updatedAt", "DESC"]]
    }).catch(err => {
      console.log("Error while getting active IPs", err.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async getClosedIPService() {
    const { branchId } = this._request.query;
    if (!branchId) {
      throw new createError.BadRequest("Branch ID is required");
    }
    return await IpMasterModel.findAll({
      where: { isActive: false, branchId: branchId },
      order: [["updatedAt", "DESC"]]
    }).catch(err => {
      console.log("Error while getting closed IPs", err.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async getIPDataByIdService() {
    const { id } = this._request.query;
    if (!id) {
      throw new createError.BadRequest("IP ID is required");
    }
    return await IpMasterModel.findOne({
      where: { id: id }
    }).catch(err => {
      console.log("Error while getting IP data by ID", err.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async createIPNotesService() {
    const createdBy = this._request?.userDetails?.id;
    const { ipId, notes } = await createIPNotesSchema.validateAsync(
      this._request.body
    );

    return await IpNotesAssociationsModel.create({
      ipId,
      notes,
      createdBy
    }).catch(err => {
      console.log("Error while creating IP notes", err.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async getIPNotesHistoryByIdService() {
    const { id } = this._request.query;
    if (!id) {
      throw new createError.BadRequest("IP ID is required");
    }
    return await IpNotesAssociationsModel.findAll({
      where: { ipId: id },
      order: [["updatedAt", "DESC"]]
    }).catch(err => {
      console.log("Error while getting IP notes history by ID", err.message);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async closeIpRegistrationService() {
    const validatedData = await closeIpRegistrationSchema.validateAsync(
      this._request.body
    );

    return await this.mysqlConnection.transaction(async t => {
      const checkExistingIP = await IpMasterModel.findOne({
        where: { id: validatedData.id, isActive: true },
        transaction: t
      });
      if (!checkExistingIP) {
        throw new createError.NotFound(
          "Active IP registration not found or may be closed already!"
        );
      }

      const bedId = checkExistingIP.bedId;
      //mark bed isBooked as false
      await RoomBedAssociationModel.update(
        { isBooked: false },
        { where: { id: bedId }, transaction: t }
      );

      await IpMasterModel.update(
        { isActive: false, dateOfDischarge: validatedData.dateOfDischarge },
        { where: { id: validatedData.id }, transaction: t }
      );
      return "SUCCESSFULLY CLOSED";
    });
  }

  async ipRoomChangeService() {
    const validatedData = await ipRoomChangeSchema.validateAsync(
      this._request.body
    );

    return await this.mysqlConnection.transaction(async t => {
      const checkExistingIP = await IpMasterModel.findOne({
        where: { id: validatedData.ipId, isActive: true },
        transaction: t
      });
      if (!checkExistingIP) {
        throw new createError.NotFound(
          "Active IP registration not found or may be closed already!"
        );
      }

      //check new Bed is not booked
      const isNewBedBooked = await RoomBedAssociationModel.findOne({
        where: { id: validatedData.bedId, isBooked: true },
        transaction: t
      });

      if (isNewBedBooked) {
        throw new createError.Conflict("New bed is already booked");
      }

      //check roomId exists
      const isRoomExists = await FloorRoomAssociationModel.findOne({
        where: { id: validatedData.roomId },
        transaction: t
      });
      if (!isRoomExists) {
        throw new createError.NotFound("Room not found");
      }

      //check floorId exists
      const isFloorExists = await BuildingFloorAssociationModel.findOne({
        where: { id: validatedData.floorId },
        transaction: t
      });
      if (!isFloorExists) {
        throw new createError.NotFound("Floor not found");
      }

      //check Building Exists
      const isBuildingExists = await BranchBuildingAssociationModel.findOne({
        where: { id: validatedData.buildingId },
        transaction: t
      });
      if (!isBuildingExists) {
        throw new createError.NotFound("Building not found");
      }

      // Free the previous bed for checkExistingIP
      await RoomBedAssociationModel.update(
        { isBooked: false },
        { where: { id: checkExistingIP.bedId }, transaction: t }
      );

      // Book the new bed
      await RoomBedAssociationModel.update(
        { isBooked: true },
        { where: { id: validatedData.bedId }, transaction: t }
      );

      // Always fetch bed record for name
      const bedRecord = await RoomBedAssociationModel.findOne({
        where: { id: validatedData.bedId },
        transaction: t
      });
      if (!bedRecord) {
        throw new createError.NotFound("Bed not found");
      }
      const buildingName = isBuildingExists.name;
      const floorName = isFloorExists.name;
      const roomName = isRoomExists.name;
      const bedName = bedRecord.name;

      const roomCodeChanged = buildingName + floorName + roomName + bedName;
      if (!roomCodeChanged) {
        throw new createError.BadRequest("Room code is invalid");
      }

      //form roomCode and update IpMasterModel
      await IpMasterModel.update(
        { roomCode: roomCodeChanged, bedId: validatedData.bedId },
        { where: { id: validatedData.ipId }, transaction: t }
      );

      return "ROOM SUCCESSFULLY UPDATED";
    });
  }

  // ========== LAYOUT MANAGEMENT CRUD OPERATIONS ==========

  // State CRUD
  async createStateService() {
    const createdByUserId = this._request?.userDetails?.id;
    const { name, isActive = true } = this._request.body;

    if (!name || !name.trim()) {
      throw new createError.BadRequest("State name is required");
    }

    // Check for duplicate state name
    const existingState = await StateMasterModel.findOne({
      where: { name: name.trim() }
    });

    if (existingState) {
      throw new createError.Conflict("State with this name already exists");
    }

    // Convert boolean isActive to status string
    const status = isActive ? "Active" : "Inactive";

    return await StateMasterModel.create({
      name: name.trim(),
      status,
      createdBy: createdByUserId
    });
  }

  async getStatesService() {
    return await StateMasterModel.findAll({
      where: { status: "Active" },
      order: [["name", "ASC"]]
    });
  }

  async updateStateService() {
    const updatedByUserId = this._request?.userDetails?.id;
    const { id } = this._request.params;
    const { name, isActive } = this._request.body;

    const state = await StateMasterModel.findOne({ where: { id } });
    if (!state) {
      throw new createError.NotFound("State not found");
    }

    if (name && name.trim()) {
      // Check for duplicate if name is being changed
      const existingState = await StateMasterModel.findOne({
        where: { name: name.trim(), id: { [Op.ne]: id } }
      });
      if (existingState) {
        throw new createError.Conflict("State with this name already exists");
      }
      state.name = name.trim();
    }

    if (isActive !== undefined) {
      // Convert boolean isActive to status string
      state.status = isActive ? "Active" : "Inactive";
    }

    state.updatedBy = updatedByUserId;
    await state.save();

    return state;
  }

  // City CRUD
  async createCityService() {
    const createdByUserId = this._request?.userDetails?.id;
    const { stateId, name, isActive = true } = this._request.body;

    if (!stateId) {
      throw new createError.BadRequest("State ID is required");
    }
    if (!name || !name.trim()) {
      throw new createError.BadRequest("City name is required");
    }

    // Verify state exists
    const state = await StateMasterModel.findOne({ where: { id: stateId } });
    if (!state) {
      throw new createError.NotFound("State not found");
    }

    // Check for duplicate city name in same state
    const existingCity = await CityMasterModel.findOne({
      where: { name: name.trim(), stateId }
    });

    if (existingCity) {
      throw new createError.Conflict(
        "City with this name already exists in this state"
      );
    }

    return await CityMasterModel.create({
      name: name.trim(),
      stateId,
      isActive,
      createdBy: createdByUserId
    });
  }

  async getCitiesService() {
    const { stateId } = this._request.query;
    const where = { isActive: true };
    if (stateId) {
      where.stateId = stateId;
    }
    return await CityMasterModel.findAll({
      where,
      order: [["name", "ASC"]]
    });
  }

  async updateCityService() {
    const updatedByUserId = this._request?.userDetails?.id;
    const { id } = this._request.params;
    const { name, stateId, isActive } = this._request.body;

    const city = await CityMasterModel.findOne({ where: { id } });
    if (!city) {
      throw new createError.NotFound("City not found");
    }

    if (stateId) {
      const state = await StateMasterModel.findOne({ where: { id: stateId } });
      if (!state) {
        throw new createError.NotFound("State not found");
      }
      city.stateId = stateId;
    }

    if (name && name.trim()) {
      const existingCity = await CityMasterModel.findOne({
        where: { name: name.trim(), stateId: city.stateId, id: { [Op.ne]: id } }
      });
      if (existingCity) {
        throw new createError.Conflict(
          "City with this name already exists in this state"
        );
      }
      city.name = name.trim();
    }

    if (isActive !== undefined) {
      city.isActive = isActive;
    }

    city.updatedBy = updatedByUserId;
    await city.save();

    return city;
  }

  // Branch CRUD
  async createBranchService() {
    const createdByUserId = this._request?.userDetails?.id;
    const {
      cityId,
      name,
      branchCode,
      address,
      isActive = true
    } = this._request.body;

    if (!cityId) {
      throw new createError.BadRequest("City ID is required");
    }
    if (!name || !name.trim()) {
      throw new createError.BadRequest("Branch name is required");
    }

    // Verify city exists
    const city = await CityMasterModel.findOne({ where: { id: cityId } });
    if (!city) {
      throw new createError.NotFound("City not found");
    }

    // Check for duplicate branch name in same city
    const existingBranch = await BranchMasterModel.findOne({
      where: { name: name.trim(), cityId }
    });

    if (existingBranch) {
      throw new createError.Conflict(
        "Branch with this name already exists in this city"
      );
    }

    // Check for duplicate branch code if provided
    if (branchCode) {
      const existingCode = await BranchMasterModel.findOne({
        where: { branchCode: branchCode.trim() }
      });
      if (existingCode) {
        throw new createError.Conflict("Branch code already exists");
      }
    }

    return await BranchMasterModel.create({
      name: name.trim(),
      cityId,
      branchCode: branchCode?.trim() || null,
      address: address?.trim() || null,
      isActive,
      createdBy: createdByUserId
    });
  }

  async getBranchesService() {
    const { cityId } = this._request.query;
    const where = { isActive: true };
    if (cityId) {
      where.cityId = cityId;
    }
    return await BranchMasterModel.findAll({
      where,
      order: [["name", "ASC"]]
    });
  }

  async updateBranchService() {
    const updatedByUserId = this._request?.userDetails?.id;
    const { id } = this._request.params;
    const { name, cityId, branchCode, address, isActive } = this._request.body;

    const branch = await BranchMasterModel.findOne({ where: { id } });
    if (!branch) {
      throw new createError.NotFound("Branch not found");
    }

    if (cityId) {
      const city = await CityMasterModel.findOne({ where: { id: cityId } });
      if (!city) {
        throw new createError.NotFound("City not found");
      }
      branch.cityId = cityId;
    }

    if (name && name.trim()) {
      const existingBranch = await BranchMasterModel.findOne({
        where: { name: name.trim(), cityId: branch.cityId, id: { [Op.ne]: id } }
      });
      if (existingBranch) {
        throw new createError.Conflict(
          "Branch with this name already exists in this city"
        );
      }
      branch.name = name.trim();
    }

    if (branchCode !== undefined) {
      if (branchCode) {
        const existingCode = await BranchMasterModel.findOne({
          where: { branchCode: branchCode.trim(), id: { [Op.ne]: id } }
        });
        if (existingCode) {
          throw new createError.Conflict("Branch code already exists");
        }
        branch.branchCode = branchCode.trim();
      } else {
        branch.branchCode = null;
      }
    }

    if (address !== undefined) {
      branch.address = address?.trim() || null;
    }

    if (isActive !== undefined) {
      branch.isActive = isActive;
    }

    branch.updatedBy = updatedByUserId;
    await branch.save();

    return branch;
  }

  // Building CRUD
  async createBuildingService() {
    const createdByUserId = this._request?.userDetails?.id;
    const {
      branchId,
      name,
      buildingCode,
      totalFloors,
      isActive = true
    } = this._request.body;

    if (!branchId) {
      throw new createError.BadRequest("Branch ID is required");
    }
    if (!name || !name.trim()) {
      throw new createError.BadRequest("Building name is required");
    }

    // Verify branch exists
    const branch = await BranchMasterModel.findOne({ where: { id: branchId } });
    if (!branch) {
      throw new createError.NotFound("Branch not found");
    }

    // Check for duplicate building name in same branch
    const existingBuilding = await BranchBuildingAssociationModel.findOne({
      where: { name: name.trim(), branchId }
    });

    if (existingBuilding) {
      throw new createError.Conflict(
        "Building with this name already exists in this branch"
      );
    }

    return await BranchBuildingAssociationModel.create({
      name: name.trim(),
      branchId,
      buildingCode: buildingCode?.trim() || null,
      totalFloors: totalFloors || null,
      isActive,
      createdBy: createdByUserId
    });
  }

  async updateBuildingService() {
    const updatedByUserId = this._request?.userDetails?.id;
    const { id } = this._request.params;
    const { name, buildingCode, totalFloors, isActive } = this._request.body;

    const building = await BranchBuildingAssociationModel.findOne({
      where: { id }
    });
    if (!building) {
      throw new createError.NotFound("Building not found");
    }

    if (name && name.trim()) {
      const existingBuilding = await BranchBuildingAssociationModel.findOne({
        where: {
          name: name.trim(),
          branchId: building.branchId,
          id: { [Op.ne]: id }
        }
      });
      if (existingBuilding) {
        throw new createError.Conflict(
          "Building with this name already exists in this branch"
        );
      }
      building.name = name.trim();
    }

    if (buildingCode !== undefined) {
      building.buildingCode = buildingCode?.trim() || null;
    }

    if (totalFloors !== undefined) {
      building.totalFloors = totalFloors;
    }

    if (isActive !== undefined) {
      building.isActive = isActive;
    }

    building.createdBy = updatedByUserId; // Note: using createdBy field for update tracking
    await building.save();

    return building;
  }

  // Floor CRUD
  async createFloorService() {
    const createdByUserId = this._request?.userDetails?.id;
    const {
      buildingId,
      name,
      floorNumber,
      floorType = "IP",
      isActive = true
    } = this._request.body;

    if (!buildingId) {
      throw new createError.BadRequest("Building ID is required");
    }
    if (!name || !name.trim()) {
      throw new createError.BadRequest("Floor name is required");
    }

    // Verify building exists
    const building = await BranchBuildingAssociationModel.findOne({
      where: { id: buildingId }
    });
    if (!building) {
      throw new createError.NotFound("Building not found");
    }

    // Check for duplicate floor name in same building
    const existingFloor = await BuildingFloorAssociationModel.findOne({
      where: { name: name.trim(), buildingId }
    });

    if (existingFloor) {
      throw new createError.Conflict(
        "Floor with this name already exists in this building"
      );
    }

    // Check for duplicate floor number if provided
    if (floorNumber) {
      const existingFloorNumber = await BuildingFloorAssociationModel.findOne({
        where: { floorNumber, buildingId }
      });
      if (existingFloorNumber) {
        throw new createError.Conflict(
          "Floor with this number already exists in this building"
        );
      }
    }

    return await BuildingFloorAssociationModel.create({
      name: name.trim(),
      buildingId,
      floorNumber: floorNumber || null,
      floorType,
      isActive,
      createdBy: createdByUserId
    });
  }

  async updateFloorService() {
    const updatedByUserId = this._request?.userDetails?.id;
    const { id } = this._request.params;
    const { name, floorNumber, floorType, isActive } = this._request.body;

    const floor = await BuildingFloorAssociationModel.findOne({
      where: { id }
    });
    if (!floor) {
      throw new createError.NotFound("Floor not found");
    }

    if (name && name.trim()) {
      const existingFloor = await BuildingFloorAssociationModel.findOne({
        where: {
          name: name.trim(),
          buildingId: floor.buildingId,
          id: { [Op.ne]: id }
        }
      });
      if (existingFloor) {
        throw new createError.Conflict(
          "Floor with this name already exists in this building"
        );
      }
      floor.name = name.trim();
    }

    if (floorNumber !== undefined) {
      if (floorNumber) {
        const existingFloorNumber = await BuildingFloorAssociationModel.findOne(
          {
            where: {
              floorNumber,
              buildingId: floor.buildingId,
              id: { [Op.ne]: id }
            }
          }
        );
        if (existingFloorNumber) {
          throw new createError.Conflict(
            "Floor with this number already exists in this building"
          );
        }
        floor.floorNumber = floorNumber;
      } else {
        floor.floorNumber = null;
      }
    }

    if (floorType) {
      floor.floorType = floorType;
    }

    if (isActive !== undefined) {
      floor.isActive = isActive;
    }

    floor.createdBy = updatedByUserId;
    await floor.save();

    return floor;
  }

  // Room CRUD
  async createRoomService() {
    const createdByUserId = this._request?.userDetails?.id;
    const {
      floorId,
      name,
      roomNumber,
      type,
      roomCategory = "General",
      genderRestriction = "Any",
      totalBeds = 0,
      charges = 0,
      isActive = true
    } = this._request.body;

    if (!floorId) {
      throw new createError.BadRequest("Floor ID is required");
    }
    if (!name || !name.trim()) {
      throw new createError.BadRequest("Room name is required");
    }
    if (!type) {
      throw new createError.BadRequest("Room type (AC/Non-AC) is required");
    }

    // Verify floor exists
    const floor = await BuildingFloorAssociationModel.findOne({
      where: { id: floorId }
    });
    if (!floor) {
      throw new createError.NotFound("Floor not found");
    }

    // Check for duplicate room number in same floor
    if (roomNumber) {
      const existingRoom = await FloorRoomAssociationModel.findOne({
        where: { roomNumber: roomNumber.trim(), floorId }
      });
      if (existingRoom) {
        throw new createError.Conflict(
          "Room with this number already exists on this floor"
        );
      }
    }

    return await FloorRoomAssociationModel.create({
      name: name.trim(),
      floorId,
      roomNumber: roomNumber?.trim() || null,
      type,
      roomCategory,
      genderRestriction,
      totalBeds,
      charges,
      isActive,
      createdBy: createdByUserId
    });
  }

  async updateRoomService() {
    const updatedByUserId = this._request?.userDetails?.id;
    const { id } = this._request.params;
    const {
      name,
      roomNumber,
      type,
      roomCategory,
      genderRestriction,
      totalBeds,
      charges,
      isActive
    } = this._request.body;

    const room = await FloorRoomAssociationModel.findOne({ where: { id } });
    if (!room) {
      throw new createError.NotFound("Room not found");
    }

    if (name && name.trim()) {
      room.name = name.trim();
    }

    if (roomNumber !== undefined) {
      if (roomNumber) {
        const existingRoom = await FloorRoomAssociationModel.findOne({
          where: {
            roomNumber: roomNumber.trim(),
            floorId: room.floorId,
            id: { [Op.ne]: id }
          }
        });
        if (existingRoom) {
          throw new createError.Conflict(
            "Room with this number already exists on this floor"
          );
        }
        room.roomNumber = roomNumber.trim();
      } else {
        room.roomNumber = null;
      }
    }

    if (type) {
      room.type = type;
    }

    if (roomCategory) {
      room.roomCategory = roomCategory;
    }

    if (genderRestriction) {
      room.genderRestriction = genderRestriction;
    }

    if (totalBeds !== undefined) {
      room.totalBeds = totalBeds;
    }

    if (charges !== undefined) {
      room.charges = charges;
    }

    if (isActive !== undefined) {
      room.isActive = isActive;
    }

    room.createdBy = updatedByUserId;
    await room.save();

    return room;
  }

  // Bed CRUD
  async createBedService() {
    const createdByUserId = this._request?.userDetails?.id;
    const {
      roomId,
      name,
      bedNumber,
      bedType = "Normal",
      hasOxygen = false,
      hasVentilator = false,
      charge = 0,
      status = "Available",
      isActive = true
    } = this._request.body;

    if (!roomId) {
      throw new createError.BadRequest("Room ID is required");
    }
    if (!name || !name.trim()) {
      throw new createError.BadRequest("Bed name is required");
    }

    // Verify room exists
    const room = await FloorRoomAssociationModel.findOne({
      where: { id: roomId }
    });
    if (!room) {
      throw new createError.NotFound("Room not found");
    }

    // Check for duplicate bed number in same room
    if (bedNumber) {
      const existingBed = await RoomBedAssociationModel.findOne({
        where: { bedNumber: bedNumber.trim(), roomId }
      });
      if (existingBed) {
        throw new createError.Conflict(
          "Bed with this number already exists in this room"
        );
      }
    }

    return await RoomBedAssociationModel.create({
      name: name.trim(),
      roomId,
      bedNumber: bedNumber?.trim() || null,
      bedType,
      hasOxygen,
      hasVentilator,
      charge,
      status,
      isBooked: status === "Occupied",
      isActive,
      createdBy: createdByUserId
    });
  }

  async createBedsBulkService() {
    const createdByUserId = this._request?.userDetails?.id;
    const {
      roomId,
      bedCount,
      bedPrefix = "Bed",
      startNumber = 1,
      bedType = "Normal",
      charge = 0
    } = this._request.body;

    if (!roomId) {
      throw new createError.BadRequest("Room ID is required");
    }
    if (!bedCount || bedCount < 1) {
      throw new createError.BadRequest("Bed count must be at least 1");
    }

    // Verify room exists
    const room = await FloorRoomAssociationModel.findOne({
      where: { id: roomId }
    });
    if (!room) {
      throw new createError.NotFound("Room not found");
    }

    const beds = [];
    for (let i = 0; i < bedCount; i++) {
      const bedNumber = startNumber + i;
      const bedName = `${bedPrefix} ${bedNumber}`;

      // Check for duplicate
      const existingBed = await RoomBedAssociationModel.findOne({
        where: { bedNumber: bedNumber.toString(), roomId }
      });
      if (existingBed) {
        continue; // Skip if exists
      }

      beds.push({
        name: bedName,
        roomId,
        bedNumber: bedNumber.toString(),
        bedType,
        hasOxygen: false,
        hasVentilator: false,
        charge,
        status: "Available",
        isBooked: false,
        isActive: true,
        createdBy: createdByUserId
      });
    }

    if (beds.length === 0) {
      throw new createError.Conflict(
        "All beds with these numbers already exist"
      );
    }

    return await RoomBedAssociationModel.bulkCreate(beds);
  }

  async updateBedService() {
    const updatedByUserId = this._request?.userDetails?.id;
    const { id } = this._request.params;
    const {
      name,
      bedNumber,
      bedType,
      hasOxygen,
      hasVentilator,
      charge,
      status,
      isActive
    } = this._request.body;

    const bed = await RoomBedAssociationModel.findOne({ where: { id } });
    if (!bed) {
      throw new createError.NotFound("Bed not found");
    }

    if (name && name.trim()) {
      bed.name = name.trim();
    }

    if (bedNumber !== undefined) {
      if (bedNumber) {
        const existingBed = await RoomBedAssociationModel.findOne({
          where: {
            bedNumber: bedNumber.trim(),
            roomId: bed.roomId,
            id: { [Op.ne]: id }
          }
        });
        if (existingBed) {
          throw new createError.Conflict(
            "Bed with this number already exists in this room"
          );
        }
        bed.bedNumber = bedNumber.trim();
      } else {
        bed.bedNumber = null;
      }
    }

    if (bedType) {
      bed.bedType = bedType;
    }

    if (hasOxygen !== undefined) {
      bed.hasOxygen = hasOxygen;
    }

    if (hasVentilator !== undefined) {
      bed.hasVentilator = hasVentilator;
    }

    if (charge !== undefined) {
      bed.charge = charge;
    }

    if (status) {
      bed.status = status;
      bed.isBooked = status === "Occupied";
    }

    if (isActive !== undefined) {
      bed.isActive = isActive;
    }

    bed.createdBy = updatedByUserId;
    await bed.save();

    return bed;
  }

  async deleteBedService() {
    const { id } = this._request.params;

    const bed = await RoomBedAssociationModel.findOne({ where: { id } });
    if (!bed) {
      throw new createError.NotFound("Bed not found");
    }

    if (bed.isBooked) {
      throw new createError.Conflict(
        "Cannot delete a bed that is currently booked"
      );
    }

    await bed.destroy();
    return { message: "Bed deleted successfully" };
  }

  async deleteRoomService() {
    const { id } = this._request.params;

    const room = await FloorRoomAssociationModel.findOne({ where: { id } });
    if (!room) {
      throw new createError.NotFound("Room not found");
    }

    // Check if room has beds
    const bedCount = await RoomBedAssociationModel.count({
      where: { roomId: id }
    });
    if (bedCount > 0) {
      throw new createError.Conflict(
        "Cannot delete room that has beds. Please delete beds first."
      );
    }

    await room.destroy();
    return { message: "Room deleted successfully" };
  }

  async deleteFloorService() {
    const { id } = this._request.params;

    const floor = await BuildingFloorAssociationModel.findOne({
      where: { id }
    });
    if (!floor) {
      throw new createError.NotFound("Floor not found");
    }

    // Check if floor has rooms
    const roomCount = await FloorRoomAssociationModel.count({
      where: { floorId: id }
    });
    if (roomCount > 0) {
      throw new createError.Conflict(
        "Cannot delete floor that has rooms. Please delete rooms first."
      );
    }

    await floor.destroy();
    return { message: "Floor deleted successfully" };
  }
}

module.exports = IpService;
