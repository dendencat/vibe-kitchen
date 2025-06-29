const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureScreenshots() {
  // Create screenshots directory if it doesn't exist
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  console.log('Capturing screenshots of AI Restaurant Battle...');

  try {
    // Capture opening screen in English
    console.log('1. Capturing opening screen (English)...');
    await page.goto('http://localhost:8080/opening.html');
    await page.waitForTimeout(2000); // Wait for animations
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'opening-screen-english.png'),
      fullPage: true 
    });

    // Switch to Japanese
    console.log('2. Capturing opening screen (Japanese)...');
    await page.click('[data-lang="ja"]');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'opening-screen-japanese.png'),
      fullPage: true 
    });

    // Navigate to main game
    console.log('3. Capturing main game screen...');
    await page.goto('http://localhost:8080/index.html');
    await page.waitForTimeout(3000); // Wait for game to initialize
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'game-main-screen.png'),
      fullPage: true 
    });

    // Switch game to Japanese
    console.log('4. Capturing main game screen (Japanese)...');
    const langBtn = await page.$('.lang-btn[data-lang="ja"]');
    if (langBtn) {
      await langBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'game-main-screen-japanese.png'),
        fullPage: true 
      });
    }

    // Capture specific UI elements
    console.log('5. Capturing menu modal...');
    await page.click('#add-menu-item');
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'menu-modal.png'),
      fullPage: true 
    });

    console.log('\nScreenshots captured successfully!');
    console.log(`Location: ${screenshotsDir}`);
    console.log('\nFiles created:');
    console.log('- opening-screen-english.png');
    console.log('- opening-screen-japanese.png');
    console.log('- game-main-screen.png');
    console.log('- game-main-screen-japanese.png');
    console.log('- menu-modal.png');

  } catch (error) {
    console.error('Error capturing screenshots:', error);
  } finally {
    await browser.close();
  }
}

// Check if server is running
const http = require('http');

function checkServer(callback) {
  http.get('http://localhost:8080', (res) => {
    callback(true);
  }).on('error', (err) => {
    callback(false);
  });
}

// Main execution
checkServer((isRunning) => {
  if (!isRunning) {
    console.log('⚠️  Please start your local server first!');
    console.log('Run: python3 -m http.server 8080');
    console.log('Then run this script again.');
    process.exit(1);
  } else {
    captureScreenshots();
  }
});