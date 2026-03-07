import Staff from '../models/staff.model.js';

// @desc    Add a new staff member
// @route   POST /api/staff
// @access  Private (Vendor only)
export const addStaff = async (req, res) => {
    try {
        const { name, phoneNumber, role, salary } = req.body;

        // Ensure user is a vendor
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ status: 'error', message: 'Only vendors can add staff' });
        }

        // Check if phone number already exists for this vendor
        // Note: The schema has an index for unique phone number overall,
        // but if it's meant per vendor we check it explicitly.
        const existingStaff = await Staff.findOne({ phoneNumber });
        if (existingStaff) {
            return res.status(400).json({ status: 'error', message: 'Staff with this phone number already exists' });
        }

        const staff = await Staff.create({
            vendor: req.user._id,
            name,
            phoneNumber,
            role,
            salary
        });

        res.status(201).json({
            status: 'success',
            data: staff
        });
    } catch (error) {
        // Handle Mongoose duplicate key error specifically
        if (error.code === 11000) {
            return res.status(400).json({ status: 'error', message: 'Staff with this phone number already exists' });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Get all staff members
// @route   GET /api/staff
// @access  Private (Vendor, Student, Mess Committee)
export const getStaff = async (req, res) => {
    try {
        const allowedRoles = ['vendor', 'student', 'mess_committee'];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to view staff' });
        }

        let query = {};
        if (req.user.role === 'vendor') {
            query = { vendor: req.user._id };
        }

        const staffList = await Staff.find(query).populate('vendor', 'name email');

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
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ status: 'error', message: 'Only vendors can update staff' });
        }

        let staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ status: 'error', message: 'Staff not found' });
        }

        // Ensure the staff belongs to the logged in vendor
        if (staff.vendor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to update this staff member' });
        }

        staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

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
// @access  Private (Vendor only)
export const deleteStaff = async (req, res) => {
    try {
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ status: 'error', message: 'Only vendors can delete staff' });
        }

        const staff = await Staff.findById(req.params.id);

        if (!staff) {
            return res.status(404).json({ status: 'error', message: 'Staff not found' });
        }

        // Ensure the staff belongs to the logged in vendor
        if (staff.vendor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to delete this staff member' });
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
