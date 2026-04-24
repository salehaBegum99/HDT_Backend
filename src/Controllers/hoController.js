const Application = require("../Models/Application");
const VisitReport = require("../Models/InspectorVisitreport");
const Tranche = require("../Models/Tranche");
const User = require("../Models/User");

// ─────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const total = await Application.countDocuments();
    const submitted = await Application.countDocuments({ status: "SUBMITTED" });
    const assigned = await Application.countDocuments({ status: "ASSIGNED" });
    const inspected = await Application.countDocuments({ status: "INSPECTED" });
    const approved = await Application.countDocuments({ status: "APPROVED" });
    const rejected = await Application.countDocuments({ status: "REJECTED" });
    const disbursed = await Application.countDocuments({ status: "DISBURSED" });
    const flagged = await Application.countDocuments({ isFlagged: true });
    const unassigned = await Application.countDocuments({
      assignedInspector: null,
    });

    res.status(200).json({
      total,
      submitted,
      assigned,
      inspected,
      approved,
      rejected,
      disbursed,
      flagged,
      unassigned,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// SEARCH APPLICATIONS
// ─────────────────────────────────────────
const searchApplications = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Search by candidateId or school name
    const applications = await Application.find({
      $or: [
        { candidateId: { $regex: query, $options: "i" } },
        { "academic.schoolName": { $regex: query, $options: "i" } },
      ],
    })
      .populate("applicantId", "name mobile email")
      .populate("assignedInspector", "name email")
      .populate("assignedSupervisor", "name email");

    // Also search by applicant name
    const userMatches = await User.find({
      name: { $regex: query, $options: "i" },
      role: "APPLICANT",
    });

    const userIds = userMatches.map((u) => u._id);
    const byApplicantName = await Application.find({
      applicantId: { $in: userIds },
    }).populate("applicantId", "name mobile email");

    // Combine and deduplicate results
    const allResults = [...applications, ...byApplicantName];
    const unique = allResults.filter(
      (app, index, self) =>
        index ===
        self.findIndex((a) => a._id.toString() === app._id.toString()),
    );

    res.status(200).json({
      total: unique.length,
      applications: unique,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// VIEW VISIT REPORT
// ─────────────────────────────────────────
const getVisitReport = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const report = await VisitReport.findOne({ applicationId }).populate(
      "inspectorId",
      "name email mobile",
    );

    if (!report) {
      return res.status(404).json({
        message: "No visit report found",
      });
    }

    res.status(200).json({ report });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// VIEW DISBURSEMENT RECORDS
// ─────────────────────────────────────────
const getDisbursementRecords = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const tranches = await Tranche.find({ applicationId })
      .populate("supervisorId", "name email")
      .sort({ trancheNumber: 1 });

    const totalDisbursed = tranches.reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      totalDisbursed,
      totalTranches: tranches.length,
      tranches,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// ADD HO INTERNAL NOTES
// ─────────────────────────────────────────
const addHONotes = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({ message: "Notes cannot be empty" });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.hoNotes = notes;
    await application.save();

    res.status(200).json({
      message: "HO notes added successfully ✅",
      notes,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// TRIGGER TRANCHE RELEASE
// ─────────────────────────────────────────
const triggerTrancheRelease = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { totalTranches, approvedAmount } = req.body;

    if (!totalTranches || !approvedAmount) {
      return res.status(400).json({
        message: "Total tranches and approved amount are required",
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status !== "APPROVED") {
      return res.status(400).json({
        message: "Application must be approved first",
      });
    }

    application.totalTranches = totalTranches;
    application.approvedAmount = approvedAmount;
    await application.save();

    res.status(200).json({
      message: `Tranche release triggered ✅`,
      totalTranches,
      approvedAmount,
      amountPerTranche: approvedAmount / totalTranches,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// PAUSE / STOP TRANCHE RELEASE
// ─────────────────────────────────────────
const pauseTrancheRelease = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Reason is required" });
    }

    // Find all pending tranches and put on hold
    const tranches = await Tranche.updateMany(
      {
        applicationId,
        status: "PENDING",
      },
      {
        $set: {
          status: "ON_HOLD",
          comments: `Paused by HO: ${reason}`,
        },
      },
    );

    const application = await Application.findById(applicationId);
    application.hoNotes = `Tranche paused: ${reason}`;
    await application.save();

    res.status(200).json({
      message: "Tranche release paused ✅",
      reason,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// REASSIGN INSPECTOR
// ─────────────────────────────────────────
const reassignInspector = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { inspectorId } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const previousInspector = application.assignedInspector;
    application.assignedInspector = inspectorId;
    application.status = "ASSIGNED";
    await application.save();

    res.status(200).json({
      message: "Inspector reassigned successfully ✅",
      previousInspector,
      newInspector: inspectorId,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// GET ALL INSPECTORS (for dropdown)
// ─────────────────────────────────────────
const getAllInspectors = async (req, res) => {
  try {
    const inspectors = await User.find({
      role: "INSPECTOR",
      isActive: true,
    }).select('name email assignedArea');

    res.status(200).json({
      total: inspectors.length,
      inspectors,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// GET ALL SUPERVISORS (for dropdown)
// ─────────────────────────────────────────
const getAllSupervisors = async (req, res) => {
  try {
    const supervisors = await User.find({
      role: "SUPERVISOR",
      isActive: true,
    }).select('name email sponsorOrg');

    res.status(200).json({
      total: supervisors.length,
      supervisors,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  searchApplications,
  getVisitReport,
  getDisbursementRecords,
  addHONotes,
  triggerTrancheRelease,
  pauseTrancheRelease,
  reassignInspector,
  getAllInspectors,
  getAllSupervisors,
};
