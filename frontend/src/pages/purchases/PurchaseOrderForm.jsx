import { useState, useEffect } from 'react';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { useVendors } from '../../hooks/useVendors';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useProducts } from '../../hooks/useProducts';
import { X, Plus, Trash2 } from 'lucide-react';

const PurchaseOrderForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    vendor_id: '',
    warehouse_id: '',
    items: [{ product_id: '', ordered_qty: 1 }],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { createPurchaseOrder } = usePurchaseOrders();
  const { vendors, loadVendors } = useVendors();
  const { warehouses, loadWarehouses } = useWarehouses();
  const { allProducts, loadAllProducts } = useProducts();

  useEffect(() => {
    loadVendors();
    loadWarehouses();
    loadAllProducts();
  }, []);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product_id: '', ordered_qty: 1 }],
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      setErrors({ ...errors, items: 'At least one item is required' });
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.vendor_id) newErrors.vendor_id = 'Vendor is required';
    if (!formData.warehouse_id) newErrors.warehouse_id = 'Warehouse is required';
    formData.items.forEach((item, index) => {
      if (!item.product_id) newErrors[`item_${index}_product_id`] = 'Product is required';
      if (!item.ordered_qty || item.ordered_qty < 1) {
        newErrors[`item_${index}_ordered_qty`] = 'Quantity must be at least 1';
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
      const data = {
        vendor_id: parseInt(formData.vendor_id),
        warehouse_id: parseInt(formData.warehouse_id),
        items: formData.items.map(item => ({
          product_id: parseInt(item.product_id),
          ordered_qty: parseInt(item.ordered_qty)
        }))
      };
      await createPurchaseOrder(data);
      onClose();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to create purchase order';
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          New Purchase Order
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <X size={24} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Vendor & Warehouse */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Vendor <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.vendor_id}
            onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.vendor_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } dark:bg-gray-700 dark:text-white`}
          >
            <option value="">Select vendor</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          {errors.vendor_id && <p className="mt-1 text-sm text-red-500">{errors.vendor_id}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Warehouse <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.warehouse_id}
            onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.warehouse_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } dark:bg-gray-700 dark:text-white`}
          >
            <option value="">Select warehouse</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
          {errors.warehouse_id && <p className="mt-1 text-sm text-red-500">{errors.warehouse_id}</p>}
        </div>
      </div>

      {/* Items */}
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

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {formData.items.map((item, index) => (
            <div key={index} className="flex gap-2 items-center bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              <div className="flex-1">
                <select
                  value={item.product_id}
                  onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                >
                  <option value="">Select product</option>
                  {allProducts?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
                {errors[`item_${index}_product_id`] && (
                  <p className="mt-1 text-sm text-red-500">{errors[`item_${index}_product_id`]}</p>
                )}
              </div>
              <div className="w-32">
                <input
                  type="number"
                  min="1"
                  value={item.ordered_qty}
                  onChange={(e) => updateItem(index, 'ordered_qty', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white text-center"
                  placeholder="Qty"
                />
                {errors[`item_${index}_ordered_qty`] && (
                  <p className="mt-1 text-sm text-red-500">{errors[`item_${index}_ordered_qty`]}</p>
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
            'Create Purchase Order'
          )}
        </button>
      </div>
    </form>
  );
};

export default PurchaseOrderForm;