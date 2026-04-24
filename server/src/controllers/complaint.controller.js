import Complaint from '../models/complaint.model.js';

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private (Student/Mess Committee)
export const createComplaint = async (req, res) => {
    try {
        const { title, description, category, latitude, longitude, address, mess } = req.body;

        if (!mess) {
            return res.status(400).json({ status: 'error', message: 'Mess is required' });
        }

        // Parse coverImage similar to course implementation 
        let image = "";
        if (req.file) {
            // Construct URL for the uploaded file
            image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        } else if (req.body.image) {
            image = req.body.image;
        }

        const complaint = await Complaint.create({
            user_id: req.user._id,
            title,
            description,
            category,
            mess,
            image,
            location: (latitude && longitude) ? { latitude, longitude, address } : undefined,
            status: 'pending'
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
        // Auto-resolve complaints that have been vendor_completed for more than 3 days
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        await Complaint.updateMany(
            { status: 'vendor_completed', vendorCompletedAt: { $lt: threeDaysAgo } },
            { $set: { status: 'resolved' } }
        );

        let queryFilter = {};

        // Mess Committee / Admins can filter via parameter
        if (req.query.mess && ['mess_committee', 'admin', 'super_admin'].includes(req.user.role)) {
            queryFilter.mess = req.query.mess;
        }

        // Vendors are locked to their assigned mess
        if (req.user.role === 'vendor') {
            if (req.user.messAssigned && req.user.messAssigned !== 'None') {
                queryFilter.mess = req.user.messAssigned;
            }
        }

        let complaints;

        if (req.user.role === 'student') {
            queryFilter.$or = [
                { status: { $in: ['pending', 'assigned', 'vendor_completed'] } },
                { user_id: req.user._id }
            ];
            complaints = await Complaint.find(queryFilter)
            .populate('assignedTo', 'name email')
            .populate('user_id', 'name avatar')
            .sort({ createdAt: -1 });
        } else if (['mess_committee', 'admin', 'super_admin'].includes(req.user.role)) {
            // Committee and Admins see all complaints (matching queryFilter)
            complaints = await Complaint.find(queryFilter)
            .populate('user_id', 'name email')
            .populate('assignedTo', 'name email')
            .sort({ createdAt: -1 });
        } else if (req.user.role === 'vendor') {
            // Vendors see assigned, vendor_completed, and resolved complaints
            queryFilter.status = { $in: ['assigned', 'vendor_completed', 'resolved'] };
            complaints = await Complaint.find(queryFilter)
            .populate('user_id', 'name email')
            .populate('assignedTo', 'name email')
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

// @desc    Assign a complaint to a vendor
// @route   PATCH /api/complaints/:id/assign
// @access  Private (Mess Committee)
export const assignComplaint = async (req, res) => {
    try {
        const { assignedTo } = req.body; // Vendor user ID

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ status: 'error', message: 'Complaint not found' });
        }

        // If assignedTo is provided, validate it's a vendor
        if (assignedTo) {
            const User = (await import('../models/user.model.js')).default;
            const assignee = await User.findById(assignedTo);
            if (!assignee || assignee.role !== 'vendor') {
                return res.status(400).json({ status: 'error', message: 'Can only assign to a vendor' });
            }
            complaint.assignedTo = assignedTo;
        }

        complaint.status = 'assigned';
        const updatedComplaint = await complaint.save();

        res.json({ status: 'success', data: updatedComplaint });
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

        const complaint = await Complaint.findById(req.params.id);
        if (!complaint) {
            return res.status(404).json({ status: 'error', message: 'Complaint not found' });
        }

        complaint.status = status;
        const updatedComplaint = await complaint.save();

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

        complaint.status = 'vendor_completed';
        complaint.vendorCompletedAt = Date.now();
        const updatedComplaint = await complaint.save();

        res.json({
            status: 'success',
            data: updatedComplaint
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Student reviews a vendor-completed complaint
// @route   PATCH /api/complaints/:id/review
// @access  Private (Student)
export const reviewComplaint = async (req, res) => {
    try {
        const { status } = req.body; // 'resolved' or 'rejected'

        if (!['resolved', 'rejected'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid status. Must be resolved or rejected' });
        }

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ status: 'error', message: 'Complaint not found' });
        }

        // Ensure it belongs to the student
        if (complaint.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to review this complaint' });
        }

        if (complaint.status !== 'vendor_completed') {
            return res.status(400).json({ status: 'error', message: 'Complaint is not ready for review' });
        }

        complaint.status = status;
        const updatedComplaint = await complaint.save();

        res.json({
            status: 'success',
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
        if (req.user.role !== 'student') {
            return res.status(403).json({ status: 'error', message: 'Only students can upvote complaints' });
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
