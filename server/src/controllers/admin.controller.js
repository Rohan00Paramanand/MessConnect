import User from '../models/user.model.js';

export const getPendingUsers = async (req, res) => {
    try {
        const pendingUsers = await User.find({
            role: { $in: ['vendor', 'mess_committee'] },
            isApprovedByAdmin: false
        }).select('-password');
        
        res.status(200).json({ status: 'success', data: pendingUsers });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export const approveUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByIdAndUpdate(
            id,
            { isApprovedByAdmin: true },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }
        
        res.status(200).json({ status: 'success', data: user });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
