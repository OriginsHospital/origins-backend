const createError = require("http-errors");
const Constants = require("../constants/constants");
const {
  visitHistoryQuery,
  embryologyHistoryQuery,
  consultationHistoryByVisitId,
  treatmentHistoryByVisitId,
  consultationPrescriptionByAppointmentId,
  treatmentPrescriptionByAppointmentId,
  formFTemplateByPatientIdQuery,
  prescriptionHistoryByTreatmentCycleIdFollicular,
  paymentHistoryByVisitId,
  getNotesHistoryByVisitIdQuery
} = require("../queries/patient_history_queries");
const MySqlConnection = require("../connections/mysql_connection");
const { Sequelize } = require("sequelize");
const lodash = require("lodash");
const {
  formFTemplatesByScanAppointmentSchema
} = require("../schemas/scanSchema");
const patientScanFormFAssociations = require("../models/Associations/patientScanFormFAssociation");

class PatientHistoryService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mySqlConnection = MySqlConnection._instance;
  }

  async getPatientVisitHistoryService() {
    const { patientId } = this._request.params;
    if (!patientId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "patientId")
      );
    }
    const data = await this.mySqlConnection
      .query(visitHistoryQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          patientId: patientId
        }
      })
      .catch(err => {
        console.log("Error while fetching patient History", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.PATIENT_DOES_NOT_EXIST);
    }

    return data[0]?.patientDetails;
  }

  async getPatientEmbryologyHistoryService() {
    const { visitId } = this._request.params;
    if (!visitId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "visitId")
      );
    }

    const patientHistoryData = await this.mySqlConnection
      .query(embryologyHistoryQuery, {
        replacements: {
          visitId: visitId
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error in patient history embryology", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(patientHistoryData)) {
      return [];
      // throw new createError.BadRequest(Constants.VISIT_DOES_NOT_EXIST);
    }

    return patientHistoryData.map(data => data.patientInformation[0]);
  }

  async getPatientConsultationHistoryService() {
    const { visitId } = this._request.params;
    if (!visitId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "visitId")
      );
    }

    const data = await this.mySqlConnection
      .query(consultationHistoryByVisitId, {
        replacements: {
          visitId: visitId
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching the consultation history", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(
        Constants.CONSULTATION_NOT_FOUND_FOR_VISIT
      );
    }

    return data[0]?.consultationDetails;
  }

  async getPatientTreatmentHistoryService() {
    const { visitId } = this._request.params;
    if (!visitId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "visitId")
      );
    }

    const data = await this.mySqlConnection
      .query(treatmentHistoryByVisitId, {
        replacements: {
          visitId: visitId
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching the treatment history", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.TREATMEMT_NOT_FOUND_FOR_VISIT);
    }

    return data[0]?.treatmentDetails;
  }

  async getConsultationInformationByAppointmentIdService() {
    const { appointmentId } = this._request.params;
    if (!appointmentId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "appointmentId")
      );
    }

    const data = await this.mySqlConnection
      .query(consultationPrescriptionByAppointmentId, {
        replacements: {
          appointmentId: appointmentId
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log(
          "Error while fetching the consultation prescriotion details",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.APPOINTMENT_NOT_FOUND);
    }
    return data[0];
  }

  async getTreatmentInformationByAppointmentIdService() {
    const { appointmentId } = this._request.params;
    if (!appointmentId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "appointmentId")
      );
    }

    const data = await this.mySqlConnection
      .query(treatmentPrescriptionByAppointmentId, {
        replacements: {
          appointmentId: appointmentId
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log(
          "Error while fetching the treatment prescriotion details",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.APPOINTMENT_NOT_FOUND);
    }
    return data[0];
  }

  async getFormFTemplateByPatientIdService() {
    const { patientId } = this._request.params;
    if (!patientId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "patientId")
      );
    }

    const data = await this.mySqlConnection
      .query(formFTemplateByPatientIdQuery, {
        replacements: {
          patientId: patientId
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log(
          "Error while fetching the form f by patientId details",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return data;
  }

  async getFormFTemplatesByScanAppointmentService() {
    const { appointmentId, type, scanId } = this._request.query;
    if (!type) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{{params}}", "type")
      );
    }
    if (!appointmentId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{{params}}", "appointmentId")
      );
    }
    if (!scanId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{{params}}", "scanId")
      );
    }

    const getPatientScanFormF = await patientScanFormFAssociations
      .findOne({
        where: {
          appointmentId: appointmentId,
          type: type,
          scanId: scanId
        }
      })
      .catch(err => {
        console.log("Error while fetching Details", err.message);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    return getPatientScanFormF;
  }

  async getPrescriptionDetailsByTreatmentCycleIdFollicularService() {
    const { treatmentCycleId } = this._request.params;
    if (!treatmentCycleId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "treatmentCycleId")
      );
    }

    const data = await this.mySqlConnection
      .query(prescriptionHistoryByTreatmentCycleIdFollicular, {
        replacements: {
          treatmentCycleId: treatmentCycleId
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log(
          "Error while fetching the prescriptionn details for follicular details",
          err
        );
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (!lodash.isEmpty(data)) {
      return data[0]?.pharmacyList || [];
    }
    return [];
  }

  async getPaymentHistoryByVisitIdService() {
    const { visitId } = this._request.params;
    if (!visitId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "visitId")
      );
    }

    const data = await this.mySqlConnection
      .query(paymentHistoryByVisitId, {
        replacements: {
          visitId: visitId
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching the payment history details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(data)) {
      return [];
    }
    return data;
  }

  async getNotesHistoryByVisitIdService() {
    const { visitId } = this._request.params;
    if (!visitId) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replaceAll("{params}", "visitId")
      );
    }

    const data = await this.mySqlConnection
      .query(getNotesHistoryByVisitIdQuery, {
        replacements: {
          visitId: visitId
        },
        type: Sequelize.QueryTypes.SELECT
      })
      .catch(err => {
        console.log("Error while fetching the payment history details", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(data)) {
      return [];
    }
    return data;
  }
}

module.exports = PatientHistoryService;
