// routes/maintenanceRoutes.js

const express = require('express');
const { body } = require('express-validator');
const { createRequest, getRequests, getRequestById, updateRequest, updateStatus, getStats, getMonthlyTrend, getByCategory, getStatusDistribution, getRecent, getAllRequests, getAssignedRequests, assignTechnician } = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const requestValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('type').isIn(['Electrical', 'Plumbing', 'HVAC', 'IT', 'Cleaning', 'Other']).withMessage('Invalid type'),
  body('priority').isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Invalid priority'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
];

router.post('/requests', protect, authorize('employee', 'manager', 'admin'), requestValidation, createRequest);
router.get('/requests/all', protect, authorize('admin', 'manager'), getAllRequests);
router.get('/requests/assigned', protect, authorize('technician'), getAssignedRequests);
router.get('/technicians', protect, authorize('manager', 'admin'), async (req, res) => {
  try {
    const User = require('../model/user');
    const technicians = await User.find({ role: 'technician' }).select('_id firstName lastName username');
    res.json({ success: true, data: technicians });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.get('/requests/:id', protect, getRequestById);
router.patch('/requests/:id', protect, authorize('employee', 'technician', 'manager', 'admin'), updateRequest);
router.patch('/requests/:id/status', protect, authorize('technician', 'manager', 'admin'), body('status').isIn(['Pending', 'In Progress', 'Completed']), updateStatus);
router.patch('/requests/:id/assign', protect, authorize('manager', 'admin'), assignTechnician);

// Dashboard endpoints (open to all authenticated, but role-filtered in controller if needed)
router.get('/requests', protect, getRequests);
router.get('/stats', protect, getStats);
router.get('/monthly-trend', protect, getMonthlyTrend);
router.get('/by-category', protect, getByCategory);
router.get('/status-distribution', protect, getStatusDistribution);
router.get('/recent', protect, getRecent);

module.exports = router;