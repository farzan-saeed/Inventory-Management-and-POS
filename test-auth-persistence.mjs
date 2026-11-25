import assert from 'node:assert';

// Mock localStorage for Node.js test environment
const store = new Map();
global.localStorage = {
  getItem: (k) => store.get(k) || null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};

// Import authService functions
const { registerUser, signInUser, signOutUser, getRegisteredUsers, getCurrentUserProfile } = await import('./01-Frontend/src/services/authService.js');

console.log("====================================================================");
console.log("TEST SUITE: OFFLINE DEMO AUTHENTICATION & CREDENTIAL PERSISTENCE");
console.log("====================================================================");

try {
  // Test 1: Register new user
  console.log("\nTest 1: User Registration in Demo / Evaluation Mode");
  const testEmail = "testuser@inventory.edu";
  const testPassword = "mypassword123";
  const testName = "Jane Doe";
  const testRole = "Inventory Staff";

  const { user, profile } = await registerUser(testEmail, testPassword, testName, testRole);
  assert.strictEqual(user.email, testEmail);
  assert.strictEqual(profile.name, testName);
  assert.strictEqual(profile.role, testRole);
  assert.strictEqual(profile.password, undefined, "Public profile should not expose password");
  console.log("  [PASS] Successfully registered user:", user.email);

  // Verify stored in registered users
  const registered = getRegisteredUsers();
  assert.strictEqual(registered.length, 1);
  assert.strictEqual(registered[0].email, testEmail);
  assert.strictEqual(registered[0].password, testPassword);
  console.log("  [PASS] User record saved persistently in local storage");

  // Test 2: Logout clears active session
  console.log("\nTest 2: Sign Out clears active session");
  await signOutUser();
  const currentProfile = await getCurrentUserProfile();
  assert.strictEqual(currentProfile, null, "Active session should be cleared after logout");
  assert.strictEqual(getRegisteredUsers().length, 1, "Registered users list must remain intact");
  console.log("  [PASS] Active session cleared while preserving registered accounts");

  // Test 3: Sign back in with the same credentials
  console.log("\nTest 3: Sign in with registered credentials");
  const loginResult = await signInUser(testEmail, testPassword);
  assert.strictEqual(loginResult.user.email, testEmail);
  assert.strictEqual(loginResult.profile.role, testRole);
  console.log("  [PASS] Successfully authenticated with saved credentials without hitting live Firebase API");

  // Test 4: Sign in with incorrect password
  console.log("\nTest 4: Reject incorrect password");
  let passwordErrorThrown = false;
  try {
    await signInUser(testEmail, "wrongpassword");
  } catch (err) {
    passwordErrorThrown = true;
    assert.strictEqual(err.code, 'auth/wrong-password');
  }
  assert.strictEqual(passwordErrorThrown, true);
  console.log("  [PASS] Rejected wrong password with auth/wrong-password");

  // Test 5: Reject non-existent user
  console.log("\nTest 5: Reject non-existent user");
  let notFoundErrorThrown = false;
  try {
    await signInUser("nonexistent@inventory.edu", "demo123");
  } catch (err) {
    notFoundErrorThrown = true;
    assert.strictEqual(err.code, 'auth/user-not-found');
  }
  assert.strictEqual(notFoundErrorThrown, true);
  console.log("  [PASS] Rejected unregistered user with auth/user-not-found");

  // Test 6: Supervisor demo accounts continue to work
  console.log("\nTest 6: Preconfigured supervisor demo accounts");
  const adminLogin = await signInUser("admin@inventory.edu", "demo123");
  assert.strictEqual(adminLogin.profile.role, "Admin");
  console.log("  [PASS] Supervisor Admin demo account authenticated cleanly");

  console.log("\n====================================================================");
  console.log("TEST SUMMARY: ALL AUTH PERSISTENCE TESTS PASSED (6/6)");
  console.log("====================================================================");
} catch (e) {
  console.error("Test failed:", e);
  process.exit(1);
}
