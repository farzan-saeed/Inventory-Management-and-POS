import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  ShoppingCart, 
  AlertCircle, 
  Plus, 
  TrendingUp, 
  ArrowUpRight, 
  Boxes, 
  FileText,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { getProducts } from '../services/productService';
import { getSuppliers } from '../services/supplierService';
import { getSales } from '../services/salesService';
import { getLowStockProducts, getStockMovements } from '../services/inventoryService';
import { formatCurrency, formatDateTime, getStockStatus, parseDate } from '../utils/formatters';

export const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [sales, setSales] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentMovements, setRecentMovements] = useState([]);

  const { role, isAdmin, isInventoryStaff, isSalesStaff } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [prodList, supList, saleList, lowList, movList] = await Promise.all([
          getProducts(true),
          getSuppliers(),
          getSales(250),
          getLowStockProducts(),
          getStockMovements(8),
        ]);

        setProducts(prodList);
        setSuppliers(supList);
        setSales(saleList);
        setLowStockItems(lowList);
        setRecentMovements(movList);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Compiling store analytics and stock levels..." size="large" />;
  }

  // Calculate aggregates
  const totalProductsCount = products.filter(p => p.isActive !== false).length;
  const totalSuppliersCount = suppliers.length;
  const totalSalesRevenue = sales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
  const lowStockCount = lowStockItems.length;

  // Dynamic weekly sales trend calculated from actual sales records (Phase 3)
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const distanceToMonday = (currentDayOfWeek + 6) % 7; // days since Monday
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  // Initialize all 7 days of the current week (Monday through Sunday) with meaningful zero values
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

  // Aggregate real transaction data into matching calendar day buckets
  if (Array.isArray(sales)) {
    sales.forEach((sale) => {
      if (!sale.createdAt) return;
      const saleDate = parseDate(sale.createdAt);
      if (!saleDate) return;

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

  const chartData = weekDays.map(({ day, revenue, orders }) => ({
    day,
    revenue,
    orders,
  }));

  const currentWeekRevenue = chartData.reduce((acc, d) => acc + d.revenue, 0);

  return (
    <div className="space-y-6">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Retail Operations Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time stock indicators, transaction records, and inventory metrics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isInventoryStaff && (
            <button
              onClick={() => navigate('/products')}
              className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" strokeWidth={2} />
              <span>Add Product</span>
            </button>
          )}

          {isSalesStaff && (
            <button
              onClick={() => navigate('/sales')}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-600" strokeWidth={1.75} />
              <span>Point of Sale</span>
            </button>
          )}

          {isInventoryStaff && (
            <button
              onClick={() => navigate('/inventory')}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Boxes className="w-4 h-4 text-blue-600" strokeWidth={1.75} />
              <span>Stock Adjustment</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={totalProductsCount}
          icon={Package}
          colorScheme="blue"
          trend="+4 this week"
          trendType="up"
          subtitle="In active catalogue"
          onClick={() => navigate('/products')}
        />

        <StatCard
          title="Active Suppliers"
          value={totalSuppliersCount}
          icon={Truck}
          colorScheme="indigo"
          subtitle="Verified trade vendors"
          onClick={() => navigate('/suppliers')}
        />

        <StatCard
          title="Total Sales Value"
          value={formatCurrency(totalSalesRevenue)}
          icon={ShoppingCart}
          colorScheme="emerald"
          trend="+18.4%"
          trendType="up"
          subtitle="Processed in Firestore"
          onClick={() => navigate('/sales')}
        />

        <StatCard
          title="Low Stock Items"
          value={lowStockCount}
          icon={AlertCircle}
          colorScheme={lowStockCount > 0 ? "rose" : "emerald"}
          subtitle={lowStockCount > 0 ? "Require replenishment" : "Stock healthy"}
          onClick={() => navigate('/inventory')}
        />
      </div>

      {/* Main Grid: Sales Chart & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Sales & Revenue Trend</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentWeekRevenue > 0 
                  ? `Current week total: ${formatCurrency(currentWeekRevenue)} across active sales`
                  : 'Current week sales distribution (Meaningful zeros on non-trading days)'}
              </p>
            </div>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/70">
              {sales.length > 0 ? `${sales.length} Total Sales Recorded` : 'No Sales Yet'}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  formatter={(val) => [`$${Number(val).toFixed(2)}`, 'Sales Revenue']}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#2563eb" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#salesGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock Watchlist (1 col) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500" strokeWidth={1.75} />
              <h2 className="text-sm font-semibold text-slate-800">Reorder Watchlist</h2>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">
              {lowStockItems.length} items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {lowStockItems.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1" strokeWidth={1.75} />
                <p className="text-xs font-semibold text-slate-700">All Stock Levels Optimal</p>
                <p className="text-xs text-slate-400">No items currently below reorder threshold.</p>
              </div>
            ) : (
              lowStockItems.slice(0, 5).map((item) => (
                <div 
                  key={item.id} 
                  className="p-2.5 rounded-lg border border-amber-100 bg-amber-50/40 hover:bg-amber-50 transition-colors flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      SKU: <span className="font-mono">{item.sku}</span> • Min: {item.reorderLevel}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-medium font-mono text-rose-600 block">
                      {item.quantity} left
                    </span>
                    <button
                      onClick={() => navigate('/inventory')}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-3 text-center">
            <button
              onClick={() => navigate('/inventory')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Open Inventory Manager
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Sales & Stock Movements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Completed Sales */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" strokeWidth={1.75} />
              <h2 className="text-sm font-semibold text-slate-800">Recent Customer Sales</h2>
            </div>
            <button
              onClick={() => navigate('/sales')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View All Sales
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {sales.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No recorded sales transactions yet.</p>
            ) : (
              sales.slice(0, 4).map((sale) => (
                <div key={sale.id || sale.saleId} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800 font-mono">{sale.saleId}</p>
                    <p className="text-slate-500 text-xs">
                      {sale.items?.length || 1} line item(s) • Sold by {sale.soldBy || 'Staff'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 font-mono">
                      {formatCurrency(sale.totalAmount)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDateTime(sale.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Stock Movements Audit */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" strokeWidth={1.75} />
              <h2 className="text-sm font-semibold text-slate-800">Recent Stock Movements (Audit Trail)</h2>
            </div>
            <button
              onClick={() => navigate('/inventory')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              Audit Log
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentMovements.length === 0 ? (
              <p className="py-6 text-center text-slate-400">No recorded stock movements yet.</p>
            ) : (
              recentMovements.slice(0, 4).map((mov) => {
                const isPositive = mov.type === 'stock_in';
                const isOut = mov.type === 'stock_out';

                return (
                  <div key={mov.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{mov.productName}</p>
                      <p className="text-slate-500 text-xs">
                        Ref: <span className="font-mono">{mov.referenceId || 'N/A'}</span> • {mov.notes || mov.type}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block font-mono font-medium px-2 py-0.5 rounded-md text-xs ${
                        isPositive 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : isOut 
                          ? 'bg-rose-50 text-rose-700' 
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {isPositive ? `+${mov.quantity}` : mov.quantity}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDateTime(mov.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
