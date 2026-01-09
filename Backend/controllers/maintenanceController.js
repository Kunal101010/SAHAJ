// controllers/maintenanceController.js

const MaintenanceRequest = require('../model/maintenanceRequest');
const { validationResult } = require('express-validator');

exports.createRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const request = new MaintenanceRequest({
      ...req.body,
      submittedBy: req.user.id
    });
    await request.save();

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getRequests = async (req, res) => {
  try {
    let query = {};
    // Everyone only sees their own requests
    query.submittedBy = req.user.id;

    const requests = await MaintenanceRequest.find(query)
      .populate('submittedBy', 'username firstName lastName')
      .populate('assignedTo', 'username firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: requests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('submittedBy', 'username firstName lastName')
      .populate('assignedTo', 'username firstName lastName');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Debug logging
    console.log('User ID:', req.user.id);
    console.log('User Role:', req.user.role);
    console.log('Request submittedBy:', request.submittedBy);
    console.log('Request assignedTo:', request.assignedTo);

    // Check access - more permissive for viewing
    if (req.user.role === 'employee') {
      const submittedById = request.submittedBy._id ? request.submittedBy._id.toString() : request.submittedBy.toString();
      if (submittedById !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized - can only view your own requests' });
      }
    }
    // Technicians can view any request (not just assigned ones) for details
    // Managers and Admins can view any request

    res.json({ success: true, data: request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateRequest = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Only the user who submitted the request can update it
    if (request.submittedBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only the request submitter can update this request' });
    }

    // If status is no longer Pending, no updates allowed
    if (request.status !== 'Pending') {
      return res.status(403).json({ success: false, message: 'Cannot edit request that is not pending' });
    }

    // Cannot change status field
    const { status, ...updateData } = req.body;
    Object.assign(request, updateData);

    await request.save();

    res.json({ success: true, data: request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // Only technicians, managers, admins can update status
    if (!['technician', 'manager', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (req.user.role === 'technician' && request.assignedTo?.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not assigned to you' });
    }

    request.status = req.body.status;
    await request.save();

    res.json({ success: true, data: request });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Dashboard Stats Endpoints

exports.getStats = async (req, res) => {
  try {
    const total = await MaintenanceRequest.countDocuments();
    const pending = await MaintenanceRequest.countDocuments({ status: 'Pending' });
    const inProgress = await MaintenanceRequest.countDocuments({ status: 'In Progress' });
    const completed = await MaintenanceRequest.countDocuments({ status: 'Completed' });

    res.json({
      success: true,
      data: { total, pending, inProgress, completed }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
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
    res.status(500).json({ success: false, message: 'Server error' });
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
    res.status(500).json({ success: false, message: 'Server error' });
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
    res.status(500).json({ success: false, message: 'Server error' });
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
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await MaintenanceRequest.find()
      .populate('submittedBy', 'firstName lastName username email')
      .populate('assignedTo', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};