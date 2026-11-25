# Figma UI/UX Design Specification & Re-creation Blueprint
**Project:** Smart Inventory and Sales Management System  
**Application Target:** Modern Retail Store Edition (Frontend, Backend, Database)  
**Canvas Standard:** Desktop 1440 × 900 px (Responsive 8pt Grid)  
**Live Editable Figma File:** [https://www.figma.com/design/Dxv7fmAgxJC6tUkwXU2eNR](https://www.figma.com/design/Dxv7fmAgxJC6tUkwXU2eNR)  
**Deliverable File:** `04-UI-UX-Design/FIGMA-DESIGN-SPECIFICATION.md`  

---

## Table of Contents
1. [Project Overview & Design Direction](#1-project-overview--design-direction)
2. [Global Design System Specifications](#2-global-design-system-specifications)
   - [Color Palette & Hex Tokens](#21-color-palette--hex-tokens)
   - [Typography Hierarchy (Inter)](#22-typography-hierarchy-inter)
   - [Layout Grid & Spacing Standard](#23-layout-grid--spacing-standard)
   - [Iconography & Elevation Shadows](#24-iconography--elevation-shadows)
   - [Component Library Specifications](#25-component-library-specifications)
3. [Low-Fidelity Wireframes (Structural Schematics)](#3-low-fidelity-wireframes-structural-schematics)
4. [High-Fidelity Screen-by-Screen Design Specifications](#4-high-fidelity-screen-by-screen-design-specifications)
   - [Screen 0: Minimal Public Landing Page (1440x960)](#screen-0-minimal-public-landing-page-1440x960)
   - [Screen 1: Authentication & Saved Accounts (1440x900)](#screen-1-login--saved-accounts-1440x900)
   - [Screen 2: Executive Dashboard & Operations Console (1440x960)](#screen-2-executive-dashboard-1440x900)
   - [Screen 3: Product Management (with Add/Edit Modal)](#screen-3-product-management-1440x900)
   - [Screen 4: Inventory Operations (with Stock-In & Adjustment Modals)](#screen-4-inventory-operations-1440x900)
   - [Screen 5: Supplier Management (with Add Supplier Modal)](#screen-5-supplier-management-1440x900)
   - [Screen 6: Point of Sale (POS) & Checkout (with Receipt Modal)](#screen-6-point-of-sale-pos--checkout-1440x900)
   - [Screen 7: Analytics & Reports](#screen-7-analytics--reports-1440x900)
5. [Clickable Prototype Navigation & Interaction Matrix](#5-clickable-prototype-navigation--interaction-matrix)
6. [Figma File Assembly Guide & Checklist](#6-figma-file-assembly-guide--checklist)

---

## 1. Project Overview & Design Direction

The **Smart Inventory and Sales Management System** is a business-critical information system designed for a small retail store transitioning from manual spreadsheets and physical registers to an automated web dashboard.

### Core Visual Principles
- **Theme:** Clean, corporate Blue-and-White business dashboard with high-contrast text and subtle neutral grey accents.
- **Chrome Structure:** Fixed dark navy sidebar (`#0F172A`, 256px width) on the left, top sticky white header (`#FFFFFF`, 64px height), and an expansive light grey content viewport (`#F8FAFC`).
- **Surface Elevation:** Clean flat surfaces with subtle 1px borders (`#E2E8F0`) and soft, minimal drop shadows. No loud gradients or skeuomorphism.
- **Component Symmetry:** Strict adherence to 8pt spatial rhythm (multiples of 4, 8, 12, 16, 24, 32).
- **Desktop Standard:** Primary design frame is **1440 × 900 px**, expanding gracefully to 1920px.

---

## 2. Global Design System Specifications

### 2.1 Color Palette & Hex Tokens

| Category | Token Name | Hex Code | Figma Role / Usage |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | `brand-600` | `#2563EB` | Primary buttons, active nav indicators, key brand elements |
| | `brand-700` | `#1D4ED8` | Button hover & active states |
| | `brand-500` | `#3B82F6` | Chart lines, active input borders, links |
| | `brand-50` | `#EFF6FF` | Selected table row highlight, light accent pills |
| **Sidebar Navy** | `sidebar-bg` | `#0F172A` | Left navigation background |
| | `sidebar-card` | `#1E293B` | Sidebar supervisor widget, active menu item |
| | `sidebar-border` | `#334155` | Subtle dividers in sidebar |
| | `sidebar-text-dim`| `#94A3B8` | Inactive nav links and sub-labels |
| **Neutrals** | `canvas-bg` | `#F8FAFC` | Main application background |
| | `surface-white`| `#FFFFFF` | Card containers, modals, table backgrounds, navbar |
| | `border-subtle`| `#E2E8F0` | Card borders, table dividers, input borders |
| | `text-primary` | `#0F172A` | Page titles, primary numerical metrics, headings |
| | `text-secondary`| `#475569` | Body copy, table header text, descriptions |
| | `text-muted` | `#64748B` | Timestamps, subtitles, SKU tags, placeholder text |
| **Status / Semantic**| `success-text` | `#065F46` | "In Stock" label, positive revenue trends |
| | `success-bg` | `#ECFDF5` | "In Stock" badge background, card accent fill |
| | `success-dot` | `#10B981` | Positive status indicator dot |
| | `warning-text` | `#92400E` | "Low Stock" label, threshold notifications |
| | `warning-bg` | `#FFFBEB` | "Low Stock" badge background |
| | `warning-dot` | `#F59E0B` | Reorder threshold warning dot |
| | `danger-text` | `#9F1239` | "Out of Stock" label, error toasts, delete |
| | `danger-bg` | `#FFF1F2` | "Out of Stock" badge background |
| | `danger-dot` | `#F43F5E` | Critical alert indicator dot |
| | `purple-pill` | `#F5F3FF` | Admin role badge background (`#5B21B6` text) |

---

### 2.2 Typography Hierarchy (Inter)

All text uses the **Inter** font family (fallback to `system-ui, -apple-system, sans-serif`). Data tables, timestamps, and currency use proportional numerals or monospace for SKUs.

| Style Name | Font Size | Line Height | Weight | Letter Spacing | Case | Figma Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display Header** | 24 px | 32 px | Bold (700) | -0.02 em | Sentence | Main screen titles (e.g. "Retail Operations Overview") |
| **Section H1** | 20 px | 28 px | Bold (700) | -0.01 em | Sentence | Modal titles, sub-module titles |
| **Card H2** | 16 px | 24 px | SemiBold (600) | 0.00 em | Sentence | Card headers, table section titles |
| **Metric Large** | 28 px | 36 px | Bold (700) | -0.02 em | Normal | StatCard KPIs, total revenue figures |
| **Body Standard** | 14 px | 20 px | Regular (400) | 0.00 em | Sentence | Input values, modal paragraphs, table rows |
| **Body SemiBold** | 14 px | 20 px | SemiBold (600) | 0.00 em | Sentence | Button labels, table bold text |
| **Caption** | 12 px | 16 px | Medium (500) | +0.01 em | Sentence | Secondary labels, input field labels, helper hints |
| **Overline Micro** | 11 px | 14 px | SemiBold (600) | +0.05 em | UPPERCASE | Table headers, "CURRENT ROLE", "CATEGORY" |
| **Monospace Data** | 12 px | 16 px | Regular (400) | 0.00 em | Normal | Product SKUs (`ELE-1042`), Transaction IDs |

---

### 2.3 Layout Grid & Spacing Standard

- **Viewport Size:** 1440 px width × 900 px height (min height; content scrolls vertically).
- **Sidebar Frame:** 256 px width, 100% viewport height, fixed left.
- **Top Navbar Frame:** 1184 px width (1440 - 256), 64 px height, sticky top.
- **Main Content Area:** 1184 px width, padded with `padding: 24px 32px 32px 32px`.
- **Inner Column Grid:** 12-column grid inside main content viewport, 24px gutters, 32px margins.
- **Spacing Scale:**
  - `4px` (Tight padding inside badges)
  - `8px` (Icon to text gap, input inner padding)
  - `12px` (Stack gap in card rows)
  - `16px` (Card inner padding, standard gap between form fields)
  - `24px` (Section gaps, main grid gaps)
  - `32px` (Major layout module separation)

---

### 2.4 Iconography & Elevation Shadows

#### Icon Library: Lucide React (24px outline, 1.75px stroke width)
- Dashboard: `LayoutDashboard`
- Products: `Package`
- Inventory: `Boxes`
- Sales & POS: `ShoppingCart`
- Suppliers: `Truck`
- Reports: `BarChart3`
- Alerts: `AlertTriangle`, `Bell`
- Actions: `Plus`, `Edit2`, `Power`, `Search`, `Filter`, `Trash2`

#### Elevation & Shadows
- **Card Shadow (`shadow-sm`):**  
  `0px 1px 3px 0px rgba(0, 0, 0, 0.05)`, `0px 1px 2px -1px rgba(0, 0, 0, 0.02)` + `1px solid #E2E8F0`
- **Hover Card Shadow (`shadow-md`):**  
  `0px 4px 6px -1px rgba(0, 0, 0, 0.07)`, `0px 2px 4px -2px rgba(0, 0, 0, 0.04)` + `1px solid #CBD5E1`
- **Modal Overlay / Dropdown (`shadow-xl`):**  
  `0px 20px 25px -5px rgba(0, 0, 0, 0.12)`, `0px 8px 10px -6px rgba(0, 0, 0, 0.05)` + `1px solid #E2E8F0`

---

### 2.5 Component Library Specifications

#### Component 1: `Sidebar`
- **Dimensions:** Width: 256px, Height: 100vh. Background: `#0F172A`.
- **Header Section (Height 64px):**
  - Brand Icon: 36 × 36 px `#2563EB` rounded rectangle with `Layers` icon in `#FFFFFF`.
  - Brand Title: "SmartInventory" (15px Bold `#FFFFFF`).
  - Subtitle: "Retail Store System" (11px Medium `#94A3B8`).
- **Role Tag Section:**
  - Label: "CURRENT ROLE" (11px Uppercase `#64748B`).
  - Active Role Pill: 11px SemiBold with dynamic color (Admin: `#F5F3FF` on `#5B21B6`; Inventory: `#FFFBEB` on `#92400E`; Sales: `#ECFDF5` on `#065F46`).
- **Nav Links (Vertical stack, 4px gap, 12px horizontal padding):**
  - Item height: 42px, radius: 8px.
  - Active State: Background `#2563EB`, text `#FFFFFF`, icon `#FFFFFF`.
  - Inactive State: Background transparent, text `#94A3B8`, hover fill `#1E293B` text `#F8FAFC`.
- **Supervisor Role Switcher Widget (Bottom docked):**
  - Card background: `#090D16`, border: `1px solid #1E293B`, radius: 12px, padding: 12px.
  - 3 segmented buttons: `Admin`, `Inventory`, `Sales`. Active button has `#2563EB` fill.

#### Component 2: `TopNavbar`
- **Dimensions:** Width: 1184px, Height: 64px. Fill: `#FFFFFF`, Border-bottom: `1px solid #E2E8F0`.
- **Left Slot:** Breadcrumb / Location label: "STORE MANAGEMENT CONSOLE" (11px Uppercase `#64748B`).
- **Right Slot (Auto-Layout horizontal, 16px gap):**
  1. Connection Pill: 24px height, `#ECFDF5` fill, `#A7F3D0` border, `Database` icon + "Firestore Connected" (11px `#065F46`).
  2. Notification Bell: 36 × 36 px button, `Bell` icon in `#475569`. Red badge dot (16 × 16 px `#E11D48`, text `#FFFFFF` 10px Bold) showing count of low stock items.
  3. User Profile Button: Avatar circle (32 × 32 px `#DBEAFE` fill, text `#1D4ED8` 12px Bold), Name "Sarah Connor" (13px SemiBold `#0F172A`), Role "Admin" (11px Regular `#64748B`), chevron icon.

#### Component 3: `StatCard`
- **Dimensions:** Width: 266px (in 4-col layout), Height: 142px. Fill: `#FFFFFF`, Border: `1px solid #E2E8F0`, Radius: 12px, Padding: 20px.
- **Top Row:** Title (13px Medium `#64748B`) + Icon Container (40 × 40 px, Radius 8px, tinted background matching semantic color).
- **Metric Row:** Number value (28px Bold `#0F172A`).
- **Footer Row:** Trend pill (e.g. "↑ +18.4%" `#ECFDF5` fill, `#065F46` text) + Subtitle caption (11px `#64748B`).

#### Component 4: `DataTable`
- **Container:** Fill `#FFFFFF`, Border `1px solid #E2E8F0`, Radius 12px, Overflow hidden.
- **Filter Bar (Height 56px, Padding 12px 16px, Fill `#F8FAFC`, Border-bottom `1px solid #E2E8F0`):**
  - Search Input: 320px width, 36px height, Radius 8px, `Search` icon on left, placeholder text.
  - Category Filter Dropdown: 140px width, 36px height.
  - Stock Health Filter Dropdown: 150px width, 36px height.
- **Header Row (Height 40px, Fill `#F8FAFC`, Border-bottom `1px solid #E2E8F0`):**
  - 11px SemiBold `#475569` uppercase tracking +0.05em.
- **Table Data Rows (Height 52px each, Border-bottom `1px solid #F1F5F9`):**
  - Hover state: Fill `#F8FAFC`.
  - Inactive product row: Opacity 65%, Fill `#F8FAFC`.

#### Component 5: `ModalDialog`
- **Backdrop:** Fill `#0F172A` at 60% opacity with 4px background blur.
- **Card Frame:** 600px width (for ProductForm) / 480px width (for Stock-in / Quick actions), Fill `#FFFFFF`, Radius 16px, Border `1px solid #E2E8F0`, Shadow `shadow-xl`.
- **Header (Padding 20px 24px, Fill `#FAFAFA`, Border-bottom `1px solid #F1F5F9`):**
  - Modal Title (18px Bold `#0F172A`), Subtitle (12px `#64748B`), Close `✕` button.
- **Body (Padding 24px):** Form fields in 2-column responsive layout.
- **Footer (Padding 16px 24px, Border-top `1px solid #F1F5F9`, Fill `#FAFAFA`):**
  - "Cancel" button (Secondary outline) + "Save / Submit" button (Primary Blue fill).

---

## 3. Low-Fidelity Wireframes (Structural Schematics)

### Wireframe 1: Login Frame
```
+---------------------------------------------------------------+
|                        [Canvas #F1F5F9]                       |
|                                                               |
|                  +--------------------------+                 |
|                  |     [Brand Icon (Blue)]  |                 |
|                  |      SmartInventory      |                 |
|                  |   Retail Store System    |                 |
|                  +--------------------------+                 |
|                  | [Card Frame: 440px wide] |                 |
|                  |                          |                 |
|                  |  Sign In to Account      |                 |
|                  |  [Email Input_________]  |                 |
|                  |  [Password Input______]  |                 |
|                  |  [Sign In Button (Blue)] |                 |
|                  |  ----------------------  |                 |
|                  |  Supervisor Demo Logins: |                 |
|                  |  [ Admin: Sarah Connor ] |                 |
|                  |  [ Inv: Michael Chen   ] |                 |
|                  |  [ Sales: Amina Patel  ] |                 |
|                  +--------------------------+                 |
+---------------------------------------------------------------+
```

### Wireframe 2: Standard Dashboard & Application Shell
```
+--------------+------------------------------------------------+
| SIDEBAR 256px| TOP NAVBAR (Height 64px)       [Bell][Profile] |
+--------------+------------------------------------------------+
| SmartInv     | PAGE TITLE: Retail Operations Overview         |
| [ROLE: Admin]| [Subtitle]            [+ Add Product] [POS]    |
|              +------------------------------------------------+
| - Dashboard* | [Stat 1: 148] [Stat 2: $12.4k] [Stat 3: 3 Low] |
| - Products   +-------------------------------+----------------+
| - Inventory  | SALES OVERVIEW CHART          | REORDER WATCH  |
| - Sales POS  | [Weekly Sales Trend Line]     | - Cable (4 left|
| - Suppliers  |                               | - Mouse (8 left|
| - Reports    |                               |                |
|              +-------------------------------+----------------+
| [Role Switch]| RECENT SALES TRANSACTIONS     | STOCK AUDIT LOG|
| [Ad][Inv][Sa]| [INV-001 | $79.95 | Sarah C ] | [+25 units in] |
+--------------+------------------------------------------------+
```

---

## 4. High-Fidelity Screen-by-Screen Design Specifications

### Screen 1: Login & Role Selection (1440×900)
- **Frame Name:** `01-Login`
- **Background:** `#F1F5F9` with centered modal box.
- **Center Modal (Width 440px, Auto-Height ~560px, Radius 16px, Fill `#FFFFFF`, Border `#E2E8F0`, Shadow `0 20px 25px -5px rgba(0,0,0,0.08)`):**
  - **Header (Y: 32px):** Icon 48 × 48 px `#2563EB`, Title "SmartInventory" (24px Bold `#0F172A`), Tagline "University Evaluation Prototype" (11px SemiBold `#2563EB` pill).
  - **Form Fields (Y: 130px, 16px gap):**
    - Label: "Email Address" (12px SemiBold `#334155`).
    - Input: Height 42px, Radius 8px, Border `#CBD5E1`, Fill `#FFFFFF`, Left icon `Mail` `#94A3B8`, text "admin@inventory.edu".
    - Label: "Password" (12px SemiBold `#334155`).
    - Input: Height 42px, Radius 8px, Border `#CBD5E1`, Left icon `Lock`, Right icon `Eye`, text "••••••••".
  - **Primary CTA:** Height 44px, Radius 8px, Fill `#2563EB`, Text "Sign In" (14px SemiBold `#FFFFFF`), Right arrow icon.
  - **Supervisor Demo Accounts Container (Y: 370px):**
    - Header: "Supervisor Quick Evaluation Accounts" with `ShieldCheck` icon.
    - Card 1: "Sarah Connor" • `admin@inventory.edu` • Badge: `Admin` (Purple).
    - Card 2: "Michael Chen" • `inventory@inventory.edu` • Badge: `Inventory Staff` (Amber).
    - Card 3: "Amina Patel" • `sales@inventory.edu` • Badge: `Sales Staff` (Emerald).

---

### Screen 2: Executive Dashboard (1440×900)
- **Frame Name:** `02-Dashboard`
- **Navigation:** Sidebar item "Dashboard" in active state (Fill `#2563EB`, Text `#FFFFFF`).
- **Main Viewport Header:**
  - Title: "Retail Operations Overview" (22px Bold `#0F172A`).
  - Subtitle: "Real-time stock indicators, transaction records, and inventory metrics." (13px `#64748B`).
  - Right CTAs:
    - Button 1: "+ Add Product" (Primary Blue `#2563EB`, 36px height).
    - Button 2: "Point of Sale" (White outline `#E2E8F0`, `ShoppingCart` icon in `#10B981`).
    - Button 3: "Stock Adjustment" (White outline `#E2E8F0`, `Boxes` icon in `#2563EB`).
- **Row 1: 4 KPI StatCards (Width 266px each, Height 140px, 20px gap):**
  1. *Total Products:* Value `148`, Icon `Package` (Blue `#EFF6FF`), Trend `+4 this week` (Green), Subtitle `In active catalogue`.
  2. *Active Suppliers:* Value `12`, Icon `Truck` (Indigo `#EEF2FF`), Subtitle `Verified trade vendors`.
  3. *Total Sales Value:* Value `$12,450.00`, Icon `ShoppingCart` (Emerald `#ECFDF5`), Trend `+18.4%`, Subtitle `Real-time revenue`.
  4. *Low Stock Items:* Value `3`, Icon `AlertTriangle` (Rose `#FFF1F2`), Trend `Requires immediate reorder` (Rose text).
- **Row 2: Analytics Split (Height 340px):**
  - **Left Card (Width 740px):** "Sales & Revenue Trend"
    - Area Chart: 7 data points (Mon to Sun), gradient fill from `#2563EB` (25% opacity) down to 0%, stroke `#2563EB` (2.5px width).
    - Tooltip: Dark `#1E293B`, showing `$530.00 Revenue`.
  - **Right Card (Width 364px):** "Reorder Watchlist (3 items)"
    - List of flagged products:
      - Item 1: `USB-C Fast Charging Cable 2M` • SKU: `ELE-3015` • Stock: `4 left` (Red Bold) • Min: `20` • Action: `Restock →`
      - Item 2: `Mechanical Gaming Keyboard` • SKU: `ELE-2089` • Stock: `8 left` (Amber Bold) • Min: `10`
      - Item 3: `Heavy Duty Packaging Tape` • SKU: `SUP-4011` • Stock: `25 left` • Min: `30`
- **Row 3: Transaction Feeds (Height 260px, 2 equal columns 542px each):**
  - Column 1: "Recent Customer Sales" (`INV-2024-001` • $79.95 • Amina Patel).
  - Column 2: "Recent Stock Movements" (Wireless Mouse • `+25 received` • Apex Wholesale).

---

### Screen 3: Product Management (1440×900)
- **Frame Name:** `03-Products`
- **Header:** "Product Catalogue Management" with "+ Create New Product" CTA.
- **DataTable Module (Width 1120px):**
  - Filters: Search bar (300px), Category filter (`Electronics`, `Packaging`, `Office Supplies`), Status filter (`All`, `Low Stock Only`, `Active Only`).
  - Columns:
    1. Product / SKU: "Wireless Bluetooth Ergonomic Mouse" (Bold) / `ELE-1042` (Mono 11px).
    2. Category: Pill `Electronics` (`#F1F5F9`).
    3. Cost Price: `$12.50` (Right-aligned).
    4. Sell Price: `$24.99` (Right-aligned, Bold).
    5. In Stock: `45` (Centered, Bold) / `Min: 15`.
    6. Stock Health: Badge `● In Stock` (Green `#ECFDF5`).
    7. Supplier: "Global Hardware & Electronics".
    8. Status: Badge `Active` (Green outline).
    9. Actions: Icons for `Quick Restock` (`PlusCircle`), `Edit` (`Edit2`), `Toggle Deactivate` (`Power`).
- **Overlay State:** `03-Products-AddModal` (600px width dialog displaying all required fields: Name, SKU with "Auto" generate button, Category dropdown, Purchase Price, Selling Price, Initial Stock, Reorder Level, Supplier dropdown, Description).

---

### Screen 4: Inventory Operations (1440×900)
- **Frame Name:** `04-Inventory`
- **Tab Bar:** Two toggle tabs:
  - Tab A (Active): "Stock Levels & Actions"
  - Tab B: "Movement Audit Trail (`stockMovements` Collection)"
- **Stock Table View:**
  - Focused on replenishment actions. Each product row features two prominent buttons:
    - Button 1: `Stock In` (Blue pill `#EFF6FF`, `ArrowDownLeft` icon)
    - Button 2: `Adjust` (Grey pill `#F1F5F9`, `Sliders` icon)
- **Overlay State A:** `04-Inventory-StockInModal` (440px width dialog: "Record Stock Received", input fields for Quantity Received, Supplier Invoice / PO Reference, and Delivery Notes).
- **Overlay State B:** `04-Inventory-AdjustModal` (440px width dialog: "Adjust Stock Quantity", input fields for New Verified Count, Reason dropdown: `Routine Stock Count Audit`, `Damaged / Expired Goods`, `Customer Return`).

---

### Screen 5: Supplier Management (1440×900)
- **Frame Name:** `05-Suppliers`
- **Header:** "Supplier Directory & Contacts" with "+ Add Supplier" CTA.
- **Search Bar:** 320px width search input.
- **Card Grid Layout (3 Columns, 350px width per card, Radius 12px, Padding 20px):**
  - **Card Header:** Icon `Truck` inside `#EEF2FF` circle, Right pill: `3 products supplied`.
  - **Company Title:** "Apex Wholesale Supplies" (15px Bold `#0F172A`).
  - **Contact Rows:**
    - Email: `orders@apexsupplies.com` (with `Mail` icon).
    - Phone: `+1 (555) 234-5678` (with `Phone` icon).
    - Address: `142 Market Street, Industrial Park, Suite 4` (with `MapPin` icon).
  - **Card Footer:** "Registered: Jan 15, 2024" • ID: `sup-001`.
- **Overlay State:** `05-Suppliers-AddModal` (440px width dialog: Company Name, Email, Phone, Warehouse Address).

---

### Screen 6: Point of Sale (POS) & Checkout (1440×900)
- **Frame Name:** `06-Sales`
- **Layout Split (2 Columns: 65% Catalog & Cart / 35% Payment Checkout):**
  - **Left Section A (Item Selector):**
    - Product Select Dropdown (showing product title, sell price, available stock).
    - Quantity Input (number input with +/- controls).
    - CTA: "+ Add to Sale" (Blue `#2563EB`).
  - **Left Section B (Cart Table):**
    - Line items: Name, SKU, Unit Price, Quantity, Subtotal, Remove `Trash` icon.
  - **Right Section (Payment & Tender Card):**
    - Customer Name Input: default "Walk-in Customer".
    - Payment Method Selector: 3 segmented cards (`Cash` with banknote icon, `Card` with credit card icon, `Mobile` with smartphone icon).
    - Calculations: Subtotal `$104.97`, Tax `$0.00`, Total Due: `$104.97` (20px Bold Blue).
    - Primary CTA: "Complete Sale ($104.97)" (Emerald Green `#10B981`, 48px height, Bold text).
- **Overlay State:** `06-Sales-ReceiptModal` (400px width dialog showing completed receipt with checkmark icon, reference ID `INV-2024-001`, itemized breakdown, total paid, and "Start Next Sale" button).

---

### Screen 7: Analytics & Reports (1440×900)
- **Frame Name:** `07-Reports`
- **Header:** "Analytics & Management Reports" with "Print Summary Report" button (`Printer` icon).
- **Financial Valuation Cards (4 Columns):**
  1. *Total Sales Revenue:* `$12,450.00` (from all completed sales).
  2. *Inventory Cost Valuation:* `$8,340.00` (capital tied up in current stock).
  3. *Retail Sales Potential:* `$16,800.00` (retail inventory value).
  4. *Projected Gross Profit:* `$8,460.00` (Gross Margin: `50.4%`).
- **Charts Row (2 Columns):**
  - Left: Horizontal Bar Chart showing **Best-Selling Products by Units Sold** (Top 5 items).
  - Right: Donut / Pie Chart showing **Inventory Distribution by Category** (Electronics 45%, Packaging 30%, Office Supplies 25%).
- **Bottom Table:** "Low-Stock Exceptions & Replenishment Summary" displaying all flagged items with estimated restock costs.

---

## 5. Clickable Prototype Navigation & Interaction Matrix

In Figma, set up the following interaction triggers on the frames to create a fully clickable prototype:

| Source Frame | Source Element / Hotspot | Trigger | Action | Target Destination Frame | Animation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `01-Login` | "Sign In" Button | On Click | Navigate to | `02-Dashboard` | Instant / Dissolve 200ms |
| `01-Login` | Admin Demo Account Card | On Click | Navigate to | `02-Dashboard` | Dissolve 150ms |
| `01-Login` | Inventory Demo Account Card | On Click | Navigate to | `03-Products` | Dissolve 150ms |
| `01-Login` | Sales Demo Account Card | On Click | Navigate to | `06-Sales` | Dissolve 150ms |
| *Any Screen* | Sidebar Link "Dashboard" | On Click | Navigate to | `02-Dashboard` | Smart Animate 150ms |
| *Any Screen* | Sidebar Link "Products" | On Click | Navigate to | `03-Products` | Smart Animate 150ms |
| *Any Screen* | Sidebar Link "Inventory" | On Click | Navigate to | `04-Inventory` | Smart Animate 150ms |
| *Any Screen* | Sidebar Link "Sales & POS"| On Click | Navigate to | `06-Sales` | Smart Animate 150ms |
| *Any Screen* | Sidebar Link "Suppliers" | On Click | Navigate to | `05-Suppliers` | Smart Animate 150ms |
| *Any Screen* | Sidebar Link "Reports" | On Click | Navigate to | `07-Reports` | Smart Animate 150ms |
| `02-Dashboard` | StatCard "Low Stock Items"| On Click | Navigate to | `04-Inventory` | Dissolve 200ms |
| `02-Dashboard` | Reorder List "Restock →" | On Click | Open Overlay | `04-Inventory-StockInModal` | Dissolve (Centered) |
| `03-Products` | "+ Create New Product" | On Click | Open Overlay | `03-Products-AddModal` | Dissolve (Centered) |
| `03-Products` | Row "Quick Restock" Icon | On Click | Open Overlay | `04-Inventory-StockInModal` | Dissolve (Centered) |
| `04-Inventory` | "Stock In" Button | On Click | Open Overlay | `04-Inventory-StockInModal` | Dissolve (Centered) |
| `04-Inventory` | "Adjust" Button | On Click | Open Overlay | `04-Inventory-AdjustModal` | Dissolve (Centered) |
| `05-Suppliers` | "+ Add Supplier" Button | On Click | Open Overlay | `05-Suppliers-AddModal` | Dissolve (Centered) |
| `06-Sales` | "Complete Sale" Button | On Click | Open Overlay | `06-Sales-ReceiptModal` | Dissolve (Centered) |
| `06-Sales-ReceiptModal` | "Start Next Sale" Button | On Click | Close Overlay & Reset | `06-Sales` | Dissolve 150ms |
| *Any Screen* | User Dropdown → "Sign Out"| On Click | Navigate to | `01-Login` | Dissolve 200ms |

---

## 6. Figma File Assembly Guide & Checklist

To assemble this editable Figma project:

1. **Step 1 — Create Project File:**
   - Create a new Figma file titled: **"Smart Inventory & Sales Management System — UI/UX Specification"**.
2. **Step 2 — Import Design Tokens:**
   - Open the **Tokens Studio for Figma** plugin (or Figma Local Variables).
   - Import `04-UI-UX-Design/tokens/figma-tokens.json` to auto-populate the color palette, typography styles, spacing, and radii.
3. **Step 3 — Import Vector Artboards:**
   - Drag and drop the SVG files from `04-UI-UX-Design/vector-artboards/` into Figma. Each file imports as a 100% native vector frame with editable shapes, texts, and layers.
4. **Step 4 — Wire Prototype Connections:**
   - Switch to Figma's **Prototype** tab (`Shift + E`).
   - Wire the hotspots listed in Section 5 ([Clickable Prototype Navigation](#5-clickable-prototype-navigation--interaction-matrix)).
5. **Step 5 — Supervisor Evaluation Readiness:**
   - Hit **Present** (`Ctrl + Alt + Enter` / `Cmd + Option + Enter`) to verify that clicking between screens, opening modals, and switching roles flows seamlessly.
