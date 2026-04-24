import TimeTable from '../models/timeTable.model.js';

// @desc    Create a new timetable entry
// @route   POST /api/timetable
// @access  Private (Vendor only)
export const createTimeTable = async (req, res) => {
    try {
        const { date, mealType, items } = req.body;

        if (req.user.role !== 'vendor') {
            return res.status(403).json({ status: 'error', message: 'Only vendors can create timetable entries' });
        }

        const mealDate = new Date(date);
        if (isNaN(mealDate.getTime())) {
            return res.status(400).json({ status: 'error', message: 'Invalid date format' });
        }

        // Check if meal already exists for this date to prevent duplicates
        const existingMeal = await TimeTable.findOne({
            date: {
                $gte: new Date(mealDate.setHours(0, 0, 0, 0)),
                $lt: new Date(mealDate.setHours(23, 59, 59, 999))
            },
            mealType
        });

        if (existingMeal) {
            return res.status(400).json({ status: 'error', message: `${mealType} already exists for this date` });
        }

        const timeTable = await TimeTable.create({
            date: new Date(date),
            mealType,
            items: Array.isArray(items) ? items : [items],
            createdBy: req.user._id
        });

        res.status(201).json({
            status: 'success',
            data: timeTable
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ status: 'error', message: `${req.body.mealType} already exists for this date` });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Get timetable entries
// @route   GET /api/timetable
// @access  Private
export const getTimeTable = async (req, res) => {
    try {
        const { date } = req.query;
        let query = {};

        if (date) {
            // Fetch for a specific day
            const queryDate = new Date(date);
            if (!isNaN(queryDate.getTime())) {
                query.date = {
                    $gte: new Date(queryDate.setHours(0, 0, 0, 0)),
                    $lt: new Date(queryDate.setHours(23, 59, 59, 999))
                };
            }
        } else {
            // Default: Fetch meals for the CURRENT WEEK (Monday to Sunday)
            const today = new Date();
            const day = today.getDay();
            const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1);
            
            const startOfWeek = new Date(today.setDate(diffToMonday));
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23, 59, 59, 999);

            query.date = { $gte: startOfWeek, $lte: endOfWeek };
        }

        const timeTable = await TimeTable.find(query)
            .populate('createdBy', 'name')
            .sort({ date: 1, mealType: 1 }); // Sort by date, then meal type

        res.status(200).json({
            status: 'success',
            count: timeTable.length,
            data: timeTable
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Update a timetable entry
// @route   PATCH /api/timetable/:id
// @access  Private (Vendor only)
export const updateTimeTable = async (req, res) => {
    try {
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ status: 'error', message: 'Only vendors can update timetable entries' });
        }

        let timeTable = await TimeTable.findById(req.params.id);

        if (!timeTable) {
            return res.status(404).json({ status: 'error', message: 'Timetable entry not found' });
        }

        timeTable = await TimeTable.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: timeTable
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Delete a timetable entry
// @route   DELETE /api/timetable/:id
// @access  Private (Vendor only)
export const deleteTimeTable = async (req, res) => {
    try {
        if (req.user.role !== 'vendor') {
            return res.status(403).json({ status: 'error', message: 'Only vendors can delete timetable entries' });
        }

        const timeTable = await TimeTable.findById(req.params.id);

        if (!timeTable) {
            return res.status(404).json({ status: 'error', message: 'Timetable entry not found' });
        }

        await timeTable.deleteOne();

        res.status(200).json({
            status: 'success',
            message: 'Timetable entry deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
