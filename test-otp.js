const http = require('http');

const data = JSON.stringify({
  mobile: '9876543210'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/send-otp',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('RESPONSE BODY:');
    console.log(body);
    process.exit(0);
  });
});

req.on('error', (e) => {
  console.error(`PROBLEM WITH REQUEST: ${e.message}`);
  process.exit(1);
});

req.write(data);
req.end();
