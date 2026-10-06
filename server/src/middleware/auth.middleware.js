import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/user.model.js';
export const protect = async (req, res, next) => {
    try {
        let token;

        // 1. Check Authorization Header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        } 
        // 2. Fallback: Check Cookies (if header isn't present)
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        // 3. Fallback: Check Query param (used by EventSource SSE connection)
        else if (req.query && req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({ status: 'error', message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded._id).select('-password');

        if (!req.user) {
            return res.status(401).json({ status: 'error', message: 'Not authorized, user not found' });
        }

        // Lazy recovery: If user was banned and the ban duration has expired, restore trust to 20 baseline
        if (req.user.role === 'user' && req.user.trustMeter === 0 && req.user.bannedUntil && new Date() >= new Date(req.user.bannedUntil)) {
            req.user.trustMeter = 20;
            req.user.bannedUntil = null;
            await req.user.save();
        }
        
        // Attach collegeId for tenant isolation:
        // - For super_admin: allow trust-level college switching via 'x-college-id' header or query param.
        // - For other roles: strictly enforce the user's registered collegeId.
        if (req.user.role === 'super_admin') {
            const scopedHeaderId = req.headers['x-college-id'] || req.query.collegeId;
            if (scopedHeaderId && scopedHeaderId !== 'all' && mongoose.Types.ObjectId.isValid(scopedHeaderId)) {
                req.collegeId = new mongoose.Types.ObjectId(scopedHeaderId);
                req.isSuperAdminImpersonating = true;
            } else if (req.user.collegeId) {
                req.collegeId = req.user.collegeId;
            }
        } else if (req.user.collegeId) {
            req.collegeId = req.user.collegeId;
        }

        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ status: 'error', message: 'Not authorized, token failed' });
    }
};

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ status: 'error', message: 'Not authorized' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};
