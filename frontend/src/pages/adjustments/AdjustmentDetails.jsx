import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAdjustments } from '../../hooks/useAdjustments';
import { ArrowLeft, Settings, Package, Warehouse, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

const AdjustmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAdjustment } = useAdjustments();
  
  const [adj, setAdj] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAdjustment = async () => {
      try {
        const data = await getAdjustment(id);
        setAdj(data);
      } catch (err) {
        setError('Adjustment not found');
      } finally {
        setLoading(false);
      }
    };
    loadAdjustment();
  }, [id, getAdjustment]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !adj) {
    return (
      <div className="text-center py-12">
        <Settings className="mx-auto text-gray-400" size={48} />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mt-4">Adjustment Not Found</h2>
        <button
          onClick={() => navigate('/adjustments')}
          className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          Go back to adjustments
        </button>
      </div>
    );
  }

  const isPositive = adj.qty_delta > 0;

  return (
    <div className="p-4 md:p-6">
      <button
        onClick={() => navigate('/adjustments')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6 transition"
      >
        <ArrowLeft size={20} />
        Back to Adjustments
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                Adjustment #{adj.id}
              </h1>
              <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full ${
                isPositive 
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                  : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
              }`}>
                {isPositive ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                {isPositive ? '+' : ''}{adj.qty_delta}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Reason: {adj.reason || 'N/A'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Package size={16} />
              Product
            </p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white mt-1">
              {adj.product?.name || `Product #${adj.product_id}`}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Warehouse size={16} />
              Warehouse
            </p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white mt-1">
              {adj.warehouse?.name || `Warehouse #${adj.warehouse_id}`}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Approved By</p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white mt-1">
              {adj.approved_by || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdjustmentDetails;