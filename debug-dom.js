const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(5000);
    
    // Analizza tutto il contenuto del body
    const bodyContent = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body.innerText,
        bodyHTML: document.body.innerHTML.substring(0, 2000), // Prime 2000 char
        images: Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt,
          classes: img.className
        })),
        buttons: Array.from(document.querySelectorAll('button')).length,
        hasStudentAnalyst: document.body.innerText.includes('Student Analyst'),
        hasReactText: document.body.innerText.includes('React'),
        hasTypescriptText: document.body.innerText.includes('TypeScript'),
        hasTailwindText: document.body.innerText.includes('Tailwind'),
        hasFrontendText: document.body.innerText.includes('Frontend'),
        divs: document.querySelectorAll('div').length
      };
    });
    
    console.log('=== DOM ANALYSIS ===');
    console.log(JSON.stringify(bodyContent, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})(); 