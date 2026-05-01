const Application = require("../Models/Application");
const VisitReport = require("../Models/InspectorVisitreport");
const createNotification = require('../utils/createNotification');


// ─────────────────────────────────────────
// GET MY ASSIGNED APPLICATIONS
// ─────────────────────────────────────────
const getAssignedApplications = async (req, res) => {
  try {
    const inspectorId = req.user.userId;

    // Filter by pending visits if requested
    const { pendingOnly } = req.query;

    let filter = { assignedInspector: inspectorId };

    // If pendingOnly → show only ASSIGNED (not yet inspected)
    if (pendingOnly === "true") {
      filter.status = "ASSIGNED";
    }

    const applications = await Application.findAll(filter)
      .populate("applicantId", "name mobile email")
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
// SUBMIT VISIT REPORT
// ─────────────────────────────────────────
const submitVisitReport = async (req, res) => {
  try {
    const inspectorId = req.user.userId;
    const { applicationId } = req.params;
    const { visitDate, comments, isVerified, rejectionReason } = req.body;

    // 1. Find application
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // 2. Check this inspector is assigned to this application
    if (application.assignedInspector.toString() !== inspectorId.toString()) {
      return res.status(403).json({
        message: "You are not assigned to this application",
      });
    }

    // 3. Validate required fields
    if (!visitDate || !comments || isVerified === undefined) {
      return res.status(400).json({
        message: "Visit date, comments and verification status are required",
      });
    }

    // 4. If not verified → reason is required
    if (!isVerified && !rejectionReason) {
      return res.status(400).json({
        message: "Please provide reason for not verifying",
      });
    }

    // 5. Create visit report
    const report = await VisitReport.create({
      applicationId,
      inspectorId,
      visitDate,
      comments,
      isVerified,
      rejectionReason: !isVerified ? rejectionReason : null,
    });

    // 6. Update application status to INSPECTED
    application.status = "INSPECTED";
    await application.save();

    res.status(201).json({
      message: "Visit report submitted successfully ✅",
      reportId: report.id,
      isVerified: report.isVerified,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// GET MY VISIT HISTORY
// ─────────────────────────────────────────
const getMyVisitHistory = async (req, res) => {
  try {
    const inspectorId = req.user.userId;

    const reports = await VisitReport.find({ inspectorId })
      .populate("applicationId", "candidateId status")
      .sort({ createdAt: -1 });

    res.status(200).json({
      total: reports.length,
      reports,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// REQUEST MORE DOCUMENTS FROM APPLICANT
// ─────────────────────────────────────────
const requestMoreDocuments = async (req, res) => {
  try {
    const inspectorId = req.user.userId;
    const { applicationId } = req.params;
    const { requiredDocuments, deadline } = req.body;

    // 1. Find application
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // 2. Check this inspector is assigned
    if (application.assignedInspector.toString() !== inspectorId.toString()) {
      return res.status(403).json({
        message: "You are not assigned to this application",
      });
    }

    // 3. Validate
    if (!requiredDocuments || !deadline) {
      return res.status(400).json({
        message: "Required documents list and deadline are required",
      });
    }

    // 4. Save request on application
    application.documentRequest = {
      requiredDocuments, // Array of document names
      deadline,
      requestedBy: inspectorId,
      requestedAt: new Date(),
    };
    await application.save();
await createNotification(
  application.applicantId,
  'Documents Required 📄',
  `Please upload the following documents: ${requiredDocuments.join(', ')}. Deadline: ${deadline}.`,
  'DOCUMENT_REQUESTED',
  '/apply/documents'
);
    res.status(200).json({
      message: "Document request sent to applicant ✅",
      requiredDocuments,
      deadline,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAssignedApplications,
  submitVisitReport,
  getMyVisitHistory,
  requestMoreDocuments,
};
