import  { useState, useEffect } from 'react';
import { useTransfers } from '../../hooks/useTransfers';
import { useProducts } from '../../hooks/useProducts';
import { useWarehouses } from '../../hooks/useWarehouses';
import { X, Plus, Trash2 } from 'lucide-react';

const TransferForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    source_warehouse_id: '',
    dest_warehouse_id: '',
    items: [{ product_id: '', qty: 1 }],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { createTransfer } = useTransfers();
  const { products, loading: productsLoading, loadProducts } = useProducts();
  const { warehouses, loading: warehousesLoading, loadWarehouses } = useWarehouses();

  // ✅ Load products and warehouses when modal opens
  useEffect(() => {
    loadProducts();
    loadWarehouses();
  }, []);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', qty: 1 }],
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      setErrors({ ...errors, items: 'At least one item is required' });
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    if (errors.items) {
      const { items, ...rest } = errors;
      setErrors(rest);
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
    const errorKey = `item_${index}_${field}`;
    if (errors[errorKey]) {
      const { [errorKey]: _, ...rest } = errors;
      setErrors(rest);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.source_warehouse_id) {
      newErrors.source_warehouse_id = 'Source warehouse is required';
    }
    if (!formData.dest_warehouse_id) {
      newErrors.dest_warehouse_id = 'Destination warehouse is required';
    }
    if (formData.source_warehouse_id && formData.dest_warehouse_id && 
        formData.source_warehouse_id === formData.dest_warehouse_id) {
      newErrors.dest_warehouse_id = 'Source and destination cannot be the same';
    }
    formData.items.forEach((item, index) => {
      if (!item.product_id) {
        newErrors[`item_${index}_product_id`] = 'Product is required';
      }
      if (!item.qty || item.qty < 1) {
        newErrors[`item_${index}_qty`] = 'Quantity must be at least 1';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const transferData = {
        source_warehouse_id: parseInt(formData.source_warehouse_id),
        dest_warehouse_id: parseInt(formData.dest_warehouse_id),
        items: formData.items.map(item => ({
          product_id: parseInt(item.product_id),
          qty: parseInt(item.qty)
        }))
      };
      
      console.log('Creating transfer with data:', transferData); // Debug log
      
      await createTransfer(transferData);
      onClose();
    } catch (error) {
      console.error('Error creating transfer:', error.response?.data); // Debug log
      const msg = error.response?.data?.detail || 'Failed to create transfer';
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Show loading state
  if (productsLoading || warehousesLoading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Loading products...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          New Stock Transfer
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <X size={24} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Warehouse Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Source Warehouse <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.source_warehouse_id}
            onChange={(e) => {
              setFormData({ ...formData, source_warehouse_id: e.target.value });
              if (errors.source_warehouse_id) {
                const { source_warehouse_id, ...rest } = errors;
                setErrors(rest);
              }
            }}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.source_warehouse_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Select source warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          {errors.source_warehouse_id && (
            <p className="mt-1 text-sm text-red-500">{errors.source_warehouse_id}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Destination Warehouse <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.dest_warehouse_id}
            onChange={(e) => {
              setFormData({ ...formData, dest_warehouse_id: e.target.value });
              if (errors.dest_warehouse_id) {
                const { dest_warehouse_id, ...rest } = errors;
                setErrors(rest);
              }
            }}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.dest_warehouse_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Select destination warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          {errors.dest_warehouse_id && (
            <p className="mt-1 text-sm text-red-500">{errors.dest_warehouse_id}</p>
          )}
        </div>
      </div>

      {/* Items Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Items <span className="text-red-500">*</span>
          </label>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
        {errors.items && <p className="text-sm text-red-500 mb-2">{errors.items}</p>}
        
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {formData.items.map((item, index) => (
            <div key={index} className="flex gap-2 items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="flex-1">
                <select
                  value={item.product_id}
                  onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    errors[`item_${index}_product_id`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">Select product</option>
                  {/* ✅ Show all products */}
                  {products && products.length > 0 ? (
                    products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No products available</option>
                  )}
                </select>
                {errors[`item_${index}_product_id`] && (
                  <p className="mt-1 text-sm text-red-500">{errors[`item_${index}_product_id`]}</p>
                )}
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 0)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    errors[`item_${index}_qty`] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 text-center`}
                />
                {errors[`item_${index}_qty`] && (
                  <p className="mt-1 text-sm text-red-500">{errors[`item_${index}_qty`]}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg">
          {errors.submit}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              Creating...
            </>
          ) : (
            'Create Transfer'
          )}
        </button>
      </div>
    </form>
  );
};

export default TransferForm;