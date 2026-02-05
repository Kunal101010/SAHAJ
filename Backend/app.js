const express = require("express")
const app = express()
const cors = require("cors");

// Import Route Handlers (These files define what happens for specific URLs)
const authRoutes = require('./routes/authRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const adminRoutes = require('./routes/adminRoutes')
const facilityRoutes = require('./routes/facilityRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Load environment variables (like passwords/secrets) from .env file
require("dotenv").config()

// Connect to MongoDB Database
const { connectDatabase } = require("./database/database")
connectDatabase()

// Middleware: Parse incoming JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware: Enable CORS (Cross-Origin Resource Sharing)
// Allows our Frontend (running on port 5173) to talk to this Backend
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Test route to check if server is running
app.get("/", (req, res) => {
    res.status(200).json({
        message: "I am alive"
    })
})

// API Route Mapping
// e.g., Request to /api/auth/login -> goes to authRoutes
app.use('/api/auth', authRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);

const port = process.env.PORT
// Start the server listening on the defined port
app.listen(port, () => {
    console.log("Running on port " + port)
})
