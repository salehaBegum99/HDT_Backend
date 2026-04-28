require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const connectDB = require('./src/Config/db');

const app = express();

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL, // Vercel URL
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json());
connectDB();

app.use('/api/auth',          require('./src/Routes/authRoutes'));
app.use('/api/admin',         require('./src/Routes/adminRoutes'));
app.use('/api/applications',  require('./src/Routes/applicationRoutes'));
app.use('/api/inspector',     require('./src/Routes/InspectorRoutes'));
app.use('/api/supervisor',    require('./src/Routes/supervisorRoutes'));
app.use('/api/ho',            require('./src/Routes/hoRoutes'));
app.use('/api/superadmin',    require('./src/Routes/superAdminRoutes'));
app.use('/api/notifications', require('./src/Routes/notificationRoutes'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));