import College from '../models/college.model.js';
import User from '../models/user.model.js';
import Invitation from '../models/invitation.model.js';
import Mess from '../models/mess.model.js';
import Complaint from '../models/complaint.model.js';
import Feedback from '../models/feedback.model.js';
import Notice from '../models/notice.model.js';
import Staff from '../models/staff.model.js';
import TimeTable from '../models/timeTable.model.js';
import { z } from 'zod';
import crypto from 'crypto';
import { sendEmail } from '../utils/sendEmail.js';

const createCollegeSchema = z.object({
    name: z.string().trim().min(2, 'College name is required'),

    allowedDomains: z
        .array(
            z.string()
                .trim()
                .min(1, 'Domain cannot be empty')
                .regex(
                    /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    'Invalid domain format'
                )
        )
        .min(1, 'At least one allowed domain is required'),

    contactEmail: z
        .string()
        .email('Invalid email')
        .optional(),

    contactPhone: z
        .string()
        .trim()
        .optional()
});

const updateCollegeStatusSchema = z.object({
    isActive: z.boolean()
});


export const createCollege = async (req, res) => {
    try {
        // 1. Validate request
        const validatedData = createCollegeSchema.parse(req.body);

        // 2. Check duplicate by name
        const collegeExists = await College.findOne({
            name: { $regex: new RegExp(`^${validatedData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });

        if (collegeExists) {
            return res.status(400).json({
                status: 'error',
                message: 'A college with this name already exists'
            });
        }

        // 3. Create
        const college = await College.create(validatedData);

        return res.status(201).json({
            status: 'success',
            data: college
        });

    } catch (error) {

        // Zod validation error
        if (error.name === 'ZodError') {
            return res.status(400).json({
                status: 'error',
                errors: error.errors
            });
        }

        // Duplicate key from MongoDB
        if (error.code === 11000) {
            return res.status(400).json({
                status: 'error',
                message: 'A college with this name already exists'
            });
        }

        console.error(error);

        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
};


export const getColleges = async (req, res) => {
    try {
        const colleges = await College.find().lean();
        const admins = await User.find({ role: 'college_admin' })
            .select('name email role collegeId isActive')
            .lean();

        // Attach assigned admins to each college
        const collegesWithAdmins = colleges.map((college) => {
            const collegeAdmins = admins.filter(
                (admin) => admin.collegeId && admin.collegeId.toString() === college._id.toString()
            );
            return {
                ...college,
                admins: collegeAdmins,
                admin: collegeAdmins[0] || null,
            };
        });

        return res.status(200).json({
            status: 'success',
            data: collegesWithAdmins
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
};


export const updateCollegeStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const { isActive } = updateCollegeStatusSchema.parse(req.body);

        const college = await College.findByIdAndUpdate(
            id,
            { isActive },
            { new: true, runValidators: true }
        );

        if (!college) {
            return res.status(404).json({
                status: 'error',
                message: 'College not found'
            });
        }

        return res.status(200).json({
            status: 'success',
            data: college
        });

    } catch (error) {

        if (error.name === 'ZodError') {
            return res.status(400).json({
                status: 'error',
                errors: error.errors
            });
        }

        console.error(error);

        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
};

export const updateCollege = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Validate request
        const validatedData = createCollegeSchema.parse(req.body);

        // 2. Check duplicate name for other colleges
        const collegeExists = await College.findOne({
            name: { $regex: new RegExp(`^${validatedData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
            _id: { $ne: id }
        });

        if (collegeExists) {
            return res.status(400).json({
                status: 'error',
                message: 'A college with this name already exists'
            });
        }

        // 3. Update
        const college = await College.findByIdAndUpdate(
            id,
            validatedData,
            { new: true, runValidators: true }
        );

        if (!college) {
            return res.status(404).json({
                status: 'error',
                message: 'College not found'
            });
        }

        return res.status(200).json({
            status: 'success',
            data: college
        });

    } catch (error) {
        // Zod validation error
        if (error.name === 'ZodError') {
            return res.status(400).json({
                status: 'error',
                errors: error.errors
            });
        }

        // Duplicate key from MongoDB
        if (error.code === 11000) {
            return res.status(400).json({
                status: 'error',
                message: 'A college with this name already exists'
            });
        }

        console.error(error);

        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
};


export const getAdmins = async (req, res) => {
    try {
        const admins = await User.find({
            role: 'college_admin'
        }).populate('collegeId', 'name').select('-password');

        return res.status(200).json({
            status: 'success',
            data: admins
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
};

const inviteAdminSchema = z.object({
    email: z.string().email('Invalid email address').transform(v => v.toLowerCase()),
    collegeId: z.string().min(1, 'College ID is required')
});

export const inviteAdmin = async (req, res) => {
    try {
        const validated = inviteAdminSchema.parse(req.body);
        
        // 1. Check if user already exists
        const normalizedEmail = validated.email.toLowerCase().trim();
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({ status: 'error', message: 'An account with this email address already exists. Please sign in instead.' });
        }

        // 2. Check if college exists
        const college = await College.findById(validated.collegeId);
        if (!college) {
            return res.status(404).json({ status: 'error', message: 'College not found' });
        }

        // 3. Clear only pending (unaccepted) invitations for this email to preserve accepted audit trail
        await Invitation.deleteMany({ email: validated.email, isAccepted: false });

        // 4. Generate random token
        const token = crypto.randomBytes(32).toString('hex');
        
        // Expiration in 7 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // 5. Save Invitation
        const invitation = await Invitation.create({
            email: validated.email,
            collegeId: validated.collegeId,
            token,
            expiresAt
        });

        // 6. Send Invitation Email
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const inviteLink = `${clientUrl}/accept-invite?token=${token}`;

        await sendEmail({
            email: validated.email,
            subject: 'MessConnect College Admin Invitation',
            message: `You have been invited to manage the MessConnect portal for ${college.name} as a College Admin.

Please complete your registration within 7 days by clicking the link below:
${inviteLink}

If you did not request this invitation, please ignore this email.`
        });

        if (process.env.NODE_ENV !== 'production') {
            console.log(`\n[EMAIL MOCK] Sent invitation link to ${validated.email}:\n${inviteLink}\n`);
        }

        res.status(201).json({
            status: 'success',
            message: 'Invitation sent successfully',
            data: {
                _id: invitation._id,
                email: invitation.email,
                expiresAt: invitation.expiresAt,
                isAccepted: invitation.isAccepted
            }
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ status: 'error', errors: error.errors });
        }
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
    }
};

export const getInvitations = async (req, res) => {
    try {
        const invitations = await Invitation.find()
            .populate('collegeId', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            data: invitations
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Something went wrong' });
    }
};

const assignCollegeAdminSchema = z.object({
    email: z.string().email('Invalid email address').transform(v => v.toLowerCase().trim()),
    name: z.string().trim().optional(),
});

export const assignCollegeAdmin = async (req, res) => {
    try {
        const { id: collegeId } = req.params;
        const { email, name } = assignCollegeAdminSchema.parse(req.body);

        // 1. Check if college exists
        const college = await College.findById(collegeId);
        if (!college) {
            return res.status(404).json({
                status: 'error',
                message: 'College not found'
            });
        }

        // 2. Check if user already exists
        let user = await User.findOne({ email });

        if (user) {
            // Already an admin for this exact college
            if (user.role === 'college_admin' && user.collegeId && user.collegeId.toString() === collegeId) {
                return res.status(200).json({
                    status: 'success',
                    message: `${user.name || user.email} is already the administrator for ${college.name}`,
                    data: { user, isNewUser: false }
                });
            }

            // Promote or reassign user
            user.role = 'college_admin';
            user.collegeId = college._id;
            user.isApprovedByAdmin = true;
            user.isVerified = true;
            if (name && (!user.name || user.name === '')) {
                user.name = name;
            }
            await user.save();

            // Clear pending invitations for this email
            await Invitation.deleteMany({ email, isAccepted: false });

            return res.status(200).json({
                status: 'success',
                message: `Successfully assigned ${user.name || user.email} as administrator for ${college.name}`,
                data: { user, isNewUser: false }
            });
        }

        // 3. User doesn't exist -> generate invitation
        await Invitation.deleteMany({ email, isAccepted: false });
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invitation = await Invitation.create({
            email,
            collegeId: college._id,
            token,
            expiresAt
        });

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        const inviteLink = `${clientUrl}/accept-invite?token=${token}`;

        await sendEmail({
            email,
            subject: 'MessConnect College Admin Invitation',
            message: `You have been invited to manage the MessConnect portal for ${college.name} as a College Admin.\n\nPlease complete your registration within 7 days by clicking the link below:\n${inviteLink}\n\nIf you did not request this invitation, please ignore this email.`
        });

        if (process.env.NODE_ENV !== 'production') {
            console.log(`\n[EMAIL MOCK] Sent invitation link to ${email}:\n${inviteLink}\n`);
        }

        return res.status(201).json({
            status: 'success',
            message: `Invitation email sent to ${email} to register as administrator for ${college.name}`,
            data: { invitation, isNewUser: true, inviteLink }
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ status: 'error', errors: error.errors });
        }
        console.error(error);
        return res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
    }
};

export const revokeAdminRole = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        if (user.role === 'super_admin') {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot revoke super admin role'
            });
        }

        user.role = 'user';
        user.collegeId = null;
        await user.save();

        return res.status(200).json({
            status: 'success',
            message: `Revoked admin role from ${user.name || user.email}`,
            data: user
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
};
export const deleteCollegeAdmin = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        if (user.role !== 'college_admin') {
            return res.status(400).json({
                status: 'error',
                message: 'Only college admin users can be deleted'
            });
        }

        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            status: 'success',
            message: `College admin ${user.name || user.email} deleted successfully`
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
};

export const deleteCollege = async (req, res) => {
    try {
        const { id: collegeId } = req.params;

        const college = await College.findById(collegeId);
        if (!college) {
            return res.status(404).json({
                status: 'error',
                message: 'College not found'
            });
        }

        // Cascade delete all accounts and data associated with this college:
        // 1. All Users belonging to this college (students, faculty, mess committee, vendors, college admins)
        // 2. All Messes
        // 3. All Complaints
        // 4. All Feedback
        // 5. All Notices
        // 6. All Staff
        // 7. All TimeTable entries
        // 8. All Invitations
        // 9. The College itself
        await Promise.all([
            User.deleteMany({ collegeId }),
            Mess.deleteMany({ collegeId }),
            Complaint.deleteMany({ collegeId }),
            Feedback.deleteMany({ collegeId }),
            Notice.deleteMany({ collegeId }),
            Staff.deleteMany({ collegeId }),
            TimeTable.deleteMany({ collegeId }),
            Invitation.deleteMany({ collegeId }),
            College.findByIdAndDelete(collegeId)
        ]);

        return res.status(200).json({
            status: 'success',
            message: `College '${college.name}' and all associated accounts and data have been permanently deleted.`
        });
    } catch (error) {
        console.error('Error deleting college and cascade data:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to delete college and associated data'
        });
    }
};

export const deleteInvitation = async (req, res) => {
    try {
        const { id } = req.params;

        const invitation = await Invitation.findById(id);
        if (!invitation) {
            return res.status(404).json({
                status: 'error',
                message: 'Invitation not found'
            });
        }

        await Invitation.findByIdAndDelete(id);

        return res.status(200).json({
            status: 'success',
            message: `Invitation for ${invitation.email} deleted successfully`
        });
    } catch (error) {
        console.error('Error deleting invitation:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to delete invitation'
        });
    }
};

export const getSuperAdminAnalytics = async (req, res) => {
    try {
        const now = new Date();

        // 1. Execute parallel queries across all relevant models
        const [
            colleges,
            admins,
            totalUsers,
            usersByRoleAgg,
            totalMesses,
            totalNotices,
            totalStaff,
            complaintsByStatusAgg,
            complaintsByCategoryAgg,
            complaintResolutionAgg,
            feedbackCategoryAgg,
            feedbackOverallAgg,
            feedbackByCollegeAgg,
            complaintsByCollegeAgg,
            usersByCollegeAndRoleAgg,
            messesByCollegeAgg,
            totalInvitations,
            acceptedInvitations,
            pendingInvitations,
            expiredInvitations,
            recentInvitations,
            userGrowthAgg,
            [pendingApprovalsCount, lowTrustCount, bannedCount, inactiveCount]
        ] = await Promise.all([
            College.find().select('_id name isActive contactEmail contactPhone createdAt allowedDomains').lean(),
            User.find({ role: 'college_admin' }).select('_id name email collegeId isActive createdAt').lean(),
            User.countDocuments({ role: { $ne: 'super_admin' } }),
            User.aggregate([
                { $match: { role: { $ne: 'super_admin' } } },
                {
                    $group: {
                        _id: '$role',
                        count: { $sum: 1 },
                        active: { $sum: { $cond: ['$isActive', 1, 0] } }
                    }
                }
            ]),
            Mess.countDocuments(),
            Notice.countDocuments(),
            Staff.countDocuments(),
            Complaint.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),
            Complaint.aggregate([
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 }
                    }
                }
            ]),
            Complaint.aggregate([
                {
                    $match: {
                        status: 'resolved',
                        resolvedAt: { $exists: true, $ne: null }
                    }
                },
                {
                    $project: {
                        durationHours: {
                            $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 1000 * 60 * 60]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avgHours: { $avg: '$durationHours' },
                        count: { $sum: 1 }
                    }
                }
            ]),
            Feedback.aggregate([
                { $unwind: '$ratings' },
                {
                    $group: {
                        _id: '$ratings.category',
                        avgRating: { $avg: '$ratings.rating' },
                        count: { $sum: 1 }
                    }
                }
            ]),
            Feedback.aggregate([
                { $unwind: '$ratings' },
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: '$ratings.rating' },
                        totalRatingsCount: { $sum: 1 }
                    }
                }
            ]),
            Feedback.aggregate([
                { $unwind: '$ratings' },
                {
                    $group: {
                        _id: '$collegeId',
                        avgRating: { $avg: '$ratings.rating' },
                        ratingCount: { $sum: 1 }
                    }
                }
            ]),
            Complaint.aggregate([
                {
                    $group: {
                        _id: '$collegeId',
                        total: { $sum: 1 },
                        pending: {
                            $sum: { $cond: [{ $in: ['$status', ['pending', 'assigned']] }, 1, 0] }
                        },
                        resolved: {
                            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
                        },
                        rejected: {
                            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
                        }
                    }
                }
            ]),
            User.aggregate([
                { $match: { collegeId: { $exists: true, $ne: null } } },
                {
                    $group: {
                        _id: { collegeId: '$collegeId', role: '$role' },
                        count: { $sum: 1 }
                    }
                }
            ]),
            Mess.aggregate([
                {
                    $group: {
                        _id: '$collegeId',
                        total: { $sum: 1 },
                        active: { $sum: { $cond: ['$isActive', 1, 0] } }
                    }
                }
            ]),
            Invitation.countDocuments(),
            Invitation.countDocuments({ isAccepted: true }),
            Invitation.countDocuments({ isAccepted: false, expiresAt: { $gte: now } }),
            Invitation.countDocuments({ isAccepted: false, expiresAt: { $lt: now } }),
            Invitation.find()
                .sort({ createdAt: -1 })
                .limit(8)
                .populate('collegeId', 'name')
                .lean(),
            User.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(new Date().setMonth(new Date().getMonth() - 5, 1))
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                            role: '$role'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),
            Promise.all([
                User.countDocuments({ role: { $in: ['vendor', 'mess_committee'] }, isApprovedByAdmin: false }),
                User.countDocuments({ role: { $ne: 'super_admin' }, trustMeter: { $lt: 50 } }),
                User.countDocuments({ bannedUntil: { $gt: now } }),
                User.countDocuments({ role: { $ne: 'super_admin' }, isActive: false })
            ])
        ]);

        // 2. Lookup Maps
        const feedbackMap = {};
        feedbackByCollegeAgg.forEach(f => {
            if (f._id) feedbackMap[f._id.toString()] = f.avgRating;
        });

        const complaintsMap = {};
        complaintsByCollegeAgg.forEach(c => {
            if (c._id) complaintsMap[c._id.toString()] = c;
        });

        const messesMap = {};
        messesByCollegeAgg.forEach(m => {
            if (m._id) messesMap[m._id.toString()] = m;
        });

        const userCountsMap = {};
        usersByCollegeAndRoleAgg.forEach(u => {
            if (u._id && u._id.collegeId) {
                const cId = u._id.collegeId.toString();
                if (!userCountsMap[cId]) userCountsMap[cId] = {};
                userCountsMap[cId][u._id.role] = u.count;
            }
        });

        // 3. College Health Matrix
        const collegeHealth = colleges.map(college => {
            const cId = college._id.toString();
            const collegeAdmins = admins.filter(a => a.collegeId && a.collegeId.toString() === cId);
            const userCounts = userCountsMap[cId] || {};
            const comp = complaintsMap[cId] || { total: 0, pending: 0, resolved: 0, rejected: 0 };
            const messInfo = messesMap[cId] || { total: 0, active: 0 };
            const avgRating = feedbackMap[cId] ? Number(feedbackMap[cId].toFixed(1)) : 0;

            const totalStudents = userCounts['user'] || 0;
            const totalVendors = userCounts['vendor'] || 0;
            const totalCommittee = userCounts['mess_committee'] || 0;
            const totalCollegeUsers = totalStudents + totalVendors + totalCommittee;

            // Health Score calculation (0 - 100)
            let score = 0;
            if (college.isActive) score += 15;
            if (collegeAdmins.length > 0) score += 25;
            if (totalCollegeUsers > 0) score += 15;
            if (messInfo.active > 0) score += 15;
            // Resolution rate
            if (comp.total > 0) {
                score += Math.round((comp.resolved / comp.total) * 20);
            } else {
                score += 20; // No complaints is good
            }
            // Feedback score
            if (avgRating > 0) {
                score += Math.round((avgRating / 5) * 10);
            } else {
                score += 5;
            }

            return {
                id: college._id,
                name: college.name,
                isActive: college.isActive,
                createdAt: college.createdAt,
                allowedDomains: college.allowedDomains || [],
                admins: collegeAdmins,
                hasAdmin: collegeAdmins.length > 0,
                studentCount: totalStudents,
                vendorCount: totalVendors,
                committeeCount: totalCommittee,
                totalUsers: totalCollegeUsers,
                messCount: messInfo.total,
                activeMessCount: messInfo.active,
                totalComplaints: comp.total,
                pendingComplaints: comp.pending,
                resolvedComplaints: comp.resolved,
                avgRating,
                healthScore: Math.min(100, Math.max(0, score))
            };
        });

        // 4. Monthly User Growth Timeline (last 6 months)
        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const userGrowthByMonth = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const y = d.getFullYear();
            const m = d.getMonth() + 1;
            const label = `${monthLabels[m - 1]} ${y}`;

            let students = 0;
            let vendors = 0;
            let committee = 0;
            let collegeAdmins = 0;

            userGrowthAgg.forEach(item => {
                if (item._id.year === y && item._id.month === m) {
                    if (item._id.role === 'user') students += item.count;
                    else if (item._id.role === 'vendor') vendors += item.count;
                    else if (item._id.role === 'mess_committee') committee += item.count;
                    else if (item._id.role === 'college_admin') collegeAdmins += item.count;
                }
            });

            userGrowthByMonth.push({
                month: label,
                students,
                vendors,
                committee,
                admins: collegeAdmins,
                total: students + vendors + committee + collegeAdmins
            });
        }

        // 5. Categorize Role Totals
        const roleCounts = {
            student: 0,
            vendor: 0,
            mess_committee: 0,
            college_admin: 0
        };
        usersByRoleAgg.forEach(r => {
            if (r._id === 'user') roleCounts.student = r.count;
            else if (r._id === 'vendor') roleCounts.vendor = r.count;
            else if (r._id === 'mess_committee') roleCounts.mess_committee = r.count;
            else if (r._id === 'college_admin') roleCounts.college_admin = r.count;
        });

        // 6. Complaint breakdown
        const complaintStatusMap = { pending: 0, assigned: 0, resolved: 0, rejected: 0, vendor_completed: 0 };
        complaintsByStatusAgg.forEach(s => {
            if (s._id) complaintStatusMap[s._id] = s.count;
        });

        const totalComplaints = Object.values(complaintStatusMap).reduce((a, b) => a + b, 0);

        const complaintCategoryMap = {};
        complaintsByCategoryAgg.forEach(c => {
            if (c._id) complaintCategoryMap[c._id] = c.count;
        });

        const avgResolutionHours = complaintResolutionAgg[0]?.avgHours
            ? Number(complaintResolutionAgg[0].avgHours.toFixed(1))
            : null;

        // 7. Feedback Breakdown
        const feedbackRatingsByCategory = feedbackCategoryAgg.map(f => ({
            category: f._id,
            avgRating: Number(f.avgRating.toFixed(1)),
            count: f.count
        }));

        const platformOverallRating = feedbackOverallAgg[0]?.avgRating
            ? Number(feedbackOverallAgg[0].avgRating.toFixed(1))
            : 0;

        // 8. Ranked Colleges
        const topComplainedColleges = [...collegeHealth]
            .filter(c => c.totalComplaints > 0)
            .sort((a, b) => b.totalComplaints - a.totalComplaints)
            .slice(0, 5);

        const topRatedColleges = [...collegeHealth]
            .filter(c => c.avgRating > 0)
            .sort((a, b) => b.avgRating - a.avgRating)
            .slice(0, 5);

        // 9. Invitation Analytics
        const acceptanceRate = totalInvitations > 0
            ? Math.round((acceptedInvitations / totalInvitations) * 100)
            : 0;

        return res.status(200).json({
            status: 'success',
            data: {
                summary: {
                    totalColleges: colleges.length,
                    activeColleges: colleges.filter(c => c.isActive).length,
                    totalUsers,
                    roleCounts,
                    totalMesses,
                    totalNotices,
                    totalStaff,
                    totalComplaints,
                    pendingComplaints: complaintStatusMap.pending + complaintStatusMap.assigned,
                    resolvedComplaints: complaintStatusMap.resolved,
                    avgPlatformRating: platformOverallRating,
                    totalInvitations,
                    pendingInvitations,
                    acceptedInvitations,
                    expiredInvitations,
                    invitationAcceptanceRate: acceptanceRate
                },
                collegeHealth,
                userGrowthByMonth,
                complaints: {
                    byStatus: complaintStatusMap,
                    byCategory: complaintCategoryMap,
                    total: totalComplaints,
                    avgResolutionHours,
                    topComplainedColleges
                },
                feedback: {
                    overallRating: platformOverallRating,
                    totalReviews: feedbackOverallAgg[0]?.totalRatingsCount || 0,
                    byCategory: feedbackRatingsByCategory,
                    topRatedColleges
                },
                invitations: {
                    total: totalInvitations,
                    accepted: acceptedInvitations,
                    pending: pendingInvitations,
                    expired: expiredInvitations,
                    acceptanceRate,
                    recent: recentInvitations
                },
                healthSignals: {
                    pendingApprovals: pendingApprovalsCount,
                    lowTrustUsers: lowTrustCount,
                    bannedUsers: bannedCount,
                    inactiveUsers: inactiveCount
                }
            }
        });
    } catch (error) {
        console.error('Error fetching superadmin analytics:', error);
        return res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to fetch analytics'
        });
    }
};

