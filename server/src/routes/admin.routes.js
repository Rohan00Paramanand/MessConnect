import express from 'express';
import { getPendingUsers, approveUser, denyUser } from '../controllers/admin.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('college_admin'));

router.get('/pending-users', getPendingUsers);
router.patch('/approve-user/:id', approveUser);
router.post('/deny-user/:id', denyUser);

export default router;
