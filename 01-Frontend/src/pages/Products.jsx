import React, { useState, useEffect } from 'react';
import { Plus, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import ProductTable from '../components/ProductTable';
import ProductForm from '../components/ProductForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { 
  getProducts, 
  addProduct, 
  updateProduct, 
  deactivateProduct 
} from '../services/productService';
import { getSuppliers } from '../services/supplierService';
import { receiveStock } from '../services/inventoryService';

export const Products = () => {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Stock action modal state
  const [quickStockProduct, setQuickStockProduct] = useState(null);
  const [quickQuantity, setQuickQuantity] = useState('10');
  const [quickReference, setQuickReference] = useState('PO-RESTOCK');

  const { isInventoryStaff, userProfile } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodList, supList] = await Promise.all([
        getProducts(true),
        getSuppliers(),
      ]);
      setProducts(prodList);
      setSuppliers(supList);
    } catch (err) {
      console.error("Failed to load products/suppliers", err);
      showToast('Error loading product catalogue.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const handleAddClick = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        showToast(`Product "${formData.name}" successfully updated.`);
      } else {
        await addProduct(formData, userProfile?.name || 'Inventory Staff');
        showToast(`Product "${formData.name}" added to catalogue and Firestore.`);
      }
      await loadData();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleToggleStatus = async (product) => {
    const newStatus = product.isActive === false;
    const actionLabel = newStatus ? 'activated' : 'deactivated';
    
    if (!window.confirm(`Are you sure you want to mark "${product.name}" as ${actionLabel}?`)) {
      return;
    }

    try {
      await deactivateProduct(product.id, newStatus);
      showToast(`Product "${product.name}" marked as ${actionLabel}.`);
      await loadData();
    } catch (err) {
      showToast(`Failed to update product status: ${err.message}`, 'error');
    }
  };

  const handleQuickRestockSubmit = async (e) => {
    e.preventDefault();
    if (!quickStockProduct) return;

    try {
      await receiveStock({
        productId: quickStockProduct.id,
        quantity: quickQuantity,
        referenceId: quickReference,
        notes: 'Quick restock from Product Catalogue',
        userId: userProfile?.name || 'Staff',
      });
      showToast(`Added ${quickQuantity} units to "${quickStockProduct.name}".`);
      setQuickStockProduct(null);
      await loadData();
    } catch (err) {
      showToast(`Restock failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {notification && (
        <div className={`p-3.5 rounded-lg border shadow-sm flex items-center justify-between text-xs font-medium ${
          notification.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={1.75} />
            )}
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Product Catalogue Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Maintain SKU definitions, category classifications, cost & selling pricing, and reorder levels.
          </p>
        </div>

        {isInventoryStaff && (
          <button
            onClick={handleAddClick}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            <span>Create New Product</span>
          </button>
        )}
      </div>

      {/* Product Table View */}
      {loading ? (
        <LoadingSpinner text="Querying product catalogue from Firestore..." />
      ) : (
        <ProductTable
          products={products}
          suppliers={suppliers}
          onEdit={handleEditClick}
          onToggleStatus={handleToggleStatus}
          onStockAction={isInventoryStaff ? (p) => setQuickStockProduct(p) : null}
          canManage={isInventoryStaff}
        />
      )}

      {/* Add / Edit Product Modal */}
      <ProductForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingProduct}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : 'Create New Product'}
      />

      {/* Quick Restock Modal */}
      {quickStockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-200/80 p-6">
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Quick Restock: {quickStockProduct.name}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Current Stock: <span className="font-medium font-mono text-slate-800">{quickStockProduct.quantity} units</span> (Min: {quickStockProduct.reorderLevel})
            </p>

            <form onSubmit={handleQuickRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Quantity to Add (Stock-In)
                </label>
                <input
                  type="number"
                  min="1"
                  value={quickQuantity}
                  onChange={(e) => setQuickQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Purchase Order / Reference ID
                </label>
                <input
                  type="text"
                  value={quickReference}
                  onChange={(e) => setQuickReference(e.target.value)}
                  placeholder="e.g. PO-2024-99"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickStockProduct(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
