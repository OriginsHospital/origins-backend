const asyncHandler = controller => async (req, res, next) => {
  try {
    await controller(req, res, next);
  } catch (error) {
    return next(error);
  }
};

const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error("Error occurred:", {
    name: err.name,
    message: err.message,
    status: err.status,
    isJoi: err.isJoi,
    details: err.details
  });

  // Handle Joi validation errors
  if (err.isJoi || err.name === "ValidationError") {
    const errorMessages = err.details
      ? err.details.map(detail => detail.message.replace(/"/g, ""))
      : [err.message];
    return res.status(400).send({
      status: 400,
      message: errorMessages.join(" "),
      data: []
    });
  }

  // Handle HTTP errors (from http-errors package)
  const status = err.status || err.statusCode || 500;
  return res.status(status).send({
    status: status,
    message: err.message || "Something Error Occurred",
    data: []
  });
};

module.exports = {
  errorHandler,
  asyncHandler
};
