import React from 'react';

/**
 * WarehouseHeroIllustration
 * A bespoke, responsive, vector-style SVG illustration representing
 * warehouse inventory shelving, organized product boxes, stock indicators,
 * and live point-of-sale inventory tracking.
 */
export const WarehouseHeroIllustration = ({ className = "" }) => {
  return (
    <div className={`relative w-full max-w-lg lg:max-w-xl mx-auto select-none ${className}`}>
      {/* Decorative ambient background blur (restrained, non-distracting) */}
      <div 
        className="absolute -inset-2 bg-gradient-to-tr from-blue-100/40 via-slate-100/30 to-blue-50/50 rounded-3xl -z-10 filter blur-xl"
        aria-hidden="true" 
      />

      <svg
        viewBox="0 0 540 420"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-sm"
        role="img"
        aria-label="Illustration of organized warehouse inventory shelves, product packages, and real-time stock management indicators"
      >
        <defs>
          {/* Subtle linear gradients for depth without excessive flair */}
          <linearGradient id="boxGradPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="boxGradSecondary" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#f1f5f9" />
          </linearGradient>
          <linearGradient id="boxGradNeutral" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>

          {/* Soft drop shadow filter for floating UI badges */}
          <filter id="badgeShadow" x="-10%" y="-10%" width="125%" height="135%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* ----------------- BACKGROUND GEOMETRY ----------------- */}
        <circle cx="270" cy="210" r="185" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="270" cy="210" r="140" fill="#f1f5f9" fillOpacity="0.5" />

        {/* ----------------- WAREHOUSE INDUSTRIAL RACK ----------------- */}
        {/* Floor Line */}
        <line x1="40" y1="365" x2="500" y2="365" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />

        {/* Left Upright Column */}
        <rect x="70" y="55" width="14" height="310" rx="2" fill="#334155" />
        {/* Perforations */}
        <circle cx="77" cy="80" r="2.5" fill="#64748b" />
        <circle cx="77" cy="115" r="2.5" fill="#64748b" />
        <circle cx="77" cy="150" r="2.5" fill="#64748b" />
        <circle cx="77" cy="185" r="2.5" fill="#64748b" />
        <circle cx="77" cy="220" r="2.5" fill="#64748b" />
        <circle cx="77" cy="255" r="2.5" fill="#64748b" />
        <circle cx="77" cy="290" r="2.5" fill="#64748b" />
        <circle cx="77" cy="325" r="2.5" fill="#64748b" />

        {/* Right Upright Column */}
        <rect x="445" y="55" width="14" height="310" rx="2" fill="#334155" />
        {/* Perforations */}
        <circle cx="452" cy="80" r="2.5" fill="#64748b" />
        <circle cx="452" cy="115" r="2.5" fill="#64748b" />
        <circle cx="452" cy="150" r="2.5" fill="#64748b" />
        <circle cx="452" cy="185" r="2.5" fill="#64748b" />
        <circle cx="452" cy="220" r="2.5" fill="#64748b" />
        <circle cx="452" cy="255" r="2.5" fill="#64748b" />
        <circle cx="452" cy="290" r="2.5" fill="#64748b" />
        <circle cx="452" cy="325" r="2.5" fill="#64748b" />

        {/* Shelf Cross Braces (Structural wireframe) */}
        <line x1="84" y1="135" x2="445" y2="235" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3 3" />
        <line x1="84" y1="235" x2="445" y2="135" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Tier 1 Shelf (Top) */}
        <rect x="65" y="125" width="400" height="10" rx="2" fill="#475569" />
        <rect x="70" y="127" width="390" height="6" rx="1" fill="#64748b" />

        {/* Tier 2 Shelf (Middle) */}
        <rect x="65" y="235" width="400" height="10" rx="2" fill="#475569" />
        <rect x="70" y="237" width="390" height="6" rx="1" fill="#64748b" />

        {/* Tier 3 Shelf (Bottom / Deck) */}
        <rect x="65" y="355" width="400" height="12" rx="2" fill="#334155" />

        {/* ----------------- SHELF 1 (TOP): ELECTRONICS & HARDWARE ----------------- */}
        {/* Box 1 (Blue Branded Electronics) */}
        <g id="box-top-1">
          <rect x="100" y="65" width="68" height="60" rx="4" fill="url(#boxGradPrimary)" stroke="#1e40af" strokeWidth="1.5" />
          {/* Packaging tape */}
          <rect x="127" y="65" width="14" height="60" fill="#3b82f6" fillOpacity="0.4" />
          {/* Barcode / shipping label */}
          <rect x="108" y="82" width="28" height="18" rx="2" fill="#ffffff" />
          <line x1="112" y1="87" x2="112" y2="95" stroke="#0f172a" strokeWidth="1.5" />
          <line x1="116" y1="87" x2="116" y2="95" stroke="#0f172a" strokeWidth="1" />
          <line x1="120" y1="87" x2="120" y2="95" stroke="#0f172a" strokeWidth="2" />
          <line x1="124" y1="87" x2="124" y2="95" stroke="#0f172a" strokeWidth="1" />
          <line x1="128" y1="87" x2="128" y2="95" stroke="#0f172a" strokeWidth="1.5" />
          {/* Status Dot: Active/OK */}
          <circle cx="156" cy="77" r="3.5" fill="#22c55e" />
        </g>

        {/* Box 2 (Neutral Warehouse Carton) */}
        <g id="box-top-2">
          <rect x="180" y="55" width="85" height="70" rx="4" fill="url(#boxGradSecondary)" stroke="#94a3b8" strokeWidth="1.5" />
          {/* Center Seam Tape */}
          <line x1="222" y1="55" x2="222" y2="125" stroke="#cbd5e1" strokeWidth="3" />
          {/* Fragile Arrow Icons */}
          <path d="M198 75 L198 87 M194 79 L198 75 L202 79" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M207 75 L207 87 M203 79 L207 75 L211 79" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Product Label */}
          <rect x="194" y="96" width="46" height="16" rx="2" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <text x="200" y="108" fill="#475569" fontSize="8" fontFamily="monospace" fontWeight="bold">ELE-1042</text>
        </g>

        {/* Box 3 & 4 Stacked */}
        <g id="box-top-stack">
          {/* Bottom box in stack */}
          <rect x="280" y="85" width="75" height="40" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="280" y1="102" x2="355" y2="102" stroke="#e2e8f0" strokeWidth="1.5" />
          {/* Top box in stack */}
          <rect x="290" y="55" width="55" height="30" rx="3" fill="url(#boxGradPrimary)" stroke="#1d4ed8" strokeWidth="1.5" />
          <rect x="312" y="55" width="11" height="30" fill="#60a5fa" fillOpacity="0.4" />
        </g>

        {/* Small Accessory Pack */}
        <g id="box-top-small">
          <rect x="370" y="75" width="50" height="50" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx="395" cy="100" r="12" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
          <path d="M391 100 L394 103 L400 97" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* ----------------- SHELF 2 (MIDDLE): ORGANIZED INVENTORY BINS ----------------- */}
        {/* Storage Bin A (Blue Front Crate) */}
        <g id="bin-mid-1">
          <rect x="95" y="160" width="95" height="75" rx="5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
          {/* Handle Grip Slot */}
          <rect x="127" y="172" width="31" height="8" rx="4" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
          {/* Bin Front Accent */}
          <rect x="95" y="210" width="95" height="25" rx="2" fill="#eff6ff" />
          <line x1="95" y1="210" x2="190" y2="210" stroke="#bfdbfe" strokeWidth="1" />
          {/* Tag Pill */}
          <rect x="110" y="216" width="65" height="14" rx="3" fill="#ffffff" stroke="#93c5fd" strokeWidth="1" />
          <text x="117" y="226" fill="#1d4ed8" fontSize="8" fontFamily="sans-serif" fontWeight="bold">BIN #01 • OK</text>
          <circle cx="168" cy="223" r="2.5" fill="#22c55e" />
        </g>

        {/* Storage Bin B (Low Stock Flagged Item) */}
        <g id="bin-mid-2">
          <rect x="210" y="160" width="95" height="75" rx="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
          {/* Handle Grip */}
          <rect x="242" y="172" width="31" height="8" rx="4" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
          {/* Bin Front Accent - Amber low stock */}
          <rect x="210" y="210" width="95" height="25" rx="2" fill="#fffbeb" />
          <line x1="210" y1="210" x2="305" y2="210" stroke="#fde68a" strokeWidth="1" />
          {/* Tag Pill with Alert Indicator */}
          <rect x="220" y="216" width="75" height="14" rx="3" fill="#ffffff" stroke="#fcd34d" strokeWidth="1" />
          <text x="226" y="226" fill="#b45309" fontSize="7.5" fontFamily="sans-serif" fontWeight="bold">REORDER: 8 left</text>
          <circle cx="288" cy="223" r="2.5" fill="#f59e0b" />
        </g>

        {/* Storage Bin C (Components & Fasteners) */}
        <g id="bin-mid-3">
          <rect x="325" y="160" width="95" height="75" rx="5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
          <rect x="357" y="172" width="31" height="8" rx="4" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
          {/* Bin Front Accent */}
          <rect x="325" y="210" width="95" height="25" rx="2" fill="#f8fafc" />
          <line x1="325" y1="210" x2="420" y2="210" stroke="#e2e8f0" strokeWidth="1" />
          <rect x="338" y="216" width="69" height="14" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <text x="345" y="226" fill="#475569" fontSize="8" fontFamily="sans-serif" fontWeight="bold">SUP-4011 • 120</text>
        </g>

        {/* ----------------- SHELF 3 (BOTTOM): BULK CRATES & PALLETS ----------------- */}
        {/* Wooden Logistics Pallet Base */}
        <g id="pallet-bottom">
          <rect x="90" y="342" width="345" height="13" rx="2" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1" />
          {/* Pallet blocks */}
          <rect x="100" y="344" width="22" height="9" fill="#cbd5e1" />
          <rect x="250" y="344" width="22" height="9" fill="#cbd5e1" />
          <rect x="400" y="344" width="22" height="9" fill="#cbd5e1" />
        </g>

        {/* Master Bulk Carton 1 */}
        <g id="carton-bulk-1">
          <rect x="95" y="270" width="135" height="72" rx="4" fill="url(#boxGradSecondary)" stroke="#94a3b8" strokeWidth="1.5" />
          <line x1="162" y1="270" x2="162" y2="342" stroke="#cbd5e1" strokeWidth="2.5" />
          {/* Packing label with barcode */}
          <rect x="110" y="285" width="45" height="30" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <line x1="116" y1="292" x2="116" y2="308" stroke="#334155" strokeWidth="1.5" />
          <line x1="120" y1="292" x2="120" y2="308" stroke="#334155" strokeWidth="2.5" />
          <line x1="125" y1="292" x2="125" y2="308" stroke="#334155" strokeWidth="1" />
          <line x1="129" y1="292" x2="129" y2="308" stroke="#334155" strokeWidth="1.5" />
          <line x1="133" y1="292" x2="133" y2="308" stroke="#334155" strokeWidth="2" />
          <line x1="138" y1="292" x2="138" y2="308" stroke="#334155" strokeWidth="1" />
          <text x="115" y="313" fill="#64748b" fontSize="5" fontFamily="monospace">BATCH-902</text>
        </g>

        {/* Master Bulk Carton 2 (Blue Heavy Goods) */}
        <g id="carton-bulk-2">
          <rect x="245" y="260" width="180" height="82" rx="4" fill="url(#boxGradNeutral)" stroke="#64748b" strokeWidth="1.5" />
          <rect x="325" y="260" width="20" height="82" fill="#f1f5f9" />
          <line x1="335" y1="260" x2="335" y2="342" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 2" />
          {/* Shipping Manifest */}
          <rect x="260" y="278" width="55" height="35" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <rect x="266" y="284" width="28" height="4" rx="1" fill="#2563eb" />
          <rect x="266" y="291" width="42" height="2" rx="1" fill="#cbd5e1" />
          <rect x="266" y="295" width="38" height="2" rx="1" fill="#cbd5e1" />
          <rect x="266" y="299" width="30" height="2" rx="1" fill="#cbd5e1" />
        </g>

        {/* ----------------- INVENTORY SCANNER / HANDHELD TERMINAL ----------------- */}
        <g id="handheld-scanner" transform="translate(425, 175) rotate(-15)">
          {/* Scanner Handle */}
          <rect x="0" y="25" width="14" height="45" rx="4" fill="#1e293b" />
          <rect x="2" y="32" width="10" height="8" rx="2" fill="#334155" />
          {/* Scanner Body */}
          <rect x="-10" y="0" width="34" height="26" rx="5" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
          {/* Scan head */}
          <rect x="-12" y="2" width="6" height="22" rx="2" fill="#2563eb" />
          {/* Red/Blue Laser Targeting Beam */}
          <line x1="-12" y1="13" x2="-115" y2="13" stroke="#3b82f6" strokeWidth="1.8" strokeDasharray="4 3" opacity="0.85" />
          {/* Laser targeting dot on box */}
          <circle cx="-115" cy="13" r="2.5" fill="#2563eb" />
        </g>

        {/* ----------------- FLOATING UI CHIP 1: LIVE STOCK METRIC ----------------- */}
        <g id="floating-chip-stock" filter="url(#badgeShadow)">
          <rect x="18" y="18" width="200" height="46" rx="10" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.2" />
          {/* Icon Container */}
          <rect x="26" y="25" width="32" height="32" rx="8" fill="#eff6ff" />
          {/* Box icon */}
          <path d="M42 32 L49 35.5 L42 39 L35 35.5 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="1" strokeLinejoin="round" />
          <path d="M35 35.5 V43 L42 46.5 V39 Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" strokeLinejoin="round" />
          <path d="M49 35.5 V43 L42 46.5 V39 Z" fill="#60a5fa" stroke="#1d4ed8" strokeWidth="1" strokeLinejoin="round" />
          {/* Text Content */}
          <text x="66" y="37" fill="#0f172a" fontSize="11" fontFamily="sans-serif" fontWeight="bold">1,420 Items Tracked</text>
          <text x="66" y="50" fill="#16a34a" fontSize="9" fontFamily="sans-serif" fontWeight="600">● 98.6% Stock Available</text>
        </g>

        {/* ----------------- FLOATING UI CHIP 2: REAL-TIME POS CHECKOUT ----------------- */}
        <g id="floating-chip-pos" filter="url(#badgeShadow)">
          <rect x="330" y="340" width="195" height="48" rx="10" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.2" />
          {/* Icon Container */}
          <rect x="338" y="348" width="32" height="32" rx="8" fill="#ecfdf5" />
          {/* Checkmark Shopping Icon */}
          <path d="M346 364 L351 369 L362 358" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          {/* Text Content */}
          <text x="378" y="361" fill="#0f172a" fontSize="11" fontFamily="sans-serif" fontWeight="bold">Instant POS Sync</text>
          <text x="378" y="374" fill="#64748b" fontSize="9" fontFamily="sans-serif" fontWeight="500">Atomic Stock Deduction</text>
        </g>

        {/* ----------------- FLOATING UI CHIP 3: LOW STOCK WARNING ----------------- */}
        <g id="floating-chip-alert" filter="url(#badgeShadow)">
          <rect x="345" y="10" width="175" height="40" rx="8" fill="#ffffff" stroke="#fde68a" strokeWidth="1.2" />
          {/* Warning Icon Badge */}
          <rect x="352" y="16" width="28" height="28" rx="6" fill="#fffbeb" />
          <path d="M366 22 L375 37 H357 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1" strokeLinejoin="round" />
          <line x1="366" y1="27" x2="366" y2="31" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="366" cy="34" r="0.9" fill="#ffffff" />
          {/* Text Content */}
          <text x="388" y="27" fill="#92400e" fontSize="10" fontFamily="sans-serif" fontWeight="bold">Low Stock Alert</text>
          <text x="388" y="39" fill="#b45309" fontSize="8.5" fontFamily="sans-serif" fontWeight="500">2 products at reorder point</text>
        </g>
      </svg>
    </div>
  );
};

export default WarehouseHeroIllustration;
