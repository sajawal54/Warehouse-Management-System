import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventory } from '../../hooks/useInventory';
import { useProducts } from '../../hooks/useProducts';
import { useWarehouses } from '../../hooks/useWarehouses';
import { Package, Warehouse, Truck, CheckCircle, X } from 'lucide-react';

const StockReceiving = () => {
  const navigate = useNavigate();
  const { receiveStock, loading, error } = useInventory();
  const { products, loadProducts } = useProducts();
  const { warehouses, loadWarehouses } = useWarehouses();

  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: 1,
    reference_type: 'Manual',
    reference_id: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [receivedData, setReceivedData] = useState(null);

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
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.product_id) newErrors.product_id = 'Product is required';
    if (!formData.warehouse_id) newErrors.warehouse_id = 'Warehouse is required';
    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSuccess(false);
    try {
      const data = {
        product_id: parseInt(formData.product_id),
        warehouse_id: parseInt(formData.warehouse_id),
        quantity: parseInt(formData.quantity),
        reference_type: formData.reference_type,
        reference_id: formData.reference_id ? parseInt(formData.reference_id) : null,
      };
      
      const result = await receiveStock(data);
      setSuccess(true);
      setReceivedData({
        product: products.find(p => p.id === parseInt(formData.product_id)),
        warehouse: warehouses.find(w => w.id === parseInt(formData.warehouse_id)),
        quantity: formData.quantity,
      });
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          product_id: '',
          warehouse_id: '',
          quantity: 1,
          reference_type: 'Manual',
          reference_id: '',
        });
        setSuccess(false);
        setReceivedData(null);
      }, 3000);
      
    } catch (err) {
      // Error is handled by hook
    }
  };

  const handleReset = () => {
    setFormData({
      product_id: '',
      warehouse_id: '',
      quantity: 1,
      reference_type: 'Manual',
      reference_id: '',
    });
    setFormErrors({});
    setSuccess(false);
    setReceivedData(null);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Truck className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Receive Stock</h1>
          <p className="text-gray-600 dark:text-gray-400">Receive inventory into warehouse</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {success && receivedData && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg mb-4 flex items-center gap-3">
          <CheckCircle size={20} />
          <span>
            Successfully received <strong>{receivedData.quantity}</strong> units of{' '}
            <strong>{receivedData.product?.name}</strong> into{' '}
            <strong>{receivedData.warehouse?.name}</strong>!
          </span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <form onSubmit={handleSubmit}>
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
                  formErrors.product_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
              {formErrors.product_id && (
                <p className="mt-1 text-sm text-red-500">{formErrors.product_id}</p>
              )}
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
                  formErrors.warehouse_id ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500`}
              >
                <option value="">Select warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              {formErrors.warehouse_id && (
                <p className="mt-1 text-sm text-red-500">{formErrors.warehouse_id}</p>
              )}
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, quantity: Math.max(1, formData.quantity - 1) })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                -
              </button>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={`w-24 px-4 py-2 text-center rounded-lg border ${
                  formErrors.quantity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500`}
                min="1"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, quantity: formData.quantity + 1 })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                +
              </button>
            </div>
            {formErrors.quantity && (
              <p className="mt-1 text-sm text-red-500">{formErrors.quantity}</p>
            )}
          </div>

          {/* Reference Type & ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reference Type
              </label>
              <input
                type="text"
                name="reference_type"
                value={formData.reference_type}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Purchase Order, Return, Manual"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reference ID (Optional)
              </label>
              <input
                type="text"
                name="reference_id"
                value={formData.reference_id}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., PO-123"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                  Receiving...
                </>
              ) : (
                <>
                  <Truck size={18} className="mr-2" />
                  Receive Stock
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockReceiving;