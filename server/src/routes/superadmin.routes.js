import express from 'express';
import { createCollege, getColleges, updateCollege, updateCollegeStatus, getAdmins, inviteAdmin, getInvitations } from '../controllers/superadmin.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('super_admin'));

router.post('/colleges', createCollege);
router.get('/colleges', getColleges);
router.put('/colleges/:id', updateCollege);
router.patch('/colleges/:id/status', updateCollegeStatus);

router.get('/admins', getAdmins);

router.post('/admins/invite', inviteAdmin);
router.get('/admins/invitations', getInvitations);

export default router;

