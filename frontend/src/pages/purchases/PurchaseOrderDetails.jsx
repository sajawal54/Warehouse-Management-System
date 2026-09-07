import  { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { useRole } from '../../hooks/useRole';
import { 
  ArrowLeft, ShoppingCart, Clock, CheckCircle, 
  Package, Truck, RefreshCw
} from 'lucide-react';
import ConfirmAction from '../../components/modals/ConfirmAction';

const PurchaseOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPurchaseOrder, submitPurchaseOrder, receivePurchaseOrder } = usePurchaseOrders();
  const { hasRole } = useRole();
  
  const [po, setPo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [receiveItems, setReceiveItems] = useState([]);

  const canSubmit = hasRole(['admin', 'manager']);
  const canReceive = hasRole(['admin', 'manager', 'staff']);

  useEffect(() => {
    const loadPO = async () => {
      try {
        const data = await getPurchaseOrder(id);
        setPo(data);
        setReceiveItems(data.items.map(item => ({
          product_id: item.product_id,
          receive_qty: 0,
          max_qty: item.ordered_qty - item.received_qty
        })));
      } catch (err) {
        setError('Purchase order not found');
      } finally {
        setLoading(false);
      }
    };
    loadPO();
  }, [id, getPurchaseOrder]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitPurchaseOrder(id);
      const data = await getPurchaseOrder(id);
      setPo(data);
    } catch (err) {
      setError('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceive = async () => {
    const itemsToReceive = receiveItems.filter(item => item.receive_qty > 0);
    if (itemsToReceive.length === 0) {
      setError('Please enter at least one item to receive');
      return;
    }

    setReceiving(true);
    try {
      await receivePurchaseOrder(id, { items: itemsToReceive });
      const data = await getPurchaseOrder(id);
      setPo(data);
      setReceiveItems(data.items.map(item => ({
        product_id: item.product_id,
        receive_qty: 0,
        max_qty: item.ordered_qty - item.received_qty
      })));
    } catch (err) {
      setError('Failed to receive stock');
    } finally {
      setReceiving(false);
    }
  };

  const updateReceiveQty = (productId, value) => {
    setReceiveItems(items => 
      items.map(item => 
        item.product_id === productId 
          ? { ...item, receive_qty: Math.min(Math.max(0, value), item.max_qty) }
          : item
      )
    );
  };

  const statusColors = {
    'Draft': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    'Submitted': 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    'Partially Received': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    'Received': 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    'Closed': 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !po) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="mx-auto text-gray-400" size={48} />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mt-4">Order Not Found</h2>
        <button
          onClick={() => navigate('/purchases')}
          className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          Go back to orders
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <button
        onClick={() => navigate('/purchases')}
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
                PO #{po.id}
              </h1>
              <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full ${statusColors[po.status]}`}>
                {po.status}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Created: {new Date(po.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canSubmit && po.status === 'Draft' && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <RefreshCw size={18} className={submitting ? 'animate-spin' : ''} />
                Submit Order
              </button>
            )}
            {canReceive && (po.status === 'Submitted' || po.status === 'Partially Received') && (
              <button
                onClick={handleReceive}
                disabled={receiving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <Truck size={18} className={receiving ? 'animate-spin' : ''} />
                Receive Stock
              </button>
            )}
          </div>
        </div>

        {/* Info - ✅ SHOW VENDOR NAME AND WAREHOUSE NAME */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Vendor</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {po.vendor?.name || `Vendor #${po.vendor_id}`}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Warehouse</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white">
              {po.warehouse?.name || `Warehouse #${po.warehouse_id}`}
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
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">Received</th>
                  {(po.status === 'Submitted' || po.status === 'Partially Received') && canReceive && (
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">To Receive</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {po.items?.map((item) => {
                  const receiveItem = receiveItems.find(r => r.product_id === item.product_id);
                  const maxQty = item.ordered_qty - item.received_qty;

                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                        {item.product?.name || `Product #${item.product_id}`}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">
                        {item.ordered_qty}
                      </td>
                      <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">
                        {item.received_qty}
                      </td>
                      {(po.status === 'Submitted' || po.status === 'Partially Received') && canReceive && (
                        <td className="px-4 py-2 text-right">
                          {maxQty > 0 ? (
                            <input
                              type="number"
                              min="0"
                              max={maxQty}
                              value={receiveItem?.receive_qty || 0}
                              onChange={(e) => updateReceiveQty(item.product_id, parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-white text-center"
                            />
                          ) : (
                            <span className="text-sm text-green-600 dark:text-green-400">Complete</span>
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
    </div>
  );
};

export default PurchaseOrderDetails;