import MessRequest from '../models/messRequest.model.js';
import Mess from '../models/mess.model.js';
import User from '../models/user.model.js';
import { notifyUser, notifyMultipleUsers } from '../utils/notificationService.js';

// @desc    Create a new mess request (equipment, maintenance, other)
// @route   POST /api/mess-requests
// @access  Private (Vendor only)
export const createMessRequest = async (req, res) => {
  try {
    const { title, category, description, priority, estimatedCost } = req.body;

    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        status: 'error',
        message: 'Only vendors can submit mess maintenance requests'
      });
    }

    // Ensure vendor has an assigned mess
    const messId = req.user.messAssigned;
    if (!messId) {
      return res.status(400).json({
        status: 'error',
        message: 'You must be assigned to an active mess to submit requests'
      });
    }

    if (!req.collegeId) {
      return res.status(400).json({
        status: 'error',
        message: 'Your account is not linked to any college campus'
      });
    }

    // Handle image upload from file or body
    let image = '';
    if (req.file) {
      image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      image = req.body.image;
    }

    const messRequest = await MessRequest.create({
      title,
      category,
      description,
      priority: priority || 'MEDIUM',
      estimatedCost: estimatedCost ? Number(estimatedCost) : null,
      image,
      vendor: req.user._id,
      mess: messId,
      college: req.collegeId
    });

    const populated = await MessRequest.findById(messRequest._id)
      .populate('vendor', 'name email phoneNumber companyName')
      .populate('mess', 'name');

    // Notify College Admins in real-time
    (async () => {
      try {
        const admins = await User.find({ collegeId: req.collegeId, role: 'college_admin' }).select('_id');
        if (admins.length > 0) {
          await notifyMultipleUsers(
            admins.map((a) => a._id),
            {
              collegeId: req.collegeId,
              title: 'New Mess Maintenance Request',
              message: `Vendor ${req.user.name} submitted a ${category.replace('_', ' ')} request: "${title}".`,
              type: 'MAINTENANCE_REQUEST',
              link: '/mess-requests',
              metadata: { requestId: messRequest._id }
            }
          );
        }
      } catch (notifyErr) {
        console.error('Failed to notify admins of mess request:', notifyErr.message);
      }
    })();

    return res.status(201).json({
      status: 'success',
      data: populated,
      message: 'Mess request submitted to College Admin successfully'
    });
  } catch (error) {
    console.error('Error creating mess request:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to submit mess request'
    });
  }
};

// @desc    Get mess requests (scoped to role and college)
// @route   GET /api/mess-requests
// @access  Private (Vendor, College Admin, Mess Committee, Super Admin)
export const getMessRequests = async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    const filter = {};

    // Strict multi-tenant scoping
    if (req.user.role === 'vendor') {
      filter.vendor = req.user._id;
    } else if (['college_admin', 'mess_committee'].includes(req.user.role)) {
      filter.college = req.collegeId;
    } else if (req.user.role === 'super_admin') {
      if (req.collegeId) {
        filter.college = req.collegeId;
      }
    } else {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view mess requests'
      });
    }

    // Optional query filters
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const requests = await MessRequest.find(filter)
      .populate('vendor', 'name email phoneNumber companyName')
      .populate('mess', 'name')
      .populate('college', 'name code')
      .populate('actionTakenBy', 'name role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      data: requests
    });
  } catch (error) {
    console.error('Error fetching mess requests:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to load mess requests'
    });
  }
};

// @desc    Update request status & admin remarks
// @route   PATCH /api/mess-requests/:id/status
// @access  Private (College Admin, Super Admin)
export const updateMessRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminRemarks } = req.body;

    const allowedStatuses = ['APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      });
    }

    // Rejection requires a reason
    if (status === 'REJECTED' && (!adminRemarks || !adminRemarks.trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a reason when rejecting a request'
      });
    }

    const messRequest = await MessRequest.findById(id);
    if (!messRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Mess request not found'
      });
    }

    // Multi-tenant check: College Admin can only act on their own college's requests
    if (req.user.role === 'college_admin') {
      if (messRequest.college.toString() !== req.collegeId.toString()) {
        return res.status(403).json({
          status: 'error',
          message: 'Not authorized to act on requests from another campus'
        });
      }
    }

    messRequest.status = status;
    if (adminRemarks !== undefined) {
      messRequest.adminRemarks = adminRemarks.trim();
    }
    messRequest.actionTakenBy = req.user._id;
    messRequest.actionTakenAt = new Date();

    await messRequest.save();

    const populated = await MessRequest.findById(messRequest._id)
      .populate('vendor', 'name email phoneNumber companyName')
      .populate('mess', 'name')
      .populate('college', 'name code')
      .populate('actionTakenBy', 'name role');

    // Notify vendor in real-time
    (async () => {
      try {
        await notifyUser({
          recipient: messRequest.vendor,
          collegeId: messRequest.college,
          title: `Request ${status.replace('_', ' ')}`,
          message: `College Admin updated your request "${messRequest.title}" to ${status.replace('_', ' ')}.${adminRemarks ? ` Remarks: "${adminRemarks}"` : ''}`,
          type: 'MAINTENANCE_REQUEST',
          link: '/mess-requests',
          metadata: { requestId: messRequest._id }
        });
      } catch (notifyErr) {
        console.error('Failed to notify vendor of request status:', notifyErr.message);
      }
    })();

    return res.status(200).json({
      status: 'success',
      data: populated,
      message: `Request status updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating mess request status:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update request status'
    });
  }
};

// @desc    Delete a pending mess request
// @route   DELETE /api/mess-requests/:id
// @access  Private (Vendor who created it, while PENDING)
export const deleteMessRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const messRequest = await MessRequest.findById(id);

    if (!messRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Mess request not found'
      });
    }

    // Only the owner vendor can delete it
    if (messRequest.vendor.toString() !== req.user._id.toString() && req.user.role !== 'super_admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this request'
      });
    }

    // Cannot delete once action has been taken by college admin
    if (messRequest.status !== 'PENDING' && req.user.role !== 'super_admin') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete a request that has already been reviewed or processed'
      });
    }

    await MessRequest.findByIdAndDelete(id);

    return res.status(200).json({
      status: 'success',
      message: 'Mess request deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting mess request:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete mess request'
    });
  }
};
