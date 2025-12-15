const MySqlConnection = require("../connections/mysql_connection");
const {
  presrcibePurchaseInformationQuery
} = require("../queries/cron_queries");
const moment = require("moment-timezone");
const Constants = require("../constants/constants");
const createError = require("http-errors");
const lodash = require("lodash");
const { Sequelize } = require("sequelize");
const sendgrid = require("@sendgrid/mail");
const patientTemplateCronTemplate = require("../templates/cronJobPatientReport");

class CronService {
  constructor() {
    this.mySqlConnection = MySqlConnection._instance;
  }

  async sendEmail(template, subject) {
    return new Promise((resolve, reject) => {
      const emailSender = sendgrid.setApiKey(process.env.EMAIL_API_KEY);
      const messageBody = {
        to: [
          "likhith0301@gmail.com",
          "aadeshpandiri@gmail.com",
          "786muhammedashfaq@gmail.com"
        ],
        from: process.env.EMAIL_SENDER,
        subject: subject,
        html: template
      };

      emailSender.send(messageBody).catch(error => {
        console.error(error);
        reject(
          new createError.InternalServerError(
            constants.SOMETHING_ERROR_OCCURRED
          )
        );
      });
    });
  }

  async getProdTable(itemDetails) {
    let prodTable = '<tr><td style="margin: 8px 30px; display: block;">';
    prodTable += `<table width="650" border="1" cellspacing="0" cellpadding="0" style="border: 1px solid #EAECF0;">`;
    prodTable += `<tr style="background: #F9FAFB;">
            <th style="color: #667085;
            font-size: 10px;
            font-weight: 700;
            line-height: 18px;
            padding: 6px;" width="300">Item Name</th>
            <th style="color: #667085;
            font-size: 10px;
            font-weight: 700;
            line-height: 18px;
            padding: 6px;" width="150">Purchase Quantity</th>
            <th style="color: #667085;
            font-size: 10px;
            font-weight: 700;
            line-height: 18px;
            padding: 6px;"  width="200">Prescribed Quantity</th>
        </tr>`;

    for (let info of itemDetails) {
      prodTable += `<tr>
                    <td style="color: #000;
                    font-size: 10px;
                    font-weight: 400;
                    line-height: normal;
                    padding: 6px;
                    vertical-align: baseline;">${info.itemName}</td>
                    <td style="color: #000;
                    font-size: 10px;
                    font-weight: 400;
                    line-height: normal;
                    padding: 6px;
                    vertical-align: baseline;">${info.purchaseQuantity}</td>
                    <td style="color: #000;
                    font-size: 10px;
                    font-weight: 400;
                    line-height: normal;
                    padding: 6px;
                    vertical-align: baseline;">${info.prescribedQuantity}</td>
                </tr>`;
    }
    prodTable += `</table></td></tr>`;
    return prodTable;
  }
  async sendPatientPurchasePrescribeReport() {
    const prevDate = moment()
      .tz("Asia/Kolkata")
      .subtract(1, "days")
      .format("YYYY-MM-DD");
    console.log("Excuting for Previous Date");
    const data = await this.mySqlConnection
      .query(presrcibePurchaseInformationQuery, {
        type: Sequelize.QueryTypes.SELECT,
        replacements: {
          appointmentDate: prevDate
        }
      })
      .catch(err => {
        console.log("Error while fetching details of appointment", err);
        throw new createError.InternalServerError(
          Constants.SOMETHING_ERROR_OCCURRED
        );
      });

    let template = patientTemplateCronTemplate;
    let patientInformation = "";
    if (!lodash.isEmpty(data)) {
      await Promise.all(
        data.map(async row => {
          let patientInfoSection = `
                    <tr>
                        <td style="
                        padding: 6px 16px  0px 16px;
                          color: #2F3043;
                          font-size: 13px;
                           font-weight: 700;
                            line-height: normal;
                          ">Patient Details</td>
                    </tr>
                    <tr>
                        <td style=" padding: 6px 16px  8px 16px;">
                            <table width="650" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td width="130" style="color: #2F3043;
                                font-size: 12.5px;
                                font-weight: 600;
                                line-height: normal;
                                text-align: left;
                                letter-spacing: 0.068px;">Patient Name</td>
                                    <td width="130" style="color: #2F3043;
                                font-size: 12.5px;
                                font-weight: 600;
                                line-height: normal;
                                text-align: left;
                                letter-spacing: 0.068px;">Patient Id</td>
                                    <td width="130" style="color: #2F3043;
                                font-size: 12.5px;
                                font-weight: 600;
                                line-height: normal;
                                text-align: left;
                                letter-spacing: 0.068px;">Mobile No.</td>
                                    <th width="130" style="color: #2F3043;
                                font-size: 12.5px;
                                font-weight: 600;
                                line-height: normal;
                                text-align: left;
                                letter-spacing: 0.068px;">Doctor Name</th>
                                    <th width="130" style="color: #2F3043;
                                font-size: 12.5px;
                                font-weight: 600;
                                line-height: normal;
                                text-align: left;
                                letter-spacing: 0.068px;">Appointment Time</th>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style=" padding: 0px 16px  8px 16px;">
                            <table width="650" border="0" cellspacing="0" cellpadding="0">
                                <tr>
                                    <td width="130" style="color: #2F3043;
                              font-size: 12.5px;
                              font-weight: 500;
                              line-height: normal;
                              letter-spacing: 0.113px;">${row?.patientDetails?.fullName}</td>
                                    <td width="130" style="color: #2F3043;
                              font-size: 12.5px;
                              font-weight: 500;
                              line-height: normal;
                              letter-spacing: 0.113px;
                              word-wrap: break-word;
                              display: block;
                              width:120px;">${row?.patientDetails?.patientId}</td>
                                    <td width="130" style="color: #2F3043;
                              font-size: 12.5px;
                              font-weight: 500;
                              line-height: normal;
                              letter-spacing: 0.113px;">${row?.patientDetails?.mobileNumber}</td>
                                    <td width="130" style="color: #2F3043;
                              font-size: 12.5px;
                              font-weight: 500;
                              line-height: normal;
                              letter-spacing: 0.113px;">${row?.doctorName}</td>
                                    <td width="130" style="color: #2F3043;
                              font-size: 12.5px;
                              font-weight: 500;
                              line-height: normal;
                              letter-spacing: 0.113px;">${row?.timeStart}:${row.timeEnd}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                `;
          let prodTable = await this.getProdTable(row?.itemPurchaseDetails);
          let hrTag = `
                     <tr>
                        <td>
                            <br>
							<hr>
                        </td>
                    </tr>
                `;
          patientInformation += hrTag + patientInfoSection + prodTable;
        })
      );
      template = template.replace("{patientInformation}", patientInformation);
      template = template.replace("{dateOfJob}", prevDate);
      await this.sendEmail(template, `Purchase Prescribed Report ${prevDate}`);
    }
  }
}

module.exports = CronService;
