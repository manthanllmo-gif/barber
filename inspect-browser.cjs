const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
    page.on('pageerror', err => console.log(`[pageerror] ${err.message}`));

    console.log('Navigating to localhost:5173/login...');
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });

    const rootHtml = await page.$eval('#root', el => el.innerHTML);
    console.log('----- #root HTML -----');
    console.log(rootHtml);
    console.log('----------------------');

    await browser.close();
})();
