require('dotenv').config();
const express = require('express');
const app = express();
const PORT = 5001; // Use a different port

console.log('Creating server...');

const server = app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use!`);
  }
});

server.on('close', () => {
  console.log('Server closed');
});

// Keep alive
setTimeout(() => {
  console.log('Closing server...');
  server.close();
}, 5000);
