const Joi = require("@hapi/joi");

const authLoginEmailSchema = Joi.object({
  email: Joi.string()
    .max(100)
    .required(),
  password: Joi.string()
    .min(8)
    .max(200)
    .required()
});

const authLoginUserNameSchema = Joi.object({
  userName: Joi.string()
    .max(100)
    .required(),
  password: Joi.string()
    .min(8)
    .max(200)
    .required()
});

const authSendOtpSchema = Joi.object({
  email: Joi.string()
    .email()
    .max(100)
    .required(),
  userName: Joi.string()
    .max(100)
    .required(),
  fullName: Joi.string()
    .max(100)
    .required(),
  password: Joi.string()
    .min(8)
    .max(200)
    .required(),
  confirmPassword: Joi.any()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": `"Password and Confirm Password does not match"`,
      "any.required": `Please confirm your password`
    })
});

const authVerifyOtpSchema = Joi.object({
  email: Joi.string()
    .email()
    .max(100)
    .required(),
  fullName: Joi.string()
    .max(100)
    .required(),
  password: Joi.string()
    .min(8)
    .max(200)
    .required(),
  confirmPassword: Joi.any()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": `Passwords must match`,
      "any.required": `Please confirm your password`
    }),
  roleId: Joi.number()
    .integer()
    .required(),
  userName: Joi.string()
    .max(100)
    .required(),
  branches: Joi.array().required(),
  otp: Joi.number()
    .integer()
    .required()
});

const authForgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .max(100)
    .required()
});

const authResetPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .max(100)
    .required(),
  password: Joi.string()
    .min(8)
    .max(200)
    .required(),
  confirmPassword: Joi.any()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": `Passwords must match`,
      "any.required": `Please confirm your password`
    }),
  secretCode: Joi.string().required()
});

const rejectUserSchema = Joi.object({
  id: Joi.number()
    .integer()
    .required(),
  isBlocked: Joi.number()
    .integer()
    .required()
});

const changePasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),
  oldPassword: Joi.string()
    .min(8)
    .max(200)
    .required(),
  newPassword: Joi.string()
    .min(8)
    .max(200)
    .required()
});

module.exports = {
  authLoginEmailSchema,
  authLoginUserNameSchema,
  authSendOtpSchema,
  authVerifyOtpSchema,
  authForgotPasswordSchema,
  authResetPasswordSchema,
  rejectUserSchema,
  changePasswordSchema
};
