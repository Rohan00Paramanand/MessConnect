import MessVisit from '../models/messVisit.model.js';
import User from '../models/user.model.js';
import Mess from '../models/mess.model.js';
import { sendEmail } from '../utils/sendEmail.js';
import { visitScheduledEmailTemplate } from '../utils/emailTemplates.js';

/**
 * 1. College Admin: Get eligible Committee Members for dropdown
 */
export const getCollegeCommitteeMembers = async (req, res) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const members = await User.find({
      collegeId,
      role: 'mess_committee',
      isActive: true,
      isApprovedByAdmin: true
    })
      .populate('messAssigned', 'name')
      .select('name email phoneNumber messAssigned');

    res.status(200).json({ status: 'success', data: members });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * 2. College Admin: Schedule a Visit & Trigger Email
 */
export const scheduleVisit = async (req, res) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { messId, assignedTo, visitDate, purpose, instructions } = req.body;

    if (!messId || !assignedTo || !visitDate || !purpose) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide mess, committee member, visit date, and purpose.'
      });
    }

    // Verify committee member belongs to this college
    const committeeMember = await User.findOne({
      _id: assignedTo,
      collegeId,
      role: 'mess_committee'
    });

    if (!committeeMember) {
      return res.status(404).json({
        status: 'error',
        message: 'Selected committee member not found or does not belong to your college.'
      });
    }

    // Verify mess
    const mess = await Mess.findOne({ _id: messId, collegeId });
    if (!mess) {
      return res.status(404).json({
        status: 'error',
        message: 'Selected mess not found in your college.'
      });
    }

    const visit = await MessVisit.create({
      collegeId,
      messId,
      assignedTo,
      scheduledBy: req.user._id,
      visitDate: new Date(visitDate),
      purpose: purpose.trim(),
      instructions: instructions ? instructions.trim() : ''
    });

    // Populate mess and assignedTo for response
    await visit.populate([
      { path: 'messId', select: 'name' },
      { path: 'assignedTo', select: 'name email phoneNumber' }
    ]);

    // Send email notification to committee member
    try {
      const clientUrl = process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(',')[0].trim()
        : 'http://localhost:3000';

      const emailHtml = visitScheduledEmailTemplate({
        memberName: committeeMember.name,
        messName: mess.name,
        visitDate,
        purpose,
        instructions,
        dashboardUrl: `${clientUrl}/dashboard/mess_committee`
      });

      await sendEmail({
        email: committeeMember.email,
        subject: `[Inspection Scheduled] Mess Visit for ${mess.name}`,
        message: `You have an inspection scheduled for ${mess.name} on ${new Date(visitDate).toLocaleDateString()}. Please check your Committee Portal.`,
        html: emailHtml
      });
    } catch (err) {
      console.error('[EMAIL WARNING] Failed to send visit schedule email:', err.message);
    }

    res.status(201).json({
      status: 'success',
      data: visit,
      message: 'Inspection visit scheduled successfully and email notification sent.'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * 3. College Admin: List all visits for their college
 */
export const getCollegeVisits = async (req, res) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;

    // Automatically transition past SCHEDULED visits to DID_NOT_VISIT
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const localTodayStart = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

    await MessVisit.updateMany(
      {
        collegeId,
        status: 'SCHEDULED',
        visitDate: { $lt: localTodayStart }
      },
      {
        $set: { status: 'DID_NOT_VISIT' }
      }
    );

    const visits = await MessVisit.find({ collegeId })
      .populate('messId', 'name')
      .populate('assignedTo', 'name email phoneNumber')
      .populate('scheduledBy', 'name email')
      .populate('adminReview.reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ status: 'success', data: visits });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * 4. Mess Committee: Get My Assigned Visits
 */
export const getMyVisits = async (req, res) => {
  try {
    // Automatically transition past SCHEDULED visits to DID_NOT_VISIT
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const localTodayStart = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

    await MessVisit.updateMany(
      {
        assignedTo: req.user._id,
        status: 'SCHEDULED',
        visitDate: { $lt: localTodayStart }
      },
      {
        $set: { status: 'DID_NOT_VISIT' }
      }
    );

    const visits = await MessVisit.find({ assignedTo: req.user._id })
      .populate('messId', 'name location')
      .populate('scheduledBy', 'name email')
      .sort({ visitDate: 1 });

    res.status(200).json({ status: 'success', data: visits });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * 5. Mess Committee: Submit Report + Selfie Photo
 */
export const submitVisitReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    const visit = await MessVisit.findOne({ _id: id, assignedTo: req.user._id });
    if (!visit) {
      return res.status(404).json({
        status: 'error',
        message: 'Visit not found or you are not authorized to submit for this inspection.'
      });
    }

    if (visit.status === 'DID_NOT_VISIT') {
      return res.status(400).json({
        status: 'error',
        message: 'The scheduled date for this visit has passed. It has been marked as Did Not Visit.'
      });
    }

    if (visit.status === 'COMPLETED') {
      return res.status(400).json({
        status: 'error',
        message: 'This visit has already been reviewed and completed.'
      });
    }

    if (!req.files || !req.files.report || !req.files.report[0]) {
      return res.status(400).json({
        status: 'error',
        message: 'Inspection report file (PDF or Image) is required.'
      });
    }

    if (!req.files.messPhoto || !req.files.messPhoto[0]) {
      return res.status(400).json({
        status: 'error',
        message: 'Photo of committee member in the mess is required.'
      });
    }

    const reportFile = req.files.report[0];
    const messPhotoFile = req.files.messPhoto[0];

    const isPdf = reportFile.mimetype === 'application/pdf';
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    visit.submission = {
      reportUrl: `${baseUrl}/uploads/${reportFile.filename}`,
      reportType: isPdf ? 'pdf' : 'image',
      messPhotoUrl: `${baseUrl}/uploads/${messPhotoFile.filename}`,
      remarks: remarks ? remarks.trim() : '',
      submittedAt: new Date()
    };
    visit.status = 'IN_REVIEW';

    await visit.save();

    await visit.populate([
      { path: 'messId', select: 'name' },
      { path: 'scheduledBy', select: 'name email' }
    ]);

    res.status(200).json({
      status: 'success',
      data: visit,
      message: 'Inspection report and photo submitted successfully. Awaiting admin verification.'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * 6. College Admin: Mark Visit Done (Approve / Complete)
 */
export const markVisitDone = async (req, res) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { id } = req.params;
    const { remarks } = req.body;

    const visit = await MessVisit.findOne({ _id: id, collegeId });
    if (!visit) {
      return res.status(404).json({
        status: 'error',
        message: 'Visit record not found.'
      });
    }

    if (visit.status !== 'IN_REVIEW') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot mark as done: The committee member has not submitted the inspection report yet.'
      });
    }

    visit.status = 'COMPLETED';
    visit.adminReview = {
      remarks: remarks ? remarks.trim() : 'Inspection verified and accepted.',
      reviewedAt: new Date(),
      reviewedBy: req.user._id
    };

    await visit.save();

    await visit.populate([
      { path: 'messId', select: 'name' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'adminReview.reviewedBy', select: 'name email' }
    ]);

    res.status(200).json({
      status: 'success',
      data: visit,
      message: 'Visit verified and marked as completed.'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

/**
 * 7. College Admin: Delete a Visit
 */
export const deleteVisit = async (req, res) => {
  try {
    const collegeId = req.collegeId || req.user.collegeId;
    const { id } = req.params;

    const visit = await MessVisit.findOneAndDelete({ _id: id, collegeId });
    if (!visit) {
      return res.status(404).json({
        status: 'error',
        message: 'Visit record not found or does not belong to your college.'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Mess inspection visit deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};
