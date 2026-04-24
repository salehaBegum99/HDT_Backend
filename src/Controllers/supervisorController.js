const Application = require("../Models/Application");
const VisitReport = require("../Models/InspectorVisitreport");
const Tranche = require("../Models/Tranche");
const User = require("../Models/User");
const createNotification = require('../utils/createNotification');
// ─────────────────────────────────────────
// GET MY ASSIGNED APPLICATIONS
// ─────────────────────────────────────────
const getAssignedApplications = async (req, res) => {
  try {
    const supervisorId = req.user.userId;

    const applications = await Application.find({
      assignedSupervisor: supervisorId,
    })
      .populate("applicantId", "name mobile email")
      .populate("assignedInspector", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: applications.length,
      applications,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// VIEW INSPECTOR VISIT REPORT
// ─────────────────────────────────────────
const getVisitReport = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const supervisorId = req.user.userId;

    // Check application is assigned to this supervisor
    const application = await Application.findOne({
      _id: applicationId,
      assignedSupervisor: supervisorId,
    });

    if (!application) {
      return res.status(403).json({
        message: "Application not assigned to you",
      });
    }

    // Get visit report
    const report = await VisitReport.findOne({ applicationId }).populate(
      "inspectorId",
      "name email",
    );

    if (!report) {
      return res.status(404).json({
        message: "No visit report found for this application",
      });
    }

    res.status(200).json({ report });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// DISBURSE TRANCHE
// ─────────────────────────────────────────
const disburseTranche = async (req, res) => {
  try {
    const supervisorId = req.user.userId;
    const { applicationId } = req.params;
    const { amount, disbursedDate, transactionReference, comments } = req.body;

    // 1. Find application
    const application = await Application.findOne({
      _id: applicationId,
      assignedSupervisor: supervisorId,
    });

    if (!application) {
      return res.status(403).json({
        message: "Application not assigned to you",
      });
    }

    // 2. Application must be APPROVED
    if (application.status !== "APPROVED") {
      return res.status(400).json({
        message: "Application must be approved before disbursement",
      });
    }

    // 3. Validate required fields
    if (!amount || !disbursedDate) {
      return res.status(400).json({
        message: "Amount and disbursed date are required",
      });
    }

    // 4. Calculate tranche number
    const trancheNumber = application.currentTranche + 1;

    // 5. Check tranche limit
    if (trancheNumber > application.totalTranches) {
      return res.status(400).json({
        message: `All ${application.totalTranches} tranches already disbursed`,
      });
    }

    // 6. Create tranche record
    const tranche = await Tranche.create({
      applicationId,
      supervisorId,
      trancheNumber,
      amount,
      disbursedDate,
      transactionReference,
      comments,
      status: "DISBURSED",
    });

    // 7. Update application
    application.currentTranche = trancheNumber;

    // If all tranches done → mark as DISBURSED
    if (trancheNumber === application.totalTranches) {
      application.status = "DISBURSED";
    }

    await application.save();
await createNotification(
  application.applicantId,
  'Payment Disbursed 💰',
  `Tranche ${trancheNumber} of ₹${amount} has been disbursed to your account.`,
  'PAYMENT_DISBURSED',
  '/payment-status'
);
    res.status(201).json({
      message: `Tranche ${trancheNumber} disbursed successfully ✅`,
      trancheId: tranche._id,
      trancheNumber,
      amount,
      remainingTranches: application.totalTranches - trancheNumber,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// GET TRANCHE HISTORY
// ─────────────────────────────────────────
const getTrancheHistory = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const supervisorId = req.user.userId;

    // Verify assignment
    const application = await Application.findOne({
      _id: applicationId,
      assignedSupervisor: supervisorId,
    });

    if (!application) {
      return res.status(403).json({
        message: "Application not assigned to you",
      });
    }

    const tranches = await Tranche.find({ applicationId }).sort({
      trancheNumber: 1,
    });

    res.status(200).json({
      totalTranches: application.totalTranches,
      disbursedTranches: application.currentTranche,
      remainingTranches: application.totalTranches - application.currentTranche,
      tranches,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// ADD SUPERVISOR COMMENTS
// ─────────────────────────────────────────
const addComments = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { comments } = req.body;
    const supervisorId = req.user.userId;

    const application = await Application.findOne({
      _id: applicationId,
      assignedSupervisor: supervisorId,
    });

    if (!application) {
      return res.status(403).json({
        message: "Application not assigned to you",
      });
    }

    application.supervisorComments = comments;
    await application.save();

    res.status(200).json({
      message: "Comments added successfully ✅",
      comments,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// REQUEST FOLLOW UP VISIT
// ─────────────────────────────────────────
const requestFollowUpVisit = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const supervisorId = req.user.userId;

    const application = await Application.findOne({
      _id: applicationId,
      assignedSupervisor: supervisorId,
    });

    if (!application) {
      return res.status(403).json({
        message: "Application not assigned to you",
      });
    }

    application.followUpRequested = true;
    await application.save();

    res.status(200).json({
      message: "Follow up visit requested successfully ✅",
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// FLAG PAYMENT ISSUE
// ─────────────────────────────────────────
const flagPaymentIssue = async (req, res) => {
  try {
    const { trancheId } = req.params;
    const { flagReason } = req.body;

    if (!flagReason) {
      return res.status(400).json({
        message: "Flag reason is required",
      });
    }

    const tranche = await Tranche.findById(trancheId);
    if (!tranche) {
      return res.status(404).json({ message: "Tranche not found" });
    }

    tranche.isFlagged = true;
    tranche.flagReason = flagReason;
    await tranche.save();

    res.status(200).json({
      message: "Payment issue flagged for HO attention 🚩",
      flagReason,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// TRANCHES DASHBOARD
// ─────────────────────────────────────────
const getTranchesDashboard = async (req, res) => {
  try {
    const supervisorId = req.user.userId;

    // Get all applications assigned to supervisor
    const applications = await Application.find({
      assignedSupervisor: supervisorId,
    });

    const applicationIds = applications.map((app) => app._id);

    // Get all tranches for these applications
    const tranches = await Tranche.find({
      applicationId: { $in: applicationIds },
    });

    // Calculate stats
    const totalDisbursed = tranches.reduce((sum, t) => sum + t.amount, 0);
    const flaggedTranches = tranches.filter((t) => t.isFlagged).length;

    res.status(200).json({
      totalApplications: applications.length,
      approvedApplications: applications.filter((a) => a.status === "APPROVED")
        .length,
      disbursedApplications: applications.filter(
        (a) => a.status === "DISBURSED",
      ).length,
      totalAmountDisbursed: totalDisbursed,
      totalTranches: tranches.length,
      flaggedTranches,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAssignedApplications,
  getVisitReport,
  disburseTranche,
  getTrancheHistory,
  addComments,
  requestFollowUpVisit,
  flagPaymentIssue,
  getTranchesDashboard,
};
