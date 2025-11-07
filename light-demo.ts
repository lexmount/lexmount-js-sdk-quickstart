/**
 * Light Browser Demo
 * - Use chrome-light-docker mode
 * - Visit Sina News
 * - Extract all links and save to links.txt
 */

import { config } from 'dotenv';
import { chromium } from 'playwright';
import { Lexmount } from 'lexmount';
import { writeFileSync } from 'fs';

// Load environment variables
config();

async function main() {
  console.log('🔗 提取新闻链接演示\n');

  // Initialize Lexmount client
  const lm = new Lexmount();

  console.log('📡 Creating light browser session...');
  // Create a session with chrome-light-docker mode
  const session = await lm.sessions.create({
    browserMode: 'chrome-light-docker',
  });
  console.log(`✓ Session created: ${session.sessionId}\n`);

  // Connect to the remote session
  const browser = await chromium.connectOverCDP(session.connectUrl);
  const context = browser.contexts()[0];
  const page = context.pages()[0];

  // Navigate to Sina News
  console.log('🌐 Navigating to Sina News...');
  await page.goto('https://news.sina.cn/');
  console.log('✓ Page loaded\n');

  // Extract all links
  console.log('🔍 Extracting links...');
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]')).map(
      (a) => (a as HTMLAnchorElement).href
    );
  });

  // Save to file
  const filename = 'links.txt';
  writeFileSync(filename, links.join('\n'), 'utf-8');

  console.log(`✅ 已提取 ${links.length} 个链接，保存到: ${filename}\n`);

  // Clean up
  // Note: Commented out to keep session alive for inspection
  // await page.close();
  // await browser.close();

  console.log('✨ Demo completed successfully!');
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

