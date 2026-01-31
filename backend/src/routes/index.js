// Register all controllers

import authRoutes from '../controllers/AuthController.js';
import usersRoutes from '../controllers/UsersController.js';
import adminRoutes from '../controllers/AdminController.js';
import supportRoutes from '../controllers/SupportController.js';

export default [
  { path: '/auth', handler: authRoutes },
  { path: '/users', handler: usersRoutes },
  { path: '/admin', handler: adminRoutes },
  { path: '/support', handler: supportRoutes }
];
