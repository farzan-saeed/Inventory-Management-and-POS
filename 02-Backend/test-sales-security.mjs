/**
 * Automated Verification Test Suite for Phase 1: processSale Cloud Function & Security
 * 
 * Verifies all 10+ operational and security criteria:
 * 1. Rejects unauthenticated callers.
 * 2. Rejects unauthorized roles ('Inventory Staff', 'Guest', etc.).
 * 3. Authorizes 'Admin' role.
 * 4. Authorizes 'Sales Staff' role.
 * 5. Rejects empty line items.
 * 6. Rejects invalid / non-integer / negative quantities.
 * 7. Rejects non-existent products.
 * 8. Rejects deactivated products (isActive === false).
 * 9. Rejects sales with insufficient stock (resource-exhausted).
 * 10. Aggregates duplicate product IDs correctly.
 * 11. Calculates total from trusted Firestore selling prices (ignoring frontend-supplied prices).
 * 12. Correctly decrements stock and writes immutable stock_out movements and sales document.
 */

import { handleProcessSale } from './lib/index.js';

// Minimal in-memory Mock Firestore for transaction verification
function createMockFirestore(initialData = {}) {
  const store = {
    users: new Map(Object.entries(initialData.users || {})),
    products: new Map(Object.entries(initialData.products || {})),
    sales: new Map(Object.entries(initialData.sales || {})),
    stockMovements: new Map(Object.entries(initialData.stockMovements || {})),
  };

  let autoIdCounter = 1;

  const firestore = {
    collection(colName) {
      return {
        doc(id) {
          const docId = id || `auto-${autoIdCounter++}`;
          return {
            id: docId,
            async get() {
              const data = store[colName]?.get(docId);
              return {
                id: docId,
                exists: data !== undefined,
                data: () => data ? JSON.parse(JSON.stringify(data)) : undefined,
              };
            },
            async set(data) {
              if (!store[colName]) store[colName] = new Map();
              store[colName].set(docId, JSON.parse(JSON.stringify(data)));
            },
          };
        },
      };
    },

    async runTransaction(updateFunction) {
      // Create transaction context
      const stagedUpdates = [];
      const stagedSets = [];

      const transaction = {
        async get(docRef) {
          return await docRef.get();
        },
        update(docRef, data) {
          stagedUpdates.push({ docRef, data });
        },
        set(docRef, data) {
          stagedSets.push({ docRef, data });
        },
      };

      const result = await updateFunction(transaction);

      // Commit staged updates
      for (const { docRef, data } of stagedUpdates) {
        const parts = docRef.id;
        // Find which collection
        for (const col of Object.keys(store)) {
          if (store[col].has(parts)) {
            const current = store[col].get(parts);
            store[col].set(parts, { ...current, ...data });
          }
        }
      }

      for (const { docRef, data } of stagedSets) {
        for (const col of Object.keys(store)) {
          // If auto id starts with auto
          if (col === 'sales' && data.saleId) {
            store[col].set(docRef.id, data);
          } else if (col === 'stockMovements' && data.type) {
            store[col].set(docRef.id, data);
          }
        }
      }

      return result;
    },

    _dump() {
      return {
        products: Object.fromEntries(store.products),
        sales: Object.fromEntries(store.sales),
        stockMovements: Object.fromEntries(store.stockMovements),
      };
    }
  };

  return firestore;
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("====================================================================");
  console.log("PHASE 1: CLOUD FUNCTION 'processSale' VERIFICATION TEST SUITE");
  console.log("====================================================================\n");

  const baseDbData = {
    users: {
      'admin-01': { uid: 'admin-01', name: 'Sarah Admin', role: 'Admin', email: 'admin@test.edu' },
      'sales-01': { uid: 'sales-01', name: 'Amina Sales', role: 'Sales Staff', email: 'sales@test.edu' },
      'inv-01': { uid: 'inv-01', name: 'Mike Inventory', role: 'Inventory Staff', email: 'inv@test.edu' },
      'guest-01': { uid: 'guest-01', name: 'Guest User', role: 'Guest', email: 'guest@test.edu' },
    },
    products: {
      'prd-mouse': {
        name: 'Wireless Mouse',
        sku: 'ELE-101',
        purchasePrice: 12.00,
        sellingPrice: 25.00,
        quantity: 10,
        isActive: true,
      },
      'prd-kb': {
        name: 'Mechanical Keyboard',
        sku: 'ELE-202',
        purchasePrice: 30.00,
        sellingPrice: 60.00,
        quantity: 5,
        isActive: true,
      },
      'prd-inactive': {
        name: 'Discontinued Scanner',
        sku: 'OFF-999',
        purchasePrice: 20.00,
        sellingPrice: 40.00,
        quantity: 8,
        isActive: false, // Inactive product!
      },
    },
  };

  // Test 1: Rejects unauthenticated requests
  console.log("Test 1: Authentication enforcement");
  try {
    const mockDb = createMockFirestore(baseDbData);
    await handleProcessSale({ items: [{ productId: 'prd-mouse', quantity: 1 }] }, {}, mockDb);
    assert(false, "Should have thrown unauthenticated error");
  } catch (err) {
    assert(err.code === 'unauthenticated', `Rejects missing auth with code='${err.code}'`);
  }

  // Test 2: Rejects unauthorized role ('Inventory Staff')
  console.log("\nTest 2: Role authorization (Inventory Staff cannot process sales)");
  try {
    const mockDb = createMockFirestore(baseDbData);
    const context = { auth: { uid: 'inv-01', token: { email: 'inv@test.edu' } } };
    await handleProcessSale({ items: [{ productId: 'prd-mouse', quantity: 1 }] }, context, mockDb);
    assert(false, "Should have thrown permission-denied error");
  } catch (err) {
    assert(err.code === 'permission-denied', `Rejects Inventory Staff with code='${err.code}'`);
  }

  // Test 3: Rejects unauthorized role ('Guest')
  console.log("\nTest 3: Role authorization (Guest cannot process sales)");
  try {
    const mockDb = createMockFirestore(baseDbData);
    const context = { auth: { uid: 'guest-01', token: { email: 'guest@test.edu' } } };
    await handleProcessSale({ items: [{ productId: 'prd-mouse', quantity: 1 }] }, context, mockDb);
    assert(false, "Should have thrown permission-denied error");
  } catch (err) {
    assert(err.code === 'permission-denied', `Rejects Guest with code='${err.code}'`);
  }

  // Test 4: Rejects empty item list
  console.log("\nTest 4: Input validation (empty items array)");
  try {
    const mockDb = createMockFirestore(baseDbData);
    const context = { auth: { uid: 'sales-01', token: { email: 'sales@test.edu' } } };
    await handleProcessSale({ items: [] }, context, mockDb);
    assert(false, "Should have thrown invalid-argument for empty items");
  } catch (err) {
    assert(err.code === 'invalid-argument', `Rejects empty items with code='${err.code}'`);
  }

  // Test 5: Rejects non-integer / negative quantity
  console.log("\nTest 5: Input validation (negative and float quantities)");
  try {
    const mockDb = createMockFirestore(baseDbData);
    const context = { auth: { uid: 'sales-01', token: { email: 'sales@test.edu' } } };
    await handleProcessSale({ items: [{ productId: 'prd-mouse', quantity: -2 }] }, context, mockDb);
    assert(false, "Should have thrown invalid-argument for negative quantity");
  } catch (err) {
    assert(err.code === 'invalid-argument', `Rejects negative quantity with code='${err.code}'`);
  }

  try {
    const mockDb = createMockFirestore(baseDbData);
    const context = { auth: { uid: 'sales-01', token: { email: 'sales@test.edu' } } };
    await handleProcessSale({ items: [{ productId: 'prd-mouse', quantity: 2.5 }] }, context, mockDb);
    assert(false, "Should have thrown invalid-argument for float quantity");
  } catch (err) {
    assert(err.code === 'invalid-argument', `Rejects float quantity with code='${err.code}'`);
  }

  // Test 6: Rejects non-existent product
  console.log("\nTest 6: Product catalogue validation (non-existent product)");
  try {
    const mockDb = createMockFirestore(baseDbData);
    const context = { auth: { uid: 'sales-01', token: { email: 'sales@test.edu' } } };
    await handleProcessSale({ items: [{ productId: 'non-existent-id', quantity: 1 }] }, context, mockDb);
    assert(false, "Should have thrown not-found for missing product");
  } catch (err) {
    assert(err.code === 'not-found', `Rejects missing product with code='${err.code}'`);
  }

  // Test 7: Rejects deactivated product
  console.log("\nTest 7: Product status validation (deactivated product)");
  try {
    const mockDb = createMockFirestore(baseDbData);
    const context = { auth: { uid: 'sales-01', token: { email: 'sales@test.edu' } } };
    await handleProcessSale({ items: [{ productId: 'prd-inactive', quantity: 1 }] }, context, mockDb);
    assert(false, "Should have thrown failed-precondition for deactivated product");
  } catch (err) {
    assert(err.code === 'failed-precondition', `Rejects deactivated product with code='${err.code}'`);
  }

  // Test 8: Rejects sale exceeding available inventory (insufficient stock)
  console.log("\nTest 8: Stock balance validation (insufficient inventory)");
  try {
    const mockDb = createMockFirestore(baseDbData);
    const context = { auth: { uid: 'sales-01', token: { email: 'sales@test.edu' } } };
    // Mouse has 10 in stock; request 15
    await handleProcessSale({ items: [{ productId: 'prd-mouse', quantity: 15 }] }, context, mockDb);
    assert(false, "Should have thrown resource-exhausted for insufficient stock");
  } catch (err) {
    assert(err.code === 'resource-exhausted', `Rejects insufficient stock with code='${err.code}'`);
  }

  // Test 9: Successfully processes sale for Sales Staff with accurate stock deduction
  console.log("\nTest 9: Successful sale processing (Sales Staff authorized)");
  {
    const mockDb = createMockFirestore(baseDbData);
    const context = { auth: { uid: 'sales-01', token: { email: 'sales@test.edu' } } };
    
    // Attempt price tampering: pass manipulated frontend price of $1.00 instead of DB price $25.00
    const result = await handleProcessSale({
      items: [
        { productId: 'prd-mouse', quantity: 3, unitPrice: 1.00 }, // DB price is $25.00
        { productId: 'prd-kb', quantity: 1, unitPrice: 5.00 },    // DB price is $60.00
      ],
      paymentMethod: 'Card',
      customerName: 'Alice Customer',
    }, context, mockDb);

    assert(result.success === true, "Sale response indicates success === true");
    assert(result.saleId.startsWith('INV-'), `Sale ID generated properly: ${result.saleId}`);
    
    // Expected total: (3 * 25.00) + (1 * 60.00) = 75.00 + 60.00 = 135.00
    // If backend trusted frontend prices, it would have been $8.00!
    assert(result.totalAmount === 135.00, `Calculated trusted total $135.00 (ignored frontend tampered prices, got: $${result.totalAmount})`);
    
    const dump = mockDb._dump();
    const updatedMouse = dump.products['prd-mouse'];
    const updatedKb = dump.products['prd-kb'];
    assert(updatedMouse.quantity === 7, `Mouse stock deducted: 10 -> ${updatedMouse.quantity} (expected 7)`);
    assert(updatedKb.quantity === 4, `Keyboard stock deducted: 5 -> ${updatedKb.quantity} (expected 4)`);

    // Verify stockMovements
    const movements = Object.values(dump.stockMovements);
    assert(movements.length === 2, `Recorded 2 stockMovements audit records (got: ${movements.length})`);
    assert(movements.every(m => m.type === 'stock_out'), "All movements marked as 'stock_out'");
    assert(movements[0].userId === 'Amina Sales', `Audit records identify operator as verified cashier '${movements[0].userId}'`);

    // Verify sales document
    const salesDocs = Object.values(dump.sales);
    assert(salesDocs.length === 1, `Created 1 persistent sale record in 'sales'`);
    assert(salesDocs[0].totalAmount === 135.00, `Stored sale record has trusted amount $135.00`);
    assert(salesDocs[0].customerName === 'Alice Customer', `Customer name correctly set to '${salesDocs[0].customerName}'`);
  }

  // Test 10: Successfully processes sale for Admin role and aggregates duplicate product IDs
  console.log("\nTest 10: Admin role authorized & duplicate item aggregation");
  {
    const mockDb = createMockFirestore(baseDbData);
    const context = { auth: { uid: 'admin-01', token: { email: 'admin@test.edu' } } };

    // Pass same product twice: 2 units and 3 units (total 5 units)
    const result = await handleProcessSale({
      items: [
        { productId: 'prd-mouse', quantity: 2 },
        { productId: 'prd-mouse', quantity: 3 },
      ],
      paymentMethod: 'Cash',
      customerName: 'Bob Duplicate',
    }, context, mockDb);

    assert(result.success === true, "Admin sale completed successfully");
    assert(result.totalAmount === 125.00, `Aggregated duplicate items: 5 * $25.00 = $125.00 (got $${result.totalAmount})`);

    const dump = mockDb._dump();
    const updatedMouse = dump.products['prd-mouse'];
    assert(updatedMouse.quantity === 5, `Mouse stock deducted: 10 -> ${updatedMouse.quantity} (expected 5)`);
  }

  console.log("\n====================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
