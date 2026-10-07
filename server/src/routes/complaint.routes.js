import express from 'express';
import { 
    createComplaint, 
    getComplaints, 
    updateComplaintStatus, 
    markVendorCompleted, 
    submitComplaintFeedback,
    upvoteComplaint,
    deleteComplaint,
    extendComplaintSla,
    nudgeVendor
} from '../controllers/complaint.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';

const router = express.Router();

// Apply protect middleware to all complaint routes
router.use(protect);

router.route('/')
    .get(getComplaints)
    .post(authorizeRoles('user'), upload.single('image'), createComplaint);

router.route('/:id')
    .delete(authorizeRoles('user'), deleteComplaint);

router.route('/:id/status')
    .patch(authorizeRoles('mess_committee'), updateComplaintStatus);

router.route('/:id/extend-sla')
    .patch(authorizeRoles('mess_committee', 'college_admin', 'super_admin'), extendComplaintSla);

router.route('/:id/nudge-vendor')
    .post(authorizeRoles('mess_committee', 'college_admin', 'super_admin'), nudgeVendor);

router.route('/:id/vendor-complete')
    .patch(authorizeRoles('vendor'), upload.single('resolutionProof'), markVendorCompleted);

router.route('/:id/feedback')
    .post(authorizeRoles('user'), submitComplaintFeedback);

router.route('/:id/upvote')
    .post(authorizeRoles('user'), upvoteComplaint);

export default router;
