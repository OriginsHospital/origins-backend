const jsonwebtoken = require("jsonwebtoken");
const createError = require("http-errors");
const constants = require("../constants/constants");

const PORTAL_ISSUER = "origins_portal";

class PortalJwtHelper {
  async getAccessToken(tokenPayload) {
    return new Promise((resolve, reject) => {
      const secret = process.env.ACCESS_TOKEN_SECRET_KEY;
      const options = {
        expiresIn: `${process.env.ACCESS_TOKEN_EXPIRY || 24}h`,
        issuer: PORTAL_ISSUER,
        audience: tokenPayload
      };
      jsonwebtoken.sign({}, secret, options, (err, token) => {
        if (err) {
          reject(new createError.InternalServerError(constants.JWT_SIGN_ERROR));
          return;
        }
        resolve(token);
      });
    });
  }

  async verifyAccessToken(token) {
    return new Promise((resolve, reject) => {
      const secret = process.env.ACCESS_TOKEN_SECRET_KEY;
      jsonwebtoken.verify(
        token,
        secret,
        { issuer: PORTAL_ISSUER },
        (err, decodedData) => {
          if (err) {
            reject(
              new createError.Unauthorized(constants.UNAUTHORIZED_ACCESS_TOKEN)
            );
            return;
          }
          resolve(decodedData);
        }
      );
    });
  }
}

module.exports = PortalJwtHelper;
module.exports.PORTAL_ISSUER = PORTAL_ISSUER;
