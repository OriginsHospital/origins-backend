const sendgrid = require("@sendgrid/mail");
const path = require("path");
const fs = require("fs");
const constants = require("../constants/constants");
const createError = require("http-errors");
const axios = require("axios");
const SimpleCrypto = require("simple-crypto-js").default;

class OTPHelper {
  constructor() {}
  sendOtpToEmail = (email, otp, fullName) => {
    return new Promise(async (resolve, reject) => {
      const htmlTemplatePath = path.join(
        __dirname,
        "../templates/otpTemplate.html"
      );
      const emailTemplate = fs.readFileSync(htmlTemplatePath, "utf8");
      const emailSender = sendgrid.setApiKey(process.env.EMAIL_API_KEY);
      const messageBody = {
        to: email,
        from: process.env.EMAIL_SENDER,
        subject: "Welcome to Origins Hospital",
        html: emailTemplate
          .replace("{{name}}", fullName)
          .replace("{{otp}}", otp)
      };

      emailSender
        .send(messageBody)
        .then(() => resolve(constants.OTP_SENT_SUCCESSFULLY))
        .catch(error => {
          console.error(error);
          reject(
            new createError.InternalServerError(
              constants.SOMETHING_ERROR_OCCURRED
            )
          );
        });
    });
  };

  sendResetLinkEmail = (email, link, name) => {
    return new Promise(async (resolve, reject) => {
      const htmlTemplatePath = path.join(
        __dirname,
        "../templates/forgotPasswordTemplate.html"
      );
      const emailTemplate = fs.readFileSync(htmlTemplatePath, "utf8");
      const emailSender = sendgrid.setApiKey(process.env.EMAIL_API_KEY);
      const messageBody = {
        to: email,
        from: process.env.EMAIL_SENDER,
        subject: "Welcome to Origins Hospital",
        html: emailTemplate.replace("{{name}}", name).replace("{{link}}", link)
      };

      emailSender
        .send(messageBody)
        .then(() => resolve(constants.EMAIL_SENT_SUCCESSFULLY))
        .catch(error => {
          console.error(error);
          reject(
            new createError.InternalServerError(
              constants.SOMETHING_ERROR_OCCURRED
            )
          );
        });
    });
  };

  sendDeviceLoginDetectedEmail = (email, link, name, agent) => {
    return new Promise(async (resolve, reject) => {
      const htmlTemplatePath = path.join(
        __dirname,
        "../templates/loginOtherDevice.html"
      );
      const emailTemplate = fs.readFileSync(htmlTemplatePath, "utf8");
      const emailSender = sendgrid.setApiKey(process.env.EMAIL_API_KEY);
      const messageBody = {
        to: email,
        from: process.env.EMAIL_SENDER,
        subject: "Origins HMS - New Login Device Detected",
        html: emailTemplate
          .replace("{{name}}", name)
          .replace("{{logoutLink}}", link)
          .replace("{{email}}", email)
          .replace("{{agent}}", agent)
      };

      emailSender
        .send(messageBody)
        .then(() => resolve(constants.EMAIL_SENT_SUCCESSFULLY))
        .catch(error => {
          console.error(error);
          reject(
            new createError.InternalServerError(
              constants.SOMETHING_ERROR_OCCURRED
            )
          );
        });
    });
  };

  encrypSessionId = text => {
    const simpleCrypto = new SimpleCrypto(process.env.CRYPTO_JS_SECRET);
    const encryptedString = simpleCrypto.encrypt(text);
    const encodedString = encodeURIComponent(encryptedString);
    return encodedString;
  };

  decryptSessionId = ciphertext => {
    const decodedString = decodeURIComponent(ciphertext);
    const simpleCrypto = new SimpleCrypto(process.env.CRYPTO_JS_SECRET);
    const decryptedString = simpleCrypto.decrypt(decodedString);
    return decryptedString;
  };
}

module.exports = OTPHelper;
