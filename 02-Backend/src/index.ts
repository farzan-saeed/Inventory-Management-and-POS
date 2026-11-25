import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK to connect directly to the shared Cloud Firestore database
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ============================================================================
// Data Transfer Object (DTO) Interfaces
// ============================================================================

export interface SaleItemInput {
  productId: string;
  quantity: number;
  name?: string;
  unitPrice?: number; // Optional; ignored in favor of trusted Firestore price
}

export interface ProcessSaleRequest {
  items: SaleItemInput[];
  paymentMethod?: string;
  customerName?: string;
}

export interface RestockRequest {
  productId: string;
  quantity: number;
  referenceId?: string;
  notes?: string;
}

export interface AdjustStockRequest {
  productId: string;
  newQuantity: number;
  reason?: string;
}

export interface StockOutRequest {
  productId: string;
  quantity: number;
  reason?: string;
  referenceId?: string;
}

// ============================================================================
// Core Logic: Server-Side Sale Processing Handler
// ============================================================================

/**
 * Handles sale processing with strict server-side validation:
 * 1. Verifies caller authentication.
 * 2. Enforces role-based authorization from Firestore ('Admin' or 'Sales Staff').
 * 3. Aggregates duplicate items and validates positive integer quantities.
 * 4. Executes an atomic Firestore transaction with reads before writes.
 * 5. Validates stock availability and calculates total from trusted Firestore selling prices.
 * 6. Atomically deducts stock, creates an immutable 'stock_out' movement, and records the sale.
 */
export async function handleProcessSale(
  data: ProcessSaleRequest,
  context: functions.https.CallableContext,
  firestoreInstance: admin.firestore.Firestore = db
) {
  // A. Authentication Check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required. You must be signed in to process sales."
    );
  }

  const userId = context.auth.uid;

  // B. Authorization Check (Fetch verified user profile from Firestore)
  const userDocSnap = await firestoreInstance.collection("users").doc(userId).get();
  if (!userDocSnap.exists) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "User profile not found in database. Sales processing denied."
    );
  }

  const userData = userDocSnap.data() || {};
  const userRole = userData.role || context.auth.token.role;

  if (userRole !== "Admin" && userRole !== "Sales Staff") {
    throw new functions.https.HttpsError(
      "permission-denied",
      `Access denied. Role "${userRole}" is not authorized to process sales transactions.`
    );
  }

  // Trusted cashier identity derived from verified server data
  const cashierIdentifier = userData.name || userData.email || context.auth.token.email || "Staff";

  // C. Input Validation
  const { items, paymentMethod = "Cash", customerName = "Walk-in Customer" } = data || {};

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "A sale transaction must contain at least one item."
    );
  }

  // Aggregate quantities for duplicate product IDs safely
  const itemMap = new Map<string, number>();

  for (const item of items) {
    if (!item || typeof item !== "object") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Each sale line item must be a valid object."
      );
    }
    const pid = typeof item.productId === "string" ? item.productId.trim() : "";
    if (!pid) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Every item must specify a valid productId string."
      );
    }
    const qty = item.quantity;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Invalid quantity for product "${pid}". Quantity must be a positive integer.`
      );
    }
    if (qty > 100000) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Quantity for product "${pid}" exceeds maximum allowable limit.`
      );
    }

    itemMap.set(pid, (itemMap.get(pid) || 0) + qty);
  }

  // Payment method and customer name sanitization
  const allowedPaymentMethods = ["Cash", "Card", "Digital", "Mobile Pay", "Credit Card"];
  const sanitizedPaymentMethod = typeof paymentMethod === "string" && allowedPaymentMethods.includes(paymentMethod.trim())
    ? paymentMethod.trim()
    : "Cash";

  const sanitizedCustomerName = typeof customerName === "string" && customerName.trim()
    ? customerName.trim().slice(0, 100)
    : "Walk-in Customer";

  // D. Atomic Multi-Document Firestore Transaction
  const saleCode = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  try {
    const result = await firestoreInstance.runTransaction(async (transaction) => {
      // Phase 1: All transaction reads & validations first
      const productReads: Array<{
        ref: admin.firestore.DocumentReference;
        data: admin.firestore.DocumentData;
        productId: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
        productName: string;
      }> = [];

      let calculatedTotal = 0;

      for (const [productId, quantity] of itemMap.entries()) {
        const productRef = firestoreInstance.collection("products").doc(productId);
        const productSnap = await transaction.get(productRef);

        if (!productSnap.exists) {
          throw new functions.https.HttpsError(
            "not-found",
            `Product with ID "${productId}" was not found in the inventory catalogue.`
          );
        }

        const pData = productSnap.data()!;
        if (pData.isActive === false) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            `Product "${pData.name || productId}" is deactivated and cannot be sold.`
          );
        }

        const currentStock = typeof pData.quantity === "number" ? pData.quantity : parseInt(pData.quantity, 10) || 0;
        if (currentStock < quantity) {
          throw new functions.https.HttpsError(
            "resource-exhausted",
            `Insufficient stock for "${pData.name || productId}". Available: ${currentStock}, Requested: ${quantity}`
          );
        }

        // Trust only the server-side sellingPrice from Firestore
        const unitPrice = typeof pData.sellingPrice === "number"
          ? pData.sellingPrice
          : (parseFloat(pData.sellingPrice) || 0);

        const subtotal = Math.round(unitPrice * quantity * 100) / 100;
        calculatedTotal += subtotal;

        productReads.push({
          ref: productRef,
          data: pData,
          productId,
          quantity,
          unitPrice,
          subtotal,
          productName: pData.name || "Product",
        });
      }

      // Phase 2: All transaction writes
      const timestamp = admin.firestore.FieldValue.serverTimestamp();

      // Deduct stock from each product and record stock movement
      for (const item of productReads) {
        const previousQty = typeof item.data.quantity === "number"
          ? item.data.quantity
          : parseInt(item.data.quantity, 10) || 0;
        const newQty = previousQty - item.quantity;

        transaction.update(item.ref, {
          quantity: newQty,
          updatedAt: timestamp,
        });

        const movementRef = firestoreInstance.collection("stockMovements").doc();
        transaction.set(movementRef, {
          productId: item.productId,
          productName: item.productName,
          type: "stock_out",
          quantity: item.quantity,
          previousQuantity: previousQty,
          newQuantity: newQty,
          referenceId: saleCode,
          notes: `Counter sale to ${sanitizedCustomerName}`,
          userId: cashierIdentifier,
          createdAt: timestamp,
        });
      }

      // Create persistent sale record in 'sales' collection
      const finalItems = productReads.map((p) => ({
        productId: p.productId,
        name: p.productName,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        subtotal: p.subtotal,
      }));

      const totalAmountRounded = Math.round(calculatedTotal * 100) / 100;

      const saleRef = firestoreInstance.collection("sales").doc();
      const saleRecord = {
        saleId: saleCode,
        items: finalItems,
        totalAmount: totalAmountRounded,
        paymentMethod: sanitizedPaymentMethod,
        customerName: sanitizedCustomerName,
        soldBy: cashierIdentifier,
        status: "completed",
        createdAt: timestamp,
      };

      transaction.set(saleRef, saleRecord);

      return {
        saleId: saleCode,
        totalAmount: totalAmountRounded,
        items: finalItems,
        paymentMethod: sanitizedPaymentMethod,
        customerName: sanitizedCustomerName,
        soldBy: cashierIdentifier,
      };
    });

    // E. Function Response
    return {
      success: true,
      saleId: result.saleId,
      totalAmount: result.totalAmount,
      items: result.items,
      paymentMethod: result.paymentMethod,
      customerName: result.customerName,
      soldBy: result.soldBy,
      message: "Sale successfully processed and inventory updated atomically.",
    };
  } catch (error: any) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    console.error("processSale transaction error:", error);
    throw new functions.https.HttpsError(
      "internal",
      error.message || "Failed to complete transaction on server."
    );
  }
}

// ============================================================================
// 1. Callable Cloud Function: processSale (FR5, FR6)
// ============================================================================

export const processSale = functions.https.onCall(
  async (data: ProcessSaleRequest, context) => {
    return await handleProcessSale(data, context, db);
  }
);

// Backward-compatible alias
export const processSaleTransaction = processSale;

// ============================================================================
// 2. Server-Side Stock In Function (FR3, FR6)
// ============================================================================

/**
 * Callable Cloud Function: restockProductInventory
 * Atomically increments product inventory and logs a stock_in record.
 */
export const restockProductInventory = functions.https.onCall(
  async (data: RestockRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }

    const { productId, quantity, referenceId = "PO-RESTOCK", notes = "" } = data;
    if (!productId || typeof quantity !== "number" || quantity <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Quantity must be a positive integer."
      );
    }

    const userEmail = context.auth.token.email || "Inventory Staff";

    return await db.runTransaction(async (transaction) => {
      const productRef = db.collection("products").doc(productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Product document not found.");
      }

      const productData = productSnap.data()!;
      const previousQty = Number(productData.quantity) || 0;
      const newQty = previousQty + quantity;
      const now = admin.firestore.FieldValue.serverTimestamp();

      transaction.update(productRef, {
        quantity: newQty,
        updatedAt: now,
      });

      const movementRef = db.collection("stockMovements").doc();
      transaction.set(movementRef, {
        productId,
        productName: productData.name,
        type: "stock_in",
        quantity,
        previousQuantity: previousQty,
        newQuantity: newQty,
        referenceId,
        notes,
        userId: userEmail,
        createdAt: now,
      });

      return {
        success: true,
        productId,
        previousQuantity: previousQty,
        newQuantity: newQty,
      };
    });
  }
);

// ============================================================================
// 3. Server-Side Stock Adjustment Function (FR3, FR8)
// ============================================================================

/**
 * Callable Cloud Function: adjustProductStock
 * Adjusts product inventory count due to physical audits or write-offs.
 */
export const adjustProductStock = functions.https.onCall(
  async (data: AdjustStockRequest, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
    }

    const { productId, newQuantity, reason = "Stock Count Audit" } = data;
    if (!productId || typeof newQuantity !== "number" || newQuantity < 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "New quantity must be a non-negative integer."
      );
    }

    const userEmail = context.auth.token.email || "Inventory Staff";

    return await db.runTransaction(async (transaction) => {
      const productRef = db.collection("products").doc(productId);
      const productSnap = await transaction.get(productRef);

      if (!productSnap.exists) {
        throw new functions.https.HttpsError("not-found", "Product document not found.");
      }

      const productData = productSnap.data()!;
      const previousQty = Number(productData.quantity) || 0;
      const diff = newQuantity - previousQty;
      const now = admin.firestore.FieldValue.serverTimestamp();

      transaction.update(productRef, {
        quantity: newQuantity,
        updatedAt: now,
      });

      const movementRef = db.collection("stockMovements").doc();
      transaction.set(movementRef, {
        productId,
        productName: productData.name,
        type: "adjustment",
        quantity: diff,
        previousQuantity: previousQty,
        newQuantity,
        referenceId: "ADJUSTMENT",
        notes: reason,
        userId: userEmail,
        createdAt: now,
      });

      return {
        success: true,
        productId,
        previousQuantity: previousQty,
        newQuantity,
        diff,
      };
    });
  }
);

// ============================================================================
// 4. Server-Side Manual Stock-Out Function (Phase 3: FR3, FR8)
// ============================================================================

/**
 * Handles manual stock removal with strict server-side validation:
 * 1. Verifies caller authentication.
 * 2. Enforces role-based authorization from Firestore ('Admin' or 'Inventory Staff').
 * 3. Validates positive integer quantity and non-negative resulting stock.
 * 4. Executes an atomic Firestore transaction deducting inventory.
 * 5. Creates an immutable 'stock_out' movement audit record with operator identity.
 */
export async function handleManualStockOut(
  data: StockOutRequest,
  context: functions.https.CallableContext,
  firestoreInstance: admin.firestore.Firestore = db
) {
  // A. Authentication Check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Authentication required. You must be signed in to perform inventory operations."
    );
  }

  const userId = context.auth.uid;

  // B. Role Authorization Check (Admin or Inventory Staff)
  const userDocSnap = await firestoreInstance.collection("users").doc(userId).get();
  if (!userDocSnap.exists) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "User profile not found in database. Stock deduction denied."
    );
  }

  const userData = userDocSnap.data() || {};
  const userRole = userData.role || context.auth.token.role;

  if (userRole !== "Admin" && userRole !== "Inventory Staff") {
    throw new functions.https.HttpsError(
      "permission-denied",
      `Access denied. Role "${userRole}" is not authorized to remove stock.`
    );
  }

  const operatorIdentifier = userData.name || userData.email || context.auth.token.email || "Inventory Staff";

  // C. Input Validation
  const { productId, quantity, reason = "Manual Stock-Out", referenceId } = data || {};

  if (!productId || typeof productId !== "string" || productId.trim() === "") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "A valid product ID must be provided."
    );
  }

  if (typeof quantity !== "number" || quantity <= 0 || !Number.isInteger(quantity)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Deduction quantity must be a positive integer."
    );
  }

  // D. Atomic Transaction Execution
  return await firestoreInstance.runTransaction(async (transaction) => {
    const productRef = firestoreInstance.collection("products").doc(productId);
    const productSnap = await transaction.get(productRef);

    if (!productSnap.exists) {
      throw new functions.https.HttpsError("not-found", "Product document not found.");
    }

    const productData = productSnap.data()!;
    if (productData.isActive === false) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        `Product "${productData.name}" is deactivated and cannot have stock deducted.`
      );
    }

    const previousQty = Number(productData.quantity) || 0;
    if (quantity > previousQty) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        `Cannot remove ${quantity} units. Only ${previousQty} units available in stock.`
      );
    }

    const newQty = previousQty - quantity;
    const now = admin.firestore.FieldValue.serverTimestamp();
    const finalRefId = (referenceId && referenceId.trim()) 
      ? referenceId.trim() 
      : `SO-${Math.floor(100000 + Math.random() * 900000)}`;

    // Update product stock balance
    transaction.update(productRef, {
      quantity: newQty,
      updatedAt: now,
    });

    // Record immutable audit entry in stockMovements
    const movementRef = firestoreInstance.collection("stockMovements").doc();
    transaction.set(movementRef, {
      productId,
      productName: productData.name,
      type: "stock_out",
      quantity,
      previousQuantity: previousQty,
      newQuantity: newQty,
      referenceId: finalRefId,
      notes: (reason && reason.trim()) ? reason.trim() : "Manual stock deduction",
      userId: operatorIdentifier,
      createdAt: now,
    });

    return {
      success: true,
      productId,
      productName: productData.name,
      previousQuantity: previousQty,
      newQuantity: newQty,
      deducted: quantity,
      referenceId: finalRefId,
      notes: reason,
      userId: operatorIdentifier,
    };
  });
}

/**
 * Callable Cloud Function: manualStockOut
 * Allows Admin and Inventory Staff to record manual stock reductions safely.
 */
export const manualStockOut = functions.https.onCall(
  async (data: StockOutRequest, context) => {
    return await handleManualStockOut(data, context, db);
  }
);

// Backward-compatible alias
export const recordStockOut = manualStockOut;
