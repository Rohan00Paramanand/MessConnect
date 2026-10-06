import User from '../models/user.model.js';
import Staff from '../models/staff.model.js';
import College from '../models/college.model.js';
import Mess from '../models/mess.model.js';
import Complaint from '../models/complaint.model.js';
import Feedback from '../models/feedback.model.js';
import Notice from '../models/notice.model.js';
import TimeTable from '../models/timeTable.model.js';
import MessVisit from '../models/messVisit.model.js';

import { sendEmail } from '../utils/sendEmail.js';
import { registrationRejectedEmailTemplate } from '../utils/emailTemplates.js';


export const getPendingUsers = async (req, res) => {
    try {
        // Only fetch pending users for the college_admin's specific college
        const pendingUsers = await User.find({
            role: { $in: ['vendor', 'mess_committee'] },
            isApprovedByAdmin: false,
            collegeId: req.collegeId
        }).populate('messAssigned', 'name').select('-password');

        res.status(200).json({ status: 'success', data: pendingUsers });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};


export const approveUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the user to get details and verify collegeId
        const user = await User.findOne({ _id: id, collegeId: req.collegeId });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found or does not belong to your college'
            });
        }

        // If approving a vendor, ensure no other vendor is already approved for the same mess in this college
        if (user.role === 'vendor') {
            const existingApprovedVendor = await User.findOne({
                role: 'vendor',
                collegeId: req.collegeId,
                messAssigned: user.messAssigned,
                isApprovedByAdmin: true,
                _id: { $ne: id }
            });

            if (existingApprovedVendor) {
                return res.status(400).json({
                    status: 'error',
                    message: 'A vendor is already approved for this mess.'
                });
            }
        }

        user.isApprovedByAdmin = true;
        user.approvedBy = req.user._id;
        user.approvedAt = new Date();
        await user.save();

        // Retrieve user without password to send back
        const updatedUser = await User.findById(id).select('-password').populate('approvedBy', 'name email');

        res.status(200).json({
            status: 'success',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};


export const denyUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim() === '') {
            return res.status(400).json({
                status: 'error',
                message: 'Rejection reason is required'
            });
        }

        // Find the user to get details (email, name, role) and check if collegeId matches
        const user = await User.findOne({
            _id: id,
            collegeId: req.collegeId
        });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found or does not belong to your college'
            });
        }

        // Send email notification to user
        await sendEmail({
            email: user.email,
            subject: 'MessConnect Registration Rejected',

            // Plain-text fallback
            message: `Dear ${user.name},

We regret to inform you that your registration request for MessConnect has been denied by the college administrator.

Reason for denial:
${reason}

If you have any questions, please reach out to the college admin.

Best regards,
MessConnect Team`,

            // Branded HTML email
            html: registrationRejectedEmailTemplate({
                name: user.name,
                reason
            })
        });

        // Delete the user from the database
        await User.deleteOne({ _id: id });

        res.status(200).json({
            status: 'success',
            message: 'User registration request denied and email sent'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};


export const getPendingStaff = async (req, res) => {
    try {
        const pendingStaff = await Staff.find({
            collegeId: req.collegeId,
            isApprovedByAdmin: false
        })
            .populate('vendor', 'name email companyName')
            .populate('mess', 'name');

        res.status(200).json({
            status: 'success',
            data: pendingStaff
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};


export const approveStaff = async (req, res) => {
    try {
        const { id } = req.params;

        const staff = await Staff.findOne({
            _id: id,
            collegeId: req.collegeId
        });

        if (!staff) {
            return res.status(404).json({
                status: 'error',
                message: 'Staff member not found or does not belong to your college'
            });
        }

        staff.isApprovedByAdmin = true;
        staff.approvedBy = req.user._id;
        staff.approvedAt = new Date();
        await staff.save();

        const updatedStaff = await Staff.findById(id)
            .populate('vendor', 'name email companyName messAssigned')
            .populate('mess', 'name')
            .populate('approvedBy', 'name email');

        res.status(200).json({
            status: 'success',
            data: updatedStaff || staff
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};


export const denyStaff = async (req, res) => {
    try {
        const { id } = req.params;

        const staff = await Staff.findOne({
            _id: id,
            collegeId: req.collegeId
        });

        if (!staff) {
            return res.status(404).json({
                status: 'error',
                message: 'Staff member not found or does not belong to your college'
            });
        }

        await staff.deleteOne();

        res.status(200).json({
            status: 'success',
            message: 'Staff member registration rejected and removed'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

/**
 * GET /api/admin/approved-users
 * Fetch approved vendors and mess committee members for the college
 */
export const getApprovedUsers = async (req, res) => {
    try {
        const query = {
            role: { $in: ['vendor', 'mess_committee'] },
            isApprovedByAdmin: true,
            collegeId: req.collegeId
        };

        if (req.query.role && ['vendor', 'mess_committee'].includes(req.query.role)) {
            query.role = req.query.role;
        }

        if (req.query.mess) {
            query.messAssigned = req.query.mess;
        }

        const users = await User.find(query)
            .populate('messAssigned', 'name')
            .populate('approvedBy', 'name email')
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({ status: 'success', data: users });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * GET /api/admin/approved-staff
 * Fetch all approved staff members for this college
 */
export const getApprovedStaff = async (req, res) => {
    try {
        const query = {
            collegeId: req.collegeId,
            isApprovedByAdmin: true
        };

        if (req.query.mess) {
            query.mess = req.query.mess;
        }

        if (req.query.role && req.query.role !== 'ALL') {
            query.role = req.query.role;
        }

        const staffList = await Staff.find(query)
            .populate('vendor', 'name email companyName messAssigned')
            .populate('mess', 'name')
            .populate('approvedBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ status: 'success', data: staffList });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * PATCH /api/admin/users/:id
 * Edit an approved vendor or committee member
 */
export const updateApprovedUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phoneNumber, companyName, messAssigned, role } = req.body;

        const user = await User.findOne({ _id: id, collegeId: req.collegeId });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found or does not belong to your college'
            });
        }

        // If updating mess for a vendor, ensure no other vendor is already approved for that mess
        if ((role === 'vendor' || user.role === 'vendor') && messAssigned && messAssigned.toString() !== user.messAssigned?.toString()) {
            const existingApprovedVendor = await User.findOne({
                role: 'vendor',
                collegeId: req.collegeId,
                messAssigned,
                isApprovedByAdmin: true,
                _id: { $ne: id }
            });

            if (existingApprovedVendor) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Another vendor is already approved for this mess.'
                });
            }
        }

        if (name) user.name = name.trim();
        if (email) user.email = email.trim().toLowerCase();
        if (phoneNumber) user.phoneNumber = phoneNumber.trim();
        if (companyName !== undefined && (user.role === 'vendor' || role === 'vendor')) {
            user.companyName = companyName.trim();
        }
        if (user.role === 'mess_committee') {
            user.messAssigned = null;
        } else if (messAssigned !== undefined) {
            user.messAssigned = messAssigned || null;
        }

        await user.save();

        const updated = await User.findById(id).populate('messAssigned', 'name').select('-password');
        res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * DELETE /api/admin/users/:id
 * Delete an approved vendor or mess committee member and ALL related data
 */
export const deleteApprovedUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findOne({ _id: id, collegeId: req.collegeId });

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found or does not belong to your college'
            });
        }

        const roleLabel = user.role === 'vendor' ? 'Vendor' : 'Mess committee member';

        // Cascading deletion of all data related to this user
        if (user.role === 'vendor') {
            // 1. Delete all staff registered under this vendor
            await Staff.deleteMany({ vendor: user._id });

            // 2. Delete menu timetables created by this vendor
            await TimeTable.deleteMany({ createdBy: user._id });

            // 3. Delete notices created by this vendor
            await Notice.deleteMany({ author: user._id });

            // 4. Unassign complaints assigned to this vendor
            await Complaint.updateMany(
                { assignedTo: user._id },
                { $unset: { assignedTo: 1 }, status: 'pending' }
            );

            // 5. Clean up meal attendance/pass if models exist
            try {
                const mongoose = (await import('mongoose')).default;
                if (mongoose.models.MealAttendance) {
                    await mongoose.models.MealAttendance.deleteMany({ vendor: user._id });
                }
            } catch {
                // optional model
            }
        } else if (user.role === 'mess_committee') {
            // 1. Delete visits scheduled for this committee member
            await MessVisit.deleteMany({ assignedTo: user._id });

            // 2. Delete notices created by this committee member
            await Notice.deleteMany({ author: user._id });
        }

        // Delete user account
        await User.deleteOne({ _id: user._id });

        res.status(200).json({
            status: 'success',
            message: `${roleLabel} (${user.name}) and all related records deleted successfully`
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * PATCH /api/admin/staff/:id
 * Edit an approved staff member
 */
export const updateApprovedStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, phoneNumber, role, salary, mess } = req.body;

        const staff = await Staff.findOne({ _id: id, collegeId: req.collegeId });
        if (!staff) {
            return res.status(404).json({
                status: 'error',
                message: 'Staff member not found or does not belong to your college'
            });
        }

        if (name) staff.name = name.trim();
        if (phoneNumber) staff.phoneNumber = phoneNumber.trim();
        if (role) staff.role = role;
        if (salary !== undefined) staff.salary = salary ? Number(salary) : undefined;
        if (mess) staff.mess = mess;

        await staff.save();

        const updated = await Staff.findById(id).populate('vendor', 'name email companyName').populate('mess', 'name');
        res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * DELETE /api/admin/staff/:id
 * Delete an approved staff member and their records
 */
export const deleteApprovedStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const staff = await Staff.findOne({ _id: id, collegeId: req.collegeId });

        if (!staff) {
            return res.status(404).json({
                status: 'error',
                message: 'Staff member not found or does not belong to your college'
            });
        }

        await staff.deleteOne();

        res.status(200).json({
            status: 'success',
            message: `Staff member (${staff.name}) and all related records deleted successfully`
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};


export const getCollegeAdminAnalytics = async (req, res) => {
    try {
        const collegeId = req.collegeId;

        if (!collegeId) {
            return res.status(400).json({
                status: 'error',
                message: 'No college associated with your account'
            });
        }

        const now = new Date();

        // Parallel queries scoped strictly to this collegeId
        const [
            college,
            usersByRoleAgg,
            messes,
            vendors,
            pendingUserApprovals,
            pendingStaffApprovals,
            complaintsByStatusAgg,
            complaintsByCategoryAgg,
            complaintsByMessAgg,
            complaintResolutionAgg,
            feedbackOverallAgg,
            feedbackByCategoryAgg,
            feedbackByMessAgg,
            staffByRoleAgg,
            recentComplaints,
            [lowTrustCount, bannedCount, totalNotices]
        ] = await Promise.all([
            College.findById(collegeId)
                .select('name contactEmail contactPhone createdAt allowedDomains')
                .lean(),

            User.aggregate([
                { $match: { collegeId } },
                {
                    $group: {
                        _id: '$role',
                        count: { $sum: 1 },
                        active: {
                            $sum: {
                                $cond: ['$isActive', 1, 0]
                            }
                        }
                    }
                }
            ]),

            Mess.find({ collegeId }).lean(),

            User.find({
                collegeId,
                role: 'vendor'
            })
                .select(
                    'name email companyName messAssigned isApprovedByAdmin isActive'
                )
                .lean(),

            User.countDocuments({
                collegeId,
                role: { $in: ['vendor', 'mess_committee'] },
                isApprovedByAdmin: false
            }),

            Staff.countDocuments({
                collegeId,
                isApprovedByAdmin: false
            }),

            Complaint.aggregate([
                { $match: { collegeId } },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),

            Complaint.aggregate([
                { $match: { collegeId } },
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 }
                    }
                }
            ]),

            Complaint.aggregate([
                { $match: { collegeId } },
                {
                    $group: {
                        _id: '$mess',
                        total: { $sum: 1 },
                        pending: {
                            $sum: {
                                $cond: [
                                    {
                                        $in: [
                                            '$status',
                                            ['pending', 'assigned']
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        resolved: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$status', 'resolved'] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]),

            Complaint.aggregate([
                {
                    $match: {
                        collegeId,
                        status: 'resolved',
                        resolvedAt: {
                            $exists: true,
                            $ne: null
                        }
                    }
                },
                {
                    $project: {
                        durationHours: {
                            $divide: [
                                {
                                    $subtract: [
                                        '$resolvedAt',
                                        '$createdAt'
                                    ]
                                },
                                1000 * 60 * 60
                            ]
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
                { $match: { collegeId } },
                { $unwind: '$ratings' },
                {
                    $group: {
                        _id: null,
                        avgRating: {
                            $avg: '$ratings.rating'
                        },
                        totalCount: {
                            $sum: 1
                        }
                    }
                }
            ]),

            Feedback.aggregate([
                { $match: { collegeId } },
                { $unwind: '$ratings' },
                {
                    $group: {
                        _id: '$ratings.category',
                        avgRating: {
                            $avg: '$ratings.rating'
                        },
                        count: {
                            $sum: 1
                        }
                    }
                }
            ]),

            Feedback.aggregate([
                { $match: { collegeId } },
                { $unwind: '$ratings' },
                {
                    $group: {
                        _id: '$mess',
                        avgRating: {
                            $avg: '$ratings.rating'
                        },
                        reviewCount: {
                            $sum: 1
                        }
                    }
                }
            ]),

            Staff.aggregate([
                { $match: { collegeId } },
                {
                    $group: {
                        _id: '$role',
                        count: { $sum: 1 },
                        approved: {
                            $sum: {
                                $cond: [
                                    '$isApprovedByAdmin',
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]),

            Complaint.find({ collegeId })
                .sort({ createdAt: -1 })
                .limit(6)
                .populate('user_id', 'name email')
                .populate('mess', 'name')
                .select(
                    'title category status createdAt upvotes rejectionReason'
                )
                .lean(),

            Promise.all([
                User.countDocuments({
                    collegeId,
                    role: {
                        $in: ['user', 'student']
                    },
                    trustMeter: {
                        $lt: 50
                    }
                }),

                User.countDocuments({
                    collegeId,
                    bannedUntil: {
                        $gt: now
                    }
                }),

                Notice.countDocuments({
                    collegeId
                })
            ])
        ]);

        // Map roles
        const roleCounts = {
            student: 0,
            vendor: 0,
            mess_committee: 0
        };

        usersByRoleAgg.forEach(r => {
            if (r._id === 'user' || r._id === 'student') {
                roleCounts.student += r.count;
            } else if (r._id === 'vendor') {
                roleCounts.vendor += r.count;
            } else if (r._id === 'mess_committee') {
                roleCounts.mess_committee += r.count;
            }
        });

        // Map complaint status & categories
        const complaintStatusMap = {
            pending: 0,
            assigned: 0,
            resolved: 0,
            rejected: 0
        };

        complaintsByStatusAgg.forEach(s => {
            if (s._id) {
                complaintStatusMap[s._id] = s.count;
            }
        });

        const totalComplaints = Object.values(
            complaintStatusMap
        ).reduce((a, b) => a + b, 0);

        const complaintCategoryMap = {};

        complaintsByCategoryAgg.forEach(c => {
            if (c._id) {
                complaintCategoryMap[c._id] = c.count;
            }
        });

        // Map feedback by mess
        const feedbackMessMap = {};

        feedbackByMessAgg.forEach(f => {
            if (f._id) {
                feedbackMessMap[f._id.toString()] = {
                    avgRating: Number(
                        f.avgRating.toFixed(1)
                    ),
                    reviewCount: f.reviewCount
                };
            }
        });

        // Map complaints by mess
        const complaintsMessMap = {};

        complaintsByMessAgg.forEach(c => {
            if (c._id) {
                complaintsMessMap[c._id.toString()] = c;
            }
        });

        // Mess performance comparison
        const messPerformance = messes.map(m => {
            const mId = m._id.toString();

            const assignedVendor = vendors.find(
                v =>
                    v.messAssigned &&
                    v.messAssigned.toString() === mId
            );

            const fb = feedbackMessMap[mId] || {
                avgRating: 0,
                reviewCount: 0
            };

            const comp = complaintsMessMap[mId] || {
                total: 0,
                pending: 0,
                resolved: 0
            };

            return {
                id: m._id,
                name: m.name,
                isActive: m.isActive,

                vendor: assignedVendor
                    ? {
                        name: assignedVendor.name,
                        email: assignedVendor.email,
                        companyName: assignedVendor.companyName,
                        isApproved:
                            assignedVendor.isApprovedByAdmin
                    }
                    : null,

                avgRating: fb.avgRating,
                reviewCount: fb.reviewCount,
                totalComplaints: comp.total,
                pendingComplaints: comp.pending,
                resolvedComplaints: comp.resolved
            };
        });

        // Staff breakdown
        const staffRoles = {};
        let totalStaff = 0;
        let approvedStaff = 0;

        staffByRoleAgg.forEach(s => {
            if (s._id) {
                staffRoles[s._id] = s.count;
                totalStaff += s.count;
                approvedStaff += s.approved;
            }
        });

        return res.status(200).json({
            status: 'success',
            data: {
                collegeInfo: college,

                kpis: {
                    totalStudents: roleCounts.student,
                    totalVendors: roleCounts.vendor,
                    totalCommittee: roleCounts.mess_committee,
                    totalMesses: messes.length,
                    activeMesses: messes.filter(
                        m => m.isActive
                    ).length,
                    pendingUserApprovals,
                    pendingStaffApprovals,
                    totalComplaints,
                    pendingComplaints:
                        complaintStatusMap.pending +
                        complaintStatusMap.assigned,
                    resolvedComplaints:
                        complaintStatusMap.resolved,
                    avgRating:
                        feedbackOverallAgg[0]?.avgRating
                            ? Number(
                                feedbackOverallAgg[0].avgRating.toFixed(
                                    1
                                )
                            )
                            : 0,
                    totalFeedback:
                        feedbackOverallAgg[0]?.totalCount || 0,
                    totalNotices
                },

                messPerformance,

                complaints: {
                    byStatus: complaintStatusMap,
                    byCategory: complaintCategoryMap,
                    total: totalComplaints,
                    avgResolutionHours:
                        complaintResolutionAgg[0]?.avgHours
                            ? Number(
                                complaintResolutionAgg[0].avgHours.toFixed(
                                    1
                                )
                            )
                            : null,
                    recent: recentComplaints
                },

                feedback: {
                    overall:
                        feedbackOverallAgg[0]?.avgRating
                            ? Number(
                                feedbackOverallAgg[0].avgRating.toFixed(
                                    1
                                )
                            )
                            : 0,

                    totalReviews:
                        feedbackOverallAgg[0]?.totalCount || 0,

                    byCategory:
                        feedbackByCategoryAgg.map(f => ({
                            category: f._id,
                            avgRating: Number(
                                f.avgRating.toFixed(1)
                            ),
                            count: f.count
                        }))
                },

                staff: {
                    total: totalStaff,
                    approved: approvedStaff,
                    pending: pendingStaffApprovals,
                    byRole: staffRoles
                },

                trustSignals: {
                    lowTrustUsers: lowTrustCount,
                    bannedUsers: bannedCount
                }
            }
        });
    } catch (error) {
        console.error(
            'Error fetching college admin analytics:',
            error
        );

        return res.status(500).json({
            status: 'error',
            message:
                error.message ||
                'Failed to fetch college analytics'
        });
    }
};