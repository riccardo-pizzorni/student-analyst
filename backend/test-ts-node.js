console.log('Testing ts-node availability...');

try {
  require('ts-node/register');
  console.log('ts-node loaded successfully');

  // Try to load the index.ts file
  console.log('Loading index.ts...');
  require('./src/index.ts');
  console.log('index.ts loaded successfully');
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
