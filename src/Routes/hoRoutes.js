const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  searchApplications,
  getVisitReport,
  getDisbursementRecords,
  addHONotes,
  triggerTrancheRelease,
  pauseTrancheRelease,
  reassignInspector,
  getAllInspectors,
  getAllSupervisors,
} = require("../Controllers/hoController");
const {
  verifyToken,
  authorizeRoles,
} = require("../Middleware/auth.middleware");

// All routes → HO only
router.get(
  "/dashboard",
  verifyToken,
  authorizeRoles("HO", "SUPERADMIN"),
  getDashboardStats,
);

router.get(
  "/search",
  verifyToken,
  authorizeRoles("HO", "SUPERADMIN"),
  searchApplications,
);

router.get(
  "/:applicationId/visit-report",
  verifyToken,
  authorizeRoles("HO", "SUPERADMIN"),
  getVisitReport,
);

router.get(
  "/:applicationId/disbursements",
  verifyToken,
  authorizeRoles("HO", "SUPERADMIN"),
  getDisbursementRecords,
);

router.patch(
  "/:applicationId/notes",
  verifyToken,
  authorizeRoles("HO"),
  addHONotes,
);

router.patch(
  "/:applicationId/trigger-tranche",
  verifyToken,
  authorizeRoles("HO"),
  triggerTrancheRelease,
);

router.patch(
  "/:applicationId/pause-tranche",
  verifyToken,
  authorizeRoles("HO"),
  pauseTrancheRelease,
);

router.patch(
  "/:applicationId/reassign-inspector",
  verifyToken,
  authorizeRoles("HO"),
  reassignInspector,
);

router.get(
  "/inspectors/list",
  verifyToken,
  authorizeRoles("HO", "SUPERADMIN"),
  getAllInspectors,
);

router.get(
  "/supervisors/list",
  verifyToken,
  authorizeRoles("HO", "SUPERADMIN"),
  getAllSupervisors,
);

module.exports = router;
