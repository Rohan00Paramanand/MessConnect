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
        let complaints;

        if (req.user.role === 'student') {
            complaints = await Complaint.find({ user_id: req.user._id }).populate('assignedTo', 'name email');
        } else if (req.user.role === 'mess_committee') {
            // Committee sees all complaints
            complaints = await Complaint.find().populate('user_id', 'name email').populate('assignedTo', 'name email');
        } else if (req.user.role === 'vendor') {
            // Vendors only see assigned complaints
            complaints = await Complaint.find({ status: 'assigned' }).populate('user_id', 'name email').populate('assignedTo', 'name email');
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

// @desc    Update complaint status (resolve/reject)
// @route   PATCH /api/complaints/:id/status
// @access  Private (Mess Committee)
export const updateComplaintStatus = async (req, res) => {
    try {
        const { status } = req.body; // should be 'resolved' or 'rejected'

        if (!['resolved', 'rejected'].includes(status)) {
            return res.status(400).json({ status: 'error', message: 'Invalid status update. Only resolved or rejected allowed.' });
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
