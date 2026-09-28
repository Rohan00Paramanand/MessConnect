import express from 'express';
import {
  getMyMealPass,
  purchaseMeals,
  registerFace,
  getEnrolledStudentsForMess,
  markMealAttendance,
  getVendorAttendanceHistory
} from '../controllers/meal.controller.js';
import { protect, authorizeRoles } from '../middleware/auth.middleware.js';

const router = express.Router();

// All meal routes require user authentication
router.use(protect);

// Student endpoints
router.get('/my-pass', authorizeRoles('user', 'student'), getMyMealPass);
router.post('/purchase', authorizeRoles('user', 'student'), purchaseMeals);
router.post('/register-face', authorizeRoles('user', 'student'), registerFace);

// Vendor biometric scanning endpoints
router.get('/vendor/enrolled-students', authorizeRoles('vendor', 'college_admin', 'super_admin'), getEnrolledStudentsForMess);
router.post('/scan-attendance', authorizeRoles('vendor', 'college_admin', 'super_admin'), markMealAttendance);
router.get('/vendor/recent-attendance', authorizeRoles('vendor', 'college_admin', 'super_admin'), getVendorAttendanceHistory);

export default router;
