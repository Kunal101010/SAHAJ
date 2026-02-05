// src/utils/auth.js

// 1. Save user data and token to browser's Local Storage
// This keeps the user logged in even if they refresh the page
export const loginUser = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

// 2. Logout: Remove data from Local Storage and redirect to Login page
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// 3. Check if user is currently logged in (simply checks if token exists)
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// 4. Retrievecurrent user details from Local Storage
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};