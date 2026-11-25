import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Sliders, 
  Clock, 
  Search, 
  Filter, 
  Calendar,
  RotateCcw,
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { getProducts } from '../services/productService';
import { 
  receiveStock, 
  recordStockOut,
  adjustStock, 
  getStockMovements 
} from '../services/inventoryService';
import { formatDateTime, getStockStatus, parseDate } from '../utils/formatters.js';

export const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'movements'
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);

  // Stock-In Modal
  const [stockInProduct, setStockInProduct] = useState(null);
  const [stockInQty, setStockInQty] = useState('');
  const [stockInRef, setStockInRef] = useState('');
  const [stockInNotes, setStockInNotes] = useState('');

  // Stock-Out Modal (Phase 3)
  const [stockOutProduct, setStockOutProduct] = useState(null);
  const [stockOutQty, setStockOutQty] = useState('');
  const [stockOutReason, setStockOutReason] = useState('Damaged Stock Write-off');
  const [stockOutRef, setStockOutRef] = useState('');

  // Adjustment Modal
  const [adjustProduct, setAdjustProduct] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Stock Count Audit');

  // Movement Ledger Filters (Phase 3)
  const [movSearchTerm, setMovSearchTerm] = useState('');
  const [movTypeFilter, setMovTypeFilter] = useState('');
  const [movStartDate, setMovStartDate] = useState('');
  const [movEndDate, setMovEndDate] = useState('');

  const { isInventoryStaff, userProfile } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodList, movList] = await Promise.all([
        getProducts(false), // active items
        getStockMovements(50),
      ]);
      setProducts(prodList);
      setMovements(movList);
    } catch (err) {
      console.error(err);
      showToast('Error loading inventory records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const handleStockInSubmit = async (e) => {
    e.preventDefault();
    if (!stockInProduct) return;

    try {
      await receiveStock({
        productId: stockInProduct.id,
        quantity: stockInQty,
        referenceId: stockInRef || 'PO-RESTOCK',
        notes: stockInNotes,
        userId: userProfile?.name || 'Staff',
      });
      showToast(`Successfully received ${stockInQty} units into inventory.`);
      setStockInProduct(null);
      setStockInQty('');
      setStockInRef('');
      setStockInNotes('');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to receive stock.', 'error');
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustProduct) return;

    try {
      await adjustStock({
        productId: adjustProduct.id,
        newQuantity: adjustQty,
        reason: adjustReason,
        userId: userProfile?.name || 'Staff',
      });
      showToast(`Stock quantity for "${adjustProduct.name}" adjusted to ${adjustQty}.`);
      setAdjustProduct(null);
      setAdjustQty('');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to adjust stock.', 'error');
    }
  };

  const handleStockOutSubmit = async (e) => {
    e.preventDefault();
    if (!stockOutProduct) return;

    const qty = parseInt(stockOutQty, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast('Please enter a valid positive quantity to remove.', 'error');
      return;
    }

    const available = Number(stockOutProduct.quantity) || 0;
    if (qty > available) {
      showToast(`Cannot remove ${qty} units. Only ${available} units available in stock.`, 'error');
      return;
    }

    try {
      await recordStockOut({
        productId: stockOutProduct.id,
        quantity: qty,
        reason: stockOutReason,
        referenceId: stockOutRef || ('SO-' + Math.floor(1000 + Math.random() * 9000)),
        userId: userProfile?.name || 'Inventory Staff',
      });
      showToast(`Successfully deducted ${qty} units of "${stockOutProduct.name}" from inventory.`);
      setStockOutProduct(null);
      setStockOutQty('');
      setStockOutRef('');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to record stock-out.', 'error');
    }
  };

  const handleResetMovFilters = () => {
    setMovSearchTerm('');
    setMovTypeFilter('');
    setMovStartDate('');
    setMovEndDate('');
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Combined Multi-Filter for Transaction / Movement History
  const filteredMovements = movements.filter((mov) => {
    // 1. Keyword search (Product Name, Reference ID, Operator, Notes)
    if (movSearchTerm.trim()) {
      const term = movSearchTerm.toLowerCase();
      const matchName = mov.productName?.toLowerCase().includes(term);
      const matchRef = mov.referenceId?.toLowerCase().includes(term);
      const matchUser = mov.userId?.toLowerCase().includes(term);
      const matchNotes = mov.notes?.toLowerCase().includes(term);
      if (!matchName && !matchRef && !matchUser && !matchNotes) {
        return false;
      }
    }

    // 2. Transaction Type Filter
    if (movTypeFilter && mov.type !== movTypeFilter) {
      return false;
    }

    // 3. Date-Range Filter
    if (mov.createdAt) {
      const movDate = parseDate(mov.createdAt);
      if (movDate) {
        if (movStartDate) {
          const start = new Date(movStartDate);
          start.setHours(0, 0, 0, 0);
          if (movDate < start) return false;
        }
        if (movEndDate) {
          const end = new Date(movEndDate);
          end.setHours(23, 59, 59, 999);
          if (movDate > end) return false;
        }
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notification && (
        <div className={`p-4 rounded-xl border shadow-md flex items-center justify-between text-xs font-semibold ${
          notification.type === 'error'
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Inventory & Stock Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Process stock receipts, balance audit discrepancies, and monitor movement ledger.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-200/80 p-1 rounded-lg text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3.5 py-1.5 rounded-md transition-colors ${
              activeTab === 'stock' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Stock Levels & Actions
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3.5 py-1.5 rounded-md transition-colors ${
              activeTab === 'movements' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Movement Audit Trail ({movements.length})
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Retrieving stock quantities and transaction logs..." />
      ) : activeTab === 'stock' ? (
        /* Stock Levels Tab */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search inventory items..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {filteredProducts.length} items listed
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-medium text-xs border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3 text-center">Current Quantity</th>
                  <th className="px-4 py-3 text-center">Reorder Threshold</th>
                  <th className="px-4 py-3">Health Status</th>
                  {isInventoryStaff && <th className="px-4 py-3 text-right">Quick Stock Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const stock = getStockStatus(p.quantity, p.reorderLevel);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{p.sku}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-medium font-mono ${
                          p.quantity <= 0 ? 'text-rose-600' : p.quantity <= p.reorderLevel ? 'text-amber-600' : 'text-slate-900'
                        }`}>
                          {p.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600">{p.reorderLevel}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${stock.bgClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${stock.dotClass}`} />
                          {stock.label}
                        </span>
                      </td>
                      {isInventoryStaff && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setStockInProduct(p);
                                setStockInQty('');
                                setStockInRef('PO-' + Math.floor(1000 + Math.random() * 9000));
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors flex items-center gap-1"
                              title="Record stock received from supplier"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" strokeWidth={1.75} />
                              <span>Stock In</span>
                            </button>

                            <button
                              onClick={() => {
                                setStockOutProduct(p);
                                setStockOutQty('');
                                setStockOutReason('Damaged Stock Write-off');
                                setStockOutRef('SO-' + Math.floor(1000 + Math.random() * 9000));
                              }}
                              disabled={p.quantity <= 0}
                              className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors flex items-center gap-1"
                              title="Record stock removal (damage, loss, etc.)"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" strokeWidth={1.75} />
                              <span>Stock Out</span>
                            </button>

                            <button
                              onClick={() => {
                                setAdjustProduct(p);
                                setAdjustQty(String(p.quantity));
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors flex items-center gap-1"
                              title="Adjust verified inventory count"
                            >
                              <Sliders className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                              <span>Adjust</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Movements Audit Trail Tab */
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Header & Filter Controls */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xs font-semibold text-slate-700">
                  Immutable Stock Movement Ledger (`stockMovements` Collection)
                </h2>
                <p className="text-xs text-slate-500">
                  Every stock increase, manual write-off, POS sale, or audit discrepancy is logged with operator verification.
                </p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60 self-start sm:self-auto">
                Showing {filteredMovements.length} of {movements.length} records
              </span>
            </div>

            {/* Filter Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 pt-2 border-t border-slate-200/60">
              {/* Keyword Search */}
              <div className="relative lg:col-span-4">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={movSearchTerm}
                  onChange={(e) => setMovSearchTerm(e.target.value)}
                  placeholder="Search product, ref ID, operator..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Movement Type Filter */}
              <div className="lg:col-span-3">
                <select
                  value={movTypeFilter}
                  onChange={(e) => setMovTypeFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500 text-slate-700"
                >
                  <option value="">All Movement Types</option>
                  <option value="stock_in">Stock-In (Restock Receipts)</option>
                  <option value="stock_out">Stock-Out (Sales & Write-offs)</option>
                  <option value="adjustment">Adjustments (Audit Corrections)</option>
                </select>
              </div>

              {/* Date Range: Start Date */}
              <div className="lg:col-span-2">
                <input
                  type="date"
                  value={movStartDate}
                  onChange={(e) => setMovStartDate(e.target.value)}
                  title="From date"
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500 text-slate-700"
                />
              </div>

              {/* Date Range: End Date */}
              <div className="lg:col-span-2">
                <input
                  type="date"
                  value={movEndDate}
                  onChange={(e) => setMovEndDate(e.target.value)}
                  title="To date"
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500 text-slate-700"
                />
              </div>

              {/* Reset Button */}
              <div className="lg:col-span-1 flex items-center justify-end">
                <button
                  onClick={handleResetMovFilters}
                  disabled={!movSearchTerm && !movTypeFilter && !movStartDate && !movEndDate}
                  title="Reset all filters"
                  className="w-full px-2 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white rounded-lg border border-slate-200 transition-colors flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3 h-3 text-slate-500" strokeWidth={1.75} />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-medium text-xs border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Movement Type</th>
                  <th className="px-4 py-3 text-center">Quantity Delta</th>
                  <th className="px-4 py-3 text-center">Previous → New</th>
                  <th className="px-4 py-3">Reference / Notes</th>
                  <th className="px-4 py-3">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Clock className="w-7 h-7 text-slate-300" strokeWidth={1.75} />
                        <p className="font-semibold text-slate-600">No matching movement records found.</p>
                        <p className="text-xs text-slate-400">
                          {movements.length === 0 
                            ? 'No stock operations have been recorded yet.'
                            : 'Try adjusting your search keywords, movement type, or date range filter.'}
                        </p>
                        {(movSearchTerm || movTypeFilter || movStartDate || movEndDate) && (
                          <button
                            onClick={handleResetMovFilters}
                            className="mt-2 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                          >
                            Clear All Filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((mov) => {
                    const isStockIn = mov.type === 'stock_in';
                    const isStockOut = mov.type === 'stock_out';

                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                          {formatDateTime(mov.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{mov.productName}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                            isStockIn ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            isStockOut ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {mov.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-medium">
                          <span className={isStockIn ? 'text-emerald-600' : isStockOut ? 'text-rose-600' : 'text-amber-600'}>
                            {isStockIn ? `+${mov.quantity}` : isStockOut ? `-${mov.quantity}` : (mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-slate-600">
                          {mov.previousQuantity} → <span className="font-medium text-slate-900">{mov.newQuantity}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">
                          <span className="font-mono font-medium text-slate-700">{mov.referenceId}</span>
                          {mov.notes && <span className="block text-slate-400 truncate max-w-xs">{mov.notes}</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{mov.userId || 'Staff'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock-In Modal */}
      {stockInProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200/80 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Record Stock Received (Stock-In)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Item: <span className="font-medium text-slate-800">{stockInProduct.name}</span> (Current: {stockInProduct.quantity})
            </p>

            <form onSubmit={handleStockInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Quantity Received *</label>
                <input
                  type="number"
                  min="1"
                  value={stockInQty}
                  onChange={(e) => setStockInQty(e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Supplier Invoice / PO Reference</label>
                <input
                  type="text"
                  value={stockInRef}
                  onChange={(e) => setStockInRef(e.target.value)}
                  placeholder="e.g. PO-8902"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Receiving Notes (Optional)</label>
                <input
                  type="text"
                  value={stockInNotes}
                  onChange={(e) => setStockInNotes(e.target.value)}
                  placeholder="e.g. Delivered by freight carrier"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStockInProduct(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Confirm Stock Received
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {adjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200/80 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Adjust Stock Quantity
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Item: <span className="font-medium text-slate-800">{adjustProduct.name}</span> (Current count: {adjustProduct.quantity})
            </p>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Verified Count *</label>
                <input
                  type="number"
                  min="0"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason for Adjustment *</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="Stock Count Audit">Routine Stock Count Audit</option>
                  <option value="Damaged Stock Write-off">Damaged / Expired Goods</option>
                  <option value="Discrepancy Correction">Discrepancy Correction</option>
                  <option value="Customer Return">Customer Return to Inventory</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustProduct(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock-Out Modal (Phase 3) */}
      {stockOutProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200/80 p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-slate-900">
                Record Manual Stock-Out
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-medium border border-rose-200">
                Stock Deduction
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Item: <span className="font-medium text-slate-800">{stockOutProduct.name}</span> (Current count: <span className="font-mono font-medium text-slate-900">{stockOutProduct.quantity}</span>)
            </p>

            <form onSubmit={handleStockOutSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Quantity to Remove *</label>
                <input
                  type="number"
                  min="1"
                  max={stockOutProduct.quantity}
                  value={stockOutQty}
                  onChange={(e) => setStockOutQty(e.target.value)}
                  placeholder={`1 to ${stockOutProduct.quantity}`}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono text-sm"
                  required
                />
                {parseInt(stockOutQty, 10) > (stockOutProduct.quantity || 0) && (
                  <p className="text-xs text-rose-600 font-medium mt-1">
                    Entered quantity exceeds currently available stock ({stockOutProduct.quantity}).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason for Removal *</label>
                <select
                  value={stockOutReason}
                  onChange={(e) => setStockOutReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 bg-white"
                >
                  <option value="Damaged Stock Write-off">Damaged / Broken Packaging</option>
                  <option value="Expired Stock Disposal">Expired Goods Disposal</option>
                  <option value="Internal Store Consumption">Internal Store Consumption / Supplies</option>
                  <option value="Unexplained Stock Shrinkage">Loss / Shrinkage Discrepancy</option>
                  <option value="Marketing & Promotional Sample">Marketing / Promotional Sample</option>
                  <option value="Defective Return to Supplier">Defective Batch Return</option>
                  <option value="Other Manual Deduction">Other Administrative Write-off</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Disposal Ref / Authorization ID</label>
                <input
                  type="text"
                  value={stockOutRef}
                  onChange={(e) => setStockOutRef(e.target.value)}
                  placeholder="e.g. SO-9842"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setStockOutProduct(null);
                    setStockOutQty('');
                    setStockOutRef('');
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!stockOutQty || parseInt(stockOutQty, 10) <= 0 || parseInt(stockOutQty, 10) > (stockOutProduct.quantity || 0)}
                  className="px-4 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 rounded-lg shadow-sm"
                >
                  Confirm Stock Removal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
