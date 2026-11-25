/**
 * Automated Verification Test Suite for Phase 2:
 * Supplier CRUD Completion & Duplicate SKU Prevention
 */

import { 
  getSuppliers, 
  addSupplier, 
  updateSupplier, 
  deleteSupplier, 
  getSupplierProductCount,
  INITIAL_SUPPLIERS 
} from './01-Frontend/src/services/supplierService.js';

import { 
  getProducts, 
  addProduct, 
  updateProduct, 
  isSkuDuplicate,
  INITIAL_PRODUCTS 
} from './01-Frontend/src/services/productService.js';

// Polyfill localStorage for Node.js test environment
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

async function runPhase2Tests() {
  console.log("====================================================================");
  console.log("PHASE 2: SUPPLIER CRUD & DUPLICATE SKU VERIFICATION TEST SUITE");
  console.log("====================================================================\n");

  // Reset mock storage with clean initial datasets
  localStorage.setItem('smart_inventory_suppliers', JSON.stringify(INITIAL_SUPPLIERS));
  localStorage.setItem('smart_inventory_products', JSON.stringify(INITIAL_PRODUCTS));

  // -------------------------------------------------------------------------
  // Part 1: Supplier CRUD Completion
  // -------------------------------------------------------------------------
  console.log("Part 1: Supplier Management CRUD");

  // Test 1: Create new supplier
  console.log("\nTest 1: Supplier Creation");
  const newSup = await addSupplier({
    name: 'Pacific Freight & Logistics',
    email: 'info@pacificfreight.com',
    phone: '+1 (555) 999-1122',
    address: '400 Ocean Terminal, Seattle, WA',
  });
  assert(newSup && newSup.id, `Created supplier with ID: ${newSup.id}`);
  assert(newSup.name === 'Pacific Freight & Logistics', `Supplier name set to '${newSup.name}'`);

  const suppliersAfterAdd = await getSuppliers();
  assert(suppliersAfterAdd.some(s => s.id === newSup.id), "New supplier retrieved from supplier directory");

  // Test 2: Update existing supplier
  console.log("\nTest 2: Supplier Editing");
  const updatedSup = await updateSupplier(newSup.id, {
    name: 'Pacific Freight Logistics Inc.',
    email: 'contact@pacificlogistics.com',
    phone: '+1 (555) 999-3344',
    address: '400 Ocean Terminal, Suite 10, Seattle, WA',
  });
  assert(updatedSup.name === 'Pacific Freight Logistics Inc.', `Updated supplier name to '${updatedSup.name}'`);
  assert(updatedSup.email === 'contact@pacificlogistics.com', `Updated supplier email to '${updatedSup.email}'`);

  // Test 3: Reject empty name in update
  try {
    await updateSupplier(newSup.id, { name: '   ' });
    assert(false, "Should reject empty supplier name");
  } catch (err) {
    assert(err.message.includes("organization name is required"), `Validation rejected empty name: "${err.message}"`);
  }

  // Test 4: Prevent deletion when products reference supplier
  console.log("\nTest 3: Supplier Deletion Safeguard (Associated Products)");
  // 'sup-002' supplies 'prd-001' (Wireless Mouse) and 'prd-002' (Gaming Keyboard)
  const productCountSup2 = await getSupplierProductCount('sup-002');
  assert(productCountSup2 > 0, `Supplier 'sup-002' has ${productCountSup2} associated product(s) in catalog`);

  try {
    await deleteSupplier('sup-002');
    assert(false, "Should block deletion of supplier with associated products");
  } catch (err) {
    assert(
      err.message.includes("Cannot delete supplier") && err.message.includes("associated product"),
      `Blocked deletion with expected safeguard message: "${err.message}"`
    );
  }

  const suppliersStillPresent = await getSuppliers();
  assert(suppliersStillPresent.some(s => s.id === 'sup-002'), "Supplier 'sup-002' remains safe and un-deleted");

  // Test 5: Safe deletion when NO products reference supplier
  console.log("\nTest 4: Safe Supplier Deletion (Zero Associated Products)");
  const productCountNewSup = await getSupplierProductCount(newSup.id);
  assert(productCountNewSup === 0, `Newly created supplier has 0 associated products`);

  const deleteResult = await deleteSupplier(newSup.id);
  assert(deleteResult.success === true, `Deletion completed successfully for unreferenced supplier`);

  const suppliersAfterDelete = await getSuppliers();
  assert(!suppliersAfterDelete.some(s => s.id === newSup.id), "Deleted supplier is no longer in directory");

  // -------------------------------------------------------------------------
  // Part 2: Duplicate SKU Prevention
  // -------------------------------------------------------------------------
  console.log("\n--------------------------------------------------------------------");
  console.log("Part 2: Duplicate SKU Prevention");

  // Existing initial catalog has: 'ELE-1042', 'ELE-2089', 'SUP-4011', 'ELE-3015', 'OFF-8820', 'OFF-1102'

  // Test 6: Create product with new unique SKU
  console.log("\nTest 5: Create product with unique SKU");
  const newProduct = await addProduct({
    name: 'USB-C to HDMI Adapter',
    sku: 'ELE-9901',
    category: 'Electronics',
    purchasePrice: 8.50,
    sellingPrice: 19.99,
    quantity: 15,
    reorderLevel: 5,
    supplierId: 'sup-001',
  });
  assert(newProduct && newProduct.id, `Created product with unique SKU '${newProduct.sku}'`);

  // Test 7: Reject creating product with exact existing SKU
  console.log("\nTest 6: Reject product creation with existing SKU");
  try {
    await addProduct({
      name: 'Counterfeit Mouse',
      sku: 'ELE-1042', // Already exists on prd-001
      category: 'Electronics',
      purchasePrice: 5.00,
      sellingPrice: 15.00,
      quantity: 10,
      reorderLevel: 5,
    });
    assert(false, "Should reject duplicate SKU ELE-1042");
  } catch (err) {
    assert(err.message === "This SKU already exists. Please use a unique SKU.", `Rejected duplicate SKU with message: "${err.message}"`);
  }

  // Test 8: Reject duplicate SKU with different casing & whitespace
  console.log("\nTest 7: Case-insensitive and whitespace-normalized SKU duplicate rejection");
  try {
    await addProduct({
      name: 'Another Keyboard',
      sku: '  ele-2089  ', // lowercase + whitespace (existing is 'ELE-2089')
      category: 'Electronics',
      purchasePrice: 20.00,
      sellingPrice: 45.00,
      quantity: 5,
      reorderLevel: 2,
    });
    assert(false, "Should reject normalized duplicate '  ele-2089  '");
  } catch (err) {
    assert(err.message === "This SKU already exists. Please use a unique SKU.", `Rejected normalized duplicate SKU: "${err.message}"`);
  }

  // Test 9: Edit product retaining its own SKU (allowed)
  console.log("\nTest 8: Edit product retaining its own existing SKU");
  const editedSameSku = await updateProduct('prd-001', {
    name: 'Wireless Bluetooth Ergonomic Mouse V2',
    sku: 'ELE-1042', // Same product's existing SKU
    sellingPrice: 26.99,
  });
  assert(editedSameSku !== null, "Product update succeeded retaining existing SKU");
  assert(editedSameSku.name === 'Wireless Bluetooth Ergonomic Mouse V2', `Product name updated to '${editedSameSku.name}'`);
  assert(editedSameSku.sku === 'ELE-1042', `Product SKU retained as '${editedSameSku.sku}'`);

  // Test 10: Edit product to use ANOTHER product's SKU (rejected)
  console.log("\nTest 9: Edit product to use another product's SKU (collision rejection)");
  try {
    await updateProduct('prd-001', {
      sku: 'ELE-2089', // Belongs to prd-002
    });
    assert(false, "Should reject collision with prd-002's SKU");
  } catch (err) {
    assert(err.message === "This SKU already exists. Please use a unique SKU.", `Rejected collision on edit: "${err.message}"`);
  }

  // Test 11: Edit product with casing variance of another SKU (rejected)
  console.log("\nTest 10: Edit product with lowercase variance of another SKU");
  try {
    await updateProduct('prd-001', {
      sku: 'sup-4011', // Belongs to prd-003 ('SUP-4011')
    });
    assert(false, "Should reject lowercase collision with prd-003");
  } catch (err) {
    assert(err.message === "This SKU already exists. Please use a unique SKU.", `Rejected lowercase collision on edit: "${err.message}"`);
  }

  // Test 12: Verify isSkuDuplicate helper directly
  console.log("\nTest 11: Direct isSkuDuplicate helper verification");
  const dupCheck1 = await isSkuDuplicate('ELE-1042');
  assert(dupCheck1 === true, "isSkuDuplicate('ELE-1042') returns true for existing SKU");

  const dupCheck2 = await isSkuDuplicate('ele-1042');
  assert(dupCheck2 === true, "isSkuDuplicate('ele-1042') returns true for lowercase variant");

  const dupCheck3 = await isSkuDuplicate('ELE-1042', 'prd-001');
  assert(dupCheck3 === false, "isSkuDuplicate('ELE-1042', 'prd-001') returns false when excluding its own product ID");

  const dupCheck4 = await isSkuDuplicate('BRAND-NEW-SKU-999');
  assert(dupCheck4 === false, "isSkuDuplicate('BRAND-NEW-SKU-999') returns false for non-existent SKU");

  console.log("\n====================================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("====================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase2Tests();
