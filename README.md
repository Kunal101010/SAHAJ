# Sahaj FMS (Facility Management System)

## 📌 Project Overview
Sahaj FMS is a comprehensive web-based application designed to streamline facility management operations. It enables administrators to manage facilities and users, allows employees to book facilities and report maintenance issues, and provides technicians with a platform to manage their assigned tasks.

The system is built using the **MERN Stack** (MongoDB, Express.js, React, Node.js) and features role-based access control, real-time notifications, and data visualization.

---

## 🛠 Tech Stack & Dependencies

### Backend (Server-Side)
-   **Node.js**: Runtime environment for executing JavaScript on the server.
-   **Express.js**: Web framework for handling API routes and middleware.
-   **MongoDB & Mongoose**: NoSQL database and Object Data Modeling (ODM) library for data storage.
-   **JWT (JSON Web Token)**: Used for secure user authentication and session management.
-   **BcryptJS**: Hashing library to securely store user passwords.
-   **Nodemailer**: Service to send emails (used for OTP password resets).
-   **Cors**: Middleware to allow cross-origin requests from the frontend.
-   **Dotenv**: Loads environment variables from a `.env` file.

### Frontend (Client-Side)
-   **React**: Library for building the user interface.
-   **Vite**: Fast build tool and development server.
-   **Tailwind CSS**: Utility-first CSS framework for styling.
-   **React Router DOM**: Handles client-side navigation between pages.
-   **Axios**: HTTP client for making API requests to the backend.
-   **Recharts**: Library for rendering charts and graphs (Dashboard analytics).
-   **Framer Motion**: Library for adding animations to UI components.

---

## 🚀 Key Features by Role

### 1. Admin
-   **User Management**: Add, edit, delete, and view system users.
-   **Facility Management**: Create and manage facility details (e.g., conference rooms, workspaces).
-   **Dashboard Analytics**: View high-level stats on bookings, maintenance requests, and active users.

### 2. Manager
-   **Booking Oversight**: View all facility bookings.
-   **Maintenance Oversight**: Monitor maintenance request statuses.
-   **Reports**: Access analytics and system reports.

### 3. Technician
-   **Task Management**: View assigned maintenance requests.
-   **Status Updates**: Mark tasks as "In Progress" or "Completed".
-   **History**: View past completed tasks.

### 4. Employee (Standard User)
-   **Book Facilities**: Reserve rooms or equipment.
-   **Report Issues**: Submit maintenance requests (e.g., broken AC, networking issue).
-   **Profile Management**: Update personal details.

---

## 📂 File Structure & Explanation

### Backend (`/backend`)
| Directory / File | Description |
| :--- | :--- |
| `app.js` / `server.js` | **Entry Point**. Sets up the Express server, connects to MongoDB, and configures middleware. |
| `controllers/` | Contains the **logic** for each feature (e.g., `authController.js` handles login/signup logic). |
| `models/` | Defines the **Database Schemas**. e.g., `User.js` defines what a user looks like (name, email, role). |
| `routes/` | Defines the **API Endpoints**. Maps URLs (like `/api/login`) to specific controllers. |
| `middleware/` | Functions that run before controllers (e.g., `auth.js` checks if a user is logged in). |
| `services/` | Helper functions, such as `sendEmail.js` for sending emails. |

### Frontend (`/frontend`)
| Directory / File | Description |
| :--- | :--- |
| `src/main.jsx` | **Entry Point**. Renders the React app into the DOM. |
| `src/App.jsx` | Define the **Routes** and main application layout structure. |
| `src/pages/` | Contains individual **screens** (e.g., `LoginPage.jsx`, `DashboardPage.jsx`). |
| `src/components/` | Reusable **UI details** (e.g., `Sidebar.jsx`, `TopBar.jsx`, `StatCard.jsx`). |
| `src/services/api.js` | Configures **Axios** to connect to the backend API automatically. |
| `src/utils/` | Helper functions, like `auth.js` for getting the current user's data. |

---

## 🔄 Code Flow Example: Login
1.  **User Action**: User enters email/password on `LoginPage.jsx` and clicks "Login".
2.  **Frontend API Call**: `handleSubmit` calls `api.post('/api/auth/login', data)`.
3.  **Backend Route**: The request hits `routes/authRoutes.js`.
4.  **Controller Logic**: `authController.login` is executed:
    -   Checks if user exists in MongoDB (`User.findOne`).
    -   Compares hashed passwords (`bcrypt.compare`).
    -   Generates a JWT Token (`jwt.sign`).
5.  **Response**: Server sends back the Token and User Info.
6.  **Frontend State**: App saves the token to `localStorage` and redirects user to the Dashboard.

---

## 🔄 Code Flow Example: Forgot Password (OTP)
1.  **Request**: User enters email on `ForgotPasswordPage`.
2.  **Backend**: `forgotPassword` generates a random 6-digit OTP, saves it (hashed) to the database, and emails it using `nodemailer`.
3.  **Verify**: User enters the OTP.
4.  **Backend**: `resetPassword` verifies the OTP matches the hashed version in the database. If correct, it updates the password.

---

## ⚙️ How to Run the Project

### 1. Backend Setup
```bash
cd backend
npm install   # Install dependencies
npm start    # Start the server (usually on http://localhost:5000)
```

### 2. Frontend Setup
```bash
cd frontend
npm install   # Install dependencies
npm run dev   # Start the React dev server (usually on http://localhost:5173)
```

---

## 💡 Viva Questions Prep
-   **Why use MongoDB?** It is flexible (NoSQL) and works well with JSON data used in JavaScript apps.
-   **What is JWT?** JSON Web Token. It's a secure way to transmit information between parties as a JSON object, used here to keep users logged in.
-   **What is the difference between Authentication and Authorization?**
    -   **Authentication** = "Who are you?" (Login).
    -   **Authorization** = "What are you allowed to do?" (Role-based access).
-   **What is React?** A JavaScript library for building user interfaces using reusable components.
