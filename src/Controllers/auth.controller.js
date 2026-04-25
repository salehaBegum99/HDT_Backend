const OTP       = require('../Models/OTP');
const User      = require('../Models/User');
const Applicant = require('../Models/Applicant');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const generateCandidateId  = require('../utils/generateCandidateId');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');

// ─────────────────────────────────────────
// SEND OTP
// ─────────────────────────────────────────
const sendOTP = async (req, res) => {
  console.log('=== SEND OTP HIT ===');
  console.log('Body:', req.body);
  console.log('Mobile:', req.body.mobile);

  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    console.log('Checking if user exists...');
    const existingUser = await User.findOne({ where: { mobile } });
    console.log('Existing user:', existingUser ? 'Found' : 'Not found');

    if (existingUser) {
      return res.status(400).json({ message: 'Mobile already registered' });
    }

    const otp       = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    console.log('Deleting old OTPs...');
    await OTP.destroy({ where: { mobile } });

    console.log('Creating new OTP...');
    await OTP.create({ mobile, otp, expiresAt });

    console.log(`OTP for ${mobile}: ${otp}`);

    res.status(200).json({
      message: 'OTP sent successfully',
      otp,
    });

  } catch (error) {
    console.log('ERROR in sendOTP:', error.message);
    console.log('Stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────
const verifyOTP = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    // ✅ Sequelize: findOne with where
    const otpRecord = await OTP.findOne({ where: { mobile } });

    if (!otpRecord) {
      return res.status(400).json({ message: 'OTP not found. Request a new one.' });
    }

    if (otpRecord.isUsed) {
      return res.status(400).json({ message: 'OTP already used. Request a new one.' });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Request a new one.' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // ✅ Sequelize: update instead of .save()
    await otpRecord.update({ isUsed: true });

    res.status(200).json({
      message: 'Mobile verified successfully ✅',
      mobileVerified: true,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// REGISTER APPLICANT
// ─────────────────────────────────────────
const registerApplicant = async (req, res) => {
  try {
    const { name, email, mobile, password, aadhaar, dateOfBirth, gender } = req.body;

    if (!name || !mobile || !email || !password || !aadhaar || !dateOfBirth || !gender) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    // ✅ Sequelize: findOne with where
    const otpRecord = await OTP.findOne({ where: { mobile } });
    if (!otpRecord || !otpRecord.isUsed) {
      return res.status(400).json({
        message: 'Mobile not verified. Please verify OTP first.',
      });
    }

    const mobileExists = await User.findOne({ where: { mobile } });
    if (mobileExists) {
      return res.status(400).json({ message: 'Mobile already registered' });
    }

    const emailExists = await User.findOne({ where: { email } });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // ✅ Sequelize: findAll instead of find
    const existingApplicants = await Applicant.findAll();
    for (let applicant of existingApplicants) {
      const isDuplicate = await bcrypt.compare(aadhaar, applicant.aadhaarHash);
      if (isDuplicate) {
        return res.status(400).json({ message: 'Aadhaar already registered' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const aadhaarHash    = await bcrypt.hash(aadhaar, 10);
    const aadhaarMasked  = `XXXX-XXXX-${aadhaar.slice(-4)}`;

    const user = await User.create({
      name, email, mobile,
      password: hashedPassword,
      role: 'APPLICANT',
      isMobileVerified: true,
      isFirstLogin: false,
    });

    // ✅ Sequelize: user.id not user._id
    const candidateId = await generateCandidateId(User);

    await Applicant.create({
      userId: user.id,   // ← id not _id
      candidateId,
      aadhaarMasked,
      aadhaarHash,
      dateOfBirth,
      gender,
    });

    res.status(201).json({
      message: 'Registration successful! ✅',
      candidateId,
      name: user.name,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// LOGIN (All Roles)
// ─────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { mobile, email, password } = req.body;

    if (!password || (!mobile && !email)) {
      return res.status(400).json({
        message: 'Please provide mobile or email and password',
      });
    }

    // ✅ Sequelize: findOne with where
    const user = await User.findOne({
      where: mobile ? { mobile } : { email }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated. Contact admin.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // ✅ Sequelize: user.id not user._id
    const accessToken  = generateAccessToken(user.id, user.role, user.name);
    const refreshToken = generateRefreshToken(user.id);

    // ✅ Sequelize: update instead of .save()
    await user.update({ refreshToken });

    res.status(200).json({
      message:      'Login successful ✅',
      role:         user.role,
      name:         user.name,
      isFirstLogin: user.isFirstLogin,
      accessToken,
      refreshToken,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────
const refreshTokenHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // ✅ Sequelize: findByPk (find by primary key) instead of findById
    const user = await User.findByPk(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // ✅ Sequelize: user.id not user._id
    const newAccessToken = generateAccessToken(user.id, user.role, user.name);

    res.status(200).json({ accessToken: newAccessToken });

  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

// ─────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    // ✅ Sequelize: findOne with where
    const user = await User.findOne({ where: { refreshToken } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // ✅ Sequelize: update instead of .save()
    await user.update({ refreshToken: null });

    res.status(200).json({ message: 'Logged out successfully ✅' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ─────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.userId;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters'
      });
    }

    // ✅ Sequelize: findByPk
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // ✅ Sequelize: update
    await user.update({
      password:     hashedPassword,
      isFirstLogin: false,
    });

    res.status(200).json({ message: 'Password changed successfully ✅' });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  registerApplicant,
  login,
  refreshToken: refreshTokenHandler,
  logout,
  changePassword,
};