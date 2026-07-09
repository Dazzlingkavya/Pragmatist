const express = require("express");
const { body } = require("express-validator");
const validateRequest = require("../middleware/validateRequest");
const generateToken = require("../utils/generateToken");
const createHttpError = require("../utils/createHttpError");

const router = express.Router();

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required")
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
      const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;

      if (!superAdminEmail || !superAdminPassword) {
        throw createHttpError(500, "Super admin credentials are not configured");
      }

      const emailMatches = email.toLowerCase() === superAdminEmail.toLowerCase();
      const passwordMatches = password === superAdminPassword;

      if (!emailMatches || !passwordMatches) {
        throw createHttpError(401, "Invalid email or password");
      }

      const user = {
        id: "super-admin",
        name: "Super Admin",
        email: superAdminEmail,
        role: "SUPER_ADMIN",
        organizationId: null
      };

      res.json({
        token: generateToken(user),
        user
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
