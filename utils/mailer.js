const nodemailer = require("nodemailer");
const createError = require("http-errors");
const constants = require("../constants/constants");

const getTransporter = () => {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || "smtppro.zoho.in";
  const port = Number(process.env.SMTP_PORT || 465);

  if (!user || !pass) {
    throw new createError.InternalServerError(
      "Email service is not configured. Please set SMTP_USER and SMTP_PASS."
    );
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
};

const sendMail = async ({ to, subject, html, text }) => {
  const transporter = getTransporter();
  const fromAddress = process.env.EMAIL_SENDER || process.env.SMTP_USER;
  const fromName = process.env.EMAIL_FROM_NAME || "Origins Hospital";

  try {
    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      html,
      text
    });
  } catch (error) {
    console.error("Error sending email via Zoho SMTP:", error.message);
    throw new createError.InternalServerError(
      constants.SOMETHING_ERROR_OCCURRED
    );
  }
};

module.exports = { sendMail };
