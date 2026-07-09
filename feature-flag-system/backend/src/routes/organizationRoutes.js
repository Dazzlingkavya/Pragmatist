const express = require("express");
const { body } = require("express-validator");
const Organization = require("../models/Organization");
const { authenticate, authorize } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.use(authenticate, authorize("SUPER_ADMIN"));

router.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Organization name is required"),
    body("slug")
      .trim()
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Slug must contain only lowercase letters, numbers, and hyphens")
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const organization = await Organization.create({
        name: req.body.name,
        slug: req.body.slug
      });

      res.status(201).json({ organization });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/", async (_req, res, next) => {
  try {
    const organizations = await Organization.find().sort({ createdAt: -1 });
    res.json({ organizations });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
