import mongoose from 'mongoose';
import Complaint from '../models/complaint.model.js';
import Feedback from '../models/feedback.model.js';
import Mess from '../models/mess.model.js';
import MessVisit from '../models/messVisit.model.js';
import User from '../models/user.model.js';

// @desc    Get monthly report and analytics for vendor
// @route   GET /api/vendor/reports/monthly
// @access  Private (Vendor, College Admin, Super Admin)
export const getVendorMonthlyReport = async (req, res) => {
    try {
        const now = new Date();
        const month = Math.min(12, Math.max(1, parseInt(req.query.month, 10) || (now.getMonth() + 1)));
        const year = parseInt(req.query.year, 10) || now.getFullYear();

        // Resolve mess ID
        let messId = null;
        if (req.user.role === 'vendor') {
            messId = req.user.messAssigned?._id || req.user.messAssigned;
            if (!messId || messId === 'None') {
                return res.status(400).json({
                    status: 'error',
                    message: 'No mess facility is assigned to your vendor account.'
                });
            }
        } else if (['college_admin', 'super_admin', 'mess_committee'].includes(req.user.role)) {
            messId = req.query.messId || req.user.messAssigned?._id || req.user.messAssigned;
            if (!messId) {
                // Pick first mess in college if not specified
                const firstMess = await Mess.findOne(req.collegeId ? { collegeId: req.collegeId } : {}).select('_id');
                if (firstMess) {
                    messId = firstMess._id;
                } else {
                    return res.status(404).json({
                        status: 'error',
                        message: 'No mess facility found.'
                    });
                }
            } else if (req.user.role !== 'super_admin') {
                // Strictly verify requested mess belongs to this admin/committee's college
                const messValid = await Mess.findOne({ _id: messId, collegeId: req.collegeId });
                if (!messValid) {
                    return res.status(403).json({
                        status: 'error',
                        message: 'Mess facility does not belong to your college.'
                    });
                }
            }
        } else {
            return res.status(403).json({
                status: 'error',
                message: 'Unauthorized to view vendor reports.'
            });
        }

        const messObjectId = new mongoose.Types.ObjectId(messId.toString());

        // Target Month UTC date range
        const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
        const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

        // Previous Month UTC date range (for MoM comparison)
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevStartDate = new Date(Date.UTC(prevYear, prevMonth - 1, 1, 0, 0, 0, 0));
        const prevEndDate = new Date(Date.UTC(prevYear, prevMonth, 0, 23, 59, 59, 999));

        // Run aggregations in parallel
        const [
            messDoc,
            vendorUser,
            complaintsByStatusAgg,
            complaintsByCategoryAgg,
            turnaroundAgg,
            resolutionFeedbackAgg,
            recentResolutionComments,
            feedbacksInMonth,
            inspectionsInMonth,
            prevMonthComplaintsCount,
            prevMonthResolvedCount,
            prevMonthFeedbacks
        ] = await Promise.all([
            // 1. Mess Details
            Mess.findById(messObjectId).select('name location capacity').lean(),

            // 2. Vendor Account
            User.findOne({
                role: 'vendor',
                messAssigned: messObjectId,
                isActive: true
            }).select('name companyName email phoneNumber').lean(),

            // 3. Complaints Grouped by Status
            Complaint.aggregate([
                {
                    $match: {
                        mess: messObjectId,
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // 4. Complaints Grouped by Category
            Complaint.aggregate([
                {
                    $match: {
                        mess: messObjectId,
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // 5. Turnaround / Resolution Time Aggregation
            Complaint.aggregate([
                {
                    $match: {
                        mess: messObjectId,
                        vendorCompletedAt: { $exists: true, $ne: null },
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $project: {
                        durationHours: {
                            $divide: [
                                { $subtract: ['$vendorCompletedAt', '$createdAt'] },
                                1000 * 60 * 60
                            ]
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        count: { $sum: 1 },
                        avgHours: { $avg: '$durationHours' },
                        minHours: { $min: '$durationHours' },
                        maxHours: { $max: '$durationHours' },
                        under2Hours: {
                            $sum: { $cond: [{ $lte: ['$durationHours', 2] }, 1, 0] }
                        },
                        under12Hours: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $gt: ['$durationHours', 2] },
                                            { $lte: ['$durationHours', 12] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        under24Hours: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            { $gt: ['$durationHours', 12] },
                                            { $lte: ['$durationHours', 24] }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },
                        over24Hours: {
                            $sum: { $cond: [{ $gt: ['$durationHours', 24] }, 1, 0] }
                        }
                    }
                }
            ]),

            // 6. Resolution Feedback Ratings (Satisfied vs Unsatisfied)
            Complaint.aggregate([
                {
                    $match: {
                        mess: messObjectId,
                        'resolutionFeedback.rating': { $in: ['satisfied', 'unsatisfied'] },
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: '$resolutionFeedback.rating',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // 7. Recent Resolution Feedback Comments (anonymized)
            Complaint.find({
                mess: messObjectId,
                'resolutionFeedback.comment': { $exists: true, $ne: '' },
                createdAt: { $gte: startDate, $lte: endDate }
            })
                .select('title category resolutionFeedback createdAt')
                .sort({ 'resolutionFeedback.submittedAt': -1 })
                .limit(6)
                .lean(),

            // 8. Daily Feedbacks in Month
            Feedback.find({
                mess: messObjectId,
                date: { $gte: startDate, $lte: endDate }
            })
                .select('ratings comment date createdAt')
                .lean(),

            // 9. Committee Inspections in Month
            MessVisit.find({
                messId: messObjectId,
                visitDate: { $gte: startDate, $lte: endDate }
            })
                .select('visitDate purpose status submission.remarks submission.submittedAt')
                .sort({ visitDate: -1 })
                .lean(),

            // 10. Previous Month Complaints Count
            Complaint.countDocuments({
                mess: messObjectId,
                createdAt: { $gte: prevStartDate, $lte: prevEndDate }
            }),

            // 11. Previous Month Resolved Count
            Complaint.countDocuments({
                mess: messObjectId,
                status: { $in: ['vendor_completed', 'resolved'] },
                createdAt: { $gte: prevStartDate, $lte: prevEndDate }
            }),

            // 12. Previous Month Feedbacks
            Feedback.find({
                mess: messObjectId,
                date: { $gte: prevStartDate, $lte: prevEndDate }
            })
                .select('ratings')
                .lean()
        ]);

        // Process Complaints Data
        const statusMap = {
            pending: 0,
            assigned: 0,
            vendor_completed: 0,
            resolved: 0,
            rejected: 0
        };
        let totalComplaints = 0;
        complaintsByStatusAgg.forEach((item) => {
            if (statusMap.hasOwnProperty(item._id)) {
                statusMap[item._id] = item.count;
            }
            totalComplaints += item.count;
        });

        const categoryMap = {
            food: 0,
            cleanliness: 0,
            timeliness: 0,
            taste: 0,
            'staff behaviour': 0,
            other: 0
        };
        complaintsByCategoryAgg.forEach((item) => {
            if (categoryMap.hasOwnProperty(item._id)) {
                categoryMap[item._id] = item.count;
            }
        });

        // Resolution summary
        const resolvedCount = statusMap.resolved + statusMap.vendor_completed;
        const resolutionRate = totalComplaints > 0
            ? Math.round((resolvedCount / totalComplaints) * 100)
            : 100;

        // Turnaround statistics
        const turnaround = turnaroundAgg[0] || {
            count: 0,
            avgHours: 0,
            minHours: 0,
            maxHours: 0,
            under2Hours: 0,
            under12Hours: 0,
            under24Hours: 0,
            over24Hours: 0
        };

        const avgResolutionHours = turnaround.count > 0
            ? Number(turnaround.avgHours.toFixed(1))
            : null;

        // Resolution Satisfaction
        let satisfiedCount = 0;
        let unsatisfiedCount = 0;
        resolutionFeedbackAgg.forEach((item) => {
            if (item._id === 'satisfied') satisfiedCount = item.count;
            if (item._id === 'unsatisfied') unsatisfiedCount = item.count;
        });
        const totalResolutionRatings = satisfiedCount + unsatisfiedCount;
        const satisfactionRate = totalResolutionRatings > 0
            ? Math.round((satisfiedCount / totalResolutionRatings) * 100)
            : null;

        // Process Daily Student Feedbacks
        let totalFeedbackScore = 0;
        let totalFeedbackRatingsCount = 0;
        const feedbackCategoryScores = {
            food: { sum: 0, count: 0 },
            cleanliness: { sum: 0, count: 0 },
            timeliness: { sum: 0, count: 0 },
            taste: { sum: 0, count: 0 },
            'staff behaviour': { sum: 0, count: 0 },
            other: { sum: 0, count: 0 }
        };
        const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        const dailyTrendMap = {};
        const feedbackComments = [];

        feedbacksInMonth.forEach((fb) => {
            const dayKey = new Date(fb.date).toISOString().slice(0, 10);
            if (!dailyTrendMap[dayKey]) {
                dailyTrendMap[dayKey] = { date: dayKey, sum: 0, count: 0 };
            }

            if (fb.ratings && Array.isArray(fb.ratings)) {
                fb.ratings.forEach((r) => {
                    if (r.rating) {
                        totalFeedbackScore += r.rating;
                        totalFeedbackRatingsCount += 1;

                        const starBucket = Math.round(r.rating);
                        if (ratingDistribution[starBucket] !== undefined) {
                            ratingDistribution[starBucket] += 1;
                        }

                        if (feedbackCategoryScores[r.category]) {
                            feedbackCategoryScores[r.category].sum += r.rating;
                            feedbackCategoryScores[r.category].count += 1;
                        }

                        dailyTrendMap[dayKey].sum += r.rating;
                        dailyTrendMap[dayKey].count += 1;
                    }
                });
            }

            if (fb.comment && fb.comment.trim() && feedbackComments.length < 8) {
                feedbackComments.push({
                    comment: fb.comment.trim(),
                    date: fb.date
                });
            }
        });

        const overallAvgRating = totalFeedbackRatingsCount > 0
            ? Number((totalFeedbackScore / totalFeedbackRatingsCount).toFixed(1))
            : null;

        const categoryAverages = {};
        Object.keys(feedbackCategoryScores).forEach((cat) => {
            const entry = feedbackCategoryScores[cat];
            categoryAverages[cat] = entry.count > 0
                ? Number((entry.sum / entry.count).toFixed(1))
                : null;
        });

        const dailyTrend = Object.values(dailyTrendMap)
            .map((item) => ({
                date: item.date,
                displayDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                avgRating: item.count > 0 ? Number((item.sum / item.count).toFixed(1)) : null,
                submissions: item.count
            }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Previous Month Comparison calculations
        let prevMonthTotalScore = 0;
        let prevMonthRatingsCount = 0;
        prevMonthFeedbacks.forEach((fb) => {
            if (fb.ratings && Array.isArray(fb.ratings)) {
                fb.ratings.forEach((r) => {
                    if (r.rating) {
                        prevMonthTotalScore += r.rating;
                        prevMonthRatingsCount += 1;
                    }
                });
            }
        });
        const prevMonthAvgRating = prevMonthRatingsCount > 0
            ? Number((prevMonthTotalScore / prevMonthRatingsCount).toFixed(1))
            : null;

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        res.status(200).json({
            status: 'success',
            data: {
                period: {
                    month,
                    monthName: monthNames[month - 1],
                    year,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                },
                mess: {
                    id: messDoc?._id || messId,
                    name: messDoc?.name || 'Mess Facility',
                    location: messDoc?.location || '',
                    capacity: messDoc?.capacity || null
                },
                vendor: {
                    name: vendorUser?.name || 'Assigned Vendor',
                    companyName: vendorUser?.companyName || '',
                    email: vendorUser?.email || '',
                    phoneNumber: vendorUser?.phoneNumber || ''
                },
                summary: {
                    totalComplaints,
                    resolvedCount,
                    pendingCount: statusMap.pending,
                    assignedCount: statusMap.assigned,
                    rejectedCount: statusMap.rejected,
                    resolutionRate,
                    avgResolutionHours,
                    totalFeedbacks: feedbacksInMonth.length,
                    overallAvgRating,
                    satisfactionRate,
                    totalInspections: inspectionsInMonth.length,
                    completedInspections: inspectionsInMonth.filter((i) => i.status === 'COMPLETED').length
                },
                comparison: {
                    prevMonthName: monthNames[prevMonth - 1],
                    prevMonthComplaints: prevMonthComplaintsCount,
                    complaintsChangePercent: prevMonthComplaintsCount > 0
                        ? Math.round(((totalComplaints - prevMonthComplaintsCount) / prevMonthComplaintsCount) * 100)
                        : null,
                    prevMonthResolved: prevMonthResolvedCount,
                    prevMonthAvgRating,
                    ratingDiff: (overallAvgRating !== null && prevMonthAvgRating !== null)
                        ? Number((overallAvgRating - prevMonthAvgRating).toFixed(1))
                        : null
                },
                complaintsByCategory: categoryMap,
                complaintsByStatus: statusMap,
                turnaroundSpeed: {
                    under2Hours: turnaround.under2Hours || 0,
                    under12Hours: turnaround.under12Hours || 0,
                    under24Hours: turnaround.under24Hours || 0,
                    over24Hours: turnaround.over24Hours || 0,
                    minHours: turnaround.count > 0 ? Number(turnaround.minHours.toFixed(1)) : null,
                    maxHours: turnaround.count > 0 ? Number(turnaround.maxHours.toFixed(1)) : null
                },
                resolutionFeedback: {
                    satisfied: satisfiedCount,
                    unsatisfied: unsatisfiedCount,
                    totalRated: totalResolutionRatings,
                    satisfactionRate,
                    recentComments: recentResolutionComments.map((c) => ({
                        id: c._id,
                        title: c.title,
                        category: c.category,
                        rating: c.resolutionFeedback?.rating,
                        comment: c.resolutionFeedback?.comment,
                        submittedAt: c.resolutionFeedback?.submittedAt || c.createdAt
                    }))
                },
                feedbackDetails: {
                    categoryAverages,
                    ratingDistribution,
                    dailyTrend,
                    recentComments: feedbackComments
                },
                inspections: inspectionsInMonth.map((insp) => ({
                    id: insp._id,
                    visitDate: insp.visitDate,
                    purpose: insp.purpose,
                    status: insp.status,
                    remarks: insp.submission?.remarks || ''
                }))
            }
        });
    } catch (error) {
        console.error('Error generating vendor monthly report:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Failed to generate vendor monthly report'
        });
    }
};
