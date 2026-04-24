const express = require("express");
const router = express.Router();
const {
  getAssignedApplications,
  getVisitReport,
  disburseTranche,
  getTrancheHistory,
  addComments,
  requestFollowUpVisit,
  flagPaymentIssue,
  getTranchesDashboard,
} = require("../Controllers/supervisorController");
const {
  verifyToken,
  authorizeRoles,
} = require("../Middleware/auth.middleware");

// All routes → Supervisor only
router.get(
  "/my-applications",
  verifyToken,
  authorizeRoles("SUPERVISOR"),
  getAssignedApplications,
);

router.get(
  "/:applicationId/visit-report",
  verifyToken,
  authorizeRoles("SUPERVISOR"),
  getVisitReport,
);

router.post(
  "/:applicationId/disburse",
  verifyToken,
  authorizeRoles("SUPERVISOR"),
  disburseTranche,
);

router.get(
  "/:applicationId/tranches",
  verifyToken,
  authorizeRoles("SUPERVISOR"),
  getTrancheHistory,
);

router.patch(
  "/:applicationId/comments",
  verifyToken,
  authorizeRoles("SUPERVISOR"),
  addComments,
);

router.patch(
  "/:applicationId/follow-up",
  verifyToken,
  authorizeRoles("SUPERVISOR"),
  requestFollowUpVisit,
);

router.patch(
  "/tranche/:trancheId/flag",
  verifyToken,
  authorizeRoles("SUPERVISOR"),
  flagPaymentIssue,
);

router.get(
  "/dashboard",
  verifyToken,
  authorizeRoles("SUPERVISOR"),
  getTranchesDashboard,
);

module.exports = router;
