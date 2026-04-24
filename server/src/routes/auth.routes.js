import express from 'express';
import { signup, login, logout, sendOtp, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout); 
router.post('/send-otp', sendOtp);
router.get('/me', protect, getMe);

export default router;
