const User = require('../model/user');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const sendEmail = require('../services/sendEmail');

const generateToken = (userId, role) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in environment');
  }

  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const formatUserResponse = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  phone: user.phone,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role
});

exports.signup = async (req, res) => {
  // Check for input errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { username, email, phone, password, firstName, lastName, role } = req.body;

  try {
    // 1. Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    // 2. Create new user object
    const user = new User({
      username,
      email,
      phone,
      password, // Mongoose will hash this automatically (see User model)
      firstName,
      lastName,
      role: role || 'employee' // Default role is employee
    });

    // 3. Save user to database
    await user.save();

    // 4. Generate login token immediately
    const token = generateToken(user._id, user.role);

    // 5. Respond with success
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: formatUserResponse(user)
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  // Check if there are any validation errors (like missing email/password)
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { emailOrUsername, password } = req.body;

  try {
    // 1. Find user by either email or username
    // We explicitly select the password field because it's usually hidden
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
    }).select('+password');

    // 2. If no user found, return error
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 3. Check if account is active (not banned/deleted)
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    // 4. Compare the provided password with the hashed password in database
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // 5. Generate a secure token (JWT) for the user to stay logged in
    const token = generateToken(user._id, user.role);

    // 6. Send back success response with token and user info
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: formatUserResponse(user)
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.logout = (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};

exports.updateProfile = async (req, res) => {
  const { firstName, lastName, phone } = req.body;

  if (req.body.username || req.body.email) {
    return res.status(400).json({
      success: false,
      message: 'Username and email cannot be changed'
    });
  }

  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (phone !== undefined) user.phone = phone.trim();

    await user.save();

    const updatedUser = await User.findById(req.user.id).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUserResponse(updatedUser)
    });
  } catch (err) {
    console.error('UpdateProfile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('ChangePassword error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    // 1. Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User with this email does not exist' });
    }

    // 2. Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Hash the OTP for security before saving to DB
    const resetTokenHash = crypto.createHash('sha256').update(otp).digest('hex');

    // 4. Set expiry time (10 minutes from now)
    const tokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // 5. Save hashed OTP and expiry to user document
    user.passwordResetToken = resetTokenHash;
    user.resetTokenExpiry = tokenExpiry;
    await user.save();

    // 6. Send the Plain OTP via email (not the hashed one)
    await sendEmail({
      email: user.email,
      subject: 'Password Reset OTP - Sahaj FMS',
      message: `
        Hello ${user.firstName || user.username},
        
        You have requested to reset your password. Use the following One-Time Password (OTP) to reset it:
        
        ${otp}
        
        This code will expire in 10 minutes.
        
        If you did not request this, please ignore this email.
        
        Best regards,
        Sahaj FMS Team
      `
    });

    res.json({
      success: true,
      message: 'OTP sent to your email'
    });
  } catch (err) {
    console.error('ForgotPassword error:', err);
    res.status(500).json({ success: false, message: 'Error sending OTP. Please try again.' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ success: false, message: 'Email, OTP, and new password are required' });
  }

  try {
    // 1. Hash the provided OTP to compare with stored hash
    const resetTokenHash = crypto.createHash('sha256').update(otp).digest('hex');

    // 2. Find user that matches Email AND Hashed OTP AND Token is not expired
    const user = await User.findOne({
      email: email.toLowerCase(),
      passwordResetToken: resetTokenHash,
      resetTokenExpiry: { $gt: new Date() } // $gt means "Greater Than" (time in future)
    }).select('+password');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // 3. Update password and clear reset tokens
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (err) {
    console.error('ResetPassword error:', err);
    res.status(500).json({ success: false, message: 'Error resetting password. Please try again.' });
  }
};