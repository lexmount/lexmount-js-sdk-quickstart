/**
 * Basic Lexmount Demo
 * - Visit Lexmount website
 * - Verify page title
 * - Take screenshot
 */

import { config } from 'dotenv';
import { chromium } from 'playwright';
import { Lexmount } from 'lexmount';

// Load environment variables
config();

async function main() {
  console.log('🚀 Starting Lexmount basic demo...\n');

  // Initialize Lexmount client
  // Reads LEXMOUNT_API_KEY and LEXMOUNT_PROJECT_ID from environment variables
  const lm = new Lexmount();

  console.log('📡 Creating browser session...');
  // Create a session on Lexmount
  const session = await lm.sessions.create();
  console.log(`✓ Session created: ${session.sessionId}\n`);

  // Connect to the remote session
  const browser = await chromium.connectOverCDP(session.connectUrl);
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  // Execute Playwright actions on the remote browser
  console.log('🌐 Navigating to Lexmount website...');
  await page.goto('https://dev.lexmount.net/');

  const pageTitle = await page.title();
  console.log(`📄 Page title: ${pageTitle}`);

  // Verify the page title
  const expectedTitle = 'Lexmount Browser - AI-Powered Cloud Browser Service';
  if (pageTitle === expectedTitle) {
    console.log('✓ Page title verified!\n');
  } else {
    throw new Error(
      `Page title mismatch!\nExpected: ${expectedTitle}\nActual: ${pageTitle}`
    );
  }

  // Take a screenshot
  console.log('📸 Taking screenshot...');
  await page.screenshot({ path: 'screenshot.png' });
  console.log('✓ Screenshot saved to: screenshot.png\n');

  // Clean up
  await page.close();
  await browser.close();

  console.log('✨ Demo completed successfully!');
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

