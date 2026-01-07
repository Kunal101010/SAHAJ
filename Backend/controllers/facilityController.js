const Facility = require('../model/facility');

exports.getAllFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find({ isActive: true }).sort('name');
    res.json({ success: true, facilities });
  } catch (err) {
    console.error('Get facilities error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
