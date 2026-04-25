require('dotenv').config();

const express   = require('express');
const cors      = require('cors');
const connectDB = require('./src/Config/db');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

connectDB().catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});

app.use('/api/auth',         require('./src/Routes/authRoutes'));
app.use('/api/admin',        require('./src/Routes/adminRoutes'));
app.use('/api/applications', require('./src/Routes/applicationRoutes'));
app.use('/api/inspector',    require('./src/Routes/InspectorRoutes'));
app.use('/api/supervisor',   require('./src/Routes/supervisorRoutes'));
app.use('/api/ho',           require('./src/Routes/hoRoutes'));
app.use('/api/superadmin',   require('./src/Routes/superAdminRoutes'));
app.use('/api/notifications',require('./src/Routes/notificationRoutes'));

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Keep server alive
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
