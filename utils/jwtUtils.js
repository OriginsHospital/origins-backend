const jsonwebtoken = require("jsonwebtoken");
const createError = require("http-errors");
const constants = require("../constants/constants");

class JWTHelper {
  async getAccessToken(tokenPayload) {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.ACCESS_TOKEN_SECRET_KEY;
      const options = {
        expiresIn: `${process.env.ACCESS_TOKEN_EXPIRY}h`,
        issuer: "hms_origins",
        audience: tokenPayload
      };
      jsonwebtoken.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message);
          reject(new createError.InternalServerError(constants.JWT_SIGN_ERROR));
          return;
        }
        resolve(token);
      });
    });
  }

  async getRefreshToken(tokenPayload) {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.REFRESH_TOKEN_SECRET_KEY;
      const options = {
        expiresIn: `${process.env.REFRESH_TOKEN_EXPIRY}h`,
        issuer: "hms_origins",
        audience: tokenPayload
      };
      jsonwebtoken.sign(payload, secret, options, (err, token) => {
        if (err) {
          console.log(err.message);
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
      jsonwebtoken.verify(token, secret, (err, decodedData) => {
        if (err) {
          console.log(err.message);
          reject(
            new createError.Unauthorized(constants.UNAUTHORIZED_ACCESS_TOKEN)
          );
        }
        resolve(decodedData);
      });
    });
  }

  async verifyRefreshToken(token) {
    return new Promise((resolve, reject) => {
      const secret = process.env.REFRESH_TOKEN_SECRET_KEY;
      jsonwebtoken.verify(token, secret, (err, decodedData) => {
        if (err) {
          console.log(err.message);
          reject(new createError.Unauthorized(constants.SESSION_EXPIRED));
        }
        resolve(decodedData);
      });
    });
  }
}

module.exports = JWTHelper;
