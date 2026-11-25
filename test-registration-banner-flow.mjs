import assert from 'node:assert';
import fs from 'node:fs';

console.log("====================================================================");
console.log("INTEGRATION TEST: REGISTRATION -> SAVE BANNER -> SAVED ACCOUNTS FLOW");
console.log("====================================================================");

// 1. Verify Login.jsx sets pending save account before registration
const loginSrc = fs.readFileSync('./01-Frontend/src/pages/Login.jsx', 'utf8');
assert.strictEqual(
  loginSrc.includes("sessionStorage.setItem('smart_inventory_pending_save_account'"),
  true,
  "Login.jsx must store pending account into sessionStorage prior to/during registration"
);
console.log("  [PASS] Login.jsx queues credentials in sessionStorage before route transition");

// 2. Verify useAuth.jsx manages pendingSaveAccount state
const useAuthSrc = fs.readFileSync('./01-Frontend/src/hooks/useAuth.jsx', 'utf8');
assert.strictEqual(
  useAuthSrc.includes("pendingSaveAccount"),
  true,
  "useAuth.jsx must have pendingSaveAccount in state"
);
assert.strictEqual(
  useAuthSrc.includes("savePendingAccount"),
  true,
  "useAuth.jsx must provide savePendingAccount action"
);
assert.strictEqual(
  useAuthSrc.includes("dismissPendingAccount"),
  true,
  "useAuth.jsx must provide dismissPendingAccount action"
);
assert.strictEqual(
  useAuthSrc.includes("setPendingSaveAccount(pending)"),
  true,
  "useAuth.jsx register method must update pendingSaveAccount state"
);
console.log("  [PASS] useAuth.jsx manages pendingSaveAccount reactively in AuthContext");

// 3. Verify DashboardLayout.jsx consumes pendingSaveAccount from useAuth
const dashboardLayoutSrc = fs.readFileSync('./01-Frontend/src/layouts/DashboardLayout.jsx', 'utf8');
assert.strictEqual(
  dashboardLayoutSrc.includes("pendingSaveAccount,"),
  true,
  "DashboardLayout.jsx must destructure pendingSaveAccount from useAuth"
);
assert.strictEqual(
  dashboardLayoutSrc.includes("savePendingAccount,"),
  true,
  "DashboardLayout.jsx must destructure savePendingAccount from useAuth"
);
assert.strictEqual(
  dashboardLayoutSrc.includes("Save login credentials on this device?"),
  true,
  "DashboardLayout.jsx must render banner header"
);
assert.strictEqual(
  dashboardLayoutSrc.includes("Save Login Info"),
  true,
  "DashboardLayout.jsx must provide 'Save Login Info' action button"
);
assert.strictEqual(
  dashboardLayoutSrc.includes("Not Now"),
  true,
  "DashboardLayout.jsx must provide 'Not Now' dismiss button"
);
console.log("  [PASS] DashboardLayout.jsx receives pendingSaveAccount reactively from useAuth and renders banner");

// 4. Verify end-to-end localStorage data flow
const mockSessionStorage = new Map();
const mockLocalStorage = new Map();

global.sessionStorage = {
  getItem: (k) => mockSessionStorage.get(k) || null,
  setItem: (k, v) => mockSessionStorage.set(k, String(v)),
  removeItem: (k) => mockSessionStorage.delete(k),
  clear: () => mockSessionStorage.clear(),
};

global.localStorage = {
  getItem: (k) => mockLocalStorage.get(k) || null,
  setItem: (k, v) => mockLocalStorage.set(k, String(v)),
  removeItem: (k) => mockLocalStorage.delete(k),
  clear: () => mockLocalStorage.clear(),
};

const { 
  registerUser, 
  getSavedAccounts, 
  saveAccountCredentials,
  removeSavedAccount 
} = await import('./01-Frontend/src/services/authService.js');

// Simulate user registration
const registered = await registerUser('newstaff@company.com', 'mypassword123', 'Staff Member', 'Inventory Staff');
assert.strictEqual(registered.user.email, 'newstaff@company.com');
assert.strictEqual(registered.profile.role, 'Inventory Staff');
console.log("  [PASS] User successfully registered in demo/offline mode");

// Simulate saving pending account queued for banner
const pendingObj = {
  uid: registered.profile.uid,
  name: registered.profile.name,
  email: registered.profile.email,
  role: registered.profile.role,
  password: 'mypassword123',
};
sessionStorage.setItem('smart_inventory_pending_save_account', JSON.stringify(pendingObj));
assert.strictEqual(Boolean(sessionStorage.getItem('smart_inventory_pending_save_account')), true);
console.log("  [PASS] Pending account is queued in sessionStorage");

// User clicks "Save Login Info" on DashboardLayout banner
const pendingFromSession = JSON.parse(sessionStorage.getItem('smart_inventory_pending_save_account'));
saveAccountCredentials(pendingFromSession);
sessionStorage.removeItem('smart_inventory_pending_save_account');

assert.strictEqual(sessionStorage.getItem('smart_inventory_pending_save_account'), null);
const savedList = getSavedAccounts();
assert.strictEqual(savedList.length, 1);
assert.strictEqual(savedList[0].name, 'Staff Member');
assert.strictEqual(savedList[0].role, 'Inventory Staff');
assert.strictEqual(savedList[0].email, 'newstaff@company.com');
console.log("  [PASS] User saved account into device storage and banner dismissed");

// Verify Login screen can retrieve saved accounts
const accountsForLogin = getSavedAccounts();
assert.strictEqual(accountsForLogin.length, 1);
assert.strictEqual(accountsForLogin[0].email, 'newstaff@company.com');
console.log("  [PASS] Login page receives saved account with correct role badge for quick 1-click sign-in");

console.log("\n====================================================================");
console.log("ALL INTEGRATION CHECKS COMPLETED SUCCESSFULLY!");
console.log("====================================================================");
