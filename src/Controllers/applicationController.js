const Application = require("../Models/Application");
const Applicant = require("../Models/Applicant");
const generateApplicationId = require('../utils/generateApplicationId');
const createNotification = require('../utils/createNotification');
const uploadDocuments = async (req, res) => {
  try {
    console.log('--- uploadDocuments called ---');
    console.log('User:', req.user);
    console.log('Files received:', req.files);
    
    const applicantId = req.user.userId;

    const application = await Application.findOne({ applicantId });
    console.log('Application found:', application?._id);
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found. Submit application first.' });
    }

    const documents = {};
    const files = req.files;

    if (files.photo)        documents.photo        = files.photo[0].path;
    if (files.aadhaarCard)  documents.aadhaarCard  = files.aadhaarCard[0].path;
    if (files.marksheet)    documents.marksheet    = files.marksheet[0].path;
    if (files.incomeProof)  documents.incomeProof  = files.incomeProof[0].path;
    if (files.bankPassbook) documents.bankPassbook = files.bankPassbook[0].path;
    if (files.feeReceipt)   documents.feeReceipt   = files.feeReceipt[0].path;

    console.log('Documents to save:', documents);

    application.documents = { ...application.documents, ...documents };
    await application.save();

    res.status(200).json({
      message: 'Documents uploaded successfully ✅',
      documents: application.documents,
    });
  } catch (error) {
    console.log('ERROR:', error.message); // ← This will show exact error
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// ─────────────────────────────────────────
// SUBMIT APPLICATION (Applicant Only)
// ─────────────────────────────────────────
const submitApplication = async (req, res) => {
  try {
    const { personal, family, academic, background, reason } = req.body;
    const applicantId = req.user.userId;

    const applicantProfile = await Applicant.findOne({ userId: applicantId });
    if (!applicantProfile) {
      return res.status(404).json({ message: "Applicant profile not found" });
    }

    const existingApplication = await Application.findOne({ applicantId });
    if (existingApplication) {
      return res.status(400).json({ message: "You have already submitted an application" });
    }

    if (!personal || !family || !academic || !background || !reason) {
      return res.status(400).json({ message: "All sections are required" });
    }

    // Generate application display ID
    const applicationDisplayId = await generateApplicationId(
      Application,
      applicantProfile.candidateId
    );

    const application = await Application.create({
      applicantId,
      candidateId: applicantProfile.candidateId,
      applicationDisplayId, // ← Add this
      personal,
      family,
      academic,
      background,
      reason,
      status: "SUBMITTED",
    });
    await createNotification(
  applicantId,
  'Application Submitted ✅',
  `Your application ${applicationDisplayId} has been submitted successfully. We will review it shortly.`,
  'STATUS_CHANGE',
  '/dashboard'
);

    res.status(201).json({
      message: "Application submitted successfully ✅",
      applicationId: application._id,
      applicationDisplayId: application.applicationDisplayId, // ← Return this
      candidateId: application.candidateId,
      status: application.status,
    });
    
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
  
};


// ─────────────────────────────────────────
// GET MY APPLICATION (Applicant Only)
// ─────────────────────────────────────────
const getMyApplication = async (req, res) => {
  try {
    const applicantId = req.user.userId;

    const application = await Application.findOne({ applicantId })
      .populate("assignedInspector", "name email") // Get inspector name
      .populate("assignedSupervisor", "name email"); // Get supervisor name

    if (!application) {
      return res.status(404).json({ message: "No application found" });
    }

    res.status(200).json({ application });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// GET ALL APPLICATIONS (HO Only)
// ─────────────────────────────────────────
const getAllApplications = async (req, res) => {
  try {
    const { status, city, assignedInspector, startDate, endDate } = req.query;

    // Build filter dynamically
    let filter = {};

    if (status) filter.status = status;
    if (assignedInspector) filter.assignedInspector = assignedInspector;
    if (startDate && endDate) {
      filter.submittedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const applications = await Application.find(filter)
      .populate("applicantId", "name mobile email")
      .populate("assignedInspector", "name email")
      .populate("assignedSupervisor", "name email")
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      total: applications.length,
      applications,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// GET SINGLE APPLICATION
// ─────────────────────────────────────────
const getSingleApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate("applicantId", "name mobile email")
      .populate('assignedInspector',  'name email assignedArea') // ← assignedArea
  .populate('assignedSupervisor', 'name email sponsorOrg');  // ← sponsorOrg

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.status(200).json({ application });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// UPDATE APPLICATION STATUS (HO Only)
// ─────────────────────────────────────────
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, rejectionReason, hoNotes } = req.body;

    const validStatuses = ["APPROVED", "REJECTED", "ASSIGNED", "INSPECTED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Rejection must have a reason
    if (status === "REJECTED" && !rejectionReason) {
      return res.status(400).json({
        message: "Rejection reason is required",
      });
    }

    application.status = status;
    if (rejectionReason) application.rejectionReason = rejectionReason;
    if (hoNotes) application.hoNotes = hoNotes;
    await application.save();
const messages = {
  APPROVED: { title: 'Application Approved 🎉', msg: 'Congratulations! Your scholarship application has been approved.' },
  REJECTED: { title: 'Application Update', msg: `Your application was not approved. Reason: ${rejectionReason || 'See dashboard for details.'}` },
  ASSIGNED: { title: 'Application Assigned', msg: 'Your application has been assigned for review.' },
  INSPECTED: { title: 'Verification Complete ✅', msg: 'Your field verification has been completed.' },
};
const notif = messages[status];
if (notif) {
  await createNotification(
    application.applicantId,
    notif.title,
    notif.msg,
    'STATUS_CHANGE',
    '/dashboard'
  );
}
    res.status(200).json({
      message: `Application ${status} successfully ✅`,
      status: application.status,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// ASSIGN INSPECTOR (HO Only)
// ─────────────────────────────────────────
const assignInspector = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { inspectorId } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    application.assignedInspector = inspectorId;
    application.status = "ASSIGNED";
    await application.save();
const app = await Application.findById(applicationId).populate('applicantId');
await createNotification(
  application.applicantId,
  'Inspector Assigned 👤',
  'An inspector has been assigned to verify your application details.',
  'INSPECTOR_ASSIGNED',
  '/dashboard'
);
    res.status(200).json({
      message: "Inspector assigned successfully ✅",
      applicationId,
      assignedInspector: inspectorId,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
  
};


// ─────────────────────────────────────────
// FLAG APPLICATION (HO Only)
// ─────────────────────────────────────────
const flagApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Toggle flag
    application.isFlagged = !application.isFlagged;
    await application.save();

    res.status(200).json({
      message: `Application ${application.isFlagged ? "flagged 🚩" : "unflagged"} successfully`,
      isFlagged: application.isFlagged,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// ASSIGN SUPERVISOR (HO Only)
// ─────────────────────────────────────────
const assignSupervisor = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { supervisorId } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Application must be approved before assigning supervisor
    if (application.status !== "APPROVED") {
      return res.status(400).json({
        message: "Application must be approved before assigning supervisor",
      });
    }

    application.assignedSupervisor = supervisorId;
    await application.save();

    res.status(200).json({
      message: "Supervisor assigned successfully ✅",
      applicationId,
      assignedSupervisor: supervisorId,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
module.exports = {
  submitApplication,
  uploadDocuments,
  getMyApplication,
  getAllApplications,
  getSingleApplication,
  updateApplicationStatus,
  assignInspector,
  assignSupervisor,
  flagApplication,
};
