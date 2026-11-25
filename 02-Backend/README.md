# 02-Backend — Firebase Cloud Functions & Server Logic

## 1. Overview & Role
The **02-Backend** component encapsulates server-side business logic using **Firebase Cloud Functions** and the **Firebase Admin SDK** in Node.js/TypeScript. 

Its primary purpose in this university information system is to guarantee **data integrity**, enforce **strict role authorization**, and execute **atomic multi-document transactions** that should never rely solely on client-side trust.

By centralizing critical workflows (e.g. stock deduction upon sales) on the backend, race conditions, negative inventory states, and unauthorized manipulations are mathematically prevented.

---

## 2. Technology Stack
- **Runtime:** Node.js 18
- **Language:** TypeScript 5.x
- **SDKs:** 
  - `firebase-functions` v4.x (HTTPS Callable trigger framework)
  - `firebase-admin` v12.x (Privileged Firestore operations)
- **Database Target:** Shared Cloud Firestore database (configured in `03-Database`)

---

## 3. Directory Structure
```
02-Backend/
├── src/
│   └── index.ts        # Cloud Functions: processSaleTransaction, restockProductInventory, adjustProductStock
├── package.json        # Dependencies & compilation scripts
├── tsconfig.json       # TypeScript compiler settings (target: ES2021)
└── README.md           # Backend documentation & emulator setup guide
```

---

## 4. Server-Side Function Specifications

### 1. `processSaleTransaction` (FR5, FR6)
- **Type:** HTTPS Callable Function (`functions.https.onCall`)
- **Security Check:** Caller must have an active Firebase Auth token with role `Admin` or `Sales Staff`.
- **Payload (`ProcessSaleRequest`):**
  ```typescript
  {
    items: [
      { productId: "prd-001", name: "Wireless Mouse", quantity: 2, unitPrice: 24.99 }
    ],
    paymentMethod: "Cash" | "Card" | "Digital",
    customerName: "Walk-in Customer"
  }
  ```
- **Transaction Process:**
  1. Reads all target product documents in `products/{id}`.
  2. Checks that each product exists, is active (`isActive !== false`), and has `quantity >= item.quantity`.
  3. If any product has insufficient stock, the transaction aborts with `resource-exhausted` and no documents are modified.
  4. Deducts stock (`quantity: quantity - item.quantity`) and updates `updatedAt`.
  5. Inserts an immutable audit record in `stockMovements` (`type: "stock_out"`).
  6. Inserts a sales receipt document in `sales`.
- **Response:**
  ```typescript
  {
    success: true,
    saleId: "INV-892110-432",
    totalAmount: 49.98,
    message: "Sale successfully processed and inventory updated atomically."
  }
  ```

---

### 2. `restockProductInventory` (FR3)
- **Type:** HTTPS Callable Function
- **Security Check:** Caller must be authenticated (`Admin` or `Inventory Staff`).
- **Functionality:** Atomically increments `products/{id}.quantity` and logs a `stock_in` movement in `stockMovements`.

---

### 3. `adjustProductStock` (FR3, FR8)
- **Type:** HTTPS Callable Function
- **Security Check:** Caller must be authenticated (`Admin` or `Inventory Staff`).
- **Functionality:** Overwrites product quantity with physical count audit data, calculating delta `diff` and logging an `adjustment` movement.

---

### 4. `manualStockOut` / `recordStockOut` (Phase 3: FR3, FR8)
- **Type:** HTTPS Callable Function (`functions.https.onCall`)
- **Security Check:** Queries `users` collection; caller must have role `Admin` or `Inventory Staff`. Rejects `Sales Staff` with `permission-denied`.
- **Validation:** Enforces positive integer deduction quantity and checks that `quantity <= product.quantity` (rejection with `resource-exhausted` if balance insufficient).
- **Functionality:** Atomically deducts product stock in Firestore and inserts an immutable `stock_out` record into `stockMovements` with reason notes, disposal reference ID, and operator identity.

---

## 5. Shared Database Connectivity
Cloud Functions access the exact same Cloud Firestore database defined in `03-Database`:
- Uses the `firebase-admin` default database connection:
  ```typescript
  admin.initializeApp();
  const db = admin.firestore();
  ```
- Shares identical collection definitions: `users`, `products`, `suppliers`, `sales`, `stockMovements`.

---

## 6. Local Emulation & Testing

To test Cloud Functions locally without deploying to live Google Cloud:

### Step 1: Install Dependencies
```bash
cd 02-Backend
npm install
```

### Step 2: Compile TypeScript to JavaScript
```bash
npm run build
```

### Step 3: Run the Firebase Local Emulator Suite
```bash
firebase emulators:start --only functions
```
The functions emulator will launch locally at `http://127.0.0.1:5001/<project-id>/us-central1/...`.

---

## 7. Deployment Guidelines (When Firebase Blaze Plan is Active)
```bash
firebase deploy --only functions
```
*(Note: Cloud Functions deployment is prepared locally for university demonstration and inspection; deployment is not a prerequisite for evaluating code logic).*
