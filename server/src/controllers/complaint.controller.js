import Complaint from '../models/complaint.model.js';
import Mess from '../models/mess.model.js';
import { sendEmail } from '../utils/sendEmail.js';
import { complaintStatusEmailTemplate, complaintFeedbackReceivedEmailTemplate } from '../utils/emailTemplates.js';

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

        // Enforce tenant isolation for non-super-admins
        if (req.user.role !== 'super_admin') {
            queryFilter.collegeId = req.collegeId;
        }

        // Students, Mess Committee, Admins can filter via parameter if provided
        if (req.query.mess && req.user.role !== 'vendor') {
            queryFilter.mess = req.query.mess;
        }

        // Vendors are locked to their assigned mess
        if (req.user.role === 'vendor') {
            if (req.user.messAssigned && req.user.messAssigned !== 'None') {
                queryFilter.mess = req.user.messAssigned;
            }
        }

        let complaints;

        if (req.user.role === 'user') {
            // Users should not see any rejected complaints
            let userFilter = { ...queryFilter, $and: [...queryFilter.$and, { status: { $ne: 'rejected' } }] };
            complaints = await Complaint.find(userFilter)
                .populate('user_id', 'name email avatar trustMeter role')
                .populate('assignedTo', 'name email')
                .populate('resolvedBy', 'name email role')
                .populate('mess', 'name')
                .sort({ createdAt: -1 });
        } else if (['mess_committee', 'college_admin', 'super_admin'].includes(req.user.role)) {
            // Committee, College Admins, and Super Admins see all complaints in their college (matching queryFilter)
            complaints = await Complaint.find(queryFilter)
                .populate('user_id', 'name email avatar trustMeter role')
                .populate('assignedTo', 'name email')
                .populate('resolvedBy', 'name email role')
                .populate('mess', 'name')
                .sort({ createdAt: -1 });
        } else if (req.user.role === 'vendor') {
            // Vendors see assigned or completed complaints assigned specifically to them
            queryFilter.status = { $in: ['assigned', 'vendor_completed'] };
            queryFilter.assignedTo = req.user._id;
            complaints = await Complaint.find(queryFilter)
                .populate('user_id', 'name email avatar trustMeter role')
                .populate('assignedTo', 'name email')
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

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ status: 'error', message: 'Complaint not found' });
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
            complaint.assignedTo = vendor._id;
            complaint.vendorCompletedAt = null; // Clear completion timestamp on re-assignment
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

        // Send email notification (asynchronously in background)
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
                    }
                } catch (emailError) {
                    console.error('Failed to send notification email:', emailError.message);
                }
            })();
        }

        res.json({ status: 'success', data: updatedComplaint });
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

        complaint.status = 'vendor_completed';
        complaint.vendorCompletedAt = Date.now();
        complaint.resolutionProof = {
            image,
            location: {
                latitude: Number(latitude),
                longitude: Number(longitude),
                address: address ? address.trim() : 'Location verified'
            },
            submittedAt: Date.now(),
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

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ status: 'error', message: 'Complaint not found' });
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
