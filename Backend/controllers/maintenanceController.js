const MaintenanceRequest = require('../model/maintenanceRequest');
const User = require('../model/user');
const { validationResult } = require('express-validator');
const notificationService = require('../services/notificationService');

const handleError = (res, err, message = 'Server error') => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message });
};

const populateRequest = (query) => {
  return query
    .populate('submittedBy', 'username firstName lastName')
    .populate('assignedTo', 'username firstName lastName');
};

exports.createRequest = async (req, res) => {
  // Validate input (e.g. title is required)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    // 1. Create a new request object with data from frontend
    // We automatically set 'submittedBy' to the current logged-in user
    const request = new MaintenanceRequest({
      ...req.body,
      submittedBy: req.user.id
    });

    // 2. Save to database
    await request.save();

    // 3. Send Notifications
    // Find all store managers and admins to notify them
    const adminAndManagerIds = await notificationService.getUsersByRole(['admin', 'manager']);
    const submittedUser = await User.findById(req.user.id).select('firstName lastName');

    if (adminAndManagerIds.length > 0) {
      // Create notification message
      const notificationData = notificationService.requestCreatedNotification(
        request._id,
        request.title,
        submittedUser.firstName || submittedUser.username || 'User'
      );

      // Send notification (saved to DB and/or real-time)
      await notificationService.notifyMultiple(adminAndManagerIds, notificationData);
    }

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getRequests = async (req, res) => {
  try {
    const requests = await populateRequest(
      MaintenanceRequest.find({ submittedBy: req.user.id })
    ).sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getAssignedRequests = async (req, res) => {
  try {
    const requests = await populateRequest(
      MaintenanceRequest.find({ assignedTo: req.user.id })
    ).sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const request = await populateRequest(
      MaintenanceRequest.findById(req.params.id)
    );

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (req.user.role === 'employee') {
      const submittedById = request.submittedBy._id
        ? request.submittedBy._id.toString()
        : request.submittedBy.toString();

      if (submittedById !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized - can only view your own requests'
        });
      }
    }

    res.json({ success: true, data: request });
  } catch (err) {
    handleError(res, err);
  }
};

exports.updateRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.submittedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the request submitter can update this request'
      });
    }

    if (request.status !== 'Pending') {
      return res.status(403).json({
        success: false,
        message: 'Cannot edit request that is not pending'
      });
    }

    const { status, ...updateData } = req.body;
    Object.assign(request, updateData);
    await request.save();

    res.json({ success: true, data: request });
  } catch (err) {
    handleError(res, err);
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('submittedBy', 'firstName lastName username');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (!['technician', 'manager', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (req.user.role === 'technician' && request.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not assigned to you' });
    }

    const oldStatus = request.status;
    request.status = req.body.status;
    await request.save();

    // Emit Socket Event
    try {
      getSocketIO().emit('request_updated', request);
    } catch (e) {
      console.error('Socket emit error:', e.message);
    }

    // Send notifications when status changes to "Completed"
    if (req.body.status === 'Completed') {
      const adminAndManagerIds = await notificationService.getUsersByRole(['admin', 'manager']);
      const completionNotification = notificationService.requestCompletedNotification(
        request._id,
        request.title
      );

      // Notify user
      await notificationService.notify(request.submittedBy._id, completionNotification);

      // Notify admin and managers
      if (adminAndManagerIds.length > 0) {
        await notificationService.notifyMultiple(adminAndManagerIds, completionNotification);
      }
    } else if (oldStatus !== req.body.status) {
      // Notify user about status change
      const statusChangeNotification = notificationService.requestStatusChangedNotification(
        request._id,
        request.title,
        req.body.status
      );
      await notificationService.notify(request.submittedBy._id, statusChangeNotification);
    }

    res.json({ success: true, data: request });
  } catch (err) {
    handleError(res, err);
  }
};

exports.assignTechnician = async (req, res) => {
  try {
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({ success: false, message: 'Technician ID is required' });
    }

    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('submittedBy', 'firstName lastName username');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (!['manager', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only managers and admins can assign technicians'
      });
    }

    request.assignedTo = technicianId;
    request.status = 'In Progress';
    await request.save();

    // Emit Socket Event
    try {
      getSocketIO().emit('request_updated', request);
    } catch (e) {
      console.error('Socket emit error:', e.message);
    }

    // Get technician details for notification
    const technician = await User.findById(technicianId).select('firstName lastName username');

    // Notify technician about assignment
    const techNotificationData = notificationService.requestAssignedToTechnicianNotification(
      request._id,
      request.title,
      technician.firstName || technician.username
    );
    await notificationService.notify(technicianId, techNotificationData);

    // Notify user about technician assignment
    const userNotificationData = notificationService.requestAssignedNotificationToUser(
      request._id,
      request.title,
      technician.firstName || technician.username
    );
    await notificationService.notify(request.submittedBy, userNotificationData);

    const populatedRequest = await populateRequest(
      MaintenanceRequest.findById(request._id)
    );

    res.json({ success: true, data: populatedRequest });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getStats = async (req, res) => {
  try {
    const [total, pending, inProgress, completed] = await Promise.all([
      MaintenanceRequest.countDocuments(),
      MaintenanceRequest.countDocuments({ status: 'Pending' }),
      MaintenanceRequest.countDocuments({ status: 'In Progress' }),
      MaintenanceRequest.countDocuments({ status: 'Completed' })
    ]);

    res.json({
      success: true,
      data: { total, pending, inProgress, completed }
    });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getMonthlyTrend = async (req, res) => {
  try {
    const trend = await MaintenanceRequest.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ success: true, data: trend });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getByCategory = async (req, res) => {
  try {
    const categories = await MaintenanceRequest.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({ success: true, data: categories });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getStatusDistribution = async (req, res) => {
  try {
    const distribution = await MaintenanceRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({ success: true, data: distribution });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getRecent = async (req, res) => {
  try {
    const recent = await MaintenanceRequest.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('assignedTo', 'firstName lastName');

    res.json({ success: true, data: recent });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await populateRequest(
      MaintenanceRequest.find()
    ).sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (err) {
    handleError(res, err);
  }
};