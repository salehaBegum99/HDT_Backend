const mongoose = require("mongoose");

const systemSettingsSchema = new mongoose.Schema(
  {
    // Tranche Rules
    defaultTotalTranches: {
      type: Number,
      default: 3,
    },

    maxScholarshipAmount: {
      type: Number,
      default: 100000,
    },

    minScholarshipAmount: {
      type: Number,
      default: 10000,
    },

    // Document Retention
    documentRetentionDays: {
      type: Number,
      default: 365, // 1 year
    },

    // Application Rules
    applicationDeadline: {
      type: Date,
      default: null,
    },

    // Last updated by
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("SystemSettings", systemSettingsSchema);
