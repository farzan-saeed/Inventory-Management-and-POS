# 03-Database — Cloud Firestore Architecture, Security & Data

## 1. Overview & Role
The **03-Database** component encompasses the persistent data tier of the Smart Inventory and Sales Management System, powered by **Firebase Cloud Firestore**.

It contains:
1. **Firestore Security Rules (`firestore.rules`):** Server-enforced access control and role-based permissions.
2. **Compound Query Indexes (`firestore.indexes.json`):** Pre-computed indexes optimizing sorting and filtering.
3. **Database Schema Specifications (`schema/COLLECTIONS.md`):** Complete ER diagram and field definitions.
4. **Sample Datasets (`sample-data/`):** JSON records for users, products, suppliers, sales, and stock movements.
5. **Database Seed Utility (`scripts/seedDatabase.js`):** Automation script to populate a fresh Firestore instance.

---

## 2. Directory Structure
```
03-Database/
├── firestore.indexes.json     # Predefined composite query index configurations
├── firestore.rules            # Declarative server-side security & RBAC rules
│
├── schema/
│   └── COLLECTIONS.md         # Full Entity-Relationship diagram & field specifications
│
├── sample-data/               # University evaluation datasets
│   ├── users.json             # Admin, Inventory Staff, and Sales Staff accounts
│   ├── products.json          # Catalog items with pricing, category, & reorder levels
│   ├── suppliers.json         # Trade supplier directory records
│   ├── sales.json             # Historical sales transaction receipts
│   └── stockMovements.json    # Audit trail movements (stock_in, stock_out, adjustment)
│
├── scripts/
│   ├── package.json           # Seed utility runner configuration
│   └── seedDatabase.js        # Node.js script to populate live Firestore
│
└── README.md                  # Database documentation and administration guide
```

---

## 3. Data Collections & Entity Relationships

The database is structured around five primary Firestore collections:

| Collection | Primary Document ID | Description | Security Scope |
| :--- | :--- | :--- | :--- |
| `users` | Auth UID (`uid`) | User identities, roles, and profiles | Authenticated read; Admin manage |
| `products` | Auto-generated ID | Retail catalogue, prices, and stock levels | Authenticated read; Inventory Staff / Admin write |
| `suppliers` | Auto-generated ID | Verified wholesale vendors and contact data | Authenticated read; Inventory Staff / Admin write |
| `sales` | Auto-generated ID | Checkout transaction records and receipts | Authenticated read; Sales Staff / Admin create; immutable |
| `stockMovements` | Auto-generated ID | Immutable audit trail for all stock changes | Authenticated read; Staff create; immutable |

*For complete field types and visual ER diagrams, refer to [schema/COLLECTIONS.md](schema/COLLECTIONS.md).*

---

## 4. Firestore Security Rules (`firestore.rules`)

Security is enforced at the database level by Firestore security rules. Rules evaluate every incoming request from both the frontend SDK and server environments:

```javascript
// Rule summary:
function isAdmin() { ... }
function isInventoryStaff() { ... }
function isSalesStaff() { ... }

// Products: readable by staff; writable only by Inventory Staff or Admin
match /products/{productId} {
  allow read: if isAuthenticated();
  allow create, update: if isInventoryStaff();
  allow delete: if isAdmin();
}

// Sales: readable by staff; DIRECT CLIENT WRITES STRICTLY FORBIDDEN
// All sales must be processed via 'processSale' Callable Cloud Function using Firebase Admin SDK
match /sales/{saleId} {
  allow read: if isAuthenticated();
  allow create, update, delete: if false;
}

// Stock Movements: immutable audit trail; direct client creation of 'stock_out' is forbidden
match /stockMovements/{movementId} {
  allow read: if isAuthenticated();
  allow create: if isInventoryStaff() && 
    request.resource.data.type in ['stock_in', 'adjustment'] && 
    request.resource.data.type != 'stock_out';
  allow update, delete: if false; // Immutable log
}
```

---

## 5. Composite Query Indexes (`firestore.indexes.json`)

Pre-configured compound indexes to guarantee sub-second response times:
1. `products`: `isActive ASC`, `category ASC` (category filtering)
2. `products`: `isActive ASC`, `quantity ASC` (low-stock queries)
3. `stockMovements`: `productId ASC`, `createdAt DESC` (movement history timeline)
4. `sales`: `status ASC`, `createdAt DESC` (sales chronological feed)

---

## 6. How to Deploy Database Rules & Indexes

Using the Firebase CLI from the project root:
```bash
# Deploy both rules and indexes
firebase deploy --only firestore

# Or deploy individually:
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

---

## 7. How to Seed or Import Sample Data

### Method A: Automated Seed Script
1. Obtain a Firebase service account private key from **Firebase Console → Project Settings → Service Accounts**.
2. Save the key as `03-Database/scripts/serviceAccountKey.json`.
3. Run the seed script:
   ```bash
   node 03-Database/scripts/seedDatabase.js
   ```

### Method B: Frontend Automatic Evaluation Fallback
The `01-Frontend` component already contains pre-seeded fallback data mirroring `sample-data/`. When launching the application in demo mode, all 6 products, 3 suppliers, and stock movements are immediately loaded for evaluation without requiring an external database connection.
