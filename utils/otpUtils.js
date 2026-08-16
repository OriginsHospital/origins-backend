const path = require("path");
const fs = require("fs");
const constants = require("../constants/constants");
const SimpleCrypto = require("simple-crypto-js").default;
const { sendMail } = require("./mailer");

class OTPHelper {
  constructor() {}
  sendOtpToEmail = (email, otp, fullName) => {
    return new Promise(async (resolve, reject) => {
      try {
        const htmlTemplatePath = path.join(
          __dirname,
          "../templates/otpTemplate.html"
        );
        const emailTemplate = fs.readFileSync(htmlTemplatePath, "utf8");
        const html = emailTemplate
          .replace("{{name}}", fullName)
          .replace("{{otp}}", otp);

        await sendMail({
          to: email,
          subject: "Origins Hospital - Verify your email",
          html,
          text: `Hi ${fullName}, your Origins Hospital registration OTP is ${otp}. It is valid for 5 minutes.`
        });
        resolve(constants.OTP_SENT_SUCCESSFULLY);
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  };

  sendResetLinkEmail = (email, link, name) => {
    return new Promise(async (resolve, reject) => {
      try {
        const htmlTemplatePath = path.join(
          __dirname,
          "../templates/forgotPasswordTemplate.html"
        );
        const emailTemplate = fs.readFileSync(htmlTemplatePath, "utf8");
        const html = emailTemplate
          .replace("{{name}}", name)
          .replace("{{link}}", link);

        await sendMail({
          to: email,
          subject: "Origins Hospital - Reset your password",
          html,
          text: `Hi ${name}, reset your Origins Hospital password using this link: ${link}`
        });
        resolve(constants.EMAIL_SENT_SUCCESSFULLY);
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  };

  sendDeviceLoginDetectedEmail = (email, link, name, agent) => {
    return new Promise(async (resolve, reject) => {
      try {
        const htmlTemplatePath = path.join(
          __dirname,
          "../templates/loginOtherDevice.html"
        );
        const emailTemplate = fs.readFileSync(htmlTemplatePath, "utf8");
        const html = emailTemplate
          .replace("{{name}}", name)
          .replace("{{logoutLink}}", link)
          .replace("{{email}}", email)
          .replace("{{agent}}", agent);

        await sendMail({
          to: email,
          subject: "Origins HMS - New Login Device Detected",
          html,
          text: `Hi ${name}, a new login was detected for ${email} from ${agent}. Logout using: ${link}`
        });
        resolve(constants.EMAIL_SENT_SUCCESSFULLY);
      } catch (error) {
        console.error(error);
        reject(error);
      }
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
