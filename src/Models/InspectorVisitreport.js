const mongoose = require("mongoose");

const visitReportSchema = new mongoose.Schema(
  {
    // Which application
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },

    // Which inspector submitted
    inspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Visit Details
    visitDate: {
      type: Date,
      required: true,
    },

    // Inspector comments
    comments: {
      type: String,
      required: true,
    },

    // Evidence photos
    photos: [
      {
        type: String, // File paths
      },
    ],

    // Verification decision
    isVerified: {
      type: Boolean,
      required: true,
    },

    // If not verified → why?
    rejectionReason: {
      type: String,
      default: null,
    },

    // Tranche number (for follow up visits)
    trancheNumber: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("VisitReport", visitReportSchema);
