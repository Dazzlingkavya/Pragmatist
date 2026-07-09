const express = require("express");
const { body } = require("express-validator");
const bcrypt = require("bcrypt");
const Organization = require("../models/Organization");
const User = require("../models/User");
const validateRequest = require("../middleware/validateRequest");
const generateToken = require("../utils/generateToken");
const createHttpError = require("../utils/createHttpError");

const router = express.Router();

router.post(
  "/signup",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("organizationSlug").trim().notEmpty().withMessage("Organization slug is required")
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const { name, email, password, organizationSlug } = req.body;
      const organization = await Organization.findOne({ slug: organizationSlug.toLowerCase() });

      if (!organization) {
        throw createHttpError(404, "Organization not found");
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({
        name,
        email,
        passwordHash,
        role: "ORG_ADMIN",
        organizationId: organization._id
      });

      res.status(201).json({
        message: "Organization admin created successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organizationId: user.organizationId
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

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
      const user = await User.findOne({ email, role: "ORG_ADMIN" }).populate("organizationId");

      if (!user) {
        throw createHttpError(401, "Invalid email or password");
      }

      if (!user.organizationId) {
        throw createHttpError(403, "User is not linked to an active organization");
      }

      const passwordMatches = await bcrypt.compare(password, user.passwordHash);

      if (!passwordMatches) {
        throw createHttpError(401, "Invalid email or password");
      }

      const tokenUser = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId._id
      };

      res.json({
        token: generateToken(tokenUser),
        user: {
          ...tokenUser,
          organization: {
            id: user.organizationId._id,
            name: user.organizationId.name,
            slug: user.organizationId.slug
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
