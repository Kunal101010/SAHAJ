const express = require('express');
const { protect } = require('../middleware/auth');
const { getAllFacilities } = require('../controllers/facilityController');

const router = express.Router();

// Public routes for viewing facilities (employees can access)
router.get('/', getAllFacilities);

module.exports = router;
