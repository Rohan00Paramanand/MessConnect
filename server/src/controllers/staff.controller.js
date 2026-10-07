import Staff from '../models/staff.model.js';
import Mess from '../models/mess.model.js';

// @desc    Add a new staff member
// @route   POST /api/staff
// @access  Private (Vendor only)
export const addStaff = async (req, res) => {
    try {
        const { name, phoneNumber, role, salary } = req.body;

        // Ensure user is an approved vendor
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ status: 'error', message: 'Only vendors can add staff' });
        }

        const cleanPhone = phoneNumber ? phoneNumber.replace(/\D/g, '') : '';
        if (cleanPhone.length !== 10) {
            return res.status(400).json({ status: 'error', message: 'Staff phone number must be exactly 10 digits long' });
        }

        // Check if phone number already exists
        const existingStaff = await Staff.findOne({ phoneNumber: cleanPhone });
        if (existingStaff) {
            return res.status(400).json({ status: 'error', message: 'Staff with this phone number already exists' });
        }

        let documents = {};
        if (req.files) {
            ['identityProof', 'policeVerification', 'medicalReport'].forEach(field => {
                if (req.files[field] && req.files[field][0]) {
                    const file = req.files[field][0];
                    documents[field] = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
                }
            });
        }

        const staff = await Staff.create({
            vendor: req.user._id,
            collegeId: req.collegeId,
            mess: req.user.messAssigned,
            name,
            phoneNumber,
            role,
            salary: salary ? Number(salary) : undefined,
            documents,
            isApprovedByAdmin: false // Pending college admin approval
        });

        res.status(201).json({
            status: 'success',
            data: staff
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ status: 'error', message: 'Staff with this phone number already exists' });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Private (Vendor, Mess Committee, College Admin)
export const getStaff = async (req, res) => {
    try {
        const allowedRoles = ['vendor', 'mess_committee', 'college_admin', 'super_admin'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to view staff' });
        }

        let query = {};
        if (req.user.role !== 'super_admin' || req.collegeId) {
            query.collegeId = req.collegeId;
        }

        if (req.user.role === 'vendor') {
            query.vendor = req.user._id;
        } else {
            // mess_committee or college_admin
            if (req.query.vendor) {
                query.vendor = req.query.vendor;
            } else if (req.query.mess) {
                const User = (await import('../models/user.model.js')).default;
                const vendorsInMess = await User.find({ role: 'vendor', messAssigned: req.query.mess, collegeId: req.collegeId }).select('_id');
                const vendorIds = vendorsInMess.map(v => v._id);
                query.vendor = { $in: vendorIds };
            }
        }

        const staffList = await Staff.find(query)
            .populate('vendor', 'name email companyName messAssigned')
            .populate('mess', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            count: staffList.length,
            data: staffList
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Update a staff member
// @route   PATCH /api/staff/:id
// @access  Private (Vendor only)
export const updateStaff = async (req, res) => {
    try {
        const allowedRoles = ['vendor', 'college_admin', 'super_admin'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to update staff' });
        }

        let staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ status: 'error', message: 'Staff not found' });
        }

        if (req.user.role === 'vendor' && staff.vendor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to update this staff member' });
        }
        if (['college_admin', 'super_admin'].includes(req.user.role) && req.collegeId && staff.collegeId.toString() !== req.collegeId.toString()) {
            return res.status(403).json({ status: 'error', message: 'Staff does not belong to your college' });
        }

        staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        }).populate('vendor', 'name email companyName').populate('mess', 'name');

        res.status(200).json({
            status: 'success',
            data: staff
        });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Delete a staff member
// @route   DELETE /api/staff/:id
// @access  Private (Vendor, College Admin)
export const deleteStaff = async (req, res) => {
    try {
        const allowedRoles = ['vendor', 'college_admin', 'super_admin'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to delete staff' });
        }

        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ status: 'error', message: 'Staff not found' });
        }

        if (req.user.role === 'vendor' && staff.vendor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to delete this staff member' });
        }
        if (['college_admin', 'super_admin'].includes(req.user.role) && req.collegeId && staff.collegeId.toString() !== req.collegeId.toString()) {
            return res.status(403).json({ status: 'error', message: 'Staff does not belong to your college' });
        }

        await staff.deleteOne();

        res.status(200).json({
            status: 'success',
            message: 'Staff member removed successfully'
        });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
