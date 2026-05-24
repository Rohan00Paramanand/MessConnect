import User from '../models/user.model.js';

export const getPendingUsers = async (req, res) => {
    try {
        // Only fetch pending users for the college_admin's specific college
        const pendingUsers = await User.find({
            role: { $in: ['vendor', 'mess_committee'] },
            isApprovedByAdmin: false,
            collegeId: req.collegeId
        }).select('-password');
        
        res.status(200).json({ status: 'success', data: pendingUsers });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const approveUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Ensure the user being approved belongs to the same college
        const user = await User.findOneAndUpdate(
            { _id: id, collegeId: req.collegeId },
            { isApprovedByAdmin: true },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found or does not belong to your college' });
        }
        
        res.status(200).json({ status: 'success', data: user });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
