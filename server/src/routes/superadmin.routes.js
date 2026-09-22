import express from 'express';
import {
    createCollege,
    getColleges,
    updateCollege,
    updateCollegeStatus,
    deleteCollege,
    getAdmins,
    inviteAdmin,
    getInvitations,
    deleteInvitation,
    assignCollegeAdmin,
    revokeAdminRole,
    deleteCollegeAdmin,
    getSuperAdminAnalytics
} from '../controllers/superadmin.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('super_admin'));

router.get('/analytics', getSuperAdminAnalytics);

router.post('/colleges', createCollege);
router.get('/colleges', getColleges);
router.put('/colleges/:id', updateCollege);
router.patch('/colleges/:id/status', updateCollegeStatus);
router.delete('/colleges/:id', deleteCollege);
router.post('/colleges/:id/assign-admin', assignCollegeAdmin);

router.get('/admins', getAdmins);
router.post('/admins/:userId/revoke', revokeAdminRole);
router.delete('/admins/:userId', deleteCollegeAdmin);
router.post('/admins/invite', inviteAdmin);
router.get('/admins/invitations', getInvitations);
router.delete('/admins/invitations/:id', deleteInvitation);
router.delete('/invitations/:id', deleteInvitation);

export default router;

