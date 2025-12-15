const { QueryTypes, Op } = require("sequelize");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const MySqlConnection = require("../connections/mysql_connection");
const lodash = require("lodash");
const ConsentFormsTemplateMaster = require("../models/Master/consentTemplatesMaster");
const {
  getPatientInfoForConsentForm
} = require("../queries/consentform_templates_queries");
const puppeteer = require("puppeteer");
const { hospitalLogoTemplate } = require("../templates/headerTemplates");

class ConsentFormsTemplateService {
  constructor(request, response, next) {
    this._request = request;
    this._response = response;
    this._next = next;
    this.mysqlConnection = MySqlConnection._instance;
  }

  async getConsentFormsListService() {
    // Currently sending all consents irrespective of IUI/ICSI etc.
    // const {type} = this._request.query;
    // if(!type){
    //     throw new createError.InternalServerError(Constants.PARAMS_ERROR.replace("{params}", "consent type"));
    // }
    return await ConsentFormsTemplateMaster.findAll({
      where: {
        isActive: 1
      },
      attributes: ["id", "name"]
    }).catch(err => {
      console.log("Error while fetching consent forms list", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });
  }

  async downloadConsentFormByIdService() {
    const { id, patientId } = this._request.query;
    if (!id) {
      throw new createError.BadRequest(
        Constants.PARAMS_ERROR.replace("{{params}}", "id")
      );
    }

    const patientInfo = await this.mysqlConnection
      .query(getPatientInfoForConsentForm, {
        type: QueryTypes.SELECT,
        replacements: {
          patientId: patientId
        }
      })
      .catch(err => {
        console.log("Error during fetching of patientDetails", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    if (lodash.isEmpty(patientInfo)) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    let data = await ConsentFormsTemplateMaster.findOne({
      where: {
        id: id
      }
    }).catch(err => {
      console.log("Error during fetching of consent template", err);
      throw new createError.InternalServerError(
        Constants.SOMETHING_ERROR_OCCURRED
      );
    });

    if (lodash.isEmpty(data)) {
      throw new createError.BadRequest(Constants.DATA_NOT_FOUND);
    }

    let hospitalLogoInformation = hospitalLogoTemplate
      .replaceAll("{branchName}", patientInfo[0]?.place)
      .replaceAll("{branchAddress}", patientInfo[0]?.hospitalAddress)
      .replaceAll("{logoText}", patientInfo[0]?.logoText)
      .replaceAll("{branchPhoneNumber}", patientInfo[0]?.phoneNumber);

    data.consentTemplate = data.consentTemplate
      .replaceAll("{hospitalLogoInformation}", hospitalLogoInformation)
      .replaceAll("{{patientName}}", patientInfo[0].patientName)
      .replaceAll("{{guardianName}}", patientInfo[0].guardianName)
      .replaceAll("{{patientAge}}", patientInfo[0].patientAge)
      .replaceAll("{{dateOfBirth}}", patientInfo[0].dateOfBirth)
      .replaceAll("{{patientGender}}", patientInfo[0].patientGender)
      .replaceAll("{{patientAgeGender}}", patientInfo[0].patientAgeGender)
      .replaceAll("{{hospitalAddress}}", patientInfo[0].hospitalAddress)
      .replaceAll("{{currentDate}}", patientInfo[0].currentDate)
      .replaceAll("{{patientAddress}}", patientInfo[0].patientAddress)
      .replaceAll("{{doctorName}}", patientInfo[0].doctorName)
      .replaceAll("{{hospitalName}}", patientInfo[0].hospitalName)
      .replaceAll("{{artClinicName}}", patientInfo[0].artClinicName)
      .replaceAll("{{artClinicAddress}}", patientInfo[0].artClinicAddress)
      .replaceAll("{{place}}", patientInfo[0].place);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setContent(data.consentTemplate, {
      waitUntil: ["load", "domcontentloaded", "networkidle0"]
    });
    const pdf_buffer = await page.pdf({
      format: "a4",
      scale: parseFloat("1"),
      margin: { top: `0.4in`, bottom: `0.4in`, left: `0.4in`, right: `0.4in` },
      height: `11in`,
      width: `8.5in`,
      printBackground: true
    });
    await browser.close();

    this._response.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${data.fileName +
        "_" +
        patientInfo[0].patientId +
        ".pdf"}`,
      "Content-Length": pdf_buffer.length,
      filename: `${data.fileName}_${patientInfo[0].patientId}.pdf`
    });

    this._response.send(pdf_buffer);
  }
}

module.exports = ConsentFormsTemplateService;
