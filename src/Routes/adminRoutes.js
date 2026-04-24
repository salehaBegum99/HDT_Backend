const express = require("express");
const router = express.Router();
const {
  createUser,
  deactivateUser,
  getAllUsers,
} = require("../Controllers/adminController");
const {
  verifyToken,
  authorizeRoles,
} = require("../Middleware/auth.middleware");

// All routes here are SuperAdmin only
// verifyToken → checks logged in
// authorizeRoles('SUPERADMIN') → checks role

// Create internal user
router.post(
  "/create-user",
  verifyToken,
  authorizeRoles("SUPERADMIN"),
  createUser,
);

// Deactivate a user
router.patch(
  "/deactivate-user/:userId",
  verifyToken,
  authorizeRoles("SUPERADMIN"),
  deactivateUser,
);

// Get all internal users
router.get("/users", verifyToken, authorizeRoles("SUPERADMIN"), getAllUsers);

module.exports = router;
