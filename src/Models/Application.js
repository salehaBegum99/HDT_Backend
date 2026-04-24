const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    candidateId: { type: String, required: true },

    status: {
      type: String,
      enum: ["SUBMITTED", "ASSIGNED", "INSPECTED", "APPROVED", "REJECTED", "DISBURSED"],
      default: "SUBMITTED",
    },

    // ── PERSONAL ──────────────────────────
    personal: {
      firstName:        { type: String, required: true },
      lastName:         { type: String, required: true },
      address:          { type: String, required: true },
      cityVillage:      { type: String, required: true },
      pincode:          { type: String, required: true },
      aadhaarNumber:    { type: String, required: true },
    },

    // ── FAMILY ────────────────────────────
    family: {
      fatherName:           { type: String, required: true },
      fatherProfession:     { type: String, required: true },
      motherName:           { type: String, required: true },
      motherProfession:     { type: String, required: true },
      guardianName:         { type: String },           // Optional
      guardianProfession:   { type: String },           // Optional
      guardianStatus:       { type: String, required: true },
      numberOfEarningMembers: { type: Number, required: true },
      isOrphan:             { type: Boolean, required: true },
      isSingleParent:       { type: Boolean, required: true },
    },

    // ── ACADEMIC ──────────────────────────
    academic: {
      educationalLevel:   { type: String, required: true }, // Class 9, Degree etc.
      academicYear:       { type: String, required: true },
      currentGrade:       { type: String, required: true },
      currentGradePercentage: { type: Number, required: true },
    },

    // ── BACKGROUND ────────────────────────
    background: {
      studentDisabilityStatus:  { type: String, required: true },
      parentDisabilityStatus:   { type: String, required: true },
      isFirstGenLearner:        { type: Boolean, required: true },
      isMinorityCommunity:      { type: Boolean, required: true },
      mediumOfInstruction:      { type: String, required: true },
    },

    // ── REASON ────────────────────────────
    reason: {
      reasonForApplying:  { type: String, required: true },
      nextOptionIfNotGiven: { type: String, required: true },
    },

    // ── BANK (for disbursement) ────────────
    // bank: {
    //   accountNumber:      { type: String, required: true },
    //   ifscCode:           { type: String, required: true },
    //   bankName:           { type: String, required: true },
    //   accountHolderName:  { type: String, required: true },
    // },

    // ── DOCUMENTS ─────────────────────────
    documents: {
      photo:        { type: String },
      aadhaarCard:  { type: String },
      marksheet:    { type: String },
      incomeProof:  { type: String },
      bankPassbook: { type: String },
      feeReceipt:   { type: String },
    },

    // ── ASSIGNMENT ────────────────────────
    assignedInspector:  { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    assignedSupervisor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // ── HO ────────────────────────────────
    hoNotes:          { type: String, default: null },
    rejectionReason:  { type: String, default: null },
    isFlagged:        { type: Boolean, default: false },

    // ── SUPERVISOR ────────────────────────
    supervisorComments:   { type: String, default: null },
    approvedAmount:       { type: Number, default: null },
    totalTranches:        { type: Number, default: 1 },
    currentTranche:       { type: Number, default: 0 },
    followUpRequested:    { type: Boolean, default: false },

    // ── INSPECTOR ─────────────────────────
    documentRequest: {
      requiredDocuments: [String],
      deadline: Date,
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      requestedAt: Date,
    },
    applicationDisplayId: {
  type: String,
  unique: true,
},

    submittedAt: { type: Date, default: Date.now },
  },
  
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);