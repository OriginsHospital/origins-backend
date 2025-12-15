const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const BlockSlotsMasterModel = require("../models/Master/blockedSlotsMaster");
const Constants = require("../constants/constants");
const { Sequelize } = require("sequelize");
const {
  blockedSlotSchema,
  getBlockedTimeSlotsSchema
} = require("../schemas/timeSlotsSchemas");
const {
  getDoctorsListQuery,
  checkOverlappingSlotsQuery,
  getBlockedTimeSlotsQuery,
  getDoctorShiftDetailsQuery
} = require("../queries/time_slots_queries");
const lodash = require("lodash");

class TimeSlotsService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
  }

  async getDoctorsListService() {
    const currentUserBranchId = this._request.userDetails.branchDetails.map(
      branch => {
        return branch.id;
      }
    );

    const data = await this.mysqlConnection
      .query(getDoctorsListQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          branchId: currentUserBranchId.map(branch => String(branch))
        }
      })
      .catch(err => {
        console.log("Error while getting doctorsList", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async getBlockedTimeSlotsService() {
    this._request.body = await getBlockedTimeSlotsSchema.validateAsync(
      this._request.body
    );

    const blockedSlots = await this.mysqlConnection
      .query(getBlockedTimeSlotsQuery, {
        replacements: {
          blockedDate: this._request.body.blockedDate
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("error while fetching blocked slots details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    const data = blockedSlots.map(slot => {
      return {
        doctorId: slot.doctorId,
        blockedDate: slot.blockedDate,
        timeStart: slot.timeStart,
        timeEnd: slot.timeEnd,
        blockType: slot.blockType,
        doctorName: slot.doctorName
      };
    });

    return data;
  }

  async checkOverlappingSlot(slot, blockedDate) {
    const data = await this.mysqlConnection
      .query(checkOverlappingSlotsQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          timeStart: slot.timeStart,
          timeEnd: slot.timeEnd,
          blockedDate: blockedDate,
          doctorId: slot.doctorId
        }
      })
      .catch(err => {
        console.log("Error while getting overlapping list", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data.length > 0
      ? data[0].fullName + " " + slot.timeStart + "-" + slot.timeEnd
      : "";
  }

  async checkShiftRange(slot) {
    let doctorShiftRange = await this.mysqlConnection.query(
      getDoctorShiftDetailsQuery,
      {
        replacements: {
          doctorId: slot.doctorId
        },
        type: Sequelize.QueryTypes.SELECT
      }
    );
    if (!lodash.isEmpty(doctorShiftRange)) {
      doctorShiftRange = doctorShiftRange[0];
      const shiftStart = doctorShiftRange.shiftFrom;
      const shiftEnd = doctorShiftRange.shiftTo;
      const blockStart = slot.timeStart;
      const blockEnd = slot.timeEnd;
      if (blockStart < shiftStart || blockEnd > shiftEnd) {
        return (
          doctorShiftRange.fullName + " " + slot.timeStart + "-" + slot.timeEnd
        );
      }
    }
    return "";
  }

  async blockTimeSlotsService() {
    const blockSlotsPayload = await blockedSlotSchema.validateAsync(
      this._request.body
    );

    const grouped = lodash.groupBy(
      blockSlotsPayload.blockedList,
      obj => `${obj.doctorId}-${obj.timeStart}-${obj.timeEnd}-${obj.blockType}`
    );

    let duplicates = lodash.filter(grouped, group => group.length > 1);
    duplicates = lodash.flatten(duplicates);
    if (duplicates.length > 1) {
      throw new createError.BadRequest(`Duplicate entry found`);
    }

    const blockSlotsData = [];
    await Promise.all(
      blockSlotsPayload.blockedList.map(async slot => {
        const currentSlotInfo = slot;
        blockSlotsData.push({
          blockedDate: blockSlotsPayload.blockedDate,
          doctorId: currentSlotInfo.doctorId,
          timeStart: currentSlotInfo.timeStart,
          timeEnd: currentSlotInfo.timeEnd,
          blockType: currentSlotInfo.blockType ? currentSlotInfo.blockType : "B"
        });
        const isValidRange = await this.checkShiftRange(slot);
        if (!lodash.isEmpty(isValidRange)) {
          throw new createError.BadRequest(
            `Block range out of shift timings for ${isValidRange}, please select valid range`
          );
        }
        const isValidBlockedSlot = await this.checkOverlappingSlot(
          slot,
          blockSlotsPayload.blockedDate
        );
        if (!lodash.isEmpty(isValidBlockedSlot)) {
          throw new createError.BadRequest(
            `Appointment found for ${isValidBlockedSlot} in blocked Range, please cancel appoinment or change block slot `
          );
        }
      })
    );

    return await this.mysqlConnection.transaction(async t => {
      await BlockSlotsMasterModel.destroy({
        where: {
          blockedDate: blockSlotsPayload.blockedDate
        },
        transaction: t
      }).catch(err => {
        console.log("Error while deleting blocked date", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      await BlockSlotsMasterModel.bulkCreate(blockSlotsData, {
        transaction: t
      }).catch(err => {
        console.log("Error while adding blocked slots details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

      return Constants.DATA_UPDATED_SUCCESS;
    });
  }
}

module.exports = TimeSlotsService;
