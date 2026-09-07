import { useState, useEffect } from 'react';
import { useAdjustments } from '../../hooks/useAdjustments';
import { useProducts } from '../../hooks/useProducts';
import { useWarehouses } from '../../hooks/useWarehouses';
import { X } from 'lucide-react';

const AdjustmentForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    qty_delta: 0,
    reason: '',
    approved_by: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { createAdjustment } = useAdjustments();
  const { products, loadProducts } = useProducts();
  const { warehouses, loadWarehouses } = useWarehouses();

  useEffect(() => {
    loadProducts();
    loadWarehouses();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseInt(value) || 0 : value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.product_id) newErrors.product_id = 'Product is required';
    if (!formData.warehouse_id) newErrors.warehouse_id = 'Warehouse is required';
    if (formData.qty_delta === 0) newErrors.qty_delta = 'Quantity must be positive or negative';
    if (!formData.reason.trim()) newErrors.reason = 'Reason is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const data = {
        product_id: parseInt(formData.product_id),
        warehouse_id: parseInt(formData.warehouse_id),
        qty_delta: formData.qty_delta,
        reason: formData.reason,
        approved_by: formData.approved_by || null,
      };
      await createAdjustment(data);
      onClose();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Failed to create adjustment';
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          New Stock Adjustment
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <X size={24} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Product & Warehouse */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Product <span className="text-red-500">*</span>
          </label>
          <select
            name="product_id"
            value={formData.product_id}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.product_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } dark:bg-gray-700 dark:text-white`}
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
            ))}
          </select>
          {errors.product_id && <p className="mt-1 text-sm text-red-500">{errors.product_id}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Warehouse <span className="text-red-500">*</span>
          </label>
          <select
            name="warehouse_id"
            value={formData.warehouse_id}
            onChange={handleChange}
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

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Quantity <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            name="qty_delta"
            value={formData.qty_delta}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.qty_delta ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } dark:bg-gray-700 dark:text-white`}
            placeholder="Positive = Add, Negative = Remove"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {formData.qty_delta > 0 ? '➕ Add' : formData.qty_delta < 0 ? '➖ Remove' : '0'}
          </span>
        </div>
        {errors.qty_delta && <p className="mt-1 text-sm text-red-500">{errors.qty_delta}</p>}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Enter positive number to add stock, negative to remove stock
        </p>
      </div>

      {/* Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Reason <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          className={`w-full px-4 py-2 rounded-lg border ${
            errors.reason ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } dark:bg-gray-700 dark:text-white`}
          placeholder="e.g., Damage, Recount, Expiry, etc."
        />
        {errors.reason && <p className="mt-1 text-sm text-red-500">{errors.reason}</p>}
      </div>

      {/* Approved By (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Approved By (Optional)
        </label>
        <input
          type="text"
          name="approved_by"
          value={formData.approved_by}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          placeholder="Manager name who approved this adjustment"
        />
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
            'Create Adjustment'
          )}
        </button>
      </div>
    </form>
  );
};

export default AdjustmentForm;