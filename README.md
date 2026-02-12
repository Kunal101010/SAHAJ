# Sahaj-FMS (Facility Management System)

A comprehensive Facility Management System designed to streamline maintenance requests, facility bookings, and user management. This system provides role-based access for Admins, Managers, Technicians, and standard Users.

## 🚀 Tech Stack

### Frontend
*   **React (v19)**: A JavaScript library for building user interfaces, utilizing a component-based architecture for efficient rendering.
*   **Vite**: A fast build tool and development server that provides instant hot module replacement (HMR).
*   **Tailwind CSS (v4)**: A utility-first CSS framework for rapidly building custom designs without leaving your HTML.
*   **React Router (v7)**: Handles client-side routing, enabling navigation between views without reloading the page.
*   **Framer Motion**: A production-ready motion library for React to create fluid animations and gestures.
*   **Recharts**: A composable charting library built on React components for data visualization.
*   **Axios**: A promise-based HTTP client for making asynchronous requests to the backend API.

### Backend
*   **Node.js**: A JavaScript runtime built on Chrome's V8 engine for executing server-side code.
*   **Express.js**: A minimal and flexible Node.js web application framework that manages routes and middleware.
*   **MongoDB**: A NoSQL database that stores data in flexible, JSON-like documents.
*   **Mongoose**: An Object Data Modeling (ODM) library for MongoDB and Node.js, providing schema-based solution to model application data.
*   **JSON Web Tokens (JWT)**: A standard for securely transmitting information between parties as a JSON object, used here for authentication.
*   **Nodemailer**: A module for Node.js applications to send emails easily.


---

## 📂 Backend Architecture & File Explanation

This section provides a detailed explanation of the backend file structure and the purpose of each file.

### 1. `app.js` (Root)
*   **Purpose**: The entry point of the backend application.
*   **Functionality**:
    *   Initializes the Express application.
    *   Connects to the MongoDB database using `connectDatabase()`.
    *   Sets up middleware like `cors` (for frontend communication) and `express.json()` (for parsing request bodies).
    *   Defines the base API routes (e.g., `/api/auth`, `/api/maintenance`).
    *   Start the server on the defined PORT.

### 2. `database/`
*   **`database.js`**:
    *   Handles the connection to the MongoDB database using `mongoose.connect()`.
    *   Contains a helper function `createAdminUser()` that checks if an admin exists and creates one if not (seeding the database).

### 3. `middleware/`
*   **`auth.js`**:
    *   **protect**: Verifies the JWT token from the `Authorization` header. If valid, attaches the user to the request object (`req.user`).
    *   **authorize**: Checks if the authenticated user has the required specific role (e.g., 'admin', 'manager') to access a route.

### 4. `model/` (Mongoose Schemas)
*   **`user.js`**: Defines the `User` schema (username, email, password, role, etc.). Includes a pre-save hook to hash passwords using `bcryptjs` and a method to compare passwords for login.
*   **`maintenanceRequest.js`**: Schema for maintenance tickets (description, priority, status, assigned technician, images).
*   **`booking.js`**: Schema for facility bookings (facility ID, user ID, start time, end time, status).
*   **`facility.js`**: Schema for facility details (name, description, capacity, image).
*   **`notification.js`**: Schema for storing system notifications for users.

### 5. `controllers/` (Business Logic)
*   **`authController.js`**: Handles user registration, login, password reset, and logout. Generates JWT tokens.
*   **`maintenanceController.js`**: Manages CRUD operations for maintenance requests. Includes logic for assigning technicians and updating request status.
*   **`bookingController.js`**: Handles facility booking requests, availability checks, and cancellations.
*   **`adminController.js`**: logic for admin-specific tasks like managing users and viewing system-wide stats.
*   **`facilityController.js`**: Manages adding, updating, and deleting facilities.
*   **`notificationController.js`**: Handles fetching and marking notifications as read.

### 6. `routes/` (API Endpoints)
*   **`authRoutes.js`**: Maps endpoints like `/register`, `/login` to functions in `authController`.
*   **`maintenanceRoutes.js`**: Routes for creating and listing maintenance requests. Protected by `auth` middleware.
*   **`bookingRoutes.js`**: Routes for facility bookings.
*   **`adminRoutes.js`**: Protected routes accessible only by admins.
*   **`facilityRoutes.js`**: Routes for viewing and managing facilities.
*   **`notificationRoutes.js`**: Routes for user notifications.

### 7. `services/` (Helper Functions)
*   **`sendEmail.js`**: Uses `nodemailer` to send transactional emails (e.g., password resets, booking confirmations).
*   **`notificationService.js`**: specialized logic for creating and pushing notifications to users.
*   **`catchAsync.js`**: A wrapper function to handle asynchronous errors in controllers (avoids repetitive try-catch blocks).

---

## 📂 Project Structure

```
Sahaj-FMS/
├── Backend/                 # Server-side application
│   ├── app.js               # Application entry point
│   ├── controllers/         # Request logic (Auth, Booking, Maintenance)
│   ├── middleware/          # Auth verification, validation
│   ├── model/               # Mongoose schemas
│   ├── routes/              # API route definitions
│   └── ...
└── frontend/                # Client-side application
    ├── src/
    │   ├── components/      # Reusable UI components
    │   ├── pages/           # Application pages
    │   ├── services/        # API services (api.js)
    │   ├── contexts/        # React Context (AuthContext)
    │   └── App.jsx          # Main routing & layout component
    └── ...
```

---

## ⚙️ Code Workflow & Architecture

### 1. Authentication Flow
*   **Backend**: Uses `jsonwebtoken` to generate signed tokens upon login.
*   **Frontend**: Stores the token in `localStorage`.
*   **Interceptor**: The `src/services/api.js` file configures Axios to automatically attach the `Authorization: Bearer <token>` header to every outgoing request, ensuring secure communication.

### 2. Frontend Routing
*   **Navigation**: Managed by `react-router-dom` in `App.jsx`.
*   **Protection**: A `PrivateRoute` component checks for a valid token before rendering protected pages (e.g., Dashboard, Profile).
*   **Animations**: `AnimatePresence` and `motion.div` handle smooth page transitions.

### 3. Backend API
*   **Entry Point**: `app.js` initializes the Express app, connects to MongoDB, and sets up middleware (CORS, JSON parsing).
*   **Routes**:
    *   `/api/auth` - Login, Signup
    *   `/api/maintenance` - Request creation and tracking
    *   `/api/bookings` - Facility booking management
    *   `/api/admin` - User and system management
*   **Controllers**: Separate logic from routes to keep code clean and maintainable.
