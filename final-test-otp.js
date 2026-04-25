const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/send-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000
};

console.log('Sending request to send-otp...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.error('Timeout');
  req.destroy();
  process.exit(1);
});

req.write(JSON.stringify({ mobile: '9876543210' }));
req.end();

setTimeout(() => { process.exit(1); }, 6000);
