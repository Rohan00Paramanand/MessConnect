import Complaint from '../models/complaint.model.js';

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private (Student/Mess Committee)
export const createComplaint = async (req, res) => {
    try {
        const { title, description, category } = req.body;

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
            image,
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

        let complaints;

        if (req.user.role === 'student') {
            complaints = await Complaint.find({ user_id: req.user._id }).populate('assignedTo', 'name email');
        } else if (req.user.role === 'mess_committee') {
            // Committee sees all complaints
            complaints = await Complaint.find().populate('user_id', 'name email').populate('assignedTo', 'name email');
        } else if (req.user.role === 'vendor') {
            // Vendors see assigned, vendor_completed, and resolved complaints
            complaints = await Complaint.find({ status: { $in: ['assigned', 'vendor_completed', 'resolved'] } }).populate('user_id', 'name email').populate('assignedTo', 'name email');
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

// @desc    Assign a complaint
// @route   PATCH /api/complaints/:id/assign
// @access  Private (Mess Committee)
export const assignComplaint = async (req, res) => {
    try {
        const { assignedTo } = req.body;

        // Validate that the assigned user is also a mess committee member
        // Dynamically importing to avoid circular dependencies if any, though regular import is fine too.
        const User = (await import('../models/user.model.js')).default;
        const assignee = await User.findById(assignedTo);

        if (!assignee || assignee.role !== 'mess_committee') {
            return res.status(400).json({ status: 'error', message: 'Can only assign to a mess committee member' });
        }

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ status: 'error', message: 'Complaint not found' });
        }

        complaint.assignedTo = assignedTo;
        complaint.status = 'assigned';

        const updatedComplaint = await complaint.save();

        res.json({
            status: 'success',
            data: updatedComplaint
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Update complaint status (reject only for committee)
// @route   PATCH /api/complaints/:id/status
// @access  Private (Mess Committee)
export const updateComplaintStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (status !== 'rejected') {
            return res.status(400).json({ status: 'error', message: 'Mess committee can only reject complaints from this endpoint.' });
        }

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({ status: 'error', message: 'Complaint not found' });
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
