const User = require("../Models/User");
const bcrypt = require("bcryptjs");
const sendEmail = require('../utils/sendEmail');
// ─────────────────────────────────────────
// CREATE INTERNAL USER (SuperAdmin Only)
// ─────────────────────────────────────────
const createUser = async (req, res) => {
  try {
    const { name, email, mobile, role,  assignedArea, sponsorOrg  } = req.body;

    // 1. Validate required fields
    if (!name || !email || !mobile || !role) {
      return res.status(400).json({
        message: "Name, email, mobile and role are required",
      });
    }

    // 2. Only these roles can be created by SuperAdmin
    const allowedRoles = ["INSPECTOR", "SUPERVISOR", "HO"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Allowed roles: ${allowedRoles.join(", ")}`,
      });
    }

    // 3. Check email not already used
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 4. Check mobile not already used
    const mobileExists = await User.findOne({ mobile });
    if (mobileExists) {
      return res.status(400).json({ message: "Mobile already registered" });
    }

    // 5. Auto generate temporary password
    // Format: Name@RandomNumbers → Shoeb@4521
    const tempPassword = `${name.split(" ")[0]}@${Math.floor(1000 + Math.random() * 9000)}`;

    // 6. Hash the password
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 7. Create user
    const user = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      role,
     assignedArea: assignedArea || null, 
      sponsorOrg:   sponsorOrg   || null,  
      isFirstLogin: true, 
    });

    // 8. In production → send email/SMS with credentials
    // For now → return in response for testing
   /// console.log(`Credentials for ${name}: ${email} / ${tempPassword}`);
await sendEmail({
  to: email,
  subject: 'Your Scholarship Portal Login Credentials',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
      <h2 style="color: #1d4ed8;">Scholarship Portal</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your account has been created as <strong>${role}</strong>.</p>
      <p>Here are your login credentials:</p>
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px;">
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${tempPassword}</p>
      </div>
      <p style="color: #ef4444;">
        Please login and change your password immediately.
      </p>
      <p>Login here: <a href="http://localhost:3000/login">Click here</a></p>
    </div>
  `
});
    res.status(201).json({
      message: `${role} created successfully ✅`,
      user: {
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        tempPassword, // Remove this in production!
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// DEACTIVATE USER (SuperAdmin Only)
// ─────────────────────────────────────────
const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent SuperAdmin from deactivating themselves
    if (user.role === "SUPERADMIN") {
      return res.status(403).json({
        message: "Cannot deactivate SuperAdmin account",
      });
    }

    user.isActive = false;
    await user.save();

    res.status(200).json({
      message: `${user.name} has been deactivated ✅`,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// GET ALL USERS (SuperAdmin Only)
// ─────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    // Never return passwords!
    const users = await User.find({
      role: { $ne: "APPLICANT" }, // Exclude applicants
    }).select("-password -refreshToken");

    res.status(200).json({
      total: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createUser, deactivateUser, getAllUsers };
