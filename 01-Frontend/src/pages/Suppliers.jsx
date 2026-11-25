import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Package, 
  Edit2, 
  Trash2, 
  X 
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { 
  getSuppliers, 
  addSupplier, 
  updateSupplier, 
  deleteSupplier,
  getSupplierProductCount 
} from '../services/supplierService';
import { getProducts } from '../services/productService';
import { formatDate } from '../utils/formatters';

export const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add / Edit Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Safeguard & Confirmation State
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [deleteBlockedCount, setDeleteBlockedCount] = useState(0);

  // Notification Toast State
  const [notification, setNotification] = useState(null);

  const { isInventoryStaff } = useAuth();

  const loadData = async () => {
    try {
      setLoading(true);
      const [supList, prodList] = await Promise.all([
        getSuppliers(),
        getProducts(true),
      ]);
      setSuppliers(supList);
      setProducts(prodList);
    } catch (err) {
      console.error(err);
      showToast('Error loading suppliers list.', 'error');
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

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
    setFormError('');
    setFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
    });
    setFormError('');
    setFormOpen(true);
  };

  // Handle Create or Update Submission
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Supplier organization name is required.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, formData);
        showToast(`Supplier "${formData.name}" updated successfully.`);
      } else {
        await addSupplier(formData);
        showToast(`Supplier "${formData.name}" added successfully.`);
      }
      setFormData({ name: '', email: '', phone: '', address: '' });
      setEditingSupplier(null);
      setFormOpen(false);
      await loadData();
    } catch (err) {
      setFormError(err.message || 'Failed to save supplier.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Request (Checks Product Association Safeguard Freshly)
  const handleDeleteClick = async (supplier) => {
    try {
      const associatedCount = await getSupplierProductCount(supplier.id);
      setSupplierToDelete(supplier);
      setDeleteBlockedCount(associatedCount);
    } catch (e) {
      const fallbackCount = productCountBySupplier[supplier.id] || 0;
      setSupplierToDelete(supplier);
      setDeleteBlockedCount(fallbackCount);
    }
  };

  // Confirm and Execute Deletion
  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    setSubmitting(true);
    try {
      await deleteSupplier(supplierToDelete.id);
      showToast(`Supplier "${supplierToDelete.name}" deleted successfully.`);
      setSupplierToDelete(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to delete supplier.', 'error');
      setSupplierToDelete(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Group products by supplier ID
  const productCountBySupplier = products.reduce((acc, p) => {
    if (p.supplierId) {
      acc[p.supplierId] = (acc[p.supplierId] || 0) + 1;
    }
    return acc;
  }, {});

  const filteredSuppliers = suppliers.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 ml-4">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Supplier Directory & Contacts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Maintain authorized wholesale suppliers and their affiliated catalogue products.
          </p>
        </div>

        {isInventoryStaff && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" strokeWidth={1.75} />
            <span>Add Supplier</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search suppliers by name, email, location..."
          className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Supplier Grid View */}
      {loading ? (
        <LoadingSpinner text="Retrieving verified supplier network..." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSuppliers.map((supplier) => {
            const suppliedItemsCount = productCountBySupplier[supplier.id] || 0;

            return (
              <div 
                key={supplier.id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                      <Truck className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1.5 border border-slate-200/60">
                        <Package className="w-3.5 h-3.5 text-slate-500" strokeWidth={1.75} />
                        {suppliedItemsCount} products
                      </span>
                      {isInventoryStaff && (
                        <div className="flex items-center gap-0.5 ml-1">
                          <button
                            onClick={() => handleOpenEdit(supplier)}
                            title="Edit Supplier"
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(supplier)}
                            title="Delete Supplier"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-900 mb-1">{supplier.name}</h3>
                  
                  <div className="space-y-1.5 text-xs text-slate-600 mt-3">
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" strokeWidth={1.75} />
                        <span className="truncate">{supplier.email}</span>
                      </div>
                    )}
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" strokeWidth={1.75} />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    {supplier.address && (
                      <div className="flex items-start gap-2 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                        <span className="line-clamp-2">{supplier.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                  <span>Registered: {formatDate(supplier.createdAt)}</span>
                  <span className="font-mono">{supplier.id}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Supplier Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200/80 p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  {editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : 'Add Trade Supplier'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingSupplier ? 'Update vendor details and contact information.' : 'Enter vendor details to associate with products.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Wholesale Supplies"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Contact Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="orders@supplier.com"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Physical / Warehouse Address</label>
                <textarea
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Warehouse address, Suite, City..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {submitting ? 'Saving...' : (editingSupplier ? 'Update Supplier' : 'Save Supplier')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Deletion Safeguard / Confirmation Dialog */}
      {supplierToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-xl border border-slate-200/80 p-6 text-center">
            {deleteBlockedCount > 0 ? (
              /* Case A: Deletion Blocked because products are associated */
              <div>
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center mx-auto mb-3 border border-amber-200/60">
                  <AlertCircle className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-2">Cannot Delete Supplier</h3>
                <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200/80 text-xs text-amber-900 text-left mb-4 space-y-1.5">
                  <p>
                    Supplier <strong className="font-semibold">{supplierToDelete.name}</strong> is currently associated with <strong className="text-amber-800 font-semibold">{deleteBlockedCount} product(s)</strong> in your catalogue.
                  </p>
                  <p className="text-xs text-amber-700">
                    To maintain data integrity and prevent orphaned records, please reassign those products to another supplier before deleting.
                  </p>
                </div>
                <button
                  onClick={() => setSupplierToDelete(null)}
                  className="w-full py-2 px-4 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Understood, Return to Directory
                </button>
              </div>
            ) : (
              /* Case B: Safe Deletion Confirmation (No products associated) */
              <div>
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mx-auto mb-3 border border-rose-200/60">
                  <Trash2 className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-semibold text-slate-900 mb-1">Delete Supplier</h3>
                <p className="text-xs text-slate-500 mb-4">
                  Are you sure you want to permanently delete <strong className="font-medium text-slate-800">{supplierToDelete.name}</strong>? This action cannot be undone.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setSupplierToDelete(null)}
                    disabled={submitting}
                    className="flex-1 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={submitting}
                    className="flex-1 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors"
                  >
                    {submitting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
