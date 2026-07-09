const mongoose = require("mongoose");

const featureFlagSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true
    },
    featureKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    enabled: {
      type: Boolean,
      required: true,
      default: false
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

featureFlagSchema.index({ organizationId: 1, featureKey: 1 }, { unique: true });

module.exports = mongoose.model("FeatureFlag", featureFlagSchema);
