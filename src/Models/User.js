const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true, // Not mandatory for applicants
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["APPLICANT", "INSPECTOR", "SUPERVISOR", "HO", "SUPERADMIN"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true, // SuperAdmin can deactivate users
    },
    isMobileVerified: {
      type: Boolean,
      default: false, // Only becomes true after OTP
    },

    // Replace assignedArea + assignedDistrict with just:
assignedArea: {
  type: String,
  default: null,
},
// Add for Supervisor:
sponsorOrg: {
  type: String,
  default: null,
},
    refreshToken: { type: String, default: null },
  },
  { timestamps: true },
); // Adds createdAt, updatedAt automatically
const user = mongoose.model("User", userSchema);
module.exports = user;
