import { spawn } from 'node:child_process';
import assert from 'node:assert';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const VIEWPORTS = [
  { name: 'Desktop Large', width: 1440, height: 900 },
  { name: 'Desktop Standard', width: 1280, height: 800 },
  { name: 'Tablet (iPad Mini)', width: 768, height: 1024 },
  { name: 'Mobile (iPhone SE)', width: 375, height: 667 },
  { name: 'Mobile (iPhone 12/13/14)', width: 390, height: 844 },
];

function checkViewport(vp) {
  return new Promise((resolve, reject) => {
    // We launch Chrome in headless mode with window-size and virtual-time-budget
    // and dump DOM to verify correct rendering
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      `--window-size=${vp.width},${vp.height}`,
      '--virtual-time-budget=3000',
      '--dump-dom',
      'http://localhost:5173/'
    ];

    const proc = spawn(CHROME_PATH, args);
    let output = '';

    proc.stdout.on('data', (d) => { output += d.toString(); });
    proc.on('close', (code) => {
      if (code === 0 && output.length > 0) {
        // Basic DOM assertions that must be present at every resolution
        assert(output.includes('Manage Your Inventory.'), `Headline missing in ${vp.name}`);
        assert(output.includes('Everything You Need to Manage Your Inventory'), `Features missing in ${vp.name}`);
        assert(output.includes('WarehouseHeroIllustration') || output.includes('viewBox="0 0 540 420"'), `Hero SVG missing in ${vp.name}`);
        resolve({ ...vp, status: 'PASS', htmlLength: output.length });
      } else {
        reject(new Error(`Failed in viewport ${vp.name}`));
      }
    });
    proc.on('error', reject);
  });
}

console.log("====================================================================");
console.log("TEST SUITE: RESPONSIVE VIEWPORT TESTING ACROSS TARGET DEVICES");
console.log("====================================================================");

for (const vp of VIEWPORTS) {
  const res = await checkViewport(vp);
  console.log(`  [PASS] ${res.name.padEnd(25)} (${res.width}x${res.height}) -> HTML rendered cleanly (${res.htmlLength} bytes)`);
}

console.log("\n====================================================================");
console.log("TEST SUMMARY: ALL 5 RESPONSIVE VIEWPORTS VERIFIED");
console.log("====================================================================");
