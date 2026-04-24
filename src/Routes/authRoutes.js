const express = require("express");
const router = express.Router();
const {
  sendOTP,
  verifyOTP,
  registerApplicant,
  login,
  refreshToken,
  logout,
} = require("../Controllers/auth.controller");
const {
  verifyToken,
  authorizeRoles,
} = require("../Middleware/auth.middleware");

// OTP
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

// Applicant Registration
router.post("/register", registerApplicant);

// Auth
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// Test protected route
router.get("/test-auth", verifyToken, (req, res) => {
  res.json({
    message: `Welcome ${req.user.name}!`,
    role: req.user.role,
    userId: req.user.userId,
  });
});

// Note: role-based admin routes (applications/assign/visit-report/create-user)
// were removed because their handler functions (getApplications, assignInspector,
// submitReport, createUser) are not defined in this repository. Re-add them
// with proper imports when those controllers are implemented.
module.exports = router;
