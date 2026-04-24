const express = require("express");
const router = express.Router();
const {
  submitApplication,
  getMyApplication,
  getAllApplications,
  getSingleApplication,
  updateApplicationStatus,
  assignInspector,
  assignSupervisor,
  flagApplication,
} = require("../Controllers/applicationController");
const {
  verifyToken,
  authorizeRoles,
} = require("../Middleware/auth.middleware");
const { upload } = require('../Config/Cloudinary');
const { uploadDocuments } = require('../Controllers/applicationController');

// Upload documents separately
router.post(
  '/upload-documents',
  verifyToken,
  authorizeRoles('APPLICANT'),
  upload.fields([
    { name: 'photo',        maxCount: 1 },
    { name: 'aadhaarCard',  maxCount: 1 },
    { name: 'marksheet',    maxCount: 1 },
    { name: 'incomeProof',  maxCount: 1 },
    { name: 'bankPassbook', maxCount: 1 },
    { name: 'feeReceipt',   maxCount: 1 },
  ]),
  uploadDocuments
);

// Applicant Routes
router.post(
  "/submit",
  verifyToken,
  authorizeRoles("APPLICANT"),
  submitApplication,
);
router.get(
  "/my-application",
  verifyToken,
  authorizeRoles("APPLICANT"),
  getMyApplication,
);

// HO Routes
router.get(
  "/all",
  verifyToken,
  authorizeRoles("HO", "SUPERADMIN"),
  getAllApplications,
);
router.get(
  "/:applicationId",
  verifyToken,
  authorizeRoles("HO", "INSPECTOR", "SUPERVISOR", "SUPERADMIN"),
  getSingleApplication,
);
router.patch(
  "/:applicationId/status",
  verifyToken,
  authorizeRoles("HO"),
  updateApplicationStatus,
);
router.patch(
  "/:applicationId/assign-inspector",
  verifyToken,
  authorizeRoles("HO"),
  assignInspector,
);
router.patch(
  "/:applicationId/flag",
  verifyToken,
  authorizeRoles("HO"),
  flagApplication,
);
router.patch(
  "/:applicationId/assign-supervisor",
  verifyToken,
  authorizeRoles("HO"),
  assignSupervisor,
);
module.exports = router;
