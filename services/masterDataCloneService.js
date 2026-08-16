const Constants = require("../constants/constants");
const createError = require("http-errors");
const { Op } = require("sequelize");
const { cloneMasterDataSchema } = require("../schemas/masterDataSchema");
const MySqlConnection = require("../connections/mysql_connection");
const BranchMasterModel = require("../models/Master/branchMaster");
const LabTestMasterBranchAssociation = require("../models/Master/LabTestMasterBranchAssociation");
const ScanMasterBranchAssociation = require("../models/Master/ScanMasterBranchAssociation");
const EmbryologyMasterBranchAssociation = require("../models/Master/EmbryologyMasterBranchAssociation");
const OtPersonDefaultMasterModel = require("../models/Master/personDefaultOtMasterModel");
const AppointmentChargesBranchAssociation = require("../models/Associations/appointmentChargesBranchAssocitation");
const BranchBuildingAssociationModel = require("../models/Associations/branchBuildingAssociation");
const BuildingFloorAssociationModel = require("../models/Associations/buildingFloorAssociationModel");
const FloorRoomAssociationModel = require("../models/Associations/floorRoomAssociationModel");
const RoomBedAssociationModel = require("../models/Associations/roomBedAssociationModel");

const emptySummary = () => ({
  sourceCount: 0,
  created: 0,
  skipped: 0,
  updated: 0
});

const pickEnum = (value, allowed, fallback) =>
  allowed.includes(value) ? value : fallback;

class MasterDataCloneService {
  constructor(request) {
    this._request = request;
    this.mysqlConnection = MySqlConnection._instance;
  }

  async previewCloneMasterData() {
    const payload = await this._validateClonePayload();
    return this._runClone(payload, { dryRun: true });
  }

  async cloneMasterData() {
    const payload = await this._validateClonePayload();
    return this._runClone(payload, { dryRun: false });
  }

  async _validateClonePayload() {
    const payload = await cloneMasterDataSchema.validateAsync(
      this._request.body
    );

    if (Number(payload.sourceBranchId) === Number(payload.targetBranchId)) {
      throw new createError.BadRequest(Constants.CLONE_SOURCE_TARGET_SAME);
    }

    const branches = await BranchMasterModel.findAll({
      where: {
        id: { [Op.in]: [payload.sourceBranchId, payload.targetBranchId] }
      },
      attributes: ["id", "name", "branchCode", "isActive"]
    }).catch(err => {
      console.log("Error while validating clone branches", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    const sourceBranch = branches.find(
      branch => Number(branch.id) === Number(payload.sourceBranchId)
    );
    const targetBranch = branches.find(
      branch => Number(branch.id) === Number(payload.targetBranchId)
    );

    if (!sourceBranch || !targetBranch) {
      throw new createError.BadRequest(Constants.BRANCH_NOT_FOUND);
    }

    return {
      ...payload,
      sourceBranch,
      targetBranch,
      createdBy: this._request?.userDetails?.id
    };
  }

  async _runClone(payload, { dryRun }) {
    const runner = async transaction => {
      const results = {};
      const selected = new Set(payload.cloneTypes);

      if (selected.has("labTests")) {
        results.labTests = await this._cloneLabTests(
          payload,
          dryRun,
          transaction
        );
      }
      if (selected.has("scans")) {
        results.scans = await this._cloneScans(payload, dryRun, transaction);
      }
      if (selected.has("embryology")) {
        results.embryology = await this._cloneEmbryology(
          payload,
          dryRun,
          transaction
        );
      }
      if (selected.has("defaultOtPersons")) {
        results.defaultOtPersons = await this._cloneDefaultOtPersons(
          payload,
          dryRun,
          transaction
        );
      }
      if (selected.has("appointmentCharges")) {
        results.appointmentCharges = await this._cloneAppointmentCharges(
          payload,
          dryRun,
          transaction
        );
      }
      if (selected.has("layouts")) {
        results.layouts = await this._cloneLayouts(
          payload,
          dryRun,
          transaction
        );
      }

      return {
        sourceBranch: {
          id: payload.sourceBranch.id,
          name: payload.sourceBranch.name,
          branchCode: payload.sourceBranch.branchCode
        },
        targetBranch: {
          id: payload.targetBranch.id,
          name: payload.targetBranch.name,
          branchCode: payload.targetBranch.branchCode
        },
        overwriteExisting: Boolean(payload.overwriteExisting),
        dryRun,
        results
      };
    };

    if (dryRun) {
      return runner(null);
    }

    return this.mysqlConnection.transaction(async t => runner(t));
  }

  _tx(transaction) {
    return transaction ? { transaction } : {};
  }

  async _cloneAssociationTable({
    model,
    sourceKey,
    payload,
    dryRun,
    transaction,
    mapCreateRow,
    mapUpdateValues
  }) {
    const summary = emptySummary();
    const sourceRows = await model
      .findAll({
        where: { branchId: payload.sourceBranchId },
        ...this._tx(transaction)
      })
      .catch(err => {
        console.log(`Error while reading source ${sourceKey} for clone`, err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    const targetRows = await model
      .findAll({
        where: { branchId: payload.targetBranchId },
        ...this._tx(transaction)
      })
      .catch(err => {
        console.log(`Error while reading target ${sourceKey} for clone`, err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    summary.sourceCount = sourceRows.length;
    const sourceByKey = new Map();
    sourceRows.forEach(row => {
      sourceByKey.set(Number(row[sourceKey]), row);
    });
    const existingByKey = new Map(
      targetRows.map(row => [Number(row[sourceKey]), row])
    );
    const toCreate = [];
    const toUpdate = [];

    sourceByKey.forEach(row => {
      const existing = existingByKey.get(Number(row[sourceKey]));
      if (!existing) {
        toCreate.push(mapCreateRow(row));
        return;
      }
      if (payload.overwriteExisting) {
        toUpdate.push({ id: existing.id, values: mapUpdateValues(row) });
        return;
      }
      summary.skipped += 1;
    });

    if (dryRun) {
      summary.created = toCreate.length;
      summary.updated = toUpdate.length;
      return summary;
    }

    if (toCreate.length) {
      await model.bulkCreate(toCreate, this._tx(transaction)).catch(err => {
        console.log(`Error while cloning ${sourceKey} records`, err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });
    }

    for (const item of toUpdate) {
      await model
        .update(item.values, {
          where: { id: item.id },
          ...this._tx(transaction)
        })
        .catch(err => {
          console.log(`Error while updating cloned ${sourceKey} record`, err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });
    }

    summary.created = toCreate.length;
    summary.updated = toUpdate.length;
    return summary;
  }

  _cloneLabTests(payload, dryRun, transaction) {
    return this._cloneAssociationTable({
      model: LabTestMasterBranchAssociation,
      sourceKey: "labTestId",
      payload,
      dryRun,
      transaction,
      mapCreateRow: row => ({
        labTestId: row.labTestId,
        branchId: payload.targetBranchId,
        sampleTypeId: row.sampleTypeId,
        labTestGroupId: row.labTestGroupId,
        amount: row.amount,
        isOutSourced: row.isOutSourced,
        isActive: row.isActive,
        createdBy: payload.createdBy
      }),
      mapUpdateValues: row => ({
        sampleTypeId: row.sampleTypeId,
        labTestGroupId: row.labTestGroupId,
        amount: row.amount,
        isOutSourced: row.isOutSourced,
        isActive: row.isActive,
        updatedBy: payload.createdBy
      })
    });
  }

  _cloneScans(payload, dryRun, transaction) {
    return this._cloneAssociationTable({
      model: ScanMasterBranchAssociation,
      sourceKey: "scanId",
      payload,
      dryRun,
      transaction,
      mapCreateRow: row => ({
        scanId: row.scanId,
        branchId: payload.targetBranchId,
        isFormFRequired: row.isFormFRequired,
        amount: row.amount,
        isActive: row.isActive,
        createdBy: payload.createdBy
      }),
      mapUpdateValues: row => ({
        isFormFRequired: row.isFormFRequired,
        amount: row.amount,
        isActive: row.isActive,
        updatedBy: payload.createdBy
      })
    });
  }

  _cloneEmbryology(payload, dryRun, transaction) {
    return this._cloneAssociationTable({
      model: EmbryologyMasterBranchAssociation,
      sourceKey: "embryologyId",
      payload,
      dryRun,
      transaction,
      mapCreateRow: row => ({
        embryologyId: row.embryologyId,
        branchId: payload.targetBranchId,
        amount: row.amount,
        isActive: row.isActive,
        createdBy: payload.createdBy
      }),
      mapUpdateValues: row => ({
        amount: row.amount,
        isActive: row.isActive
      })
    });
  }

  _cloneDefaultOtPersons(payload, dryRun, transaction) {
    return this._cloneAssociationTable({
      model: OtPersonDefaultMasterModel,
      sourceKey: "designationId",
      payload,
      dryRun,
      transaction,
      mapCreateRow: row => ({
        personId: row.personId,
        designationId: row.designationId,
        branchId: payload.targetBranchId,
        createdBy: payload.createdBy
      }),
      mapUpdateValues: row => ({
        personId: row.personId,
        updatedBy: payload.createdBy
      })
    });
  }

  _cloneAppointmentCharges(payload, dryRun, transaction) {
    return this._cloneAssociationTable({
      model: AppointmentChargesBranchAssociation,
      sourceKey: "appointmentReasonId",
      payload,
      dryRun,
      transaction,
      mapCreateRow: row => ({
        appointmentReasonId: row.appointmentReasonId,
        branchId: payload.targetBranchId,
        appointmentCharges: row.appointmentCharges,
        createdBy: payload.createdBy
      }),
      mapUpdateValues: row => ({
        appointmentCharges: row.appointmentCharges,
        updatedBy: payload.createdBy
      })
    });
  }

  async _cloneLayouts(payload, dryRun, transaction) {
    const summary = {
      sourceCount: 0,
      created: 0,
      skipped: 0,
      updated: 0,
      buildingsCreated: 0,
      buildingsSkipped: 0,
      floorsCreated: 0,
      roomsCreated: 0,
      bedsCreated: 0
    };
    const tx = this._tx(transaction);

    const sourceBuildings = await BranchBuildingAssociationModel.findAll({
      where: { branchId: payload.sourceBranchId },
      ...tx
    }).catch(err => {
      console.log("Error while reading source buildings for clone", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    const targetBuildings = await BranchBuildingAssociationModel.findAll({
      where: { branchId: payload.targetBranchId },
      ...tx
    }).catch(err => {
      console.log("Error while reading target buildings for clone", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    const targetBuildingByName = new Map(
      targetBuildings.map(building => [
        String(building.name || "")
          .trim()
          .toLowerCase(),
        building
      ])
    );

    const sourceBuildingIds = sourceBuildings.map(building => building.id);
    const sourceFloors = sourceBuildingIds.length
      ? await BuildingFloorAssociationModel.findAll({
          where: { buildingId: { [Op.in]: sourceBuildingIds } },
          ...tx
        })
      : [];
    const sourceFloorIds = sourceFloors.map(floor => floor.id);
    const sourceRooms = sourceFloorIds.length
      ? await FloorRoomAssociationModel.findAll({
          where: { floorId: { [Op.in]: sourceFloorIds } },
          ...tx
        })
      : [];
    const sourceRoomIds = sourceRooms.map(room => room.id);
    const sourceBeds = sourceRoomIds.length
      ? await RoomBedAssociationModel.findAll({
          where: { roomId: { [Op.in]: sourceRoomIds } },
          ...tx
        })
      : [];

    const floorsByBuilding = new Map();
    sourceFloors.forEach(floor => {
      const list = floorsByBuilding.get(floor.buildingId) || [];
      list.push(floor);
      floorsByBuilding.set(floor.buildingId, list);
    });
    const roomsByFloor = new Map();
    sourceRooms.forEach(room => {
      const list = roomsByFloor.get(room.floorId) || [];
      list.push(room);
      roomsByFloor.set(room.floorId, list);
    });
    const bedsByRoom = new Map();
    sourceBeds.forEach(bed => {
      const list = bedsByRoom.get(bed.roomId) || [];
      list.push(bed);
      bedsByRoom.set(bed.roomId, list);
    });

    const countDescendants = buildingId => {
      const floors = floorsByBuilding.get(buildingId) || [];
      let rooms = 0;
      let beds = 0;
      floors.forEach(floor => {
        const floorRooms = roomsByFloor.get(floor.id) || [];
        rooms += floorRooms.length;
        floorRooms.forEach(room => {
          beds += (bedsByRoom.get(room.id) || []).length;
        });
      });
      return { floors: floors.length, rooms, beds };
    };

    sourceBuildings.forEach(building => {
      const descendants = countDescendants(building.id);
      summary.sourceCount +=
        1 + descendants.floors + descendants.rooms + descendants.beds;
    });

    const buildingsToClone = [];
    sourceBuildings.forEach(building => {
      const key = String(building.name || "")
        .trim()
        .toLowerCase();
      const descendants = countDescendants(building.id);
      const descendantCount =
        descendants.floors + descendants.rooms + descendants.beds;
      if (targetBuildingByName.has(key)) {
        summary.skipped += 1 + descendantCount;
        summary.buildingsSkipped += 1;
        return;
      }
      buildingsToClone.push(building);
      if (dryRun) {
        summary.created += 1 + descendantCount;
        summary.buildingsCreated += 1;
        summary.floorsCreated += descendants.floors;
        summary.roomsCreated += descendants.rooms;
        summary.bedsCreated += descendants.beds;
      }
    });

    if (dryRun) {
      return summary;
    }

    for (const building of buildingsToClone) {
      const createdBuilding = await BranchBuildingAssociationModel.create(
        {
          branchId: payload.targetBranchId,
          name: building.name,
          buildingCode: building.buildingCode,
          totalFloors: building.totalFloors,
          isActive: building.isActive,
          createdBy: payload.createdBy
        },
        tx
      ).catch(err => {
        console.log("Error while cloning building", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      summary.created += 1;
      summary.buildingsCreated += 1;

      const floors = floorsByBuilding.get(building.id) || [];
      for (const floor of floors) {
        const createdFloor = await BuildingFloorAssociationModel.create(
          {
            buildingId: createdBuilding.id,
            name: floor.name,
            floorNumber: floor.floorNumber,
            floorType: pickEnum(floor.floorType, ["IP", "ICU", "Mixed"], "IP"),
            isActive: floor.isActive,
            createdBy: payload.createdBy
          },
          tx
        ).catch(err => {
          console.log("Error while cloning floor", err);
          throw new createError.InternalServerError(
            Constants.SOMETHING_ERROR_OCCURRED
          );
        });

        summary.created += 1;
        summary.floorsCreated += 1;

        const rooms = roomsByFloor.get(floor.id) || [];
        for (const room of rooms) {
          const createdRoom = await FloorRoomAssociationModel.create(
            {
              floorId: createdFloor.id,
              name: room.name,
              roomNumber: room.roomNumber,
              type: pickEnum(room.type, ["AC", "Non-AC"], "Non-AC"),
              roomCategory: pickEnum(
                room.roomCategory,
                ["General", "Semi-Private", "Private", "VIP"],
                "General"
              ),
              genderRestriction: pickEnum(
                room.genderRestriction,
                ["Male", "Female", "Any"],
                "Any"
              ),
              totalBeds: room.totalBeds,
              charges: room.charges,
              isActive: room.isActive,
              createdBy: payload.createdBy
            },
            tx
          ).catch(err => {
            console.log("Error while cloning room", err);
            throw new createError.InternalServerError(
              Constants.SOMETHING_ERROR_OCCURRED
            );
          });

          summary.created += 1;
          summary.roomsCreated += 1;

          const beds = bedsByRoom.get(room.id) || [];
          if (beds.length) {
            const bedRows = beds.map(bed => ({
              roomId: createdRoom.id,
              name: bed.name,
              bedNumber: bed.bedNumber,
              bedType: pickEnum(bed.bedType, ["Normal", "ICU"], "Normal"),
              hasOxygen: bed.hasOxygen,
              hasVentilator: bed.hasVentilator,
              charge: bed.charge,
              status: "Available",
              isBooked: false,
              isActive: bed.isActive,
              createdBy: payload.createdBy
            }));
            await RoomBedAssociationModel.bulkCreate(bedRows, tx).catch(err => {
              console.log("Error while cloning beds", err);
              throw new createError.InternalServerError(
                Constants.SOMETHING_ERROR_OCCURRED
              );
            });
            summary.created += bedRows.length;
            summary.bedsCreated += bedRows.length;
          }
        }
      }
    }

    return summary;
  }
}

module.exports = MasterDataCloneService;
