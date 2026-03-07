import express from 'express';
import { createTimeTable, getTimeTable, updateTimeTable, deleteTimeTable } from '../controllers/timeTable.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply protect middleware to all timetable routes
router.use(protect);

router.route('/')
    .get(getTimeTable)
    .post(authorizeRoles('vendor'), createTimeTable);

router.route('/:id')
    .patch(authorizeRoles('vendor'), updateTimeTable)
    .delete(authorizeRoles('vendor'), deleteTimeTable);

export default router;
