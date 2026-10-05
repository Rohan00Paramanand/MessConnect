import express from 'express';
import { getVendorMonthlyReport } from '../controllers/vendor.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply auth protection to all vendor endpoints
router.use(protect);

// Vendor monthly report (accessible to vendors for their mess, and admins/committee for review)
router.get(
    '/reports/monthly',
    authorizeRoles('vendor', 'college_admin', 'super_admin', 'mess_committee'),
    getVendorMonthlyReport
);

export default router;
