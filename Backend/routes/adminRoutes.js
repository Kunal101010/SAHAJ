const express = require('express');
const { protect, authorize } = require('../middleware/auth');
// const {getUsers, createUser, updateUser} = require('../controllers/adminController');
const {
  getUsers, createUser, updateUser,
  getAllFacilities, // Public endpoint
  getFacilities,
  createFacility,
  updateFacility,
  deleteFacility
} = require('../controllers/adminController');

const router = express.Router();

// Public route for viewing facilities (all authenticated users can access)
router.get('/facilities/public', getAllFacilities);

// All routes protected and admin only
router.use(protect, authorize('admin'));

//user management admin routes
router.route('/users')
  .get(getUsers)
  .post(createUser);

router.route('/users/:id')
  .patch(updateUser);

//facility routes  
router.route('/facilities')
  .get(getFacilities)
  .post(createFacility);

router.route('/facilities/:id')
  .patch(updateFacility)
  .delete(deleteFacility);

module.exports = router;