const mongoose = require("mongoose");

const applicantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Links to User model
      required: true,
    },
    candidateId: {
      type: String,
      unique: true, // SCH20260001
    },
    aadhaarMasked: {
      type: String, // Stores XXXX-XXXX-1234
      required: true,
    },
    aadhaarHash: {
      type: String, // Hashed full aadhaar to detect duplicates
      unique: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
      required: true,
    },
  //   address: {
  //     street: String,
  //     city: String,
  //     state: String,
  //     pincode: String,
  //   },
  //   schoolName: {
  //     type: String,
  //     required: true,
  //   },
  //   className: {
  //     type: String,
  //     required: true,
  //   },
  //   parentName: {
  //     type: String,
  //     required: true,
  //   },
  //   parentMobile: {
  //     type: String,
  //     required: true,
  //   },
  //   annualIncome: {
  //     type: Number,
  //     required: true,
  //   },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Applicant", applicantSchema);
