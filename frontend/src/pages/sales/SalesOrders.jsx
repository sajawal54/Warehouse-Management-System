import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSalesOrders } from '../../hooks/useSalesOrders';
import { useRole } from '../../hooks/useRole';
import { 
  Plus, Search, Eye, RefreshCw, ChevronLeft, ChevronRight,
  ShoppingBag, Clock, CheckCircle, XCircle
} from 'lucide-react';
import SalesOrderForm from './SalesOrderForm';

const SalesOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { salesOrders, loading, error, loadSalesOrders } = useSalesOrders();
  const { hasRole } = useRole();
  const navigate = useNavigate();
  const itemsPerPage = 10;

  const canCreate = hasRole(['admin', 'manager', 'staff']);

  const statusColors = {
    'Draft': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    'Submitted': 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    'Partially Fulfilled': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    'Fulfilled': 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    'Cancelled': 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
  };

  const statusIcons = {
    'Draft': Clock,
    'Submitted': Clock,
    'Partially Fulfilled': Clock,
    'Fulfilled': CheckCircle,
    'Cancelled': XCircle,
  };

  const filteredOrders = salesOrders.filter(so => {
    const search = searchTerm.toLowerCase();
    return so.id?.toString().includes(search) ||
           so.customer_ref?.toLowerCase().includes(search);
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handleRefresh = async () => {
    await loadSalesOrders();
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ShoppingBag className="text-blue-600" size={28} />
            Sales Orders
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Process customer orders</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          {canCreate && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Plus size={20} />
              New SO
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by order # or customer..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted</option>
          <option value="Partially Fulfilled">Partially Fulfilled</option>
          <option value="Fulfilled">Fulfilled</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">SO #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Warehouse</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Loading...</p>
                  </td>
                </tr>
              ) : currentOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <ShoppingBag className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={48} />
                    <p>No sales orders found</p>
                    {canCreate && (
                      <button
                        onClick={() => setShowForm(true)}
                        className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Create your first sales order
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                currentOrders.map((so) => {
                  const StatusIcon = statusIcons[so.status] || Clock;
                  const statusColor = statusColors[so.status] || 'bg-gray-100 dark:bg-gray-700';

                  return (
                    <tr
                      key={so.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                      onClick={() => navigate(`/sales/${so.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900 dark:text-white">
                        #{so.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {so.customer_ref || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {so.warehouse?.name || `Warehouse #${so.warehouse_id}`}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${statusColor}`}>
                          <StatusIcon size={12} />
                          {so.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/sales/${so.id}`)}
                          className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create SO Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <SalesOrderForm onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesOrders;