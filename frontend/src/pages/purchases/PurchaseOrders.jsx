import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders';
import { useRole } from '../../hooks/useRole';
import { 
  Plus, Search, Eye, RefreshCw, ChevronLeft, ChevronRight,
  ShoppingCart, Clock, CheckCircle, XCircle, ArrowRight,
  Sparkles
} from 'lucide-react';
import PurchaseOrderForm from './PurchaseOrderForm';
import PageHeader from '../../components/common/PageHeader';

const PurchaseOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { purchaseOrders, loading, error, loadPurchaseOrders } = usePurchaseOrders();
  const { hasRole } = useRole();
  const navigate = useNavigate();
  const itemsPerPage = 10;

  const canCreate = hasRole(['admin', 'manager', 'staff']);

  const statusColors = {
    'Draft': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    'Submitted': 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    'Partially Received': 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
    'Received': 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300',
    'Closed': 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
  };

  const statusIcons = {
    'Draft': Clock,
    'Submitted': Clock,
    'Partially Received': Clock,
    'Received': CheckCircle,
    'Closed': CheckCircle,
  };

  const filteredOrders = purchaseOrders.filter(po => {
    const search = searchTerm.toLowerCase();
    return po.id?.toString().includes(search) ||
           (po.vendor?.name || '').toLowerCase().includes(search);
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handleRefresh = async () => {
    await loadPurchaseOrders();
  };

  const actions = (
    <>
      <button
        onClick={handleRefresh}
        className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition border border-gray-200 dark:border-gray-700"
        title="Refresh"
      >
        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
      </button>
      {canCreate && (
        <button
          onClick={() => setShowForm(true)}
          className="px-5 py-2.5 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/25"
        >
          <Plus size={18} />
          New PO
        </button>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ShoppingCart}
        title="Purchase Orders"
        subtitle="Order products from vendors"
        actions={actions}
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by PO number or vendor..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-300"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 dark:text-gray-300"
        >
          <option value="all">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted</option>
          <option value="Partially Received">Partially Received</option>
          <option value="Received">Received</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">PO #</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Warehouse</th>
                <th className="px-6 py-3.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-3 text-gray-500 dark:text-gray-400">Loading purchase orders...</p>
                  </td>
                </tr>
              ) : currentOrders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <ShoppingCart className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={48} />
                    <p>No purchase orders found</p>
                    {canCreate && (
                      <button
                        onClick={() => setShowForm(true)}
                        className="mt-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        Create your first purchase order
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                currentOrders.map((po) => {
                  const StatusIcon = statusIcons[po.status] || Clock;
                  const statusColor = statusColors[po.status] || 'bg-gray-100 dark:bg-gray-700';

                  return (
                    <tr
                      key={po.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer"
                      onClick={() => navigate(`/purchases/${po.id}`)}
                    >
                      <td className="px-6 py-4 text-sm font-mono font-medium text-gray-900 dark:text-white">
                        #{po.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {po.vendor?.name || `Vendor #${po.vendor_id}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {po.warehouse?.name || `Warehouse #${po.warehouse_id}`}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${statusColor}`}>
                          <StatusIcon size={12} />
                          {po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate(`/purchases/${po.id}`)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create PO Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <PurchaseOrderForm onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;