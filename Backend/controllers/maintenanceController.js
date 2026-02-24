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

    // 3. Respond immediately — notifications run in the background
    res.status(201).json({ success: true, data: request });

    // 4. Fire-and-forget: send notifications without blocking the response
    Promise.all([
      User.findById(req.user.id).select('firstName lastName'),
      notificationService.getUsersByRole(['admin', 'manager'])
    ]).then(([submittedUser, adminAndManagerIds]) => {
      if (adminAndManagerIds.length > 0) {
        const notificationData = notificationService.requestCreatedNotification(
          request._id,
          request.title,
          submittedUser?.firstName || submittedUser?.username || 'User'
        );
        notificationService.notifyMultiple(adminAndManagerIds, notificationData).catch(console.error);
      }
    }).catch(console.error);
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

    // Emit socket event immediately (no DB lookup needed)
    try {
      getSocketIO().emit('request_updated', request);
    } catch (e) {
      console.error('Socket emit error:', e.message);
    }

    // Respond immediately — DB notification writes run in the background
    res.json({ success: true, data: request });

    // Fire-and-forget: send notifications without blocking the response
    if (req.body.status === 'Completed') {
      const completionNotification = notificationService.requestCompletedNotification(
        request._id,
        request.title
      );
      // Notify user + admins/managers in parallel
      Promise.all([
        notificationService.notify(request.submittedBy._id, completionNotification),
        notificationService.getUsersByRole(['admin', 'manager']).then(ids =>
          ids.length > 0 ? notificationService.notifyMultiple(ids, completionNotification) : null
        )
      ]).catch(console.error);
    } else if (oldStatus !== req.body.status) {
      const statusChangeNotification = notificationService.requestStatusChangedNotification(
        request._id,
        request.title,
        req.body.status
      );
      notificationService.notify(request.submittedBy._id, statusChangeNotification).catch(console.error);
    }
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

    // Emit socket event immediately
    try {
      getSocketIO().emit('request_updated', request);
    } catch (e) {
      console.error('Socket emit error:', e.message);
    }

    const populatedRequest = await populateRequest(
      MaintenanceRequest.findById(request._id)
    );

    // Respond immediately — notifications run in the background
    res.json({ success: true, data: populatedRequest });

    // Fire-and-forget: fetch technician details and send both notifications in parallel
    User.findById(technicianId).select('firstName lastName username').then(technician => {
      const name = technician?.firstName || technician?.username || 'Technician';
      Promise.all([
        notificationService.notify(
          technicianId,
          notificationService.requestAssignedToTechnicianNotification(request._id, request.title, name)
        ),
        notificationService.notify(
          request.submittedBy,
          notificationService.requestAssignedNotificationToUser(request._id, request.title, name)
        )
      ]).catch(console.error);
    }).catch(console.error);
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