import jwt from 'jsonwebtoken';
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

        if (!token) {
            return res.status(401).json({ status: 'error', message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded._id).select('-password');

        if (!req.user) {
            return res.status(401).json({ status: 'error', message: 'Not authorized, user not found' });
        }

        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ status: 'error', message: 'Not authorized, token failed' });
    }
};

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};
