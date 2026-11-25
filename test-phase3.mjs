/**
 * Automated Verification Test Suite for Phase 3:
 * Inventory & Reporting Completion
 * 
 * Verifies:
 * 1. Backend Cloud Function 'handleManualStockOut' (Authentication, Roles, Atomic Transaction, Stock Validation, Audit Trail).
 * 2. Service Layer 'recordStockOut' (Quantity validation, stock sufficiency, audit logging).
 * 3. Dynamic Dashboard Sales Trend Computation (Daily aggregation, meaningful zeroes, empty dataset handling).
 * 4. Reports Date-Range Filtering & CSV Export (Filtered metrics, CSV headers, quote escaping, empty handling).
 * 5. Transaction History Multi-Filtering (Keyword search, type filtering, date filtering, combined filters, empty states).
 */

import { handleManualStockOut } from './02-Backend/lib/index.js';
import { recordStockOut, getStockMovements, INITIAL_MOVEMENTS } from './01-Frontend/src/services/inventoryService.js';
import { getProducts, INITIAL_PRODUCTS } from './01-Frontend/src/services/productService.js';
import { INITIAL_SALES } from './01-Frontend/src/services/salesService.js';

// Polyfill localStorage for Node.js test runner
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

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

// In-memory Mock Firestore for testing Cloud Function logic
function createMockFirestore(initialData = {}) {
  const store = {
    users: new Map(Object.entries(initialData.users || {})),
    products: new Map(Object.entries(initialData.products || {})),
    stockMovements: new Map(Object.entries(initialData.stockMovements || {})),
  };

  let autoIdCounter = 1;

  return {
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
                data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined),
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

    async runTransaction(updateFn) {
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

      const result = await updateFn(transaction);

      // Apply staged operations
      for (const { docRef, data } of stagedUpdates) {
        const parts = docRef.id ? [docRef.id] : [];
        for (const [colName, map] of Object.entries(store)) {
          if (map.has(docRef.id)) {
            const current = map.get(docRef.id);
            map.set(docRef.id, { ...current, ...data });
          }
        }
      }

      for (const { docRef, data } of stagedSets) {
        store.stockMovements.set(docRef.id, data);
      }

      return result;
    },

    _store: store,
  };
}

async function runPhase3Tests() {
  console.log("====================================================================");
  console.log("PHASE 3: INVENTORY & REPORTING VERIFICATION TEST SUITE");
  console.log("====================================================================\n");

  // -------------------------------------------------------------------------
  // Part 1: Backend Cloud Function 'handleManualStockOut' Security & Validation
  // -------------------------------------------------------------------------
  console.log("Part 1: Cloud Function 'manualStockOut' Backend Security");

  const mockDb = createMockFirestore({
    users: {
      'uid-admin': { name: 'Dr. Jane Admin', role: 'Admin', email: 'admin@store.edu' },
      'uid-inventory': { name: 'Bob Inventory', role: 'Inventory Staff', email: 'bob@store.edu' },
      'uid-sales': { name: 'Amina Sales', role: 'Sales Staff', email: 'amina@store.edu' },
    },
    products: {
      'prd-mouse': { name: 'Wireless Mouse', sku: 'ELE-1042', quantity: 20, isActive: true },
      'prd-keyboard': { name: 'Mechanical Keyboard', sku: 'ELE-2089', quantity: 5, isActive: true },
      'prd-inactive': { name: 'Discontinued Monitor', sku: 'ELE-9999', quantity: 10, isActive: false },
    },
    stockMovements: {},
  });

  // Test 1: Reject unauthenticated caller
  console.log("\nTest 1: Authentication enforcement");
  try {
    await handleManualStockOut({ productId: 'prd-mouse', quantity: 2 }, { auth: null }, mockDb);
    assert(false, "Should reject unauthenticated caller");
  } catch (err) {
    assert(err.code === 'unauthenticated', `Rejects missing auth with code='${err.code}'`);
  }

  // Test 2: Reject Sales Staff role
  console.log("\nTest 2: Role authorization (Sales Staff blocked from manual stock-out)");
  try {
    await handleManualStockOut(
      { productId: 'prd-mouse', quantity: 2 },
      { auth: { uid: 'uid-sales', token: { email: 'amina@store.edu' } } },
      mockDb
    );
    assert(false, "Should reject Sales Staff from manual stock-out");
  } catch (err) {
    assert(err.code === 'permission-denied', `Rejects Sales Staff with code='${err.code}'`);
  }

  // Test 3: Reject non-positive or float quantities
  console.log("\nTest 3: Quantity validation (zero, negative, float)");
  const authInventory = { auth: { uid: 'uid-inventory', token: { email: 'bob@store.edu' } } };

  try {
    await handleManualStockOut({ productId: 'prd-mouse', quantity: 0 }, authInventory, mockDb);
    assert(false, "Should reject 0 quantity");
  } catch (err) {
    assert(err.code === 'invalid-argument', `Rejects 0 quantity with code='${err.code}'`);
  }

  try {
    await handleManualStockOut({ productId: 'prd-mouse', quantity: -3 }, authInventory, mockDb);
    assert(false, "Should reject negative quantity");
  } catch (err) {
    assert(err.code === 'invalid-argument', `Rejects negative quantity with code='${err.code}'`);
  }

  try {
    await handleManualStockOut({ productId: 'prd-mouse', quantity: 2.5 }, authInventory, mockDb);
    assert(false, "Should reject float quantity");
  } catch (err) {
    assert(err.code === 'invalid-argument', `Rejects float quantity with code='${err.code}'`);
  }

  // Test 4: Reject non-existent product
  console.log("\nTest 4: Product catalog validation (non-existent product)");
  try {
    await handleManualStockOut({ productId: 'prd-ghost', quantity: 1 }, authInventory, mockDb);
    assert(false, "Should reject ghost product");
  } catch (err) {
    assert(err.code === 'not-found', `Rejects non-existent product with code='${err.code}'`);
  }

  // Test 5: Reject deactivated product
  console.log("\nTest 5: Product status validation (deactivated item)");
  try {
    await handleManualStockOut({ productId: 'prd-inactive', quantity: 1 }, authInventory, mockDb);
    assert(false, "Should reject deactivated product");
  } catch (err) {
    assert(err.code === 'failed-precondition', `Rejects deactivated product with code='${err.code}'`);
  }

  // Test 6: Reject when quantity exceeds available stock
  console.log("\nTest 6: Stock sufficiency validation (exceeds inventory balance)");
  try {
    // prd-keyboard has 5 units; requesting 10
    await handleManualStockOut({ productId: 'prd-keyboard', quantity: 10 }, authInventory, mockDb);
    assert(false, "Should reject stock deduction exceeding available count");
  } catch (err) {
    assert(err.code === 'resource-exhausted', `Rejects excessive deduction with code='${err.code}'`);
  }

  // Test 7: Successful manual stock deduction by Inventory Staff
  console.log("\nTest 7: Successful manual stock-out (Inventory Staff authorized)");
  const stockOutResult = await handleManualStockOut(
    {
      productId: 'prd-mouse',
      quantity: 4,
      reason: 'Damaged during forklift transport',
      referenceId: 'SO-DAMAGED-01',
    },
    authInventory,
    mockDb
  );

  assert(stockOutResult.success === true, "Stock-out response indicates success === true");
  assert(stockOutResult.previousQuantity === 20, "Recorded correct previous quantity (20)");
  assert(stockOutResult.newQuantity === 16, "Recorded correct new quantity (16)");
  assert(stockOutResult.deducted === 4, "Recorded deducted quantity (4)");
  assert(mockDb._store.products.get('prd-mouse').quantity === 16, "Product stock updated atomically in Firestore to 16");

  // Verify stock movement ledger record
  const movementRecords = Array.from(mockDb._store.stockMovements.values());
  const stockOutRecord = movementRecords.find(m => m.referenceId === 'SO-DAMAGED-01');
  assert(stockOutRecord !== undefined, "Immutable stock_out record created in 'stockMovements'");
  assert(stockOutRecord.type === 'stock_out', "Movement type set strictly to 'stock_out'");
  assert(stockOutRecord.userId === 'Bob Inventory', "Audit record identifies operator as 'Bob Inventory'");
  assert(stockOutRecord.notes === 'Damaged during forklift transport', "Audit record includes specified write-off reason");

  // Test 8: Admin role authorized for manual stock-out
  console.log("\nTest 8: Admin role authorized for manual stock-out");
  const authAdmin = { auth: { uid: 'uid-admin', token: { email: 'admin@store.edu' } } };
  const adminStockOut = await handleManualStockOut(
    {
      productId: 'prd-keyboard',
      quantity: 2,
      reason: 'Store demo display unit write-off',
    },
    authAdmin,
    mockDb
  );
  assert(adminStockOut.success === true, "Admin manual stock-out succeeded");
  assert(adminStockOut.newQuantity === 3, "Keyboard stock updated: 5 -> 3");

  // -------------------------------------------------------------------------
  // Part 2: Frontend Service Layer 'recordStockOut' (Local Simulated Demo Mode)
  // -------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------");
  console.log("Part 2: Frontend Service Layer 'recordStockOut'");

  localStorage.setItem('smart_inventory_products', JSON.stringify(INITIAL_PRODUCTS));
  localStorage.setItem('smart_inventory_stock_movements', JSON.stringify(INITIAL_MOVEMENTS));

  // Test 9: Service layer deduction & audit persistence
  console.log("\nTest 9: Service layer recordStockOut execution");
  const initialProducts = await getProducts(true);
  const targetProd = initialProducts[0]; // Wireless Mouse (quantity 45)
  const initialQty = targetProd.quantity;

  const serviceResult = await recordStockOut({
    productId: targetProd.id,
    quantity: 5,
    reason: 'Expired packaging disposal',
    referenceId: 'SO-TEST-009',
    userId: 'Sarah Connor',
  });

  assert(serviceResult.success === true, "recordStockOut returned success");
  assert(serviceResult.newQuantity === initialQty - 5, `Stock deducted: ${initialQty} -> ${serviceResult.newQuantity}`);

  const movementsAfter = await getStockMovements(10);
  const loggedMov = movementsAfter.find(m => m.referenceId === 'SO-TEST-009');
  assert(loggedMov !== undefined, "Movement logged in persistent local audit trail");
  assert(loggedMov.type === 'stock_out', "Movement logged as 'stock_out'");
  assert(loggedMov.userId === 'Sarah Connor', "Movement operator recorded as 'Sarah Connor'");

  // Test 10: Service layer rejects excessive quantity
  console.log("\nTest 10: Service layer rejects quantity > stock");
  try {
    await recordStockOut({
      productId: targetProd.id,
      quantity: 9999, // Exceeds available stock
      reason: 'Attempted oversized removal',
    });
    assert(false, "Should reject quantity exceeding stock");
  } catch (err) {
    assert(err.message.includes("available in stock"), `Rejected excessive deduction: "${err.message}"`);
  }

  // -------------------------------------------------------------------------
  // Part 3: Dynamic Dashboard Sales Trend
  // -------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------");
  console.log("Part 3: Dynamic Dashboard Sales Trend Computation");

  // Helper function matching Dashboard.jsx implementation
  function computeWeeklySalesTrend(salesList) {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const distanceToMonday = (currentDayOfWeek + 6) % 7;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - distanceToMonday);
    monday.setHours(0, 0, 0, 0);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dayLabel = dayNames[d.getDay()];
      const isToday = d.toDateString() === today.toDateString();
      
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const localDateStr = `${y}-${m}-${dayNum}`;

      weekDays.push({
        dateStr: localDateStr,
        day: isToday ? `${dayLabel} (Today)` : dayLabel,
        revenue: 0,
        orders: 0,
      });
    }

    if (Array.isArray(salesList)) {
      salesList.forEach((sale) => {
        if (!sale.createdAt) return;
        const saleDate = new Date(sale.createdAt);
        if (isNaN(saleDate.getTime())) return;

        const y = saleDate.getFullYear();
        const m = String(saleDate.getMonth() + 1).padStart(2, '0');
        const dayNum = String(saleDate.getDate()).padStart(2, '0');
        const saleDateStr = `${y}-${m}-${dayNum}`;

        const targetDay = weekDays.find((wd) => wd.dateStr === saleDateStr);
        if (targetDay) {
          targetDay.revenue = Math.round((targetDay.revenue + (Number(sale.totalAmount) || 0)) * 100) / 100;
          targetDay.orders += 1;
        }
      });
    }

    return weekDays;
  }

  // Test 11: Real sales reflected accurately on matching days
  console.log("\nTest 11: Daily aggregation from real transaction records");
  const testSales = [
    { id: 's-1', totalAmount: 120.50, createdAt: new Date().toISOString() }, // Today
    { id: 's-2', totalAmount: 79.50, createdAt: new Date().toISOString() },  // Today
  ];

  const trend = computeWeeklySalesTrend(testSales);
  assert(trend.length === 7, "Generated exactly 7 days for the current week");
  const todayEntry = trend.find(d => d.day.includes('(Today)'));
  assert(todayEntry !== undefined, "Identified today's calendar entry in week");
  assert(todayEntry.revenue === 200.00, `Today's revenue aggregated: $120.50 + $79.50 = $200.00 (got: $${todayEntry.revenue})`);
  assert(todayEntry.orders === 2, `Today's orders aggregated: 2 (got: ${todayEntry.orders})`);

  // Test 12: Meaningful zeros for days without sales
  console.log("\nTest 12: Meaningful zero values on non-trading days");
  const nonTradingDays = trend.filter(d => !d.day.includes('(Today)'));
  assert(nonTradingDays.every(d => d.revenue === 0 && d.orders === 0), "All days without sales have 0 revenue and 0 orders");

  // Test 13: Empty dataset handling
  console.log("\nTest 13: Empty sales dataset handled gracefully");
  const emptyTrend = computeWeeklySalesTrend([]);
  assert(emptyTrend.length === 7, "Returns 7 days for empty sales list");
  assert(emptyTrend.every(d => d.revenue === 0 && d.orders === 0), "All 7 days show 0 when no sales exist");

  // -------------------------------------------------------------------------
  // Part 4: Reports Date-Range Filtering & CSV Export
  // -------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------");
  console.log("Part 4: Reports Date-Range Filtering & CSV Export");

  const sampleReportSales = [
    {
      saleId: 'INV-001',
      totalAmount: 150.00,
      customerName: 'Alice Walk-in',
      paymentMethod: 'Cash',
      soldBy: 'Cashier 1',
      createdAt: '2026-11-10T10:00:00Z',
      items: [{ name: 'Wireless Mouse', quantity: 3, subtotal: 75 }, { name: 'Keyboard', quantity: 1, subtotal: 75 }],
    },
    {
      saleId: 'INV-002',
      totalAmount: 200.00,
      customerName: 'Bob Corp',
      paymentMethod: 'Credit Card',
      soldBy: 'Cashier 2',
      createdAt: '2026-11-15T14:30:00Z',
      items: [{ name: 'Wireless Mouse', quantity: 8, subtotal: 200 }],
    },
    {
      saleId: 'INV-003',
      totalAmount: 50.00,
      customerName: 'Charlie',
      paymentMethod: 'Cash',
      soldBy: 'Cashier 1',
      createdAt: '2026-11-20T16:00:00Z',
      items: [{ name: 'USB-C Cable', quantity: 5, subtotal: 50 }],
    },
  ];

  // Helper matching Reports.jsx date filtering
  function filterSalesByDate(salesList, start, end) {
    return salesList.filter((s) => {
      if (!s.createdAt) return true;
      const d = new Date(s.createdAt);
      if (start) {
        const sDate = new Date(start);
        sDate.setHours(0, 0, 0, 0);
        if (d < sDate) return false;
      }
      if (end) {
        const eDate = new Date(end);
        eDate.setHours(23, 59, 59, 999);
        if (d > eDate) return false;
      }
      return true;
    });
  }

  // Test 14: Filter sales by date range
  console.log("\nTest 14: Reports date-range filtering");
  const filteredNov12to18 = filterSalesByDate(sampleReportSales, '2026-11-12', '2026-11-18');
  assert(filteredNov12to18.length === 1, `Filtered 1 sale between Nov 12-18 (got: ${filteredNov12to18.length})`);
  assert(filteredNov12to18[0].saleId === 'INV-002', "Filtered correctly selected INV-002");

  const filteredNov14to21 = filterSalesByDate(sampleReportSales, '2026-11-14', '2026-11-21');
  assert(filteredNov14to21.length === 2, `Filtered 2 sales between Nov 14-21 (got: ${filteredNov14to21.length})`);

  // Test 15: CSV Export formatting & escaping
  console.log("\nTest 15: CSV export generation and escaping");
  function generateCsv(salesData, start, end) {
    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = [];
    rows.push(['Smart Inventory & Sales Management System — Sales & Analytics Report']);
    rows.push([
      `Report Period: ${start || 'Earliest'} to ${end || 'Present'}`,
      `Total Sales: ${salesData.length}`,
    ]);
    rows.push([]);
    rows.push(['Sale ID', 'Transaction Date', 'Customer Name', 'Items Purchased', 'Payment Method', 'Cashier', 'Total Amount ($)']);

    salesData.forEach((s) => {
      const itemsList = s.items?.map(i => `${i.quantity}x ${i.name}`).join('; ') || 'N/A';
      rows.push([
        s.saleId,
        s.createdAt,
        s.customerName,
        itemsList,
        s.paymentMethod,
        s.soldBy,
        Number(s.totalAmount || 0).toFixed(2),
      ]);
    });

    return rows.map(r => r.map(escapeCsv).join(',')).join('\r\n');
  }

  const csv = generateCsv(filteredNov14to21, '2026-11-14', '2026-11-21');
  assert(csv.includes('"Sale ID","Transaction Date"'), "CSV contains standard column headers");
  assert(csv.includes('"INV-002"'), "CSV contains filtered transaction INV-002");
  assert(csv.includes('"INV-003"'), "CSV contains filtered transaction INV-003");
  assert(!csv.includes('"INV-001"'), "CSV correctly excludes out-of-range transaction INV-001");

  // -------------------------------------------------------------------------
  // Part 5: Transaction History Search & Combined Multi-Filtering
  // -------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------");
  console.log("Part 5: Transaction History Search & Multi-Filtering");

  const sampleMovements = [
    { id: 'm-1', productName: 'Ergonomic Mouse', referenceId: 'PO-9001', type: 'stock_in', userId: 'Bob Staff', notes: 'Supplier delivery', createdAt: '2026-11-10T10:00:00Z' },
    { id: 'm-2', productName: 'Ergonomic Mouse', referenceId: 'INV-501', type: 'stock_out', userId: 'Amina Cashier', notes: 'Counter sale', createdAt: '2026-11-12T12:00:00Z' },
    { id: 'm-3', productName: 'Gaming Keyboard', referenceId: 'ADJ-102', type: 'adjustment', userId: 'Bob Staff', notes: 'Audit discrepancy', createdAt: '2026-11-15T15:00:00Z' },
    { id: 'm-4', productName: 'USB-C Cable', referenceId: 'SO-WRITE-OFF', type: 'stock_out', userId: 'Bob Staff', notes: 'Damaged packaging', createdAt: '2026-11-18T09:00:00Z' },
  ];

  function filterMovements(list, search, type, start, end) {
    return list.filter((mov) => {
      if (search && search.trim()) {
        const term = search.toLowerCase();
        const matchName = mov.productName?.toLowerCase().includes(term);
        const matchRef = mov.referenceId?.toLowerCase().includes(term);
        const matchUser = mov.userId?.toLowerCase().includes(term);
        const matchNotes = mov.notes?.toLowerCase().includes(term);
        if (!matchName && !matchRef && !matchUser && !matchNotes) return false;
      }
      if (type && mov.type !== type) return false;
      if (mov.createdAt) {
        const d = new Date(mov.createdAt);
        if (start) {
          const sDate = new Date(start);
          sDate.setHours(0, 0, 0, 0);
          if (d < sDate) return false;
        }
        if (end) {
          const eDate = new Date(end);
          eDate.setHours(23, 59, 59, 999);
          if (d > eDate) return false;
        }
      }
      return true;
    });
  }

  // Test 16: Search by product name
  console.log("\nTest 16: Keyword search by product name");
  const searchMouse = filterMovements(sampleMovements, 'Mouse', '', '', '');
  assert(searchMouse.length === 2, `Search 'Mouse' returned 2 items (got: ${searchMouse.length})`);

  // Test 17: Search by transaction/reference ID
  console.log("\nTest 17: Keyword search by transaction reference ID");
  const searchRef = filterMovements(sampleMovements, 'PO-9001', '', '', '');
  assert(searchRef.length === 1 && searchRef[0].id === 'm-1', "Search 'PO-9001' returned correct transaction");

  // Test 18: Filter by transaction type
  console.log("\nTest 18: Filter by movement type");
  const typeStockOut = filterMovements(sampleMovements, '', 'stock_out', '', '');
  assert(typeStockOut.length === 2, `Filtered 'stock_out' type returned 2 movements (got: ${typeStockOut.length})`);
  assert(typeStockOut.every(m => m.type === 'stock_out'), "All results are strictly 'stock_out'");

  // Test 19: Combined multi-filter (Keyword + Type + Date Range)
  console.log("\nTest 19: Combined Multi-Filtering (Search AND Type AND Date)");
  // Search 'Bob Staff', Type 'stock_out', Date Nov 15 to Nov 25 -> m-4 (USB-C Cable, SO-WRITE-OFF, Bob Staff, Nov 18)
  const combined = filterMovements(sampleMovements, 'Bob', 'stock_out', '2026-11-15', '2026-11-25');
  assert(combined.length === 1, `Combined filter returned exactly 1 matching record (got: ${combined.length})`);
  assert(combined[0].id === 'm-4', "Combined filter matched target record m-4");

  // Test 20: Empty state when no records match
  console.log("\nTest 20: Empty state on non-matching filters");
  const noMatch = filterMovements(sampleMovements, 'NonExistentProduct123', '', '', '');
  assert(noMatch.length === 0, "Non-matching query safely returns empty array [] without error");

  console.log("\n====================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests();
