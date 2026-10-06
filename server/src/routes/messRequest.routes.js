import express from 'express';
import {
  createMessRequest,
  getMessRequests,
  updateMessRequestStatus,
  deleteMessRequest
} from '../controllers/messRequest.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router
  .route('/')
  .post(authorizeRoles('vendor'), upload.single('image'), createMessRequest)
  .get(authorizeRoles('vendor', 'college_admin', 'mess_committee', 'super_admin'), getMessRequests);

router
  .route('/:id/status')
  .patch(authorizeRoles('college_admin', 'super_admin'), updateMessRequestStatus);

router
  .route('/:id')
  .delete(authorizeRoles('vendor', 'super_admin'), deleteMessRequest);

export default router;
