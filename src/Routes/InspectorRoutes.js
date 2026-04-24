const express = require("express");
const router = express.Router();
const {
  getAssignedApplications,
  submitVisitReport,
  getMyVisitHistory,
  requestMoreDocuments,
} = require("../Controllers/inspectorController");
const {
  verifyToken,
  authorizeRoles,
} = require("../Middleware/auth.middleware");

// All routes → Inspector only
router.get(
  "/my-applications",
  verifyToken,
  authorizeRoles("INSPECTOR"),
  getAssignedApplications,
);

router.post(
  "/:applicationId/visit-report",
  verifyToken,
  authorizeRoles("INSPECTOR"),
  submitVisitReport,
);

router.get(
  "/visit-history",
  verifyToken,
  authorizeRoles("INSPECTOR"),
  getMyVisitHistory,
);

router.post(
  "/:applicationId/request-documents",
  verifyToken,
  authorizeRoles("INSPECTOR"),
  requestMoreDocuments,
);

module.exports = router;
