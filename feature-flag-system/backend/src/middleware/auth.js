const jwt = require("jsonwebtoken");
const createHttpError = require("../utils/createHttpError");

function authenticate(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(createHttpError(401, "Authorization token is required"));
  }

  try {
    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (_error) {
    return next(createHttpError(401, "Invalid or expired token"));
  }
}

function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(createHttpError(403, "You do not have permission to access this resource"));
    }

    return next();
  };
}

module.exports = { authenticate, authorize };
