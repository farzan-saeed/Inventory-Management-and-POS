import { spawn } from 'node:child_process';
import assert from 'node:assert';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function renderPage(url, budgetMs = 4000) {
  return new Promise((resolve, reject) => {
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      `--virtual-time-budget=${budgetMs}`,
      '--dump-dom',
      url
    ];

    const proc = spawn(CHROME_PATH, args);
    let output = '';
    let errorOutput = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0 && output.length > 0) {
        resolve(output);
      } else {
        reject(new Error(`Chrome failed with code ${code}: ${errorOutput}`));
      }
    });

    proc.on('error', (err) => {
      reject(err);
    });
  });
}

console.log("====================================================================");
console.log("TEST SUITE: PUBLIC LANDING PAGE & ROUTING IN REAL BROWSER (CHROME)");
console.log("====================================================================");

try {
  // Test 1: Landing Page at http://localhost:5173/
  console.log("\nTest 1: Render Public Landing Page (/) in Chrome");
  const landingHtml = await renderPage('http://localhost:5173/');

  assert(landingHtml.includes('SmartInventory'), "Landing page must contain brand name 'SmartInventory'");
  console.log("  [PASS] Brand Identity rendered: 'SmartInventory'");

  assert(landingHtml.includes('Manage Your Inventory.'), "Headline 'Manage Your Inventory.' must be present");
  assert(landingHtml.includes('Simplify Your Business.'), "Headline 'Simplify Your Business.' must be present");
  console.log("  [PASS] Hero Headline rendered: 'Manage Your Inventory. Simplify Your Business.'");

  assert(
    landingHtml.includes('Take control of your products, stock, suppliers, and sales with one simple inventory management platform.'),
    "Supporting hero copy must match requirements"
  );
  console.log("  [PASS] Hero supporting copy verified");

  // Verify Hero SVG Illustration
  assert(
    landingHtml.includes('aria-label="Illustration of organized warehouse inventory shelves, product packages, and real-time stock management indicators"'),
    "Hero illustration SVG with accessible aria-label must be present"
  );
  assert(landingHtml.includes('1,420 Items Tracked'), "Hero illustration metric chip rendered");
  assert(landingHtml.includes('Instant POS Sync'), "Hero illustration POS sync chip rendered");
  assert(landingHtml.includes('Low Stock Alert'), "Hero illustration low stock alert chip rendered");
  console.log("  [PASS] Custom warehouse vector illustration verified with all elements");

  // Test 2: Features Section
  console.log("\nTest 2: Six Core Capabilities Features Section");
  assert(landingHtml.includes('Everything You Need to Manage Your Inventory'), "Feature section title present");
  assert(landingHtml.includes('Product Management'), "Product Management card present");
  assert(landingHtml.includes('Stock Management'), "Stock Management card present");
  assert(landingHtml.includes('Sales Management'), "Sales Management card present");
  assert(landingHtml.includes('Supplier Management'), "Supplier Management card present");
  assert(landingHtml.includes('Low Stock Alerts'), "Low Stock Alerts card present");
  assert(landingHtml.includes('Reports & Analytics') || landingHtml.includes('Reports &amp; Analytics'), "Reports & Analytics card present");
  console.log("  [PASS] All 6 feature cards rendered with correct titles and descriptions");

  // Test 3: How It Works Section
  console.log("\nTest 3: How It Works 3-Step Process Section");
  assert(landingHtml.includes('Simple Inventory Management in Three Steps'), "Workflow title present");
  assert(landingHtml.includes('Manage Your Products'), "Step 1 present");
  assert(landingHtml.includes('Record Your Sales'), "Step 2 present");
  assert(landingHtml.includes('Monitor Your Business'), "Step 3 present");
  console.log("  [PASS] All 3 operational workflow steps rendered");

  // Test 4: CTA and Footer Sections
  console.log("\nTest 4: Call-To-Action & Footer Navigation");
  assert(landingHtml.includes('Ready to Take Control of Your Inventory?'), "CTA heading present");
  assert(landingHtml.includes('Bring your products, stock and sales management together in one place.'), "CTA supporting text present");
  assert(landingHtml.includes('Retail Store Edition'), "Footer project context present");
  assert(landingHtml.includes(String(new Date().getFullYear())), "Current year copyright present");
  console.log("  [PASS] CTA section and Footer verified");

  // Test 5: Sign In Route (/login)
  console.log("\nTest 5: Navigation to /login");
  const loginHtml = await renderPage('http://localhost:5173/login');
  assert(loginHtml.includes('Sign In to Your Account'), "Login page must display 'Sign In to Your Account'");
  assert(loginHtml.includes('Back to Home'), "Login page must have a 'Back to Home' navigation link");
  console.log("  [PASS] /login rendered properly with Back to Home navigation");

  // Test 6: Register Route (/register)
  console.log("\nTest 6: Navigation to /register");
  const registerHtml = await renderPage('http://localhost:5173/register');
  assert(registerHtml.includes('Register New User'), "Register route must render 'Register New User'");
  assert(registerHtml.includes('Full Name'), "Register form must have Full Name input");
  console.log("  [PASS] /register rendered directly in registration mode");

  console.log("\n====================================================================");
  console.log("TEST SUMMARY: ALL BROWSER & ROUTING TESTS PASSED (6/6)");
  console.log("====================================================================");
} catch (err) {
  console.error("Test failure:", err);
  process.exit(1);
}
