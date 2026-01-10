// routes/authRoutes.js

const express = require('express');
const { signup, login, getMe, logout, updateProfile, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

// Validation chains
const signupValidation = [
  body('username')
    .trim()
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
    .notEmpty().withMessage('Username is required'),
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('phone')
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Please provide a valid phone number'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

const loginValidation = [
  body('emailOrUsername')
    .notEmpty().withMessage('Email or username is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .not().isIn(['12345678', 'password', '123456789']).withMessage('Choose a stronger password'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) {
      throw new Error('Passwords do not match');
    }
    return true;
  })
];

// Routes
router.post('/signup', signupValidation, signup);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.patch('/profile', protect, updateProfile);
router.patch('/change-password', protect, changePasswordValidation, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;