import express from 'express';
import rateLimit from 'express-rate-limit';
import { signup, login, logout, sendOtp, sendResetOtp, getMe, resetPassword, getActiveColleges, getMesses, getInvitationByToken, acceptInvitation } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

import { vendorDocUpload } from '../middleware/upload.middleware.js';

const router = express.Router();

// Rate limiters — prevent brute force on auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { status: 'error', message: 'Too many requests. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // Max 5 requests per email per 10 minutes
    keyGenerator: (req) => {
        // Rate-limit per email address so campus Wi-Fi (shared IP) does not lock all students out
        return req.body && req.body.email ? req.body.email.toLowerCase().trim() : req.ip;
    },
    message: { status: 'error', message: 'Too many OTP requests for this email. Please wait 10 minutes before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
});


// Auth routes
router.post('/signup', authLimiter, vendorDocUpload, signup);
router.post('/login', authLimiter, login);
router.post('/logout', protect, logout);    // protect ensures only authenticated users can logout
router.post('/send-otp', otpLimiter, sendOtp);
router.post('/send-reset-otp', otpLimiter, sendResetOtp);
router.post('/reset-password', authLimiter, resetPassword);
router.get('/me', protect, getMe);

// Public lookup routes
router.get('/colleges', getActiveColleges);
router.get('/messes', getMesses);

// Invitation routes
router.get('/invitation/:token', getInvitationByToken);
router.post('/accept-invitation', acceptInvitation);

export default router;
