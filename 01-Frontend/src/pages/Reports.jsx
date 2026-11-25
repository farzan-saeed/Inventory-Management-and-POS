import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  AlertCircle,
  ArrowUpRight,
  Printer,
  Download,
  Calendar,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { getProducts } from '../services/productService';
import { getSales } from '../services/salesService';
import { getLowStockProducts } from '../services/inventoryService';
import { formatCurrency, parseDate } from '../utils/formatters';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const Reports = () => {
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Date-Range Filters (Phase 3)
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'custom'

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const [prodList, salesList, lowList] = await Promise.all([
          getProducts(true),
          getSales(250),
          getLowStockProducts(),
        ]);
        setProducts(prodList);
        setSales(salesList);
        setLowStock(lowList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Helper to apply quick date presets
  const handleApplyPreset = (preset) => {
    setActivePreset(preset);
    const now = new Date();

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }

    const formatDateInput = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    const todayStr = formatDateInput(now);
    setEndDate(todayStr);

    if (preset === 'today') {
      setStartDate(todayStr);
    } else if (preset === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      setStartDate(formatDateInput(weekAgo));
    } else if (preset === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(now.getDate() - 30);
      setStartDate(formatDateInput(monthAgo));
    }
  };

  // Filter sales records by selected date range
  const filteredSales = sales.filter((s) => {
    if (!s.createdAt) return true;
    const saleDate = parseDate(s.createdAt);
    if (!saleDate) return true;

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (saleDate < start) return false;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (saleDate > end) return false;
    }

    return true;
  });

  // Calculate filtered sales totals
  const totalRevenue = filteredSales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);

  // Best selling products calculation from filtered sales
  const productSalesMap = {};
  filteredSales.forEach(sale => {
    if (sale.items) {
      sale.items.forEach(item => {
        const itemName = item.name || 'General Product';
        if (!productSalesMap[itemName]) {
          productSalesMap[itemName] = { name: itemName, unitsSold: 0, revenue: 0 };
        }
        productSalesMap[itemName].unitsSold += (Number(item.quantity) || 0);
        productSalesMap[itemName].revenue += (Number(item.subtotal) || (Number(item.quantity) * Number(item.unitPrice)) || 0);
      });
    }
  });

  const bestSellers = Object.values(productSalesMap)
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 5);

  // Calculate inventory valuation
  const totalStockUnits = products.reduce((acc, p) => acc + (Number(p.quantity) || 0), 0);
  const totalStockCostValuation = products.reduce((acc, p) => acc + ((Number(p.quantity) || 0) * (Number(p.purchasePrice) || 0)), 0);
  const totalStockRetailValuation = products.reduce((acc, p) => acc + ((Number(p.quantity) || 0) * (Number(p.sellingPrice) || 0)), 0);
  const potentialProfit = totalStockRetailValuation - totalStockCostValuation;

  // Category stock breakdown
  const categoryStockMap = {};
  products.forEach(p => {
    const cat = p.category || 'General';
    categoryStockMap[cat] = (categoryStockMap[cat] || 0) + (Number(p.quantity) || 0);
  });

  const categoryChartData = Object.entries(categoryStockMap).map(([name, value]) => ({
    name,
    value,
  }));

  // CSV Export Handler
  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      showToast('No sales data in the selected period to export.', 'error');
      return;
    }

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = [];

    // Header Metadata
    rows.push(['Smart Inventory & Sales Management System — Sales & Analytics Report']);
    rows.push([
      `Report Period: ${startDate ? startDate : 'Earliest'} to ${endDate ? endDate : 'Present'}`,
      `Generated At: ${new Date().toLocaleString()}`,
      `Filtered Revenue: $${totalRevenue.toFixed(2)}`,
      `Total Sales: ${filteredSales.length}`,
    ]);
    rows.push([]);

    // Table 1: Filtered Sales Transactions
    rows.push([
      'Sale ID',
      'Transaction Date',
      'Customer Name',
      'Items Purchased',
      'Payment Method',
      'Cashier',
      'Total Amount ($)'
    ]);

    filteredSales.forEach((s) => {
      const itemsList = s.items?.map(i => `${i.quantity}x ${i.name}`).join('; ') || 'N/A';
      rows.push([
        s.saleId || s.id,
        s.createdAt ? (parseDate(s.createdAt)?.toLocaleString() || 'N/A') : 'N/A',
        s.customerName || 'Walk-in Customer',
        itemsList,
        s.paymentMethod || 'Cash',
        s.soldBy || 'Staff',
        Number(s.totalAmount || 0).toFixed(2),
      ]);
    });

    rows.push([]);

    // Table 2: Best-Selling Products in Range
    rows.push(['Best-Selling Products Summary']);
    rows.push(['Product Name', 'Units Sold', 'Total Revenue ($)']);

    if (bestSellers.length > 0) {
      bestSellers.forEach((item) => {
        rows.push([
          item.name,
          String(item.unitsSold),
          Number(item.revenue || 0).toFixed(2),
        ]);
      });
    } else {
      rows.push(['No products sold in this period', '0', '0.00']);
    }

    // Format CSV String
    const csvString = rows
      .map((row) => row.map(escapeCsv).join(','))
      .join('\r\n');

    // Trigger download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const startTag = startDate || 'all';
    const endTag = endDate || 'now';
    link.setAttribute('href', url);
    link.setAttribute('download', `sales-report-${startTag}-to-${endTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${filteredSales.length} sales transactions to CSV.`);
  };

  if (loading) {
    return <LoadingSpinner text="Aggregating sales and stock valuation metrics..." size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl border shadow-md flex items-center justify-between text-xs font-semibold ${notification.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 ml-4">✕</button>
        </div>
      )}

      {/* Header & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Analytics & Management Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Comprehensive financial valuation, best-selling product rankings, and inventory status.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            title="Download CSV export of currently filtered sales records"
          >
            <Download className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
            <span>Export Filtered CSV</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 text-slate-500" strokeWidth={1.75} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar (Phase 3) */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" strokeWidth={1.75} />
            <span className="text-xs font-semibold text-slate-700">
              Reporting Period Filter
            </span>
            <span className="text-xs text-slate-400">
              ({filteredSales.length} transactions included)
            </span>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'Last 30 Days' },
            ].map(p => (
              <button
                key={p.id}
                onClick={() => handleApplyPreset(p.id)}
                className={`px-2.5 py-1 rounded-md transition-colors ${activePreset === p.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Start & End Date Inputs */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-medium">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset('custom');
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-500 font-medium">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset('custom');
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => handleApplyPreset('all')}
              className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" strokeWidth={1.75} />
              <span>Reset Period</span>
            </button>
          )}

          <span className="text-xs text-slate-400 ml-auto">
            {startDate || endDate
              ? `Filtering records between ${startDate || 'earliest'} and ${endDate || 'present'}`
              : 'Showing lifetime data across all recorded transactions'}
          </span>
        </div>
      </div>

      {/* Financial Valuation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Filtered Sales Revenue</p>
          <p className="text-2xl font-semibold text-slate-900 mt-2 font-mono">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Across {filteredSales.length} completed transactions</span>
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Inventory Cost Valuation</p>
          <p className="text-2xl font-semibold text-slate-900 mt-2 font-mono">{formatCurrency(totalStockCostValuation)}</p>
          <p className="text-xs text-slate-500 mt-1">Capital tied up in {totalStockUnits} stock units</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Retail Sales Potential</p>
          <p className="text-2xl font-semibold text-blue-600 mt-2 font-mono">{formatCurrency(totalStockRetailValuation)}</p>
          <p className="text-xs text-slate-500 mt-1">Valued at catalog selling prices</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Projected Gross Profit</p>
          <p className="text-2xl font-semibold text-emerald-600 mt-2 font-mono">{formatCurrency(potentialProfit)}</p>
          <p className="text-xs text-emerald-700 font-medium mt-1">
            Margin: {totalStockRetailValuation > 0 ? `${((potentialProfit / totalStockRetailValuation) * 100).toFixed(1)}%` : '0%'}
          </p>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Selling Products Chart */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Best-Selling Products by Units Sold</h2>
            <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
              {bestSellers.length > 0 ? `Ranked Top ${bestSellers.length}` : 'No Sales In Period'}
            </span>
          </div>
          {bestSellers.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bestSellers} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#334155' }} width={110} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [`${val} units`, 'Units Sold']}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="unitsSold" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2 border border-dashed border-slate-200 rounded-lg">
              <BarChart3 className="w-8 h-8 text-slate-300" strokeWidth={1.75} />
              <p className="text-xs font-semibold text-slate-600">No product sales in selected period.</p>
              <p className="text-xs text-slate-400">Select a wider date range or complete sales in the POS terminal.</p>
            </div>
          )}
        </div>

        {/* Category Stock Distribution Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Inventory Distribution by Category</h2>
            <span className="text-xs font-medium text-slate-500">
              {categoryChartData.length} Categories
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`${val} units`, 'In Stock']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Low Stock Summary Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
            <h2 className="text-xs font-semibold text-slate-700">
              Low-Stock Exceptions & Replenishment Summary
            </h2>
          </div>
          <span className="text-xs font-medium text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
            {lowStock.length} items flagged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-medium text-xs border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3 text-center">Current Quantity</th>
                <th className="px-4 py-3 text-center">Reorder Threshold</th>
                <th className="px-4 py-3 text-right">Estimated Restock Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {lowStock.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No products currently at or below reorder level. All stock balances healthy.
                  </td>
                </tr>
              ) : (
                lowStock.map(p => {
                  const shortage = Math.max(0, (Number(p.reorderLevel) * 2) - Number(p.quantity));
                  const estimatedCost = shortage * (Number(p.purchasePrice) || 0);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{p.sku}</td>
                      <td className="px-4 py-3 text-slate-600">{p.category}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium text-rose-600 font-mono">{p.quantity}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600">{p.reorderLevel}</td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-800">
                        {formatCurrency(estimatedCost)} ({shortage} units)
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
