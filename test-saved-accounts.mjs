import assert from 'node:assert';
import fs from 'node:fs';

// Mock localStorage for Node.js test environment
const store = new Map();
global.localStorage = {
  getItem: (k) => store.get(k) || null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

const { 
  getSavedAccounts, 
  saveAccountCredentials, 
  removeSavedAccount 
} = await import('./01-Frontend/src/services/authService.js');

console.log("====================================================================");
console.log("TEST SUITE: REAL USER SAVED CREDENTIALS & LOGIN VERIFICATION");
console.log("====================================================================");

try {
  // Test 1: Initially no saved accounts
  console.log("\nTest 1: Initial state has 0 saved accounts");
  const initial = getSavedAccounts();
  assert.strictEqual(Array.isArray(initial), true);
  assert.strictEqual(initial.length, 0);
  console.log("  [PASS] Initial saved accounts list is empty");

  // Test 2: Save new user credentials after account creation
  console.log("\nTest 2: Save user credentials after new account creation");
  const user1 = {
    uid: 'user-001',
    name: 'Hamdan Al-Sayed',
    email: 'hamdan@store.com',
    role: 'Admin',
    password: 'password123',
  };
  const afterSave1 = saveAccountCredentials(user1);
  assert.strictEqual(afterSave1.length, 1);
  assert.strictEqual(afterSave1[0].name, 'Hamdan Al-Sayed');
  assert.strictEqual(afterSave1[0].role, 'Admin');
  assert.strictEqual(afterSave1[0].email, 'hamdan@store.com');
  assert.strictEqual(afterSave1[0].password, 'password123');
  console.log("  [PASS] Successfully saved new user credentials with role 'Admin'");

  // Test 3: Save second user credentials with different role
  console.log("\nTest 3: Save second user with 'Inventory Staff' role");
  const user2 = {
    uid: 'user-002',
    name: 'Zainab Omar',
    email: 'zainab@store.com',
    role: 'Inventory Staff',
    password: 'inventoryPass123',
  };
  const afterSave2 = saveAccountCredentials(user2);
  assert.strictEqual(afterSave2.length, 2);
  assert.strictEqual(afterSave2[1].name, 'Zainab Omar');
  assert.strictEqual(afterSave2[1].role, 'Inventory Staff');
  console.log("  [PASS] Second user saved with role 'Inventory Staff'");

  // Test 4: Prevent duplicate entries when saving same email again
  console.log("\nTest 4: Updating an existing saved user does not create duplicates");
  const user1Updated = {
    uid: 'user-001',
    name: 'Hamdan Al-Sayed (Lead)',
    email: 'hamdan@store.com',
    role: 'Admin',
    password: 'newPassword456',
  };
  const afterUpdate = saveAccountCredentials(user1Updated);
  assert.strictEqual(afterUpdate.length, 2, "Should update in place without duplicate");
  const updatedEntry = afterUpdate.find(u => u.email === 'hamdan@store.com');
  assert.strictEqual(updatedEntry.name, 'Hamdan Al-Sayed (Lead)');
  assert.strictEqual(updatedEntry.password, 'newPassword456');
  console.log("  [PASS] Existing account updated in place");

  // Test 5: Remove a saved account
  console.log("\nTest 5: Remove a saved account");
  const afterRemove = removeSavedAccount('hamdan@store.com');
  assert.strictEqual(afterRemove.length, 1);
  assert.strictEqual(afterRemove[0].email, 'zainab@store.com');
  console.log("  [PASS] Successfully removed account");

  // Test 6: Verify Login.jsx source code no longer contains University Evaluation Prototype
  console.log("\nTest 6: Verify Login.jsx no longer contains 'University Evaluation Prototype'");
  const loginSrc = fs.readFileSync('./01-Frontend/src/pages/Login.jsx', 'utf8');
  assert.strictEqual(loginSrc.includes('University Evaluation Prototype'), false, "Must not contain 'University Evaluation Prototype'");
  assert.strictEqual(loginSrc.includes('Sarah Connor'), false, "Must not contain hardcoded Sarah Connor");
  assert.strictEqual(loginSrc.includes('Michael Chen'), false, "Must not contain hardcoded Michael Chen");
  assert.strictEqual(loginSrc.includes('Amina Patel'), false, "Must not contain hardcoded Amina Patel");
  console.log("  [PASS] Login.jsx does not contain prototype tag or hardcoded demo users");

  // Test 7: Verify Login.jsx & DashboardLayout.jsx contain dynamic saved credentials banner & quick sign-in
  console.log("\nTest 7: Verify dynamic credentials save banner & quick sign-in UI");
  const dashboardLayoutSrc = fs.readFileSync('./01-Frontend/src/layouts/DashboardLayout.jsx', 'utf8');
  assert.strictEqual(loginSrc.includes('smart_inventory_pending_save_account'), true, "Login.jsx must queue pending account in sessionStorage upon registration");
  assert.strictEqual(loginSrc.includes('Saved Accounts on this Device'), true, "Login.jsx must show saved accounts on this device");
  assert.strictEqual(dashboardLayoutSrc.includes('Save login credentials on this device?'), true, "DashboardLayout.jsx must display save credentials banner");
  assert.strictEqual(dashboardLayoutSrc.includes('Save Login Info'), true, "DashboardLayout.jsx must have 'Save Login Info' button");
  console.log("  [PASS] Dashboard banner and login quick sign-in are correctly wired");

  console.log("\n====================================================================");
  console.log("TEST SUMMARY: ALL SAVED ACCOUNTS TESTS PASSED (7/7)");
  console.log("====================================================================");
} catch (e) {
  console.error("Test failed:", e);
  process.exit(1);
}
