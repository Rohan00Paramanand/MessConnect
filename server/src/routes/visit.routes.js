import express from 'express';
import {
  getCollegeCommitteeMembers,
  scheduleVisit,
  getCollegeVisits,
  getMyVisits,
  submitVisitReport,
  markVisitDone,
  deleteVisit
} from '../controllers/visit.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';
import { visitSubmissionUpload } from '../middleware/upload.middleware.js';

const router = express.Router();

router.use(protect);

// Mess Committee Member Endpoints
router.get('/my-visits', authorizeRoles('mess_committee'), getMyVisits);
router.post('/submit/:id', authorizeRoles('mess_committee'), visitSubmissionUpload, submitVisitReport);

// College Admin Endpoints (and Super Admin scoped to college)
router.get('/committee-members', authorizeRoles('college_admin', 'super_admin'), getCollegeCommitteeMembers);
router.get('/', authorizeRoles('college_admin', 'super_admin'), getCollegeVisits);
router.post('/schedule', authorizeRoles('college_admin', 'super_admin'), scheduleVisit);
router.patch('/mark-done/:id', authorizeRoles('college_admin', 'super_admin'), markVisitDone);
router.delete('/:id', authorizeRoles('college_admin', 'super_admin'), deleteVisit);

export default router;
