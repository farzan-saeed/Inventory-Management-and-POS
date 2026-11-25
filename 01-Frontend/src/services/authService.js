import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, isDemoConfig } from '../firebase/firebaseConfig.js';

const DEMO_USERS = [
  {
    uid: 'demo-admin-01',
    name: 'Sarah Connor',
    email: 'admin@inventory.edu',
    role: 'Admin',
    department: 'Management',
  },
  {
    uid: 'demo-inventory-01',
    name: 'Michael Chen',
    email: 'inventory@inventory.edu',
    role: 'Inventory Staff',
    department: 'Warehouse & Logistics',
  },
  {
    uid: 'demo-sales-01',
    name: 'Amina Patel',
    email: 'sales@inventory.edu',
    role: 'Sales Staff',
    department: 'Storefront',
  }
];

const LOCAL_STORAGE_USER_KEY = 'smart_inventory_user_profile';
const LOCAL_STORAGE_REGISTERED_USERS_KEY = 'smart_inventory_registered_users';
const LOCAL_STORAGE_SAVED_ACCOUNTS_KEY = 'smart_inventory_saved_accounts';

/**
 * Retrieve user-saved login accounts for quick sign-in on this device
 */
export const getSavedAccounts = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse saved accounts", e);
    return [];
  }
};

/**
 * Save user credentials for quick sign-in
 */
export const saveAccountCredentials = (account) => {
  try {
    const accounts = getSavedAccounts();
    const cleanEmail = (account.email || '').trim().toLowerCase();
    const existingIndex = accounts.findIndex(a => a.email.toLowerCase() === cleanEmail);
    const accountData = {
      uid: account.uid || 'user-' + Date.now(),
      name: account.name || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: account.role || 'Sales Staff',
      password: account.password,
      savedAt: new Date().toISOString()
    };
    if (existingIndex >= 0) {
      accounts[existingIndex] = accountData;
    } else {
      accounts.push(accountData);
    }
    localStorage.setItem(LOCAL_STORAGE_SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
    return accounts;
  } catch (e) {
    console.error("Failed to save account credentials", e);
    return [];
  }
};

/**
 * Remove a user-saved account from this device
 */
export const removeSavedAccount = (email) => {
  try {
    const cleanEmail = (email || '').trim().toLowerCase();
    const accounts = getSavedAccounts().filter(a => a.email.toLowerCase() !== cleanEmail);
    localStorage.setItem(LOCAL_STORAGE_SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
    return accounts;
  } catch (e) {
    console.error("Failed to remove saved account", e);
    return [];
  }
};

/**
 * Retrieve all registered users stored locally in prototype/evaluation mode
 */
export const getRegisteredUsers = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REGISTERED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to parse locally registered users", e);
    return [];
  }
};

/**
 * Persist a registered user into local storage for persistent demo/evaluation login
 */
const saveRegisteredUser = (userRecord) => {
  try {
    const users = getRegisteredUsers();
    const existingIndex = users.findIndex(u => u.email.toLowerCase() === userRecord.email.toLowerCase());
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...userRecord };
    } else {
      users.push(userRecord);
    }
    localStorage.setItem(LOCAL_STORAGE_REGISTERED_USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.error("Failed to save registered user locally", e);
  }
};

/**
 * Sign in user with email and password
 */
export const signInUser = async (email, password) => {
  const cleanEmail = (email || '').trim().toLowerCase();

  // 1. Check supervisor preconfigured evaluation accounts
  const demoMatch = DEMO_USERS.find(u => u.email.toLowerCase() === cleanEmail);
  if (demoMatch) {
    if (password === 'demo123' || password === 'admin123' || isDemoConfig) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(demoMatch));
      return { 
        user: { uid: demoMatch.uid, email: demoMatch.email, displayName: demoMatch.name }, 
        profile: demoMatch 
      };
    } else {
      const err = new Error('Invalid password. Please check your credentials.');
      err.code = 'auth/wrong-password';
      throw err;
    }
  }

  // 2. Check accounts registered locally in evaluation mode
  const registeredUsers = getRegisteredUsers();
  const registeredMatch = registeredUsers.find(u => u.email.toLowerCase() === cleanEmail);
  if (registeredMatch) {
    if (registeredMatch.password === password) {
      const { password: _, ...cleanProfile } = registeredMatch;
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(cleanProfile));
      return { 
        user: { uid: cleanProfile.uid, email: cleanProfile.email, displayName: cleanProfile.name }, 
        profile: cleanProfile 
      };
    } else {
      const err = new Error('Invalid password. Please check your credentials.');
      err.code = 'auth/wrong-password';
      throw err;
    }
  }

  // 3. If running in demo mode (placeholder Firebase credentials), prevent calling Google with fake key
  if (isDemoConfig) {
    const err = new Error('Account not found. Please register an account first, or verify your email address.');
    err.code = 'auth/user-not-found';
    throw err;
  }

  // 4. Live Firebase Auth execution
  try {
    if (!auth) throw new Error("Firebase Auth not initialized");
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;
    
    // Fetch user profile from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    let profile = null;
    if (userDoc.exists()) {
      profile = userDoc.data();
    } else {
      // Default fallback profile if not found
      profile = {
        uid: user.uid,
        name: user.displayName || cleanEmail.split('@')[0],
        email: user.email,
        role: 'Admin', // Default initial role
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, profile);
    }

    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(profile));
    return { user, profile };
  } catch (error) {
    if (error.code === 'auth/api-key-not-valid' || error.message?.includes('api-key-not-valid')) {
      const friendlyErr = new Error('Firebase API key is invalid. For evaluation mode, please use the demo accounts below or create an account via Register.');
      friendlyErr.code = 'auth/api-key-not-valid';
      throw friendlyErr;
    }
    throw error;
  }
};

/**
 * Register a new user and create their Firestore profile
 */
export const registerUser = async (email, password, name, role = 'Sales Staff') => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanName = (name || '').trim();

  // If in demo mode (placeholder API key):
  if (isDemoConfig) {
    // Check for duplicate registration
    const isDemoAccount = DEMO_USERS.some(u => u.email.toLowerCase() === cleanEmail);
    const existingRegistered = getRegisteredUsers().some(u => u.email.toLowerCase() === cleanEmail);
    if (isDemoAccount || existingRegistered) {
      const err = new Error('This email is already registered. Please sign in instead.');
      err.code = 'auth/email-already-in-use';
      throw err;
    }

    if (!password || password.length < 6) {
      const err = new Error('Password should be at least 6 characters.');
      err.code = 'auth/weak-password';
      throw err;
    }

    const newUser = {
      uid: 'user-' + Date.now(),
      name: cleanName || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: role || 'Sales Staff',
      createdAt: new Date().toISOString(),
      password, // Stored locally so user can log out and log back in
    };

    saveRegisteredUser(newUser);

    const { password: _, ...cleanProfile } = newUser;
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(cleanProfile));
    return {
      user: { uid: cleanProfile.uid, email: cleanProfile.email, displayName: cleanProfile.name },
      profile: cleanProfile,
    };
  }

  // Live Firebase mode
  try {
    if (!auth) throw new Error("Firebase Auth not initialized");
    const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: cleanName });

    const userProfile = {
      uid: user.uid,
      name: cleanName,
      email: user.email,
      role,
      createdAt: serverTimestamp(),
    };

    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, userProfile);

    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify({
      ...userProfile,
      createdAt: new Date().toISOString()
    }));

    return { user, profile: userProfile };
  } catch (error) {
    // Fallback if API key was invalid
    if (error.code === 'auth/api-key-not-valid' || error.message?.includes('api-key-not-valid')) {
      const newUser = {
        uid: 'user-' + Date.now(),
        name: cleanName || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: role || 'Sales Staff',
        createdAt: new Date().toISOString(),
        password,
      };
      saveRegisteredUser(newUser);
      const { password: _, ...cleanProfile } = newUser;
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(cleanProfile));
      return {
        user: { uid: cleanProfile.uid, email: cleanProfile.email, displayName: cleanProfile.name },
        profile: cleanProfile,
      };
    }
    throw error;
  }
};

/**
 * Sign out current user
 */
export const signOutUser = async () => {
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  if (auth && !isDemoConfig) {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Sign out error:", err);
    }
  }
};

/**
 * Get current profile from local cache or firestore
 */
export const getCurrentUserProfile = async (uid) => {
  if (!uid) {
    const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    return cached ? JSON.parse(cached) : null;
  }

  // Check supervisor demo users
  const demoMatch = DEMO_USERS.find(u => u.uid === uid);
  if (demoMatch) return demoMatch;

  // Check locally registered users
  const registeredMatch = getRegisteredUsers().find(u => u.uid === uid);
  if (registeredMatch) {
    const { password: _, ...clean } = registeredMatch;
    return clean;
  }

  try {
    if (db && !isDemoConfig) {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch user from Firestore:", err);
  }

  const cached = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
  return cached ? JSON.parse(cached) : null;
};

/**
 * Demo accounts helper for supervisor testing
 */
export const getDemoAccounts = () => DEMO_USERS;
