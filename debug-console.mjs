import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const page = await browser.newPage();

const errors = [];
const warnings = [];

page.on('pageerror', error => {
  errors.push(`PAGE ERROR: ${error.message}`);
});

page.on('console', msg => {
  if (msg.type() === 'error') {
    errors.push(`CONSOLE ERROR: ${msg.text()}`);
  } else if (msg.type() === 'warning') {
    warnings.push(`CONSOLE WARNING: ${msg.text()}`);
  } else {
    console.log(`CONSOLE ${msg.type()}: ${msg.text()}`);
  }
});

try {
  console.log('🔍 Navigating to localhost:5173...');
  await page.goto('http://localhost:5173/');
  
  console.log('⏳ Waiting 10 seconds for app to load...');
  await page.waitForTimeout(10000);
  
  console.log('\n=== ERROR REPORT ===');
  console.log('Errors:', errors);
  console.log('Warnings:', warnings);
  
  const finalState = await page.evaluate(() => {
    return {
      rootEmpty: document.getElementById('root').innerHTML === '',
      scriptTags: document.querySelectorAll('script').length,
      loadState: document.readyState,
      hasReactDevTools: !!window.React
    };
  });
  
  console.log('\n=== FINAL STATE ===');
  console.log(JSON.stringify(finalState, null, 2));
  
} catch (error) {
  console.error('Script error:', error);
} finally {
  await browser.close();
} 