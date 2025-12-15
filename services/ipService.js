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
      where: { branchId }
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
      where: { buildingId }
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
      where: { floorId }
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
      where: { roomId }
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
}

module.exports = IpService;
