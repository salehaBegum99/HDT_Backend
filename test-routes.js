console.log('Testing route requires...');

try {
  console.log('Loading authRoutes...');
  require('./src/Routes/authRoutes');
  console.log('✅ authRoutes loaded');
} catch (e) {
  console.error('❌ authRoutes error:', e.message);
}

try {
  console.log('Loading adminRoutes...');
  require('./src/Routes/adminRoutes');
  console.log('✅ adminRoutes loaded');
} catch (e) {
  console.error('❌ adminRoutes error:', e.message);
}

try {
  console.log('Loading applicationRoutes...');
  require('./src/Routes/applicationRoutes');
  console.log('✅ applicationRoutes loaded');
} catch (e) {
  console.error('❌ applicationRoutes error:', e.message);
}

try {
  console.log('Loading InspectorRoutes...');
  require('./src/Routes/InspectorRoutes');
  console.log('✅ InspectorRoutes loaded');
} catch (e) {
  console.error('❌ InspectorRoutes error:', e.message);
}

console.log('Done testing routes');
process.exit(0);
