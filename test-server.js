require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

console.log('Creating server...');

const server = app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
  
  // Check if server is actually listening
  console.log('Server state:', {
    listening: server.listening,
    address: server.address(),
  });
});

console.log('Server created');

// Check every second
let count = 0;
const interval = setInterval(() => {
  count++;
  console.log(`[${count}] Server alive - listening: ${server.listening}`);
  
  if (count > 5) {
    clearInterval(interval);
    console.log('Closing server...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  }
}, 1000);

// Prevent premature exit
process.stdin.resume();
