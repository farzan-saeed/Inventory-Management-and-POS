import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  query, 
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { db, isDemoConfig } from '../firebase/firebaseConfig.js';
import { generateSKU } from '../utils/formatters.js';

const LOCAL_STORAGE_PRODUCTS_KEY = 'smart_inventory_products';

// Initial sample catalog items for supervisor review
export const INITIAL_PRODUCTS = [
  {
    id: 'prd-001',
    name: 'Wireless Bluetooth Ergonomic Mouse',
    sku: 'ELE-1042',
    category: 'Electronics',
    description: 'Rechargeable multi-device 2.4GHz + Bluetooth optical mouse with silent click switches.',
    purchasePrice: 12.50,
    sellingPrice: 24.99,
    quantity: 45,
    reorderLevel: 15,
    supplierId: 'sup-002',
    isActive: true,
    createdAt: new Date('2024-03-01T10:00:00Z').toISOString(),
    updatedAt: new Date('2024-03-01T10:00:00Z').toISOString(),
  },
  {
    id: 'prd-002',
    name: 'Mechanical Gaming Keyboard (Blue Switch)',
    sku: 'ELE-2089',
    category: 'Electronics',
    description: 'Compact 87-key RGB backlit mechanical keyboard with hot-swappable switches.',
    purchasePrice: 28.00,
    sellingPrice: 59.99,
    quantity: 8, // Low stock on purpose
    reorderLevel: 10,
    supplierId: 'sup-002',
    isActive: true,
    createdAt: new Date('2024-03-05T11:30:00Z').toISOString(),
    updatedAt: new Date('2024-03-05T11:30:00Z').toISOString(),
  },
  {
    id: 'prd-003',
    name: 'Heavy Duty Packaging Tape (6-Pack)',
    sku: 'SUP-4011',
    category: 'Packaging',
    description: 'High tensile strength acrylic packing tape, 2-inch x 55 yards per roll.',
    purchasePrice: 6.20,
    sellingPrice: 14.50,
    quantity: 120,
    reorderLevel: 30,
    supplierId: 'sup-001',
    isActive: true,
    createdAt: new Date('2024-02-18T09:15:00Z').toISOString(),
    updatedAt: new Date('2024-02-18T09:15:00Z').toISOString(),
  },
  {
    id: 'prd-004',
    name: 'USB-C Fast Charging Cable 2M (Nylon Braided)',
    sku: 'ELE-3015',
    category: 'Electronics',
    description: '100W Power Delivery compliant durable braided USB Type-C charging and data cable.',
    purchasePrice: 3.40,
    sellingPrice: 9.99,
    quantity: 4, // Critical low stock
    reorderLevel: 20,
    supplierId: 'sup-002',
    isActive: true,
    createdAt: new Date('2024-03-12T14:20:00Z').toISOString(),
    updatedAt: new Date('2024-03-12T14:20:00Z').toISOString(),
  },
  {
    id: 'prd-005',
    name: 'Thermal Receipt Paper Rolls (50 Rolls/Box)',
    sku: 'OFF-8820',
    category: 'Office Supplies',
    description: 'BPA-free 3-1/8" x 230\' standard thermal POS receipt register rolls.',
    purchasePrice: 22.00,
    sellingPrice: 42.00,
    quantity: 25,
    reorderLevel: 10,
    supplierId: 'sup-003',
    isActive: true,
    createdAt: new Date('2024-01-20T08:00:00Z').toISOString(),
    updatedAt: new Date('2024-01-20T08:00:00Z').toISOString(),
  },
  {
    id: 'prd-006',
    name: 'Discontinued Laser Barcode Scanner',
    sku: 'OFF-1102',
    category: 'Office Supplies',
    description: 'Handheld 1D USB barcode reader with stand (legacy model).',
    purchasePrice: 18.00,
    sellingPrice: 35.00,
    quantity: 0,
    reorderLevel: 5,
    supplierId: 'sup-003',
    isActive: false, // Deactivated product
    createdAt: new Date('2023-11-10T12:00:00Z').toISOString(),
    updatedAt: new Date('2024-02-01T10:00:00Z').toISOString(),
  }
];

/**
 * Get all products
 */
export const getProducts = async (includeInactive = true) => {
  try {
    if (db && !isDemoConfig) {
      const q = query(collection(db, 'products'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (products.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(products));
        return includeInactive ? products : products.filter(p => p.isActive !== false);
      }
    }
  } catch (error) {
    console.warn("Firestore getProducts warning:", error.message);
  }

  // Fallback to localStorage or INITIAL_PRODUCTS
  const cached = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
  let list = INITIAL_PRODUCTS;
  if (cached) {
    try {
      list = JSON.parse(cached);
    } catch (e) {
      list = INITIAL_PRODUCTS;
    }
  } else {
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
  }

  return includeInactive ? list : list.filter(p => p.isActive !== false);
};

/**
 * Get a single product by ID
 */
export const getProductById = async (id) => {
  try {
    if (db && !isDemoConfig) {
      const docRef = doc(db, 'products', id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
      }
    }
  } catch (error) {
    console.warn("Firestore getProductById fallback:", error.message);
  }

  const products = await getProducts(true);
  return products.find(p => p.id === id) || null;
};

/**
 * Check whether a SKU is already assigned to another product.
 * 
 * Requirements:
 * - Trims whitespace and normalizes case-insensitively (UPPERCASE).
 * - During product creation (excludeProductId = null), returns true if any product has the same normalized SKU.
 * - During product editing, allows the product to retain its own existing SKU.
 * - Rejects if another product (different ID) has the same normalized SKU.
 * 
 * Note: This is an application-level duplicate prevention query appropriate for
 * academic and retail systems (not a concurrency-proof database constraint).
 * 
 * @param {string} sku - The SKU to validate
 * @param {string|null} excludeProductId - Product ID being edited (if any)
 * @returns {Promise<boolean>} True if the SKU is a duplicate
 */
export const isSkuDuplicate = async (sku, excludeProductId = null) => {
  if (!sku || typeof sku !== 'string') return false;
  const normalized = sku.trim().toUpperCase();
  if (!normalized) return false;

  // 1. Check against Firestore when live database is active
  try {
    if (db && !isDemoConfig) {
      const q = query(collection(db, 'products'));
      const snapshot = await getDocs(q);
      const isTaken = snapshot.docs.some(docSnap => {
        if (excludeProductId && docSnap.id === excludeProductId) {
          return false;
        }
        const data = docSnap.data();
        const existingSku = data.sku ? String(data.sku).trim().toUpperCase() : '';
        return existingSku === normalized;
      });
      if (isTaken) return true;
    }
  } catch (error) {
    console.warn("Firestore isSkuDuplicate query fallback to local cache:", error.message);
  }

  // 2. Check against local / cached products
  const products = await getProducts(true);
  return products.some(p => {
    if (excludeProductId && p.id === excludeProductId) {
      return false;
    }
    const existingSku = p.sku ? String(p.sku).trim().toUpperCase() : '';
    return existingSku === normalized;
  });
};

/**
 * Add a new product to Firestore
 */
export const addProduct = async (productData, userId = 'system') => {
  const purchasePrice = parseFloat(productData.purchasePrice) || 0;
  const sellingPrice = parseFloat(productData.sellingPrice) || 0;
  const quantity = parseInt(productData.quantity, 10) || 0;
  const reorderLevel = parseInt(productData.reorderLevel, 10) || 0;
  const sku = productData.sku ? productData.sku.trim().toUpperCase() : generateSKU(productData.category);

  // Application-level duplicate SKU check
  const duplicate = await isSkuDuplicate(sku);
  if (duplicate) {
    throw new Error("This SKU already exists. Please use a unique SKU.");
  }

  const newProduct = {
    name: productData.name.trim(),
    sku,
    category: productData.category || 'General',
    description: productData.description ? productData.description.trim() : '',
    purchasePrice,
    sellingPrice,
    quantity,
    reorderLevel,
    supplierId: productData.supplierId || '',
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    if (db && !isDemoConfig) {
      const docRef = await addDoc(collection(db, 'products'), newProduct);
      const productId = docRef.id;

      // Log initial stock movement if quantity > 0
      if (quantity > 0) {
        await addDoc(collection(db, 'stockMovements'), {
          productId,
          productName: newProduct.name,
          type: 'stock_in',
          quantity,
          previousQuantity: 0,
          newQuantity: quantity,
          referenceId: 'INITIAL_STOCK',
          userId,
          createdAt: serverTimestamp(),
        });
      }

      const created = {
        id: productId,
        ...newProduct,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Sync local storage
      const existing = await getProducts(true);
      localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify([created, ...existing]));
      return created;
    }
  } catch (error) {
    console.warn("Firestore addProduct fallback to local:", error.message);
  }

  // Local storage fallback for inspection
  const productId = 'prd-' + Date.now();
  const created = {
    id: productId,
    ...newProduct,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const existing = await getProducts(true);
  const updatedList = [created, ...existing];
  localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(updatedList));

  // Also log stock movement locally
  if (quantity > 0) {
    const existingMovements = JSON.parse(localStorage.getItem('smart_inventory_stock_movements') || '[]');
    existingMovements.unshift({
      id: 'mov-' + Date.now(),
      productId,
      productName: created.name,
      type: 'stock_in',
      quantity,
      previousQuantity: 0,
      newQuantity: quantity,
      referenceId: 'INITIAL_STOCK',
      userId,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem('smart_inventory_stock_movements', JSON.stringify(existingMovements));
  }

  return created;
};

/**
 * Update product information
 */
export const updateProduct = async (id, updates) => {
  if (!id) throw new Error("Product ID is required for update.");

  // If SKU is being modified, validate uniqueness against other products
  if (updates.sku !== undefined) {
    const normalizedSku = updates.sku.trim().toUpperCase();
    const duplicate = await isSkuDuplicate(normalizedSku, id);
    if (duplicate) {
      throw new Error("This SKU already exists. Please use a unique SKU.");
    }
    updates.sku = normalizedSku;
  }

  const sanitized = {
    ...updates,
    updatedAt: serverTimestamp(),
  };

  if (updates.purchasePrice !== undefined) sanitized.purchasePrice = parseFloat(updates.purchasePrice) || 0;
  if (updates.sellingPrice !== undefined) sanitized.sellingPrice = parseFloat(updates.sellingPrice) || 0;
  if (updates.reorderLevel !== undefined) sanitized.reorderLevel = parseInt(updates.reorderLevel, 10) || 0;
  if (updates.quantity !== undefined) sanitized.quantity = parseInt(updates.quantity, 10) || 0;

  try {
    if (db && !isDemoConfig) {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, sanitized);
    }
  } catch (error) {
    console.warn("Firestore updateProduct fallback:", error.message);
  }

  // Update local storage
  const existing = await getProducts(true);
  const index = existing.findIndex(p => p.id === id);
  if (index !== -1) {
    existing[index] = {
      ...existing[index],
      ...sanitized,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(existing));
    return existing[index];
  }
  return null;
};

/**
 * Deactivate or activate a product (soft delete)
 */
export const deactivateProduct = async (id, isActive = false) => {
  return await updateProduct(id, { isActive });
};
