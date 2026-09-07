import  { useState, useEffect } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { X } from 'lucide-react';

const ProductForm = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    unit: '',
    reorder_point: 10,
    unit_cost: 0.0,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { createProduct, updateProduct } = useProducts();

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        category: product.category || '',
        unit: product.unit || '',
        reorder_point: product.reorder_point || 10,
        unit_cost: product.unit_cost || 0.0,
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.sku.trim()) newErrors.sku = 'SKU is required';
    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (formData.reorder_point < 0) newErrors.reorder_point = 'Reorder point must be 0 or greater';
    if (formData.unit_cost < 0) newErrors.unit_cost = 'Unit cost must be 0 or greater';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (product) {
        await updateProduct(product.id, formData);
      } else {
        await createProduct(formData);
      }
      onClose();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Operation failed';
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {product ? 'Edit Product' : 'Add New Product'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <X size={24} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* SKU */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          SKU <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="sku"
          value={formData.sku}
          onChange={handleChange}
          className={`w-full px-4 py-2 rounded-lg border ${
            errors.sku ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          placeholder="e.g., PRD-001"
        />
        {errors.sku && <p className="mt-1 text-sm text-red-500">{errors.sku}</p>}
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-4 py-2 rounded-lg border ${
            errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          placeholder="Enter product name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>

      {/* Category & Unit */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Electronics"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Unit
          </label>
          <input
            type="text"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., kg, pcs, liters"
          />
        </div>
      </div>

      {/* Reorder Point & Unit Cost */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Reorder Point
          </label>
          <input
            type="number"
            name="reorder_point"
            value={formData.reorder_point}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.reorder_point ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            min="0"
          />
          {errors.reorder_point && <p className="mt-1 text-sm text-red-500">{errors.reorder_point}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Unit Cost ($)
          </label>
          <input
            type="number"
            name="unit_cost"
            value={formData.unit_cost}
            onChange={handleChange}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.unit_cost ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
            } dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            min="0"
            step="0.01"
          />
          {errors.unit_cost && <p className="mt-1 text-sm text-red-500">{errors.unit_cost}</p>}
        </div>
      </div>

      {errors.submit && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg">
          {errors.submit}
        </div>
      )}

      {/* Buttons */}
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
              {product ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            product ? 'Update Product' : 'Create Product'
          )}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;