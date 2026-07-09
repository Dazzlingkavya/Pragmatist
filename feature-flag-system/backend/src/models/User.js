const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ORG_ADMIN", "END_USER"],
      required: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null
    }
  },
  {
    timestamps: { createdAt: "createdAt", updatedAt: false }
  }
);

module.exports = mongoose.model("User", userSchema);
