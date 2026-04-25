const http = require('http');

console.log('Testing send-otp endpoint...\n');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/send-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': '24'
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`✅ Status Code: ${res.statusCode}`);
    console.log(`📝 Response:\n${body}\n`);
    process.exit(0);
  });
});

req.on('error', (error) => {
  if (error.code === 'ECONNREFUSED') {
    console.error('❌ Connection refused - server not running on localhost:5000');
  } else {
    console.error('❌ Error:', error.message);
  }
  process.exit(1);
});

const payload = JSON.stringify({ mobile: '9876543210' });
console.log(`📤 Sending POST request to /api/auth/send-otp`);
console.log(`📦 Payload: ${payload}\n`);
req.write(payload);
req.end();

setTimeout(() => {
  console.error('❌ Request timeout');
  process.exit(1);
}, 5000);
