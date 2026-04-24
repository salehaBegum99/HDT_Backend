const express = require("express");
const router = express.Router();
const {
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
} = require("../Controllers/superAdminController");
const {
  verifyToken,
  authorizeRoles,
} = require("../Middleware/auth.middleware");

// All routes → SuperAdmin only
router.get("/users", verifyToken, authorizeRoles("SUPERADMIN"), getAllUsers);

router.get(
  "/users/:userId",
  verifyToken,
  authorizeRoles("SUPERADMIN"),
  getSingleUser,
);

router.patch(
  "/users/:userId/edit",
  verifyToken,
  authorizeRoles("SUPERADMIN"),
  editUser,
);

router.patch(
  "/users/:userId/deactivate",
  verifyToken,
  authorizeRoles("SUPERADMIN"),
  deactivateUser,
);

router.patch(
  "/users/:userId/reactivate",
  verifyToken,
  authorizeRoles("SUPERADMIN"),
  reactivateUser,
);

router.patch(
  "/users/:userId/reset-password",
  verifyToken,
  authorizeRoles("SUPERADMIN"),
  resetUserPassword,
);

router.get("/stats", verifyToken, authorizeRoles("SUPERADMIN"), getSystemStats);

router.get(
  "/settings",
  verifyToken,
  authorizeRoles("SUPERADMIN"),
  getSystemSettings,
);

router.patch(
  "/settings",
  verifyToken,
  authorizeRoles("SUPERADMIN"),
  updateSystemSettings,
);

router.get(
  "/aadhaar/:applicantUserId",
  verifyToken,
  authorizeRoles("SUPERADMIN"),
  viewMaskedAadhaar,
);

module.exports = router;
