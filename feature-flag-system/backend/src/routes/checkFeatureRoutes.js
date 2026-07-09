const express = require("express");
const { body } = require("express-validator");
const Organization = require("../models/Organization");
const FeatureFlag = require("../models/FeatureFlag");
const validateRequest = require("../middleware/validateRequest");
const createHttpError = require("../utils/createHttpError");

const router = express.Router();

router.post(
  "/",
  [
    body("organizationSlug").trim().toLowerCase().notEmpty().withMessage("Organization slug is required"),
    body("featureKey").trim().toLowerCase().notEmpty().withMessage("Feature key is required")
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const organization = await Organization.findOne({
        slug: req.body.organizationSlug
      });

      if (!organization) {
        throw createHttpError(404, "Organization not found");
      }

      const flag = await FeatureFlag.findOne({
        organizationId: organization._id,
        featureKey: req.body.featureKey
      });

      const enabled = Boolean(flag && flag.enabled);

      res.json({
        organization: organization.name,
        featureKey: req.body.featureKey,
        enabled,
        message: `Feature is ${enabled ? "enabled" : "disabled"}`
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
