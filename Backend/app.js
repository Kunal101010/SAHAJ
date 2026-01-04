const express = require("express")
const app = express()
const cors = require("cors");

//routes here
const authRoutes = require('./routes/authRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const adminRoutes = require('./routes/adminRoutes')



//Tell node to use Dotenv
require("dotenv").config()

//Database connection
const { connectDatabase } = require("./database/database")
connectDatabase()

//using json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: 'http://localhost:5173',  
  credentials: true
}));
//test api to check if server is live or not
app.get("/", (req, res) => {
    res.status(200).json({
        message: "I am alive"
    })
})


app.use('/api/auth', authRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/admin', adminRoutes);

const port = process.env.PORT
//listen server
app.listen(port, () => {
    console.log("Running on port " + port)
})
