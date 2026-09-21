import express from 'express';
import { createMess, getMesses, getAdminMesses, updateMess } from '../controllers/mess.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply auth protection to all mess endpoints
router.use(protect);

// Read-only endpoint for logged-in students/vendors/committees to get active messes
router.get('/', getMesses);

// Administrative endpoints for college admins to manage messes
router.get('/admin', authorizeRoles('college_admin'), getAdminMesses);
router.post('/admin', authorizeRoles('college_admin'), createMess);
router.put('/admin/:id', authorizeRoles('college_admin'), updateMess);

export default router;
