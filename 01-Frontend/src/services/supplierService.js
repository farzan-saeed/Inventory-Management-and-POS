import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc, 
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, isDemoConfig } from '../firebase/firebaseConfig.js';
import { getProducts } from './productService.js';

const LOCAL_STORAGE_SUPPLIERS_KEY = 'smart_inventory_suppliers';

// Initial sample suppliers for supervisor demonstration
export const INITIAL_SUPPLIERS = [
  {
    id: 'sup-001',
    name: 'Apex Wholesale Supplies',
    email: 'orders@apexsupplies.com',
    phone: '+1 (555) 234-5678',
    address: '142 Market Street, Industrial Park, Suite 4',
    createdAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: 'sup-002',
    name: 'Global Hardware & Electronics',
    email: 'contact@globalelec.net',
    phone: '+1 (555) 876-5432',
    address: '88 Tech Boulevard, Silicon Valley',
    createdAt: new Date('2024-02-01').toISOString(),
  },
  {
    id: 'sup-003',
    name: 'Metro Retail Logistics',
    email: 'support@metrologistics.com',
    phone: '+1 (555) 345-9876',
    address: '500 Commerce Way, Bayonne, NJ',
    createdAt: new Date('2024-03-10').toISOString(),
  }
];

/**
 * Get all suppliers from Firestore (with local demo fallback)
 */
export const getSuppliers = async () => {
  try {
    if (db && !isDemoConfig) {
      const q = query(collection(db, 'suppliers'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const suppliers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (suppliers.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_SUPPLIERS_KEY, JSON.stringify(suppliers));
        return suppliers;
      }
    }
  } catch (error) {
    console.warn("Firestore suppliers fetch warning (using cache/initial):", error.message);
  }

  // Fallback to local storage or initial suppliers
  const cached = localStorage.getItem(LOCAL_STORAGE_SUPPLIERS_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // fallback
    }
  }

  // Seed default suppliers locally
  localStorage.setItem(LOCAL_STORAGE_SUPPLIERS_KEY, JSON.stringify(INITIAL_SUPPLIERS));
  return INITIAL_SUPPLIERS;
};

/**
 * Add a new supplier to Firestore
 */
export const addSupplier = async (supplierData) => {
  const newSupplier = {
    name: supplierData.name.trim(),
    email: supplierData.email ? supplierData.email.trim() : '',
    phone: supplierData.phone ? supplierData.phone.trim() : '',
    address: supplierData.address ? supplierData.address.trim() : '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    if (db && !isDemoConfig) {
      const docRef = await addDoc(collection(db, 'suppliers'), newSupplier);
      const created = { id: docRef.id, ...newSupplier, createdAt: new Date().toISOString() };
      
      // Update local cache
      const cached = await getSuppliers();
      localStorage.setItem(LOCAL_STORAGE_SUPPLIERS_KEY, JSON.stringify([...cached, created]));
      return created;
    }
  } catch (error) {
    console.warn("Firestore addSupplier fallback to local:", error.message);
  }

  // Fallback local persistence
  const created = {
    id: 'sup-' + Date.now(),
    ...newSupplier,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const cached = await getSuppliers();
  const updated = [...cached, created];
  localStorage.setItem(LOCAL_STORAGE_SUPPLIERS_KEY, JSON.stringify(updated));
  return created;
};

/**
 * Update an existing supplier in Firestore
 */
export const updateSupplier = async (id, updates) => {
  if (!id) throw new Error("Supplier ID is required for update.");
  if (!updates.name || !updates.name.trim()) {
    throw new Error("Supplier organization name is required.");
  }

  const sanitized = {
    name: updates.name.trim(),
    email: updates.email ? updates.email.trim() : '',
    phone: updates.phone ? updates.phone.trim() : '',
    address: updates.address ? updates.address.trim() : '',
    updatedAt: serverTimestamp(),
  };

  try {
    if (db && !isDemoConfig) {
      const docRef = doc(db, 'suppliers', id);
      await updateDoc(docRef, sanitized);
    }
  } catch (error) {
    console.warn("Firestore updateSupplier fallback to local:", error.message);
  }

  // Update local cache
  const cached = await getSuppliers();
  const index = cached.findIndex(s => s.id === id);
  if (index !== -1) {
    cached[index] = {
      ...cached[index],
      ...sanitized,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_SUPPLIERS_KEY, JSON.stringify(cached));
    return cached[index];
  }
  return null;
};

/**
 * Check how many products are currently associated with a supplier
 * @param {string} supplierId
 * @returns {Promise<number>} Number of associated products
 */
export const getSupplierProductCount = async (supplierId) => {
  if (!supplierId) return 0;
  const products = await getProducts(true);
  return products.filter(p => p.supplierId === supplierId).length;
};

/**
 * Delete a supplier from Firestore after verifying no products are associated.
 * 
 * Safeguard:
 * If any products still reference this supplier ID, deletion is blocked
 * with an informative error message.
 * 
 * @param {string} id - Supplier document ID
 */
export const deleteSupplier = async (id) => {
  if (!id) throw new Error("Supplier ID is required for deletion.");

  // Check product associations before allowing deletion
  const productCount = await getSupplierProductCount(id);
  if (productCount > 0) {
    throw new Error(
      `Cannot delete supplier. There are ${productCount} associated product(s) in your catalogue. Please reassign those products first.`
    );
  }

  try {
    if (db && !isDemoConfig) {
      const docRef = doc(db, 'suppliers', id);
      await deleteDoc(docRef);
    }
  } catch (error) {
    console.warn("Firestore deleteSupplier fallback to local:", error.message);
  }

  // Update local cache
  const cached = await getSuppliers();
  const updated = cached.filter(s => s.id !== id);
  localStorage.setItem(LOCAL_STORAGE_SUPPLIERS_KEY, JSON.stringify(updated));
  return { success: true, id };
};
