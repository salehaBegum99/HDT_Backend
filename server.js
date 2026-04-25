require('dotenv').config(); // ← Must be VERY FIRST LINE

const express   = require('express');
const cors      = require('cors');
const connectDB = require('./src/Config/db'); // ← Check your path

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth',         require('./src/Routes/authRoutes'));
app.use('/api/admin',        require('./src/Routes/adminRoutes'));
app.use('/api/applications', require('./src/Routes/applicationRoutes'));
app.use('/api/inspector',    require('./src/Routes/InspectorRoutes'));
app.use('/api/supervisor',   require('./src/Routes/supervisorRoutes'));
app.use('/api/ho',           require('./src/Routes/hoRoutes'));
app.use('/api/superadmin',   require('./src/Routes/superAdminRoutes'));
app.use('/api/notifications',require('./src/Routes/notificationRoutes'));
// app.use('/api/master',       require('./src/Routes/masterDataRoutes'));

const PORT = process.env.PORT || 5000;

// Initialize and start server
async function startServer() {
  try {
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    // Handle port already in use
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
        console.error('Please do one of the following:');
        console.error(`1. Kill the process: lsof -ti:${PORT} | xargs kill -9 (Mac/Linux)`);
        console.error(`   Or: Get-Process -Id (netstat -ano | findstr :${PORT}).Split()[4] | Stop-Process -Force (Windows)`);
        console.error(`2. Change the PORT in .env file to a different port`);
        process.exit(1);
      }
      throw err;
    });

    return server;
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

// Start the server
startServer().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});