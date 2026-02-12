const express = require("express")
const app = express()
const cors = require("cors");
const http = require('http'); // Import HTTP module
const { initSocket } = require('./socket'); // Import socket init function

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const adminRoutes = require('./routes/adminRoutes')
const facilityRoutes = require('./routes/facilityRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Load environment variables
require("dotenv").config()

// Connect to MongoDB Database
const { connectDatabase } = require("./database/database")
connectDatabase()

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Test route
app.get("/", (req, res) => {
    res.status(200).json({
        message: "I am alive"
    })
})

// API Route Mapping
app.use('/api/auth', authRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);

const port = process.env.PORT || 5000;

// Create HTTP server wraps express app
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start the server
server.listen(port, () => {
    console.log("Running on port " + port)
})

