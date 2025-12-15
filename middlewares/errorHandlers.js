const asyncHandler = controller => async (req, res, next) => {
  try {
    await controller(req, res, next);
  } catch (error) {
    return next(error);
  }
};

const errorHandler = (err, req, res, next) => {
  res.status(err.status || 400);
  if (err.name === "ValidationError") {
    const errorMessages = err.details.map(detail =>
      detail.message.replace(/"/g, "")
    );
    return res.status(400).send({
      status: err.status || 400,
      message: errorMessages.join(" "),
      data: []
    });
  }
  return res.send({
    status: err.status || 400,
    message: err.message,
    data: []
  });
};

module.exports = {
  errorHandler,
  asyncHandler
};
