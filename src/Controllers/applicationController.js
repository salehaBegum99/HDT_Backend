const { Op } = require('sequelize');
const Application = require("../Models/Application");
const Applicant = require("../Models/Applicant");
const User = require("../Models/User");

const generateApplicationId = require('../utils/generateApplicationId');
const createNotification = require('../utils/createNotification');


// ─────────────────────────────────────────
// UPLOAD DOCUMENTS
// ─────────────────────────────────────────
const uploadDocuments = async (req, res) => {
  try {
    const applicantId = req.user.userId;

    const application = await Application.findOne({ where: { applicantId } });

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const files = req.files || {};
    const documents = {
      ...application.documents,
      ...(files.photo && { photo: files.photo[0].path }),
      ...(files.aadhaarCard && { aadhaarCard: files.aadhaarCard[0].path }),
      ...(files.marksheet && { marksheet: files.marksheet[0].path }),
      ...(files.incomeProof && { incomeProof: files.incomeProof[0].path }),
      ...(files.bankPassbook && { bankPassbook: files.bankPassbook[0].path }),
      ...(files.feeReceipt && { feeReceipt: files.feeReceipt[0].path }),
    };

    await application.update({ documents });

    res.json({ message: 'Documents uploaded ✅', documents });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ─────────────────────────────────────────
// SUBMIT APPLICATION
// ─────────────────────────────────────────
const submitApplication = async (req, res) => {
  try {
    const { personal, family, academic, background, reason } = req.body;
    const applicantId = req.user.userId;

    const applicant = await Applicant.findOne({ where: { userId: applicantId } });

    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    const existing = await Application.findOne({ where: { applicantId } });
    if (existing) {
      return res.status(400).json({ message: "Already submitted" });
    }

    const applicationDisplayId = await generateApplicationId(
      Application,
      applicant.candidateId
    );

    const application = await Application.create({
      applicantId,
      candidateId: applicant.candidateId,
      applicationDisplayId,
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
      `Your application ${applicationDisplayId} submitted.`,
      'STATUS_CHANGE',
      '/dashboard'
    );

    res.status(201).json({
      message: "Submitted ✅",
      applicationId: application.id,
      applicationDisplayId
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ─────────────────────────────────────────
// GET MY APPLICATION
// ─────────────────────────────────────────
const getMyApplication = async (req, res) => {
  try {
    const applicantId = req.user.userId;

    const application = await Application.findOne({
  where: { applicantId },
  include: [
    { model: User, as: 'inspector',  attributes: ['name','email','assignedArea'] },
    { model: User, as: 'supervisor', attributes: ['name','email','sponsorOrg'] },
  ]
});

    if (!application) {
      return res.status(404).json({ message: "No application" });
    }

    res.json({ application });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ─────────────────────────────────────────
// GET ALL APPLICATIONS
// ─────────────────────────────────────────
const getAllApplications = async (req, res) => {
  try {
    const { status, assignedInspector, startDate, endDate } = req.query;

    let filter = {};

    if (status) filter.status = status;
    if (assignedInspector) filter.assignedInspector = assignedInspector;

    if (startDate && endDate) {
      filter.createdAt = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      };
    }

    const applications = await Application.findAll({
  where: filter,
  order: [['createdAt', 'DESC']],
  include: [
    { model: User, as: 'applicant',  attributes: ['name','email','mobile'] },
    { model: User, as: 'inspector',  attributes: ['name','email'] },
    { model: User, as: 'supervisor', attributes: ['name','email'] },
  ]
});
    res.json({ total: applications.length, applications });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ─────────────────────────────────────────
// GET SINGLE APPLICATION
// ─────────────────────────────────────────
const getSingleApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

   const application = await Application.findByPk(applicationId, {
  include: [
    { model: User, as: 'applicant',  attributes: ['name','email','mobile'] },
    { model: User, as: 'inspector',  attributes: ['name','email','assignedArea'] },
    { model: User, as: 'supervisor', attributes: ['name','email','sponsorOrg'] },
  ]
});

    if (!application) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ application });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ─────────────────────────────────────────
// UPDATE STATUS
// ─────────────────────────────────────────
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    const application = await Application.findByPk(applicationId);

    if (!application) return res.status(404).json({ message: "Not found" });

    await application.update({ status });

    res.json({ message: "Updated ✅" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ─────────────────────────────────────────
// ASSIGN INSPECTOR
// ─────────────────────────────────────────
const assignInspector = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { inspectorId } = req.body;

    const application = await Application.findByPk(applicationId);

    if (!application) return res.status(404).json({ message: "Not found" });

    await application.update({
      assignedInspector: inspectorId,
      status: "ASSIGNED"
    });

    res.json({ message: "Inspector assigned ✅" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ─────────────────────────────────────────
// FLAG APPLICATION
// ─────────────────────────────────────────
const flagApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findByPk(applicationId);

    if (!application) return res.status(404).json({ message: "Not found" });

    await application.update({
      isFlagged: !application.isFlagged
    });

    res.json({ message: "Flag toggled ✅" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────
// ASSIGN SUPERVISOR
// ─────────────────────────────────────────
const assignSupervisor = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { supervisorId } = req.body;

    const application = await Application.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'APPROVED') {
      return res.status(400).json({
        message: 'Application must be APPROVED before assigning supervisor',
      });
    }

    await application.update({
      assignedSupervisor: supervisorId,
    });

    // Notify applicant
    await createNotification(
      application.applicantId,
      'Supervisor Assigned',
      'A supervisor has been assigned to manage your scholarship disbursement.',
      'STATUS_CHANGE',
      '/dashboard'
    );

    res.json({ message: 'Supervisor assigned ✅' });

  } catch (err) {
    res.status(500).json({ message: err.message });
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
  flagApplication,
  assignSupervisor
};