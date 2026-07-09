const express = require("express");
const { body, param } = require("express-validator");
const FeatureFlag = require("../models/FeatureFlag");
const { authenticate, authorize } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");
const createHttpError = require("../utils/createHttpError");

const router = express.Router();

router.use(authenticate, authorize("ORG_ADMIN"));

const flagValidators = [
  body("featureKey")
    .trim()
    .toLowerCase()
    .matches(/^[a-z0-9_:-]+$/)
    .withMessage("Feature key must contain lowercase letters, numbers, underscores, hyphens, or colons"),
  body("description").optional().trim().isLength({ max: 500 }).withMessage("Description is too long"),
  body("enabled").isBoolean().withMessage("Enabled must be true or false")
];

router.get("/", async (req, res, next) => {
  try {
    const flags = await FeatureFlag.find({ organizationId: req.user.organizationId }).sort({
      createdAt: -1
    });
    res.json({ flags });
  } catch (error) {
    next(error);
  }
});

router.post("/", flagValidators, validateRequest, async (req, res, next) => {
  try {
    const flag = await FeatureFlag.create({
      organizationId: req.user.organizationId,
      featureKey: req.body.featureKey.toLowerCase(),
      description: req.body.description || "",
      enabled: req.body.enabled,
      createdBy: req.user.id
    });

    res.status(201).json({ flag });
  } catch (error) {
    next(error);
  }
});

router.put(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid feature flag id"), ...flagValidators],
  validateRequest,
  async (req, res, next) => {
    try {
      const flag = await FeatureFlag.findOneAndUpdate(
        { _id: req.params.id, organizationId: req.user.organizationId },
        {
          featureKey: req.body.featureKey.toLowerCase(),
          description: req.body.description || "",
          enabled: req.body.enabled
        },
        { new: true, runValidators: true }
      );

      if (!flag) {
        throw createHttpError(404, "Feature flag not found");
      }

      res.json({ flag });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid feature flag id")],
  validateRequest,
  async (req, res, next) => {
    try {
      const flag = await FeatureFlag.findOneAndDelete({
        _id: req.params.id,
        organizationId: req.user.organizationId
      });

      if (!flag) {
        throw createHttpError(404, "Feature flag not found");
      }

      res.json({ message: "Feature flag deleted" });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
