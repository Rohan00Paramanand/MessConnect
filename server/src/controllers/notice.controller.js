import Notice from '../models/notice.model.js';

// @desc    Create a new notice
// @route   POST /api/notices
// @access  Private (Mess Committee only)
export const createNotice = async (req, res) => {
    try {
        const { title, description, targetRole, isActive, expiresAt } = req.body;

        if (req.user.role !== 'mess_committee') {
            return res.status(403).json({ status: 'error', message: 'Only mess committee can create notices' });
        }

        // Handle image upload logic similar to complaint.controller.js
        let image = "";
        if (req.file) {
            image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        } else if (req.body.image) {
            image = req.body.image;
        }

        const notice = await Notice.create({
            createdBy: req.user._id,
            title,
            description,
            image,
            targetRole: targetRole || 'all',
            isActive: isActive !== undefined ? isActive : true,
            expiresAt: expiresAt ? new Date(expiresAt) : null
        });

        res.status(201).json({
            status: 'success',
            data: notice
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Get all active notices applicable to the user
// @route   GET /api/notices
// @access  Private
export const getNotices = async (req, res) => {
    try {
        const userRole = req.user.role;
        const currentDate = new Date();

        // Build query:
        // 1. Notice must be active
        // 2. Target role must be 'all' OR the user's specific role
        // 3. Expiration date must either be null OR in the future
        const query = {
            isActive: true,
            targetRole: { $in: ['all', userRole] },
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: null },
                { expiresAt: { $gt: currentDate } }
            ]
        };

        const notices = await Notice.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            count: notices.length,
            data: notices
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Update a notice
// @route   PATCH /api/notices/:id
// @access  Private (Mess Committee only)
export const updateNotice = async (req, res) => {
    try {
        if (req.user.role !== 'mess_committee') {
            return res.status(403).json({ status: 'error', message: 'Only mess committee can update notices' });
        }

        let notice = await Notice.findById(req.params.id);

        if (!notice) {
            return res.status(404).json({ status: 'error', message: 'Notice not found' });
        }

        // Only the creator can update the notice, or allow any committee member?
        // Usually, any committee member can edit, but if restricted:
        // if (notice.createdBy.toString() !== req.user._id.toString()) { return 403 }
        // We'll allow any committee member for flexibility.

        // Check if new image was uploaded
        let image = notice.image;
        if (req.file) {
            image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        } else if (req.body.image) {
            image = req.body.image;
        }

        const updatedData = { ...req.body, image };

        if (req.body.expiresAt) {
            updatedData.expiresAt = new Date(req.body.expiresAt);
        }

        notice = await Notice.findByIdAndUpdate(req.params.id, updatedData, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: notice
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Delete a notice
// @route   DELETE /api/notices/:id
// @access  Private (Mess Committee only)
export const deleteNotice = async (req, res) => {
    try {
        if (req.user.role !== 'mess_committee') {
            return res.status(403).json({ status: 'error', message: 'Only mess committee can delete notices' });
        }

        const notice = await Notice.findById(req.params.id);

        if (!notice) {
            return res.status(404).json({ status: 'error', message: 'Notice not found' });
        }

        await notice.deleteOne();

        res.status(200).json({
            status: 'success',
            message: 'Notice deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
