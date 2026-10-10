import Complaint from '../models/complaint.model.js';
import Mess from '../models/mess.model.js';
import User from '../models/user.model.js';
import { sendEmail } from '../utils/sendEmail.js';
import { notifyUser, notifyMultipleUsers } from '../utils/notificationService.js';
import { 
    complaintStatusEmailTemplate, 
    complaintFeedbackReceivedEmailTemplate,
    complaintAssignedToVendorEmailTemplate,
    complaintVendorUrgentNudgeEmailTemplate
} from '../utils/emailTemplates.js';

// Standard Service Level Agreement (SLA) turnaround: 3 calendar days (72 hours)
const SLA_RESOLUTION_DAYS = 3;

const rejectionLabels = {
    duplicate: 'Duplicate Complaint (Already Reported)',
    wrong_category: 'Wrong Category Submitted',
    spam: 'Spam or Irrelevant Complaint',
    false_information: 'False / Misleading Information',
    inappropriate: 'Inappropriate or Abusive Content'
};

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private (Student/Mess Committee)
export const createComplaint = async (req, res) => {
    try {
        const { title, description, category, latitude, longitude, address, mess } = req.body;

        if (!mess) {
            return res.status(400).json({ status: 'error', message: 'Mess is required' });
        }

        // Validate tenant boundary: Mess must belong to student's college
        const messDoc = await Mess.findOne({ _id: mess, collegeId: req.collegeId });
        if (!messDoc) {
            return res.status(400).json({ status: 'error', message: 'Selected mess does not belong to your college' });
        }

        // Check if the student is currently banned
        if (req.user.bannedUntil && new Date() < new Date(req.user.bannedUntil)) {
            return res.status(403).json({
                status: 'error',
                message: `Your complaint submission privileges are suspended until ${new Date(req.user.bannedUntil).toLocaleDateString()} due to a low trust score.`
            });
        }

        // Parse coverImage similar to course implementation 
        let image = "";
        if (req.file) {
            // Construct URL for the uploaded file
            image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        } else if (req.body.image) {
            image = req.body.image;
        }

        const complaintTitle = title ? title.trim() : (description ? description.trim().slice(0, 50) : category);

        const complaint = await Complaint.create({
            user_id: req.user._id,
            title: complaintTitle,
            description,
            category,
            mess,
            image,
            location: (latitude && longitude) ? { latitude, longitude, address } : undefined,
            status: 'pending',
            collegeId: req.collegeId
        });

        // Notify Mess Committee in real-time (excluding author if submitted by committee member)
        (async () => {
            try {
                const committee = await User.find({
                    collegeId: req.collegeId,
                    role: 'mess_committee',
                    _id: { $ne: req.user._id }
                }).select('_id');

                if (committee.length > 0) {
                    const isCommitteeCreator = req.user.role === 'mess_committee';
                    await notifyMultipleUsers(
                        committee.map((c) => c._id),
                        {
                            collegeId: req.collegeId,
                            title: isCommitteeCreator ? 'New Committee Inspection Issue' : 'New Student Complaint',
                            message: `A new complaint has been filed for ${messDoc.name}: "${complaintTitle}".`,
                            type: 'COMPLAINT_STATUS',
                            link: '/complaints',
                            metadata: { complaintId: complaint._id }
                        }
                    );
                }
            } catch (err) {
                console.error('Failed to notify committee of new complaint:', err.message);
            }
        })();

        res.status(201).json({
            status: 'success',
            data: complaint
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Private
export const getComplaints = async (req, res) => {
    try {
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        let queryFilter = {
            $and: [
                {
                    $or: [
                        { status: { $nin: ['resolved', 'rejected'] } },
                        { resolvedAt: { $gte: twoDaysAgo } },
                        { resolvedAt: { $exists: false }, updatedAt: { $gte: twoDaysAgo } }
                    ]
                }
            ]
        };

        // Enforce tenant isolation: scope if collegeId is present (for non-super-admins, or super-admin scoped to a college)
        if (req.user.role !== 'super_admin' || req.collegeId) {
            queryFilter.collegeId = req.collegeId;
        }

        // Students, Mess Committee, Admins can filter via parameter if provided
        if (req.query.mess && req.user.role !== 'vendor') {
            queryFilter.mess = req.query.mess;
        }

        // Vendors are strictly locked to their assigned mess
        if (req.user.role === 'vendor') {
            const vendorMessId = req.user.messAssigned?._id || req.user.messAssigned;
            if (!vendorMessId || vendorMessId === 'None') {
                return res.json({
                    status: 'success',
                    count: 0,
                    data: []
                });
            }
            queryFilter.mess = vendorMessId;
        }

        let complaints;

        if (req.user.role === 'user') {
            // Users should not see any rejected complaints
            let userFilter = { ...queryFilter, $and: [...queryFilter.$and, { status: { $ne: 'rejected' } }] };
            complaints = await Complaint.find(userFilter)
                .populate('user_id', 'name email avatar trustMeter role')
                .populate('assignedTo', 'name email')
                .populate('assignedBy', 'name email role')
                .populate('resolvedBy', 'name email role')
                .populate('mess', 'name')
                .sort({ createdAt: -1 });
        } else if (['mess_committee', 'college_admin', 'super_admin'].includes(req.user.role)) {
            // Committee, College Admins, and Super Admins see all complaints in their college (matching queryFilter)
            complaints = await Complaint.find(queryFilter)
                .populate('user_id', 'name email avatar trustMeter role')
                .populate('assignedTo', 'name email')
                .populate('assignedBy', 'name email role')
                .populate('resolvedBy', 'name email role')
                .populate('mess', 'name')
                .sort({ createdAt: -1 });
        } else if (req.user.role === 'vendor') {
            // Vendors strictly see complaints for their assigned mess only (complainee identity protected)
            const vendorMessId = req.user.messAssigned?._id || req.user.messAssigned;
            queryFilter.mess = vendorMessId;
            complaints = await Complaint.find(queryFilter)
                .populate('user_id', 'role')
                .populate('assignedTo', 'name email')
                .populate('assignedBy', 'name email role')
                .populate('resolvedBy', 'name email role')
                .populate('mess', 'name')
                .sort({ createdAt: -1 });
        }

        res.json({
            status: 'success',
            count: complaints?.length || 0,
            data: complaints || []
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};


// @desc    Update complaint status (committee can assign, reject, resolve)
// @route   PATCH /api/complaints/:id/status
// @access  Private (Mess Committee)
export const updateComplaintStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowed = ['assigned', 'rejected', 'resolved'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ status: 'error', message: `Invalid status. Allowed: ${allowed.join(', ')}` });
        }

        const penaltyMap = {
            duplicate: 0,
            wrong_category: -2,
            spam: -10,
            false_information: -15,
            inappropriate: -10
        };

        if (status === 'rejected') {
            const { rejectionReason } = req.body;
            if (!rejectionReason || !penaltyMap.hasOwnProperty(rejectionReason)) {
                return res.status(400).json({ 
                    status: 'error', 
                    message: `A valid rejectionReason is required when status is rejected. Allowed: ${Object.keys(penaltyMap).join(', ')}` 
                });
            }
        }

        const queryFilter = { _id: req.params.id };
        if (req.user.role !== 'super_admin') {
            queryFilter.collegeId = req.collegeId;
        }

        const complaint = await Complaint.findOne(queryFilter);
        if (!complaint) {
            return res.status(404).json({ status: 'error', message: 'Complaint not found or does not belong to your college' });
        }

        // Prevent conflict of interest: Committee members cannot review/resolve their own filed complaints
        if (complaint.user_id?.toString() === req.user._id.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'To prevent conflict of interest, complaints filed by committee members must be reviewed and resolved by another committee member.'
            });
        }

        const currentStatus = complaint.status;

        // Enforce state transition rules
        if (currentStatus === 'resolved' || currentStatus === 'rejected') {
            return res.status(400).json({ status: 'error', message: 'Resolved or Rejected complaints cannot be updated.' });
        }

        if (currentStatus === 'pending') {
            if (status !== 'assigned' && status !== 'rejected') {
                return res.status(400).json({ status: 'error', message: 'Pending complaints can only be assigned to a vendor or rejected.' });
            }
        }

        if (currentStatus === 'assigned') {
            if (status !== 'rejected') {
                return res.status(400).json({ status: 'error', message: 'Assigned complaints can only be rejected by the committee.' });
            }
        }

        if (currentStatus === 'vendor_completed') {
            if (status !== 'assigned' && status !== 'resolved') {
                return res.status(400).json({ status: 'error', message: 'Completed complaints can only be resolved or re-assigned.' });
            }
        }

        // Handle auto-assignment when changing to 'assigned'
        let assignedVendor = null;
        if (status === 'assigned') {
            const User = (await import('../models/user.model.js')).default;
            let vendor = null;

            // 1. If complaint was previously assigned to a vendor, reuse that active vendor
            if (complaint.assignedTo) {
                vendor = await User.findOne({
                    _id: complaint.assignedTo,
                    role: 'vendor',
                    isActive: true,
                    isApprovedByAdmin: true
                });
            }

            // 2. Otherwise find active vendor assigned to this mess
            if (!vendor) {
                const vendorQuery = {
                    role: 'vendor',
                    messAssigned: complaint.mess,
                    isActive: true,
                    isApprovedByAdmin: true
                };
                if (req.collegeId) {
                    vendorQuery.collegeId = req.collegeId;
                }
                vendor = await User.findOne(vendorQuery);
            }

            if (!vendor) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No active/approved vendor is currently associated with this mess.'
                });
            }
            const assignedDate = new Date();
            complaint.assignedTo = vendor._id;
            complaint.assignedBy = req.user._id;
            complaint.assignedAt = assignedDate;
            complaint.resolutionDeadline = new Date(assignedDate.getTime() + SLA_RESOLUTION_DAYS * 24 * 60 * 60 * 1000);
            complaint.isSlaBreached = false;
            complaint.vendorCompletedAt = null; // Clear completion timestamp on re-assignment
            assignedVendor = vendor;
        }

        complaint.status = status;
        if (status === 'resolved' || status === 'rejected') {
            complaint.resolvedAt = Date.now();
            complaint.resolvedBy = req.user._id;
            if (status === 'rejected') {
                complaint.rejectionReason = req.body.rejectionReason;
            } else {
                complaint.rejectionReason = null;
            }
        }

        const updatedComplaint = await complaint.save();

        // Apply TrustMeter changes (reward/penalty)
        if (status === 'resolved' || status === 'rejected') {
            try {
                const User = (await import('../models/user.model.js')).default;
                const authorUser = await User.findById(complaint.user_id);
                if (authorUser && authorUser.role === 'user') {
                    if (status === 'rejected') {
                        const penalty = penaltyMap[complaint.rejectionReason] || 0;
                        if (penalty !== 0) {
                            authorUser.trustMeter = Math.max(0, (authorUser.trustMeter ?? 100) + penalty);
                            if (authorUser.trustMeter === 0) {
                                // Ban the user for 7 days
                                authorUser.bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                            }
                            await authorUser.save();
                        }
                    } else if (status === 'resolved') {
                        // Reward positive submission
                        authorUser.trustMeter = Math.min(100, (authorUser.trustMeter ?? 100) + 10);
                        await authorUser.save();
                    }
                }
            } catch (trustError) {
                console.error('Failed to update user trust meter:', trustError.message);
            }
        }

        // Send email notification on resolution or rejection (asynchronously in background)
        if (status === 'resolved' || status === 'rejected') {
            (async () => {
                try {
                    const User = (await import('../models/user.model.js')).default;
                    const authorUser = await User.findById(complaint.user_id);
                    if (authorUser && authorUser.email) {
                        const humanRejection = status === 'rejected'
                            ? (rejectionLabels[complaint.rejectionReason] || (complaint.rejectionReason ? complaint.rejectionReason.replace('_', ' ').toUpperCase() : 'Not Specified'))
                            : '';
                        const clientUrl = process.env.CLIENT_URL || 'https://pcet.connectmess.in';
                        const dashboardUrl = `${clientUrl}/dashboard/student`;

                        const html = complaintStatusEmailTemplate({
                            name: authorUser.name,
                            title: complaint.title,
                            category: complaint.category,
                            status: complaint.status,
                            rejectionReason: humanRejection,
                            dashboardUrl
                        });

                        const plainMessage = status === 'resolved'
                            ? `Hello ${authorUser.name},\n\nYour complaint "${complaint.title}" has been resolved by the Mess Committee.\n\nPlease visit your dashboard to rate whether you were satisfied or unsatisfied with this resolution:\n${dashboardUrl}\n\nThank you,\nMessConnect Team`
                            : `Hello ${authorUser.name},\n\nYour complaint "${complaint.title}" was reviewed and could not be processed by the Mess Committee.\n\nReason for Rejection: ${humanRejection}\n\nDetails:\n- Title: ${complaint.title}\n- Category: ${complaint.category}\n- Status: REJECTED\n\nThank you,\nMessConnect Team`;

                        await sendEmail({
                            email: authorUser.email,
                            subject: status === 'resolved'
                                ? `Complaint Resolved - MessConnect`
                                : `Complaint Rejected - MessConnect`,
                            message: plainMessage,
                            html
                        });

                        // Trigger instant in-app web notification for student
                        await notifyUser({
                            recipient: authorUser._id,
                            collegeId: complaint.collegeId,
                            title: status === 'resolved' ? 'Complaint Resolved' : 'Complaint Rejected',
                            message: status === 'resolved'
                                ? `Your complaint "${complaint.title}" has been resolved by the Mess Committee. Please rate your satisfaction.`
                                : `Your complaint "${complaint.title}" was reviewed and rejected. Reason: ${humanRejection}`,
                            type: 'COMPLAINT_STATUS',
                            link: '/complaints',
                            metadata: { complaintId: complaint._id }
                        });
                    }
                } catch (emailError) {
                    console.error('Failed to send notification email:', emailError.message);
                }
            })();
        }

        // Send email notification to vendor on assignment (asynchronously in background)
        if (status === 'assigned' && assignedVendor && assignedVendor.email) {
            (async () => {
                try {
                    const clientUrl = process.env.CLIENT_URL || 'https://pcet.connectmess.in';
                    const dashboardUrl = `${clientUrl}/complaints`;

                    let messName = '';
                    if (complaint.mess) {
                        const messDoc = await Mess.findById(complaint.mess).select('name');
                        messName = messDoc ? messDoc.name : '';
                    }

                    const deadlineFormatted = complaint.resolutionDeadline
                        ? new Date(complaint.resolutionDeadline).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })
                        : 'Within 3 Days';

                    const html = complaintAssignedToVendorEmailTemplate({
                        vendorName: assignedVendor.name,
                        title: complaint.title || complaint.category,
                        category: complaint.category,
                        description: complaint.description,
                        messName,
                        deadlineFormatted,
                        dashboardUrl
                    });

                    await sendEmail({
                        email: assignedVendor.email,
                        subject: `Action Required: New Complaint Assigned (3-Day SLA) - MessConnect`,
                        message: `Hello ${assignedVendor.name},\n\nA student complaint has been assigned to you by the Mess Committee:\n\nTitle: ${complaint.title || complaint.category}\nCategory: ${complaint.category}\nTarget SLA Deadline: ${deadlineFormatted}\nDescription: ${complaint.description}\n\nPlease visit your dashboard to upload geotagged photo proof and mark it as completed:\n${dashboardUrl}\n\nThank you,\nMessConnect Team`,
                        html
                    });

                    // Trigger instant in-app web notification for vendor
                    await notifyUser({
                        recipient: assignedVendor._id,
                        collegeId: complaint.collegeId,
                        title: 'New Complaint Assigned',
                        message: `Complaint "${complaint.title || complaint.category}" has been assigned to you with a 3-Day SLA turnaround.`,
                        type: 'COMPLAINT_ASSIGNED',
                        link: '/complaints',
                        metadata: { complaintId: complaint._id }
                    });
                } catch (assignEmailErr) {
                    console.error('Failed to send vendor assignment email:', assignEmailErr.message);
                }
            })();
        }

        const populatedComplaint = await Complaint.findById(updatedComplaint._id)
            .populate('user_id', 'name email avatar trustMeter role')
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email role')
            .populate('resolvedBy', 'name email role')
            .populate('mess', 'name');

        res.json({ status: 'success', data: populatedComplaint || updatedComplaint });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Mark complaint as completed by vendor
// @route   PATCH /api/complaints/:id/vendor-complete
// @access  Private (Vendor)
export const markVendorCompleted = async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ status: 'error', message: 'Complaint not found' });
        }

        if (complaint.status !== 'assigned') {
            return res.status(400).json({ status: 'error', message: 'Only assigned complaints can be marked as completed' });
        }

        // Verify that this complaint is assigned to the current vendor
        if (complaint.assignedTo && complaint.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'You can only resolve complaints that are assigned to you.'
            });
        }

        // Validate mandatory resolution proof image
        let image = '';
        if (req.file) {
            image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        } else if (req.body.image) {
            image = req.body.image;
        }

        if (!image) {
            return res.status(400).json({
                status: 'error',
                message: 'A photo proof of resolution is mandatory.'
            });
        }

        const { latitude, longitude, address, remarks } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({
                status: 'error',
                message: 'Geotagged location coordinates (Latitude and Longitude) are mandatory for resolution proof.'
            });
        }

        const completionTime = new Date();
        complaint.status = 'vendor_completed';
        complaint.vendorCompletedAt = completionTime;

        // Check if resolution was completed within the agreed 3-day SLA
        if (complaint.resolutionDeadline && completionTime.getTime() > new Date(complaint.resolutionDeadline).getTime()) {
            complaint.isSlaBreached = true;
        } else {
            complaint.isSlaBreached = false;
        }

        complaint.resolutionProof = {
            image,
            location: {
                latitude: Number(latitude),
                longitude: Number(longitude),
                address: address ? address.trim() : 'Location verified'
            },
            submittedAt: completionTime,
            remarks: remarks ? remarks.trim() : ''
        };

        const updatedComplaint = await complaint.save();

        res.json({
            status: 'success',
            message: 'Resolution proof uploaded. Awaiting committee review.',
            data: updatedComplaint
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Submit student feedback for a resolved complaint
// @route   POST /api/complaints/:id/feedback
// @access  Private (Student/User)
export const submitComplaintFeedback = async (req, res) => {
    try {
        const { rating, comment } = req.body;

        if (!rating || !['satisfied', 'unsatisfied'].includes(rating)) {
            return res.status(400).json({
                status: 'error',
                message: "Rating must be either 'satisfied' or 'unsatisfied'."
            });
        }

        const complaint = await Complaint.findById(req.params.id)
            .populate('resolvedBy', 'name email role')
            .populate('mess', 'name');

        if (!complaint) {
            return res.status(404).json({ status: 'error', message: 'Complaint not found.' });
        }

        // Verify ownership
        if (complaint.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'You can only rate resolutions for your own complaints.'
            });
        }

        if (!['resolved', 'vendor_completed'].includes(complaint.status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Feedback can only be submitted on completed or resolved complaints.'
            });
        }

        complaint.resolutionFeedback = {
            rating,
            comment: comment ? comment.trim() : '',
            submittedAt: Date.now()
        };

        const updatedComplaint = await complaint.save();

        // Send email to the committee member who resolved this complaint, or active mess committee
        let recipientUser = complaint.resolvedBy;
        if (!recipientUser || !recipientUser.email) {
            try {
                const User = (await import('../models/user.model.js')).default;
                const committeeQuery = { role: 'committee', isActive: true };
                if (complaint.collegeId) committeeQuery.collegeId = complaint.collegeId;
                recipientUser = await User.findOne(committeeQuery);
            } catch (uErr) {
                console.error('Failed to find committee recipient:', uErr.message);
            }
        }

        if (recipientUser && recipientUser.email) {
            (async () => {
                try {
                    const clientUrl = process.env.CLIENT_URL || 'https://pcet.connectmess.in';
                    const dashboardUrl = `${clientUrl}/complaints`;

                    const html = complaintFeedbackReceivedEmailTemplate({
                        committeeName: recipientUser.name,
                        studentName: req.user.name,
                        complaintTitle: complaint.title,
                        rating,
                        comment: complaint.resolutionFeedback.comment,
                        dashboardUrl
                    });

                    await sendEmail({
                        email: recipientUser.email,
                        subject: `Student Feedback: ${rating.toUpperCase()} on Complaint "${complaint.title}"`,
                        message: `Hello ${recipientUser.name},\n\nStudent ${req.user.name} submitted resolution feedback on complaint "${complaint.title}":\nRating: ${rating.toUpperCase()}\nComment: ${complaint.resolutionFeedback.comment || 'None'}\n\nView on dashboard: ${dashboardUrl}`,
                        html
                    });

                    // Trigger instant in-app web notification for committee member who resolved the complaint
                    await notifyUser({
                        recipient: recipientUser._id,
                        collegeId: complaint.collegeId,
                        title: `Student Feedback: ${rating.toUpperCase()}`,
                        message: `${req.user.name} submitted resolution feedback on "${complaint.title}": rated ${rating.toUpperCase()}${complaint.resolutionFeedback.comment ? ` ("${complaint.resolutionFeedback.comment}")` : '.'}`,
                        type: 'FEEDBACK',
                        link: '/complaints',
                        metadata: { complaintId: complaint._id }
                    });
                } catch (emailErr) {
                    console.error('Failed to notify committee member of feedback:', emailErr.message);
                }
            })();
        }

        res.json({
            status: 'success',
            message: 'Feedback submitted successfully. Thank you!',
            data: updatedComplaint
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};



// @desc    Upvote a complaint
// @route   POST /api/complaints/:id/upvote
// @access  Private (Student)
export const upvoteComplaint = async (req, res) => {
    try {
        if (req.user.role !== 'user') {
            return res.status(403).json({ status: 'error', message: 'Only users can upvote complaints' });
        }

        const complaintQuery = { _id: req.params.id };
        if (req.user.role !== 'super_admin') {
            complaintQuery.collegeId = req.collegeId;
        }

        const complaint = await Complaint.findOne(complaintQuery);
        if (!complaint) {
            return res.status(404).json({ status: 'error', message: 'Complaint not found or does not belong to your college' });
        }

        // Initialize upvotes array if it doesn't exist (for older records)
        if (!complaint.upvotes) {
            complaint.upvotes = [];
        }

        // Check if user already upvoted (convert ObjectIds to strings for safe comparison)
        const userIdStr = req.user._id.toString();
        const index = complaint.upvotes.findIndex(id => id.toString() === userIdStr);

        if (index > -1) {
            // Remove upvote
            complaint.upvotes.splice(index, 1);
        } else {
            // Add upvote
            complaint.upvotes.push(req.user._id);
        }

        await complaint.save();

        res.json({
            status: 'success',
            data: complaint
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private (Author Student)
export const deleteComplaint = async (req, res) => {
    try {
        const { id } = req.params;
        const complaint = await Complaint.findById(id);

        if (!complaint) {
            return res.status(404).json({ status: 'error', message: 'Complaint not found' });
        }

        // Only the author student can delete their own complaint
        if (complaint.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not authorized to delete this complaint'
            });
        }

        await Complaint.findByIdAndDelete(id);

        res.status(200).json({
            status: 'success',
            message: 'Complaint deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Grant SLA extension for an assigned complaint
// @route   PATCH /api/complaints/:id/extend-sla
// @access  Private (Mess Committee)
export const extendComplaintSla = async (req, res) => {
    try {
        const { extensionHours, reason } = req.body;
        const hours = parseInt(extensionHours, 10);

        if (!hours || hours <= 0 || !reason || !reason.trim()) {
            return res.status(400).json({
                status: 'error',
                message: 'Valid extension hours (positive number) and a descriptive reason are required.'
            });
        }

        const complaintQuery = { _id: req.params.id };
        if (req.user.role !== 'super_admin') {
            complaintQuery.collegeId = req.collegeId;
        }

        const complaint = await Complaint.findOne(complaintQuery);
        if (!complaint) {
            return res.status(404).json({ status: 'error', message: 'Complaint not found or does not belong to your college.' });
        }

        if (complaint.status !== 'assigned') {
            return res.status(400).json({
                status: 'error',
                message: 'Extensions can only be granted to actively assigned complaints.'
            });
        }

        // Base the extension on current deadline or current time, whichever is later
        const baseDate = (complaint.resolutionDeadline && new Date(complaint.resolutionDeadline) > new Date())
            ? new Date(complaint.resolutionDeadline)
            : new Date();

        complaint.resolutionDeadline = new Date(baseDate.getTime() + hours * 60 * 60 * 1000);
        complaint.slaExtensionReason = reason.trim();
        complaint.slaExtendedAt = new Date();
        complaint.isSlaBreached = false;

        const updated = await complaint.save();
        const populated = await Complaint.findById(updated._id)
            .populate('user_id', 'name email avatar trustMeter role')
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email role')
            .populate('resolvedBy', 'name email role')
            .populate('mess', 'name');

        res.json({
            status: 'success',
            message: `SLA deadline extended by ${hours} hours.`,
            data: populated
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Send urgent reminder/nudge to vendor for assigned complaint
// @route   POST /api/complaints/:id/nudge-vendor
// @access  Private (Mess Committee)
export const nudgeVendor = async (req, res) => {
    try {
        const complaintQuery = { _id: req.params.id };
        if (req.user.role !== 'super_admin') {
            complaintQuery.collegeId = req.collegeId;
        }

        const complaint = await Complaint.findOne(complaintQuery)
            .populate('assignedTo', 'name email')
            .populate('mess', 'name');

        if (!complaint) {
            return res.status(404).json({ status: 'error', message: 'Complaint not found or does not belong to your college.' });
        }

        if (complaint.status !== 'assigned') {
            return res.status(400).json({
                status: 'error',
                message: 'Reminders can only be sent for actively assigned complaints.'
            });
        }

        if (!complaint.assignedTo || !complaint.assignedTo.email) {
            return res.status(400).json({
                status: 'error',
                message: 'No assigned vendor found with a valid email address.'
            });
        }

        const isOverdue = complaint.resolutionDeadline && new Date() > new Date(complaint.resolutionDeadline);
        const deadlineFormatted = complaint.resolutionDeadline
            ? new Date(complaint.resolutionDeadline).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
            : 'Within 3 Days';

        const clientUrl = process.env.CLIENT_URL || 'https://pcet.connectmess.in';
        const dashboardUrl = `${clientUrl}/complaints`;

        const html = complaintVendorUrgentNudgeEmailTemplate({
            vendorName: complaint.assignedTo.name,
            title: complaint.title || complaint.category,
            category: complaint.category,
            messName: complaint.mess?.name || 'Mess Facility',
            deadlineFormatted,
            isOverdue,
            dashboardUrl
        });

        await sendEmail({
            email: complaint.assignedTo.email,
            subject: isOverdue
                ? `🚨 URGENT: Complaint SLA Breached - Action Required - MessConnect`
                : `⚠️ Reminder: Complaint Approaching 3-Day SLA Deadline - MessConnect`,
            message: `Hello ${complaint.assignedTo.name},\n\nThis is an urgent reminder from the Mess Committee regarding the assigned complaint "${complaint.title || complaint.category}".\nDeadline: ${deadlineFormatted}\n\nPlease upload proof on your dashboard to complete it: ${dashboardUrl}`,
            html
        });

        // Trigger instant in-app web notification for vendor
        await notifyUser({
            recipient: complaint.assignedTo._id,
            collegeId: complaint.collegeId,
            title: isOverdue ? '🚨 URGENT: SLA Breached' : '⚠️ Action Required: SLA Reminder',
            message: `Mess Committee sent a reminder regarding complaint "${complaint.title || complaint.category}". Target SLA: ${deadlineFormatted}.`,
            type: 'SLA_NUDGE',
            link: '/complaints',
            metadata: { complaintId: complaint._id }
        });

        res.json({
            status: 'success',
            message: isOverdue ? 'Urgent escalation notice sent to vendor.' : 'Reminder sent to vendor.'
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
