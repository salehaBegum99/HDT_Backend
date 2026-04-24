const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./src/Config/db');
const cors = require('cors');

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // Vite default
  credentials: true
}));
connectDB();


//Routes
app.use('/api/auth', require('./src/Routes/authRoutes'));
app.use('/api/admin', require('./src/Routes/adminRoutes'));
app.use('/api/applications', require('./src/Routes/applicationRoutes'));
app.use('/api/inspector', require('./src/Routes/InspectorRoutes'));
app.use('/api/supervisor', require('./src/Routes/supervisorRoutes'));
app.use('/api/ho', require('./src/Routes/hoRoutes'));
app.use('/api/superadmin', require('./src/Routes/superAdminRoutes'));
app.use('/api/notifications', require('./src/Routes/notificationRoutes'));
app.get('/', (req, res) => {
  res.send('Scholarship API Running! 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));