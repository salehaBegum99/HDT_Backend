const User = require("../Models/User");
const Application = require("../Models/Application");
const Tranche = require("../Models/Tranche");
const SystemSettings = require("../Models/SystemSettings");
const Applicant = require("../Models/Applicant");
const bcrypt = require("bcryptjs");
// const sendEmail = require('../utils/sendEmail');

// ─────────────────────────────────────────
// GET ALL USERS
// ─────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { role, isActive } = req.query;

    let filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const users = await User.find(filter)
  .select('-password -refreshToken')
  .sort({ createdAt: -1 });

    res.status(200).json({
      total: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// GET SINGLE USER
// ─────────────────────────────────────────
const getSingleUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// EDIT USER
// ─────────────────────────────────────────
const editUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, mobile } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update only provided fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;

    await user.save();

    res.status(200).json({
      message: "User updated successfully ✅",
      user: {
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// DEACTIVATE USER
// ─────────────────────────────────────────
const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "SUPERADMIN") {
      return res.status(403).json({
        message: "Cannot deactivate SuperAdmin account",
      });
    }

    user.isActive = false;
    user.refreshToken = null; // Force logout
    await user.save();

    res.status(200).json({
      message: `${user.name} deactivated successfully ✅`,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// REACTIVATE USER
// ─────────────────────────────────────────
const reactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = true;
    await user.save();

    // Send email to notify
    await sendEmail({
      to: user.email,
      subject: "Account Reactivated",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #1d4ed8;">Scholarship Portal</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Your account has been reactivated.</p>
          <p>You can now login to the portal.</p>
        </div>
      `,
    });

    res.status(200).json({
      message: `${user.name} reactivated successfully ✅`,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// RESET USER PASSWORD
// ─────────────────────────────────────────
const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate new temp password
    const tempPassword = `${user.name.split(" ")[0]}@${Math.floor(1000 + Math.random() * 9000)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    user.password = hashedPassword;
    user.isFirstLogin = true; // Force password change
    await user.save();

    // Send new credentials via email
    await sendEmail({
      to: user.email,
      subject: "Password Reset - Scholarship Portal",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #1d4ed8;">Scholarship Portal</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Your password has been reset by the administrator.</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>New Password:</strong> ${tempPassword}</p>
          </div>
          <p style="color: #ef4444;">
            Please login and change your password immediately.
          </p>
        </div>
      `,
    });

    res.status(200).json({
      message: `Password reset successfully ✅ New credentials sent to ${user.email}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// SYSTEM WIDE STATS
// ─────────────────────────────────────────
const getSystemStats = async (req, res) => {
  try {
    // User stats
    const totalUsers = await User.countDocuments({
      role: { $ne: "SUPERADMIN" },
    });
    const totalApplicants = await User.countDocuments({ role: "APPLICANT" });
    const totalInspectors = await User.countDocuments({ role: "INSPECTOR" });
    const totalSupervisors = await User.countDocuments({ role: "SUPERVISOR" });
    const totalHO = await User.countDocuments({ role: "SUPERADMIN" });
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    // Application stats
    const totalApplications = await Application.countDocuments();
    const approvedApplications = await Application.countDocuments({
      status: "APPROVED",
    });
    const rejectedApplications = await Application.countDocuments({
      status: "REJECTED",
    });
    const pendingApplications = await Application.countDocuments({
      status: { $in: ["SUBMITTED", "ASSIGNED", "INSPECTED"] },
    });

    // Financial stats
    const tranches = await Tranche.find({ status: "DISBURSED" });
    const totalAmountDisbursed = tranches.reduce((sum, t) => sum + t.amount, 0);

    res.status(200).json({
      users: {
        total: totalUsers,
        applicants: totalApplicants,
        inspectors: totalInspectors,
        supervisors: totalSupervisors,
        ho: totalHO,
        active: activeUsers,
        inactive: inactiveUsers,
      },
      applications: {
        total: totalApplications,
        approved: approvedApplications,
        rejected: rejectedApplications,
        pending: pendingApplications,
      },
      financial: {
        totalAmountDisbursed,
        totalTranches: tranches.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// GET / UPDATE SYSTEM SETTINGS
// ─────────────────────────────────────────
const getSystemSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();

    // If no settings exist → create default
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    res.status(200).json({ settings });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateSystemSettings = async (req, res) => {
  try {
    const {
      defaultTotalTranches,
      maxScholarshipAmount,
      minScholarshipAmount,
      documentRetentionDays,
      applicationDeadline,
    } = req.body;

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }

    // Update only provided fields
    if (defaultTotalTranches)
      settings.defaultTotalTranches = defaultTotalTranches;
    if (maxScholarshipAmount)
      settings.maxScholarshipAmount = maxScholarshipAmount;
    if (minScholarshipAmount)
      settings.minScholarshipAmount = minScholarshipAmount;
    if (documentRetentionDays)
      settings.documentRetentionDays = documentRetentionDays;
    if (applicationDeadline) settings.applicationDeadline = applicationDeadline;
    settings.updatedBy = req.user.userId;

    await settings.save();

    res.status(200).json({
      message: "System settings updated successfully ✅",
      settings,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// VIEW MASKED AADHAAR
// ─────────────────────────────────────────
const viewMaskedAadhaar = async (req, res) => {
  try {
    const { applicantUserId } = req.params;

    const applicant = await Applicant.findOne({ userId: applicantUserId });
    if (!applicant) {
      return res.status(404).json({ message: "Applicant not found" });
    }

    res.status(200).json({
      candidateId: applicant.candidateId,
      aadhaarMasked: applicant.aadhaarMasked, // XXXX-XXXX-1234
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
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
