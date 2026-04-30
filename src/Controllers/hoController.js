const { Op, literal } = require('sequelize');
const Application  = require('../Models/Application');
const VisitReport  = require('../Models/InspectorVisitreport');
const Tranche      = require('../Models/Tranche');
const User         = require('../Models/User');

// ─────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const [
      total, submitted, assigned, inspected,
      approved, rejected, disbursed, flagged, unassigned
    ] = await Promise.all([
      Application.count(),
      Application.count({ where: { status: 'SUBMITTED' } }),
      Application.count({ where: { status: 'ASSIGNED' } }),
      Application.count({ where: { status: 'INSPECTED' } }),
      Application.count({ where: { status: 'APPROVED' } }),
      Application.count({ where: { status: 'REJECTED' } }),
      Application.count({ where: { status: 'DISBURSED' } }),
      Application.count({ where: { isFlagged: true } }),
      Application.count({ where: { assignedInspector: null } }),
    ]);

    res.status(200).json({
      total, submitted, assigned, inspected,
      approved, rejected, disbursed, flagged, unassigned,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// SEARCH APPLICATIONS
// ─────────────────────────────────────────
const searchApplications = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // ✅ Search by candidateId using Op.iLike (case insensitive in PostgreSQL)
    const byId = await Application.findAll({
      where: {
        candidateId: { [Op.iLike]: `%${query}%` }
      },
      include: [
        { model: User, as: 'applicant',  attributes: ['name','mobile','email'] },
        { model: User, as: 'inspector',  attributes: ['name','email'] },
        { model: User, as: 'supervisor', attributes: ['name','email'] },
      ],
    });

    // ✅ Search by applicant name
    const matchingUsers = await User.findAll({
      where: {
        name: { [Op.iLike]: `%${query}%` },
        role: 'APPLICANT',
      },
      attributes: ['id'],
    });

    const userIds = matchingUsers.map(u => u.id);

    const byName = userIds.length > 0 ? await Application.findAll({
      where: { applicantId: { [Op.in]: userIds } },
      include: [
        { model: User, as: 'applicant',  attributes: ['name','mobile','email'] },
        { model: User, as: 'inspector',  attributes: ['name','email'] },
        { model: User, as: 'supervisor', attributes: ['name','email'] },
      ],
    }) : [];

    // Combine and deduplicate
    const allResults = [...byId, ...byName];
    const unique = allResults.filter(
      (app, index, self) =>
        index === self.findIndex(a => a.id === app.id)
    );

    res.status(200).json({ total: unique.length, applications: unique });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// VIEW VISIT REPORT
// ─────────────────────────────────────────
const getVisitReport = async (req, res) => {
  try {
    const { applicationId } = req.params;

    // ✅ Sequelize: findOne with where + include
    const report = await VisitReport.findOne({
      where: { applicationId },
      include: [
        { model: User, as: 'inspector', attributes: ['name','email','mobile'] }
      ],
    });

    if (!report) {
      return res.status(404).json({ message: 'No visit report found' });
    }

    res.status(200).json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// VIEW DISBURSEMENT RECORDS
// ─────────────────────────────────────────
const getDisbursementRecords = async (req, res) => {
  try {
    const { applicationId } = req.params;

    // ✅ Sequelize: findAll with where + include + order
    const tranches = await Tranche.findAll({
      where: { applicationId },
      include: [
        { model: User, as: 'supervisor', attributes: ['name','email'] }
      ],
      order: [['trancheNumber', 'ASC']],
    });

    const totalDisbursed = tranches.reduce(
      (sum, t) => sum + parseFloat(t.amount || 0), 0
    );

    res.status(200).json({
      totalDisbursed,
      totalTranches: tranches.length,
      tranches,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// ADD HO NOTES
// ─────────────────────────────────────────
const addHONotes = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { notes } = req.body;

    if (!notes) {
      return res.status(400).json({ message: 'Notes cannot be empty' });
    }

    // ✅ Sequelize: findByPk
    const application = await Application.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // ✅ Sequelize: update()
    await application.update({ hoNotes: notes });

    res.status(200).json({ message: 'HO notes added successfully ✅', notes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
        message: 'Total tranches and approved amount are required',
      });
    }

    const application = await Application.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Application must be approved first' });
    }

    // ✅ Sequelize: update()
    await application.update({ totalTranches, approvedAmount });

    res.status(200).json({
      message: 'Tranche release triggered ✅',
      totalTranches,
      approvedAmount,
      amountPerTranche: approvedAmount / totalTranches,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// PAUSE TRANCHE RELEASE
// ─────────────────────────────────────────
const pauseTrancheRelease = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    // ✅ Sequelize: update with where
    await Tranche.update(
      { status: 'ON_HOLD', comments: `Paused by HO: ${reason}` },
      { where: { applicationId, status: 'PENDING' } }
    );

    const application = await Application.findByPk(applicationId);
    if (application) {
      await application.update({ hoNotes: `Tranche paused: ${reason}` });
    }

    res.status(200).json({ message: 'Tranche release paused ✅', reason });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// REASSIGN INSPECTOR
// ─────────────────────────────────────────
const reassignInspector = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { inspectorId } = req.body;

    const application = await Application.findByPk(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const previousInspector = application.assignedInspector;

    // ✅ Sequelize: update()
    await application.update({
      assignedInspector: inspectorId,
      status: 'ASSIGNED',
    });

    res.status(200).json({
      message: 'Inspector reassigned successfully ✅',
      previousInspector,
      newInspector: inspectorId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// GET ALL INSPECTORS
// ─────────────────────────────────────────
const getAllInspectors = async (req, res) => {
  try {
    // ✅ Sequelize: findAll with where + attributes
    const inspectors = await User.findAll({
      where: { role: 'INSPECTOR', isActive: true },
      attributes: ['id', 'name', 'email', 'assignedArea'],
    });

    res.status(200).json({ total: inspectors.length, inspectors });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// GET ALL SUPERVISORS
// ─────────────────────────────────────────
const getAllSupervisors = async (req, res) => {
  try {
    // ✅ Sequelize: findAll with where + attributes
    const supervisors = await User.findAll({
      where: { role: 'SUPERVISOR', isActive: true },
      attributes: ['id', 'name', 'email', 'sponsorOrg'],
    });

    res.status(200).json({ total: supervisors.length, supervisors });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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