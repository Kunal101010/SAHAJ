const mongoose = require("mongoose")
const bcrypt = require('bcryptjs');
const User = require("../model/user")

const createAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ 
      $or: [{ email: 'admin@sahaj.com' }, { username: 'admin' }]
    });

    if (adminExists) {
      console.log('Admin user already exists');
      return;
    }

    // Create admin user - password will be hashed by pre-save hook
    const admin = new User({
      username: 'admin',
      email: 'admin@sahaj.com',
      phone: '980000000',
      password: 'Admin@123', // This will be hashed automatically
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      isActive: true
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@sahaj.com');
    console.log('Username: admin');
    console.log('Password: Admin@123');
  } catch (err) {
    console.error('Error creating admin:', err);
  }
};

exports.connectDatabase = async () => {
    await mongoose.connect(process.env.MONGO_URI)
    console.log("Database connected successfully")
    createAdminUser();

   

}


// Only run in development (not production)
// if (process.env.NODE_ENV !== 'production') {
//   createAdminUser();
// }