const createHttpError = require("../utils/createHttpError");

function notFound(req, _res, next) {
  next(createHttpError(404, `Route not found: ${req.originalUrl}`));
}

module.exports = notFound;
