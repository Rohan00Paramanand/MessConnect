import express from 'express';
import { submitFeedback, getFeedback } from '../controllers/feedback.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply protect middleware to all feedback routes
router.use(protect);

router.route('/')
    .get(getFeedback)
    .post(authorizeRoles('student'), submitFeedback);



export default router;
