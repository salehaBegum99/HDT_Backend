const mongoose = require("mongoose");

const trancheSchema = new mongoose.Schema(
  {
    // Which application
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
    },

    // Which supervisor disbursed
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Tranche Details
    trancheNumber: {
      type: Number,
      required: true, // 1, 2, 3...
    },

    amount: {
      type: Number,
      required: true,
    },

    disbursedDate: {
      type: Date,
      required: true,
    },

    // Payment Evidence
    paymentEvidence: {
      type: String, // File path
      default: null,
    },

    // Payment reference
    transactionReference: {
      type: String,
      default: null,
    },

    // Status
    status: {
      type: String,
      enum: ["PENDING", "DISBURSED", "ON_HOLD"],
      default: "DISBURSED",
    },

    // Supervisor comments
    comments: {
      type: String,
      default: null,
    },

    // Flag for issues
    isFlagged: {
      type: Boolean,
      default: false,
    },

    flagReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Tranche", trancheSchema);
