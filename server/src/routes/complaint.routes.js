import express from 'express';
import { createComplaint, getComplaints, updateComplaintStatus, markVendorCompleted, upvoteComplaint } from '../controllers/complaint.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

// Apply protect middleware to all complaint routes
router.use(protect);

router.route('/')
    .get(getComplaints)
    .post(authorizeRoles('student'), upload.single('image'), createComplaint);



router.route('/:id/status')
    .patch(authorizeRoles('mess_committee'), updateComplaintStatus);

router.route('/:id/vendor-complete')
    .patch(authorizeRoles('vendor'), markVendorCompleted);



router.route('/:id/upvote')
    .post(authorizeRoles('student'), upvoteComplaint);

export default router;
