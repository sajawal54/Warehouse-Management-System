import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTransfers } from '../../hooks/useTransfers';
import { useRole } from '../../hooks/useRole';
import { 
  ArrowLeft, Truck, CheckCircle, Clock, XCircle, 
  MapPin, Package, ArrowRight
} from 'lucide-react';
import ConfirmAction from '../../components/modals/ConfirmAction';

const TransferDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTransfer, completeTransfer } = useTransfers();
  const { hasRole } = useRole();
  
  const [transfer, setTransfer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(false);

  const canComplete = hasRole(['admin', 'manager', 'staff']);

  useEffect(() => {
    const loadTransfer = async () => {
      try {
        const data = await getTransfer(id);
        setTransfer(data);
      } catch (err) {
        setError('Transfer not found');
      } finally {
        setLoading(false);
      }
    };
    loadTransfer();
  }, [id, getTransfer]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await completeTransfer(id);
      const data = await getTransfer(id);
      setTransfer(data);
    } catch (err) {
      setError('Failed to complete transfer');
    } finally {
      setCompleting(false);
    }
  };

  const statusColors = {
    'Pending': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    'Completed': 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    'Cancelled': 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  };

  const statusIcons = {
    'Pending': Clock,
    'Completed': CheckCircle,
    'Cancelled': XCircle,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="text-center py-12">
        <Truck className="mx-auto text-gray-400" size={48} />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mt-4">Transfer Not Found</h2>
        <button
          onClick={() => navigate('/transfers')}
          className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          Go back to transfers
        </button>
      </div>
    );
  }

  const StatusIcon = statusIcons[transfer.status] || Clock;
  const statusColor = statusColors[transfer.status] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';

  return (
    <div className="p-4 md:p-6">
      <button
        onClick={() => navigate('/transfers')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6 transition"
      >
        <ArrowLeft size={20} />
        Back to Transfers
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Transfer #{transfer.id}
              </h1>
              <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full ${statusColor}`}>
                <StatusIcon size={16} />
                {transfer.status}
              </span>
            </div>
          </div>
          {canComplete && transfer.status === 'Pending' && (
            <button
              onClick={() => setCompleting(true)}
              disabled={completing}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition flex items-center gap-2 disabled:opacity-50"
            >
              {completing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Complete Transfer
                </>
              )}
            </button>
          )}
        </div>

        {/* ✅ Transfer Info - SHOW IDs ONLY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <MapPin size={16} />
              Source Warehouse
            </p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white mt-1">
              Warehouse #{transfer.source_warehouse_id}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <MapPin size={16} />
              Destination Warehouse
            </p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white mt-1">
              Warehouse #{transfer.dest_warehouse_id}
            </p>
          </div>
        </div>

        {/* Items List */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <Package size={20} />
            Transfer Items
          </h3>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300">Product</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-300">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {transfer.items?.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                      {item.product?.name || `Product #${item.product_id}`}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-gray-700 dark:text-gray-300">
                      {item.qty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Complete Transfer Confirmation */}
      {completing && (
        <ConfirmAction
          title="Complete Transfer"
          message={`Are you sure you want to complete transfer #${transfer.id}? This will move ${transfer.items?.length || 0} item(s) between warehouses.`}
          confirmText="Complete Transfer"
          type="success"
          onConfirm={handleComplete}
          onCancel={() => setCompleting(false)}
        />
      )}
    </div>
  );
};

export default TransferDetails;