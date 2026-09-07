import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSalesOrders } from '../../hooks/useSalesOrders';
import { useRole } from '../../hooks/useRole';
import { 
  ArrowLeft, ShoppingBag, Clock, CheckCircle, XCircle,
  Package, Truck, RefreshCw
} from 'lucide-react';
import ConfirmAction from '../../components/modals/ConfirmAction';

const SalesOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSalesOrder, submitSalesOrder, fulfillSalesOrder, cancelSalesOrder } = useSalesOrders();
  const { hasRole } = useRole();
  
  const [so, setSo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [fulfilling, setFulfilling] = useState(false);
  const [fulfillItems, setFulfillItems] = useState([]);

  // ✅ Staff+ can fulfill (since you made it require_staff)
  const canSubmit = hasRole(['admin', 'manager']);
  const canFulfill = hasRole(['admin', 'manager', 'staff']);
  const canCancel = hasRole(['admin', 'manager', 'staff']);

  useEffect(() => {
    const loadSO = async () => {
      try {
        const data = await getSalesOrder(id);
        setSo(data);
        setFulfillItems(data.items.map(item => ({
          product_id: item.product_id,
          shipped_qty: 0,
          max_qty: item.ordered_qty - item.shipped_qty
        })));
      } catch (err) {
        setError('Sales order not found');
      } finally {
        setLoading(false);
      }
    };
    loadSO();
  }, [id, getSalesOrder]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitSalesOrder(id);
      const data = await getSalesOrder(id);
      setSo(data);
      setFulfillItems(data.items.map(item => ({
        product_id: item.product_id,
        shipped_qty: 0,
        max_qty: item.ordered_qty - item.shipped_qty
      })));
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelSalesOrder(id);
      const data = await getSalesOrder(id);
      setSo(data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  const handleFulfill = async () => {
    const itemsToFulfill = fulfillItems.filter(item => item.shipped_qty > 0);
    
    if (itemsToFulfill.length === 0) {
      setError('Please enter at least one item to ship');
      return;
    }

    setFulfilling(true);
    setError(null);
    
    try {
      let allSuccessful = true;
      let lastError = null;

      for (const item of itemsToFulfill) {
        try {
          await fulfillSalesOrder(id, {
            product_id: item.product_id,
            shipped_qty: item.shipped_qty
          });
        } catch (err) {
          allSuccessful = false;
          lastError = err.response?.data?.detail || `Failed to fulfill product ${item.product_id}`;
          console.error('Fulfill error for item:', item.product_id, err);
        }
      }

      const data = await getSalesOrder(id);
      setSo(data);
      setFulfillItems(data.items.map(item => ({
        product_id: item.product_id,
        shipped_qty: 0,
        max_qty: item.ordered_qty - item.shipped_qty
      })));

      if (!allSuccessful && lastError) {
        setError(`Some items failed: ${lastError}`);
      } else {
        setError(null);
      }
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fulfill order');
    } finally {
      setFulfilling(false);
    }
  };

  const updateFulfillQty = (productId, value) => {
    setFulfillItems(items => 
      items.map(item => 
        item.product_id === productId 
          ? { ...item, shipped_qty: Math.min(Math.max(0, value), item.max_qty) }
          : item
      )
    );
  };

  const statusColors = {
    'Draft': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    'Submitted': 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    'Partially Fulfilled': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    'Fulfilled': 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    'Cancelled': 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !so) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="mx-auto text-gray-400" size={48} />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mt-4">Order Not Found</h2>
        <button
          onClick={() => navigate('/sales')}
          className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          Go back to orders
        </button>
      </div>
    );
  }

  // ✅ Check if all items are fully fulfilled
  const allItemsFulfilled = so?.items?.every(item => item.ordered_qty === item.shipped_qty);

  // ✅ Show fulfill section if:
  // 1. User has permission (Staff+)
  // 2. Order status is 'Submitted' or 'Partially Fulfilled'
  // 3. Not all items are fulfilled yet
  const showFulfillSection = canFulfill && 
    (so?.status === 'Submitted' || so?.status === 'Partially Fulfilled') && 
    !allItemsFulfilled;

  return (
    <div className="p-4 md:p-6">
      <button
        onClick={() => navigate('/sales')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6 transition"
      >
        <ArrowLeft size={20} />
        Back to Orders
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                SO #{so.id}
              </h1>
              <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full ${statusColors[so.status]}`}>
                {so.status}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Customer: {so.customer_ref || 'N/A'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canSubmit && so.status === 'Draft' && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <RefreshCw size={18} className={submitting ? 'animate-spin' : ''} />
                Submit Order
              </button>
            )}
            {canCancel && (so.status === 'Draft' || so.status === 'Submitted') && (
              <button
                onClick={() => setCancelling(true)}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <XCircle size={18} className={cancelling ? 'animate-spin' : ''} />
                Cancel Order
              </button>
            )}
            {showFulfillSection && (
              <button
                onClick={handleFulfill}
                disabled={fulfilling}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <Truck size={18} className={fulfilling ? 'animate-spin' : ''} />
                {fulfilling ? 'Fulfilling...' : 'Fulfill Order'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {so.customer_ref || 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Warehouse</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {so.warehouse?.name || `Warehouse #${so.warehouse_id}`}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <Package size={20} />
            Order Items
          </h3>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300">Product</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">Ordered</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">Shipped</th>
                  {showFulfillSection && (
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">To Ship</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {so.items?.map((item) => {
                  const fulfillItem = fulfillItems.find(f => f.product_id === item.product_id);
                  const maxQty = item.ordered_qty - item.shipped_qty;

                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {item.product?.name || `Product #${item.product_id}`}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">
                        {item.ordered_qty}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">
                        {item.shipped_qty}
                      </td>
                      {showFulfillSection && (
                        <td className="px-4 py-2 text-right">
                          {maxQty > 0 ? (
                            <input
                              type="number"
                              min="0"
                              max={maxQty}
                              value={fulfillItem?.shipped_qty || 0}
                              onChange={(e) => updateFulfillQty(item.product_id, parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white text-center"
                              disabled={fulfilling}
                            />
                          ) : (
                            <span className="text-sm text-green-600 dark:text-green-400">✅ Complete</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation */}
      {cancelling && (
        <ConfirmAction
          title="Cancel Order"
          message={`Are you sure you want to cancel Sales Order #${so.id}?`}
          confirmText="Cancel Order"
          type="danger"
          onConfirm={handleCancel}
          onCancel={() => setCancelling(false)}
        />
      )}
    </div>
  );
};

export default SalesOrderDetails;