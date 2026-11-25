import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions, isDemoConfig } from '../firebase/firebaseConfig.js';
import { getProducts, updateProduct } from './productService.js';
import { getStockMovements } from './inventoryService.js';

const LOCAL_STORAGE_SALES_KEY = 'smart_inventory_sales';

// Initial sales transactions for supervisor demonstration
export const INITIAL_SALES = [
  {
    id: 'sale-1001',
    saleId: 'INV-2024-001',
    items: [
      {
        productId: 'prd-001',
        name: 'Wireless Bluetooth Ergonomic Mouse',
        quantity: 2,
        unitPrice: 24.99,
        subtotal: 49.98
      },
      {
        productId: 'prd-004',
        name: 'USB-C Fast Charging Cable 2M (Nylon Braided)',
        quantity: 3,
        unitPrice: 9.99,
        subtotal: 29.97
      }
    ],
    totalAmount: 79.95,
    paymentMethod: 'Credit Card',
    customerName: 'Walk-in Customer',
    soldBy: 'Amina Patel',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'sale-1002',
    saleId: 'INV-2024-002',
    items: [
      {
        productId: 'prd-002',
        name: 'Mechanical Gaming Keyboard (Blue Switch)',
        quantity: 1,
        unitPrice: 59.99,
        subtotal: 59.99
      }
    ],
    totalAmount: 59.99,
    paymentMethod: 'Cash',
    customerName: 'Walk-in Customer',
    soldBy: 'Sarah Connor',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'sale-1003',
    saleId: 'INV-2024-003',
    items: [
      {
        productId: 'prd-003',
        name: 'Heavy Duty Packaging Tape (6-Pack)',
        quantity: 4,
        unitPrice: 14.50,
        subtotal: 58.00
      },
      {
        productId: 'prd-005',
        name: 'Thermal Receipt Paper Rolls (50 Rolls/Box)',
        quantity: 1,
        unitPrice: 42.00,
        subtotal: 42.00
      }
    ],
    totalAmount: 100.00,
    paymentMethod: 'Mobile Pay',
    customerName: 'Walk-in Customer',
    soldBy: 'Amina Patel',
    status: 'completed',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  }
];

/**
 * Process a sale transaction.
 * 
 * Secure flow:
 * In live mode, this invokes the server-side Firebase Callable Cloud Function 'processSale'.
 * The backend verifies authentication and user roles ('Admin' or 'Sales Staff'), validates quantities,
 * fetches trusted prices from Firestore, and executes an atomic Admin transaction that updates stock,
 * writes an immutable 'stock_out' movement, and records the sale.
 * 
 * Direct client-side Firestore transactions have been removed to prevent clients from
 * bypassing security rules or calculating prices arbitrarily.
 */
export const processSale = async ({
  items, 
  paymentMethod = 'Cash', 
  customerName = 'Walk-in Customer',
  soldBy = 'Sales Staff'
}) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Sale must contain at least one line item.');
  }

  // 1. Production / Live Firebase Path: Invoke Callable Cloud Function
  if (functions && !isDemoConfig) {
    try {
      const processSaleCallable = httpsCallable(functions, 'processSale');
      const response = await processSaleCallable({
        items: items.map(i => ({
          productId: i.productId,
          name: i.name,
          quantity: parseInt(i.quantity, 10),
        })),
        paymentMethod,
        customerName: customerName.trim() || 'Walk-in Customer',
      });

      const data = response.data;

      // Sync local cache for immediate UI view
      try {
        const sales = await getSales();
        const newSaleRecord = {
          id: data.saleId,
          saleId: data.saleId,
          items: data.items,
          totalAmount: data.totalAmount,
          paymentMethod: data.paymentMethod || paymentMethod,
          customerName: data.customerName || customerName,
          soldBy: data.soldBy || soldBy,
          status: 'completed',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify([newSaleRecord, ...sales]));
      } catch (cacheErr) {
        console.warn("Local sales cache update warning:", cacheErr);
      }

      return {
        success: true,
        saleId: data.saleId,
        totalAmount: data.totalAmount,
        items: data.items,
        paymentMethod: data.paymentMethod || paymentMethod,
        customerName: data.customerName || customerName,
        soldBy: data.soldBy || soldBy,
        message: data.message || 'Sale completed and inventory automatically updated!',
      };
    } catch (error) {
      console.error("Firebase Cloud Function processSale error:", error);
      // Format human-readable message from HttpsError
      const errorMsg = error.message || 'Failed to process sale on server.';
      throw new Error(errorMsg);
    }
  }

  // 2. Offline Simulated Demo Mode (For evaluator review when running without live Firebase keys)
  // Note: Client does NOT perform Firestore transactions. All mutations are confined to localStorage.
  const products = await getProducts(true);

  // Validate stock availability in demo mode
  for (const item of items) {
    const prod = products.find(p => p.id === item.productId);
    if (!prod) {
      throw new Error(`Product "${item.name}" not found in catalogue.`);
    }
    if ((prod.quantity || 0) < item.quantity) {
      throw new Error(`Insufficient stock for "${item.name}". Available: ${prod.quantity || 0}, Requested: ${item.quantity}`);
    }
  }

  const saleCode = 'INV-' + Math.floor(100000 + Math.random() * 900000);
  let calculatedTotal = 0;

  const finalItems = items.map(item => {
    const prod = products.find(p => p.id === item.productId);
    const unitPrice = Number(prod?.sellingPrice) || 0;
    const subtotal = Math.round(unitPrice * item.quantity * 100) / 100;
    calculatedTotal += subtotal;
    return {
      productId: item.productId,
      name: prod?.name || item.name,
      quantity: item.quantity,
      unitPrice,
      subtotal,
    };
  });

  // Update demo mock quantities in localStorage
  const movements = await getStockMovements(100);
  for (const item of items) {
    const prod = products.find(p => p.id === item.productId);
    const prevQty = prod.quantity || 0;
    const newQty = prevQty - item.quantity;
    await updateProduct(item.productId, { quantity: newQty });

    movements.unshift({
      id: 'mov-' + Date.now() + Math.random().toString(36).substring(7),
      productId: item.productId,
      productName: item.name,
      type: 'stock_out',
      quantity: item.quantity,
      previousQuantity: prevQty,
      newQuantity: newQty,
      referenceId: saleCode,
      notes: `Customer sale: ${customerName}`,
      userId: soldBy,
      createdAt: new Date().toISOString(),
    });
  }
  localStorage.setItem('smart_inventory_stock_movements', JSON.stringify(movements));

  const totalAmountRounded = Math.round(calculatedTotal * 100) / 100;

  const newSale = {
    id: 'sale-' + Date.now(),
    saleId: saleCode,
    items: finalItems,
    totalAmount: totalAmountRounded,
    paymentMethod,
    customerName,
    soldBy,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  const sales = await getSales();
  sales.unshift(newSale);
  localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify(sales));

  return {
    success: true,
    saleId: saleCode,
    totalAmount: totalAmountRounded,
    items: finalItems,
    paymentMethod,
    customerName,
    soldBy,
    message: 'Sale completed and inventory automatically updated!',
  };
};

/**
 * Retrieve sales records from Firestore (or fallback cache)
 */
export const getSales = async (limitCount = 50) => {
  try {
    if (db && !isDemoConfig) {
      const q = query(
        collection(db, 'sales'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      const sales = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      if (sales.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify(sales));
        return sales;
      }
    }
  } catch (error) {
    console.warn("Firestore getSales fallback:", error.message);
  }

  const cached = localStorage.getItem(LOCAL_STORAGE_SALES_KEY);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (e) {
      // fallback to initial
    }
  }

  localStorage.setItem(LOCAL_STORAGE_SALES_KEY, JSON.stringify(INITIAL_SALES));
  return INITIAL_SALES;
};
