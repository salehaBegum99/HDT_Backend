const { Op } = require('sequelize');
const User           = require('../Models/User');
const Application    = require('../Models/Application');
const Tranche        = require('../Models/Tranche');
const SystemSettings = require('../Models/SystemSettings');
const Applicant      = require('../Models/Applicant');
const bcrypt         = require('bcryptjs');
const sendEmail      = require('../utils/sendEmail');

// ─────────────────────────────────────────
// GET ALL USERS
// ─────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { role, isActive } = req.query;

    const where = {};
    if (role)     where.role     = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    // ✅ Sequelize: findAll + where + attributes exclude
    const users = await User.findAll({
      where,
      attributes: { exclude: ['password', 'refreshToken'] },
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ total: users.length, users });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// GET SINGLE USER
// ─────────────────────────────────────────
const getSingleUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ Sequelize: findByPk instead of findById
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'refreshToken'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// EDIT USER
// ─────────────────────────────────────────
const editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, mobile } = req.body;

    // ✅ Sequelize: findByPk
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Sequelize: update()
    await user.update({
      ...(name   && { name }),
      ...(email  && { email }),
      ...(mobile && { mobile }),
    });

    res.status(200).json({
      message: 'User updated successfully ✅',
      user: {
        name:   user.name,
        email:  user.email,
        mobile: user.mobile,
        role:   user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// DEACTIVATE USER
// ─────────────────────────────────────────
const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'SUPERADMIN') {
      return res.status(403).json({ message: 'Cannot deactivate SuperAdmin account' });
    }

    // ✅ Sequelize: update()
    await user.update({ isActive: false, refreshToken: null });

    res.status(200).json({ message: `${user.name} deactivated successfully ✅` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// REACTIVATE USER
// ─────────────────────────────────────────
const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Sequelize: update()
    await user.update({ isActive: true });

    // Send email notification
    try {
      await sendEmail({
        to: user.email,
        subject: 'Account Reactivated - HDT Scholarship Portal',
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2 style="color: #1d4ed8;">HDT Scholarship Portal</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Your account has been reactivated. You can now login.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.log('Email error:', emailErr.message);
    }

    res.status(200).json({ message: `${user.name} reactivated successfully ✅` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// RESET USER PASSWORD
// ─────────────────────────────────────────
const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const tempPassword   = `${user.name.split(' ')[0]}@${Math.floor(1000 + Math.random() * 9000)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // ✅ Sequelize: update()
    await user.update({ password: hashedPassword, isFirstLogin: true });

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset - HDT Scholarship Portal',
        html: `
          <div style="font-family: Arial, sans-serif;">
            <h2 style="color: #1d4ed8;">HDT Scholarship Portal</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Your password has been reset by the administrator.</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px;">
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>New Password:</strong> ${tempPassword}</p>
            </div>
            <p style="color: #ef4444;">Please login and change your password immediately.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.log('Email error:', emailErr.message);
    }

    res.status(200).json({
      message: `Password reset successfully ✅ New credentials sent to ${user.email}`,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// SYSTEM WIDE STATS
// ─────────────────────────────────────────
const getSystemStats = async (req, res) => {
  try {
    // ✅ Sequelize: count() with where
    const [
      totalUsers, totalApplicants, totalInspectors,
      totalSupervisors, totalHO, activeUsers, inactiveUsers,
      totalApplications, approvedApplications,
      rejectedApplications, pendingApplications, tranches
    ] = await Promise.all([
      User.count({ where: { role: { [Op.ne]: 'SUPERADMIN' } } }),
      User.count({ where: { role: 'APPLICANT' } }),
      User.count({ where: { role: 'INSPECTOR' } }),
      User.count({ where: { role: 'SUPERVISOR' } }),
      User.count({ where: { role: 'HO' } }),
      User.count({ where: { isActive: true } }),
      User.count({ where: { isActive: false } }),
      Application.count(),
      Application.count({ where: { status: 'APPROVED' } }),
      Application.count({ where: { status: 'REJECTED' } }),
      Application.count({ where: { status: { [Op.in]: ['SUBMITTED','ASSIGNED','INSPECTED'] } } }),
      // ✅ Sequelize: findAll instead of find
      Tranche.findAll({ where: { status: 'DISBURSED' } }),
    ]);

    const totalAmountDisbursed = tranches.reduce(
      (sum, t) => sum + parseFloat(t.amount || 0), 0
    );

    res.status(200).json({
      users: {
        total:       totalUsers,
        applicants:  totalApplicants,
        inspectors:  totalInspectors,
        supervisors: totalSupervisors,
        ho:          totalHO,
        active:      activeUsers,
        inactive:    inactiveUsers,
      },
      applications: {
        total:    totalApplications,
        approved: approvedApplications,
        rejected: rejectedApplications,
        pending:  pendingApplications,
      },
      financial: {
        totalAmountDisbursed,
        totalTranches: tranches.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// GET SYSTEM SETTINGS
// ─────────────────────────────────────────
const getSystemSettings = async (req, res) => {
  try {
    // ✅ Sequelize: findOne with no args
    let settings = await SystemSettings.findOne();

    if (!settings) {
      settings = await SystemSettings.create({});
    }

    res.status(200).json({ settings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// UPDATE SYSTEM SETTINGS
// ─────────────────────────────────────────
const updateSystemSettings = async (req, res) => {
  try {
    const {
      defaultTotalTranches, maxScholarshipAmount,
      minScholarshipAmount, documentRetentionDays, applicationDeadline,
    } = req.body;

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    // ✅ Sequelize: update()
    await settings.update({
      ...(defaultTotalTranches  && { defaultTotalTranches }),
      ...(maxScholarshipAmount  && { maxScholarshipAmount }),
      ...(minScholarshipAmount  && { minScholarshipAmount }),
      ...(documentRetentionDays && { documentRetentionDays }),
      ...(applicationDeadline   && { applicationDeadline }),
      updatedBy: req.user.userId,
    });

    res.status(200).json({
      message: 'Settings updated successfully ✅',
      settings,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// VIEW MASKED AADHAAR
// ─────────────────────────────────────────
const viewMaskedAadhaar = async (req, res) => {
  try {
    const { applicantUserId } = req.params;

    // ✅ Sequelize: findOne with where
    const applicant = await Applicant.findOne({
      where: { userId: applicantUserId }
    });

    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    res.status(200).json({
      candidateId:   applicant.candidateId,
      aadhaarMasked: applicant.aadhaarMasked,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getSingleUser,
  editUser,
  deactivateUser,
  reactivateUser,
  resetUserPassword,
  getSystemStats,
  getSystemSettings,
  updateSystemSettings,
  viewMaskedAadhaar,
};