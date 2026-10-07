import Notice from '../models/notice.model.js';

// @desc    Create a new notice
// @route   POST /api/notices
// @access  Private (Mess Committee only)
export const createNotice = async (req, res) => {
    try {
        const { title, description, targetRole, isActive, expiresAt } = req.body;

        if (!['mess_committee', 'college_admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ status: 'error', message: 'Only mess committee, college admin, or super admin can create notices' });
        }

        // Handle image upload logic similar to complaint.controller.js
        let image = "";
        if (req.file) {
            image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        } else if (req.body.image) {
            image = req.body.image;
        }

        // Set expiration date to end-of-day (23:59:59.999) to avoid premature same-day expiration
        let parsedExpiresAt = null;
        if (expiresAt) {
            const expDate = new Date(expiresAt);
            expDate.setHours(23, 59, 59, 999);
            if (expDate < new Date()) {
                return res.status(400).json({ status: 'error', message: 'Expiration date cannot be in the past' });
            }
            parsedExpiresAt = expDate;
        } else {
            // Default notice duration: 14 days from publication
            const defaultExp = new Date();
            defaultExp.setDate(defaultExp.getDate() + 14);
            defaultExp.setHours(23, 59, 59, 999);
            parsedExpiresAt = defaultExp;
        }

        const notice = await Notice.create({
            createdBy: req.user._id,
            collegeId: req.collegeId,
            title,
            description,
            image,
            targetRole: targetRole || 'all',
            isActive: isActive !== undefined ? isActive : true,
            expiresAt: parsedExpiresAt
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

        const { includeExpired } = req.query;

        // Build query:
        // 1. Notice must be active
        // 2. Expiration date must either be null OR in the future (unless explicitly requested by admin/committee)
        const query = {
            isActive: true
        };

        if (includeExpired !== 'true' || !['mess_committee', 'college_admin', 'super_admin'].includes(userRole)) {
            query.$or = [
                { expiresAt: { $exists: false } },
                { expiresAt: null },
                { expiresAt: { $gt: currentDate } }
            ];
        }

        // Enforce college isolation for non-super-admin users or when super admin is scoped
        if (userRole !== 'super_admin' || req.collegeId) {
            if (req.collegeId) {
                query.collegeId = req.collegeId;
            }
            if (!['mess_committee', 'college_admin', 'super_admin'].includes(userRole)) {
                query.targetRole = { $in: ['all', userRole] };
            }
        }

        const notices = await Notice.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();


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
        if (!['mess_committee', 'college_admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ status: 'error', message: 'Only mess committee, college admin, or super admin can update notices' });
        }

        // Scope to own college to prevent cross-college mutations
        let notice = await Notice.findOne({ _id: req.params.id, collegeId: req.collegeId });

        if (!notice) {
            return res.status(404).json({ status: 'error', message: 'Notice not found or does not belong to your college' });
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
            const expDate = new Date(req.body.expiresAt);
            expDate.setHours(23, 59, 59, 999);
            if (expDate < new Date()) {
                return res.status(400).json({ status: 'error', message: 'Expiration date cannot be in the past' });
            }
            updatedData.expiresAt = expDate;
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
        if (!['mess_committee', 'college_admin', 'super_admin'].includes(req.user.role)) {
            return res.status(403).json({ status: 'error', message: 'Only mess committee, college admin, or super admin can delete notices' });
        }

        // Scope to own college to prevent cross-college deletion
        const notice = await Notice.findOne({ _id: req.params.id, collegeId: req.collegeId });

        if (!notice) {
            return res.status(404).json({ status: 'error', message: 'Notice not found or does not belong to your college' });
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
