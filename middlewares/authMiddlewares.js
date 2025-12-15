const createError = require("http-errors");
const constants = require("../constants/constants");
const RedisConnection = require("../connections/redis_connection");
const {
  authSendOtpSchema,
  authForgotPasswordSchema
} = require("../schemas/authSchemas");
const { asyncHandler } = require("./errorHandlers");
const JwtHelper = require("../utils/jwtUtils");

const sessionExists = (req, res, next) => {
  if (req.session.userId) {
    const sessionTimeOut = +process.env.SESSION_TIMEOUT;
    const currentTime = Date.now();
    const { createdAt } = req.session;
    if (!(currentTime > createdAt + sessionTimeOut)) {
      return next(new createError.BadRequest(constants.SESSION_ALREADY_EXISTS));
    }
  }
  next();
};

const sessionDoesNotExists = (req, res, next) => {
  if (!req.session.userId) {
    return next(new createError.BadRequest(constants.SESSION_DOESNOT_EXISTS));
  }
  next();
};

const otpExists = asyncHandler(async (req, res, next) => {
  const validPayload = await authSendOtpSchema.validateAsync(req.body);
  const { email } = validPayload;
  const isExists = await RedisConnection._instance
    .GET(`otp:${email}`)
    .catch(err => {
      console.log("Error with redisclient get", err.mesasge);
      return next(
        new createError.InternalServerError(constants.SESSION_ALREADY_EXISTS)
      );
    });

  if (isExists) {
    return next(new createError.BadRequest(constants.OTP_EXISTS));
  }
  next();
});

const resetLinkExists = asyncHandler(async (req, res, next) => {
  const validPayload = await authForgotPasswordSchema.validateAsync(req.body);
  const { email } = validPayload;
  const isExists = await RedisConnection._instance
    .GET(`resetcode:${email}`)
    .catch(err => {
      console.log("Error with redisclient get", err.mesasge);
      throw createError.InternalServerError(Constants.REDIS_ERROR);
    });

  if (isExists) {
    return next(new createError.BadRequest(constants.RESET_LINK_EXISTS));
  }
  next();
});

const checkActiveSession = asyncHandler(async (req, res, next) => {
  if (!req.session.userId) {
    return next(new createError.Unauthorized(constants.SESSION_EXPIRED));
  }
  const sessionTimeOut = +process.env.SESSION_TIMEOUT;
  const currentTime = Date.now();
  const { createdAt } = req.session;
  if (currentTime > createdAt + sessionTimeOut) {
    req.session.destroy(err => {
      if (err) {
        throw new createError.InternalServerError(
          constants.SOMETHING_ERROR_OCCURRED
        );
      }
      res.clearCookie(process.env.SESSION_COOKIE_NAME);
    });
    return next(new createError.Unauthorized(constants.SESSION_EXPIRED));
  }
  next();
});

const tokenVerified = asyncHandler(async (req, res, next) => {
  if (!req.headers["authorization"]) {
    return next(new createError.Unauthorized(constants.PROVIDE_TOKEN));
  }
  const token = req.headers["authorization"].split(" ")[1];
  if (token !== req.session.accessToken) {
    return next(
      new createError.Unauthorized(constants.UNAUTHORIZED_ACCESS_TOKEN)
    );
  }
  const Jwt = new JwtHelper();
  const userDecodedData = await Jwt.verifyAccessToken(token);
  if (!userDecodedData) {
    return next(
      new createError.Unauthorized(constants.UNAUTHORIZED_ACCESS_TOKEN)
    );
  }
  req.userDetails = JSON.parse(userDecodedData.aud);
  next();
});

module.exports = {
  sessionExists,
  otpExists,
  resetLinkExists,
  checkActiveSession,
  sessionDoesNotExists,
  tokenVerified
};
