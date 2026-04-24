// const userModel = require('../Models/User');
const OTP = require("../Models/OTP");
const User = require("../Models/User");
const Applicant = require("../Models/Applicant");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const generateCandidateId = require("../utils/generateCandidateId");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateTokens");

// ─────────────────────────────────────────
// SEND OTP
// ─────────────────────────────────────────
const sendOTP = async (req, res) => {
  try {
    const { mobile } = req.body;

    // 1. Validate mobile number exists in request
    if (!mobile) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    // 2. Check if mobile is already registered
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: "Mobile already registered" });
    }

    // 3. Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 4. Set expiry to 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // 5. Delete any old OTPs for this mobile (clean up)
    await OTP.deleteMany({ mobile });

    // 6. Save new OTP to DB
    await OTP.create({ mobile, otp, expiresAt });

    // 7. In production → send via SMS service
    // For now → log to console for testing
    console.log(`OTP for ${mobile}: ${otp}`);

    res.status(200).json({
      message: "OTP sent successfully",
      // Remove next line in production!
      otp: otp,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    // 1. Find OTP record for this mobile
    const otpRecord = await OTP.findOne({ mobile });

    // 2. Does OTP exist?
    if (!otpRecord) {
      return res
        .status(400)
        .json({ message: "OTP not found. Request a new one." });
    }

    // 3. Is OTP already used?
    if (otpRecord.isUsed) {
      return res
        .status(400)
        .json({ message: "OTP already used. Request a new one." });
    }

    // 4. Is OTP expired?
    if (otpRecord.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "OTP expired. Request a new one." });
    }

    // 5. Does OTP match?
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // 6. Mark OTP as used
    otpRecord.isUsed = true;
    await otpRecord.save();

    res.status(200).json({
      message: "Mobile verified successfully ✅",
      mobileVerified: true,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// APPLICANT REGISTER
// ─────────────────────────────────────────
const registerApplicant = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      password,
      aadhaar,
      dateOfBirth,
      gender,
      // address,
      // schoolName,
      // className,
      // parentName,
      // parentMobile,
      // annualIncome,
    } = req.body;

    // 1. Check all required fields exist
    if (
      !name ||
      !mobile ||
      !email ||
      !password ||
      !aadhaar ||
      !dateOfBirth ||
      !gender
    ) {
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });
    }

    // 2. Check mobile was OTP verified
    const otpRecord = await OTP.findOne({ mobile });
    if (!otpRecord || !otpRecord.isUsed) {
      return res.status(400).json({
        message: "Mobile not verified. Please verify OTP first.",
      });
    }

    // 3. Check mobile not already registered
    const mobileExists = await User.findOne({ mobile });
    if (mobileExists) {
      return res.status(400).json({ message: "Mobile already registered" });
    }

    // 4. Check email not already registered
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: "Email already registered" });
      }
    }

    // 5. Check Aadhaar not already used
    //    We hash aadhaar to compare without storing raw number
    const aadhaarHash = await bcrypt.hash(aadhaar, 10);
    const existingApplicants = await Applicant.find();
    for (let applicant of existingApplicants) {
      const isDuplicate = await bcrypt.compare(aadhaar, applicant.aadhaarHash);
      if (isDuplicate) {
        return res.status(400).json({ message: "Aadhaar already registered" });
      }
    }

    // 6. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Mask Aadhaar → XXXX-XXXX-1234
    const aadhaarMasked = `XXXX-XXXX-${aadhaar.slice(-4)}`;

    // 8. Create User
    const user = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      role: "APPLICANT",
      isMobileVerified: true,
    });

    // 9. Generate Candidate ID
    const candidateId = await generateCandidateId(User);

    // 10. Create Applicant profile
    await Applicant.create({
      userId: user._id,
      candidateId,
      aadhaarMasked,
      aadhaarHash,
      dateOfBirth,
      gender,
      // address,
      // schoolName,
      // className,
      // parentName,
      // parentMobile,
      // annualIncome,
    });

    res.status(201).json({
      message: "Registration successful! ✅",
      candidateId,
      name: user.name,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// LOGIN (All Roles)
// ─────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { mobile, email, password } = req.body;

    // 1. Must provide mobile or email
    if (!password && (!mobile || !email)) {
      return res.status(400).json({
        message: "Please provide mobile or email and password",
      });
    }

    // 2. Find user by mobile or email
    const user = await User.findOne(mobile ? { mobile } : { email });

    // 3. Does user exist?
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 4. Is account active?
    if (!user.isActive) {
      return res.status(403).json({
        message: "Account deactivated. Contact admin.",
      });
    }

    // 5. Check password matches
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // 6. Generate tokens
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    // 7. Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    // 8. Return response
    res.status(200).json({
      message: "Login successful ✅",
      role: user.role,
      name: user.name,
      accessToken, // Frontend stores this in memory
      refreshToken, // Frontend stores this in localStorage
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // 1. Refresh token must exist
    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    // 2. Verify refresh token is valid
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // 3. Find user and check token matches what we stored
    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // 4. Generate new access token
    const newAccessToken = generateAccessToken(user._id, user.role);

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

// ─────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // 1. Find user with this refresh token
    const user = await User.findOne({ refreshToken });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Delete refresh token from DB
    //    This is what truly "kills" the session
    user.refreshToken = null;
    await user.save();

    res.status(200).json({ message: "Logged out successfully ✅" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
module.exports = {
  sendOTP,
  verifyOTP,
  registerApplicant,
  login,
  refreshToken,
  logout,
};
