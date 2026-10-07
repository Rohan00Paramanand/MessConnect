import express from 'express';
import {
    getPendingUsers,
    approveUser,
    denyUser,
    getPendingStaff,
    approveStaff,
    denyStaff,
    getApprovedUsers,
    getApprovedStaff,
    updateApprovedUser,
    deleteApprovedUser,
    updateApprovedStaff,
    deleteApprovedStaff,
    getCollegeAdminAnalytics
} from '../controllers/admin.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('college_admin', 'super_admin'));

// Ensure a college context is active before querying college admin endpoints
router.use((req, res, next) => {
    if (!req.collegeId) {
        return res.status(400).json({
            status: 'error',
            message: 'Please select a college to view college admin features'
        });
    }
    next();
});

router.get('/analytics', getCollegeAdminAnalytics);

// Pending approvals
router.get('/pending-users', getPendingUsers);
router.patch('/approve-user/:id', approveUser);
router.post('/deny-user/:id', denyUser);

router.get('/pending-staff', getPendingStaff);
router.patch('/approve-staff/:id', approveStaff);
router.delete('/deny-staff/:id', denyStaff);

// Approved Vendors & Mess Committee management (Edit & Delete with cascading data cleanup)
router.get('/approved-users', getApprovedUsers);
router.patch('/users/:id', updateApprovedUser);
router.delete('/users/:id', deleteApprovedUser);

// Approved Staff management (Edit & Delete)
router.get('/approved-staff', getApprovedStaff);
router.patch('/staff/:id', updateApprovedStaff);
router.delete('/staff/:id', deleteApprovedStaff);

export default router;
