import Feedback from '../models/feedback.model.js';

// @desc    Submit new feedback
// @route   POST /api/feedback
// @access  Private (Student only)
export const submitFeedback = async (req, res) => {
    try {
        const { date, rating, comment } = req.body;

        if (req.user.role !== 'student') {
            return res.status(403).json({ status: 'error', message: 'Only students can submit feedback' });
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ status: 'error', message: 'Rating must be between 1 and 5' });
        }

        const feedbackDate = new Date(date);

        // Ensure date is valid
        if (isNaN(feedbackDate.getTime())) {
            return res.status(400).json({ status: 'error', message: 'Invalid date format' });
        }

        // The schema ensures uniqueness per user per date, but we can catch it specifically
        const existingFeedback = await Feedback.findOne({
            user: req.user._id,
            date: {
                $gte: new Date(feedbackDate.setHours(0, 0, 0, 0)),
                $lt: new Date(feedbackDate.setHours(23, 59, 59, 999))
            }
        });

        if (existingFeedback) {
            return res.status(400).json({ status: 'error', message: 'You have already submitted feedback for this date' });
        }

        const feedback = await Feedback.create({
            user: req.user._id,
            date: new Date(date), // use original date string
            rating,
            comment
        });

        res.status(201).json({
            status: 'success',
            data: feedback
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ status: 'error', message: 'You have already submitted feedback for this date' });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Get feedback
// @route   GET /api/feedback
// @access  Private
export const getFeedback = async (req, res) => {
    try {
        let feedbackList;

        if (req.user.role === 'student') {
            // Students only see their own feedback
            feedbackList = await Feedback.find({ user: req.user._id }).sort({ date: -1 });
        } else if (req.user.role === 'mess_committee') {
            // Committee sees all feedback AND who submitted it
            feedbackList = await Feedback.find()
                .populate('user', 'name email department branch year')
                .sort({ date: -1 });
        } else if (req.user.role === 'vendor') {
            // Vendors see all feedback but NOT who submitted it
            feedbackList = await Feedback.find()
                .select('-user') // exclude the user field
                .sort({ date: -1 });
        }

        res.status(200).json({
            status: 'success',
            count: feedbackList?.length || 0,
            data: feedbackList || []
        });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Update feedback
// @route   PATCH /api/feedback/:id
// @access  Private (Student only)
export const updateFeedback = async (req, res) => {
    try {
        const { rating, comment } = req.body;

        if (req.user.role !== 'student') {
            return res.status(403).json({ status: 'error', message: 'Only students can update feedback' });
        }

        let feedback = await Feedback.findById(req.params.id);

        if (!feedback) {
            return res.status(404).json({ status: 'error', message: 'Feedback not found' });
        }

        // Ensure the feedback belongs to the logged in student
        if (feedback.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to update this feedback' });
        }

        if (rating) feedback.rating = rating;
        if (comment !== undefined) feedback.comment = comment; // Allow empty string comments

        const updatedFeedback = await feedback.save();

        res.status(200).json({
            status: 'success',
            data: updatedFeedback
        });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private (Student only)
export const deleteFeedback = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ status: 'error', message: 'Only students can delete feedback' });
        }

        const feedback = await Feedback.findById(req.params.id);

        if (!feedback) {
            return res.status(404).json({ status: 'error', message: 'Feedback not found' });
        }

        // Ensure the feedback belongs to the logged in student
        if (feedback.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: 'error', message: 'Not authorized to delete this feedback' });
        }

        await feedback.deleteOne();

        res.status(200).json({
            status: 'success',
            message: 'Feedback deleted successfully'
        });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};
