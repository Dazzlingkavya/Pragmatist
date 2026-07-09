const { validationResult } = require("express-validator");
const createHttpError = require("../utils/createHttpError");

function validateRequest(req, _res, next) {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  const message = errors
    .array()
    .map((error) => error.msg)
    .join(", ");

  return next(createHttpError(400, message));
}

module.exports = validateRequest;
