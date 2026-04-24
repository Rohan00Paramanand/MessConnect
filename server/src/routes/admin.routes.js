import express from 'express';
import { getPendingUsers, approveUser } from '../controllers/admin.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect);
router.use(authorizeRoles('admin', 'super_admin'));

router.get('/pending-users', getPendingUsers);
router.patch('/approve-user/:id', approveUser);

export default router;
