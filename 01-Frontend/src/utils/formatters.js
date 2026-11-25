/**
 * Utility formatters for Smart Inventory & Sales Management System
 */

// Formats number to currency string (e.g. $1,250.00)
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '$0.00';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
};

// Safely parses Firestore Timestamp, { seconds }, ISO string, or Date to a JS Date object
export const parseDate = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return isNaN(timestamp.getTime()) ? null : timestamp;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }
  if (timestamp.seconds !== undefined) {
    return new Date(timestamp.seconds * 1000);
  }
  const d = new Date(timestamp);
  return isNaN(d.getTime()) ? null : d;
};

// Formats Firestore timestamp or ISO date string
export const formatDate = (timestamp) => {
  const date = parseDate(timestamp);
  if (!date) return '—';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Formats Firestore timestamp with time
export const formatDateTime = (timestamp) => {
  const date = parseDate(timestamp);
  if (!date) return '—';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

// Returns visual indicator badge styles based on stock levels
export const getStockStatus = (quantity, reorderLevel) => {
  const qty = Number(quantity) || 0;
  const reorder = Number(reorderLevel) || 0;

  if (qty <= 0) {
    return {
      label: 'Out of Stock',
      bgClass: 'bg-rose-50 text-rose-700 border-rose-200',
      dotClass: 'bg-rose-500',
      badge: 'danger',
    };
  }

  if (qty <= reorder) {
    return {
      label: 'Low Stock',
      bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
      dotClass: 'bg-amber-500',
      badge: 'warning',
    };
  }

  return {
    label: 'In Stock',
    bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotClass: 'bg-emerald-500',
    badge: 'success',
  };
};

// Generates a clean random SKU
export const generateSKU = (categoryPrefix = 'PRD') => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const prefix = (categoryPrefix || 'PRD').substring(0, 3).toUpperCase();
  return `${prefix}-${randomNum}`;
};
