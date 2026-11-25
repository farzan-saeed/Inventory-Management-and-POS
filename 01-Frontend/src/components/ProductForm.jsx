import React, { useState, useEffect } from 'react';
import { X, RotateCcw, AlertCircle, Check } from 'lucide-react';
import { generateSKU } from '../utils/formatters';
import { getSuppliers } from '../services/supplierService';
import { isSkuDuplicate } from '../services/productService';

const CATEGORIES = [
  'Electronics',
  'Office Supplies',
  'Packaging',
  'Hardware',
  'Accessories',
  'Beverages & Snacks',
  'General Merchandise',
];

export const ProductForm = ({ isOpen, onClose, onSubmit, initialData = null, title = 'Add New Product' }) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: 'Electronics',
    description: '',
    purchasePrice: '',
    sellingPrice: '',
    quantity: '',
    reorderLevel: '10',
    supplierId: '',
    isActive: true,
  });

  const [suppliers, setSuppliers] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const list = await getSuppliers();
        setSuppliers(list);
        if (!initialData && list.length > 0 && !formData.supplierId) {
          setFormData(prev => ({ ...prev, supplierId: list[0].id }));
        }
      } catch (e) {
        console.error("Failed to load suppliers in form", e);
      }
    };
    if (isOpen) {
      loadSuppliers();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        sku: initialData.sku || '',
        category: initialData.category || 'Electronics',
        description: initialData.description || '',
        purchasePrice: initialData.purchasePrice !== undefined ? String(initialData.purchasePrice) : '',
        sellingPrice: initialData.sellingPrice !== undefined ? String(initialData.sellingPrice) : '',
        quantity: initialData.quantity !== undefined ? String(initialData.quantity) : '',
        reorderLevel: initialData.reorderLevel !== undefined ? String(initialData.reorderLevel) : '10',
        supplierId: initialData.supplierId || '',
        isActive: initialData.isActive !== false,
      });
    } else {
      setFormData({
        name: '',
        sku: generateSKU('ELE'),
        category: 'Electronics',
        description: '',
        purchasePrice: '',
        sellingPrice: '',
        quantity: '',
        reorderLevel: '10',
        supplierId: suppliers[0]?.id || '',
        isActive: true,
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.purchasePrice || isNaN(formData.purchasePrice) || Number(formData.purchasePrice) < 0) {
      newErrors.purchasePrice = 'Valid purchase price (≥ 0) is required';
    }
    if (!formData.sellingPrice || isNaN(formData.sellingPrice) || Number(formData.sellingPrice) < 0) {
      newErrors.sellingPrice = 'Valid selling price (≥ 0) is required';
    }
    if (!formData.quantity || isNaN(formData.quantity) || parseInt(formData.quantity, 10) < 0) {
      newErrors.quantity = 'Valid initial stock quantity is required';
    }
    if (!formData.reorderLevel || isNaN(formData.reorderLevel) || parseInt(formData.reorderLevel, 10) < 0) {
      newErrors.reorderLevel = 'Valid reorder level is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleGenerateSKU = () => {
    setFormData(prev => ({ ...prev, sku: generateSKU(prev.category) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Normalize SKU and check for application-level uniqueness
      const normalizedSku = formData.sku.trim().toUpperCase();
      const duplicate = await isSkuDuplicate(normalizedSku, initialData?.id || null);
      if (duplicate) {
        setErrors(prev => ({
          ...prev,
          sku: "This SKU already exists. Please use a unique SKU."
        }));
        setSubmitting(false);
        return;
      }

      await onSubmit({ ...formData, sku: normalizedSku });
      onClose();
    } catch (err) {
      if (err.message && err.message.includes("SKU already exists")) {
        setErrors(prev => ({ ...prev, sku: err.message }));
      } else {
        setErrors(prev => ({ ...prev, form: err.message || 'Failed to save product.' }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-xl border border-slate-200/80 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            <p className="text-xs text-slate-500">Provide product specifications, pricing, and stock limits.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errors.form && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
              <span>{errors.form}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Wireless Ergonomic Mouse"
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.name ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
              />
              {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
            </div>

            {/* SKU with Auto-generate */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                SKU / Barcode <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="e.g. ELE-1042"
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border ${
                    errors.sku ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
                />
                <button
                  type="button"
                  onClick={handleGenerateSKU}
                  title="Auto-generate SKU"
                  className="px-2.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" strokeWidth={1.75} />
                  <span>Auto</span>
                </button>
              </div>
              {errors.sku && <p className="mt-1 text-xs text-rose-500">{errors.sku}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Purchase Price */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Purchase Price ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="purchasePrice"
                value={formData.purchasePrice}
                onChange={handleChange}
                placeholder="0.00"
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.purchasePrice ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
              />
              {errors.purchasePrice && <p className="mt-1 text-xs text-rose-500">{errors.purchasePrice}</p>}
            </div>

            {/* Selling Price */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Selling Price ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                name="sellingPrice"
                value={formData.sellingPrice}
                onChange={handleChange}
                placeholder="0.00"
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.sellingPrice ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
              />
              {errors.sellingPrice && <p className="mt-1 text-xs text-rose-500">{errors.sellingPrice}</p>}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Initial Stock Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="0"
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.quantity ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
              />
              {errors.quantity && <p className="mt-1 text-xs text-rose-500">{errors.quantity}</p>}
            </div>

            {/* Reorder Level */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Reorder Threshold Level <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                name="reorderLevel"
                value={formData.reorderLevel}
                onChange={handleChange}
                placeholder="10"
                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                  errors.reorderLevel ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500`}
              />
              {errors.reorderLevel && <p className="mt-1 text-xs text-rose-500">{errors.reorderLevel}</p>}
            </div>

            {/* Supplier Selection */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Supplier Association</label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">-- No Supplier Assigned --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.phone || s.email || 'Vendor'})</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">Description (Optional)</label>
              <textarea
                rows="2"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Product specifications, features or storage requirements..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm transition-colors flex items-center gap-1.5"
            >
              {submitting ? 'Saving...' : (initialData ? 'Update Product' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
