import React, { useState } from 'react';
import { 
  Search, 
  Edit2, 
  Power, 
  PlusCircle, 
  Package
} from 'lucide-react';
import { formatCurrency, getStockStatus } from '../utils/formatters';

export const ProductTable = ({
  products = [],
  suppliers = [],
  onEdit,
  onToggleStatus,
  onStockAction,
  canManage = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [stockFilter, setStockFilter] = useState('All'); // 'All' | 'Low' | 'Active' | 'Inactive'

  // Map supplier ID to name
  const supplierMap = suppliers.reduce((acc, s) => {
    acc[s.id] = s.name;
    return acc;
  }, {});

  // Extract unique categories
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Filter products
  const filtered = products.filter(p => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'Low') {
      matchesStock = Number(p.quantity) <= Number(p.reorderLevel);
    } else if (stockFilter === 'Active') {
      matchesStock = p.isActive !== false;
    } else if (stockFilter === 'Inactive') {
      matchesStock = p.isActive === false;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Filter & Search Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50/50">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by product name, SKU, category..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Stock Condition Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">Status:</span>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="All">All Products</option>
              <option value="Low">Low Stock Alerts Only</option>
              <option value="Active">Active Only</option>
              <option value="Inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-medium text-xs border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Product / SKU</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Cost Price</th>
              <th className="px-4 py-3 text-right">Sell Price</th>
              <th className="px-4 py-3 text-center">In Stock</th>
              <th className="px-4 py-3">Stock Health</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3 text-center">Status</th>
              {canManage && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 9 : 8} className="px-4 py-8 text-center text-slate-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-slate-300" strokeWidth={1.75} />
                  <p className="font-medium text-slate-600">No matching products found</p>
                  <p className="text-slate-400 text-xs mt-0.5">Try adjusting your search or filters.</p>
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const stock = getStockStatus(product.quantity, product.reorderLevel);
                const isInactive = product.isActive === false;

                return (
                  <tr 
                    key={product.id} 
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isInactive ? 'bg-slate-50/40 opacity-75' : ''
                    }`}
                  >
                    {/* Name & SKU */}
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{product.name}</span>
                        <span className="text-xs font-mono text-slate-400">{product.sku}</span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-xs">
                        {product.category || 'General'}
                      </span>
                    </td>

                    {/* Purchase Price */}
                    <td className="px-4 py-3 text-right text-slate-600 font-mono">
                      {formatCurrency(product.purchasePrice)}
                    </td>

                    {/* Selling Price */}
                    <td className="px-4 py-3 text-right font-medium text-slate-900 font-mono">
                      {formatCurrency(product.sellingPrice)}
                    </td>

                    {/* Available Quantity */}
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium font-mono text-sm ${
                        product.quantity <= 0 
                          ? 'text-rose-600' 
                          : product.quantity <= product.reorderLevel 
                          ? 'text-amber-600' 
                          : 'text-slate-800'
                      }`}>
                        {product.quantity}
                      </span>
                      <span className="text-xs text-slate-400 block">
                        Min: {product.reorderLevel}
                      </span>
                    </td>

                    {/* Stock Status Pill */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${stock.bgClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${stock.dotClass}`} />
                        {stock.label}
                      </span>
                    </td>

                    {/* Supplier */}
                    <td className="px-4 py-3 text-slate-600">
                      <span className="truncate block max-w-[140px]" title={supplierMap[product.supplierId] || 'Direct / None'}>
                        {supplierMap[product.supplierId] || '—'}
                      </span>
                    </td>

                    {/* Active Status Badge */}
                    <td className="px-4 py-3 text-center">
                      {product.isActive !== false ? (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          Deactivated
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Stock Action Shortcut */}
                          {onStockAction && (
                            <button
                              onClick={() => onStockAction(product)}
                              title="Restock / Adjust Quantity"
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <PlusCircle className="w-4 h-4" strokeWidth={1.75} />
                            </button>
                          )}

                          {/* Edit Product */}
                          <button
                            onClick={() => onEdit(product)}
                            title="Edit Product"
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>

                          {/* Toggle Active / Deactivate */}
                          <button
                            onClick={() => onToggleStatus(product)}
                            title={product.isActive !== false ? 'Deactivate Product' : 'Activate Product'}
                            className={`p-1 rounded transition-colors ${
                              product.isActive !== false 
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info */}
      <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
        <span>Showing {filtered.length} of {products.length} products</span>
        <span className="text-xs text-slate-400">Database collection: `products`</span>
      </div>
    </div>
  );
};

export default ProductTable;
