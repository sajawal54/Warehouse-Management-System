import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransfers } from '../../hooks/useTransfers';
import { useRole } from '../../hooks/useRole';
import { 
  Plus, Search, Eye, CheckCircle, XCircle, Clock, Truck,
  ArrowRight, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import TransferForm from './TransferForm';
import ConfirmAction from '../../components/modals/ConfirmAction';

const Transfers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [completingTransfer, setCompletingTransfer] = useState(null);

  const { transfers, loading, error, loadTransfers, completeTransfer } = useTransfers();
  const { hasRole } = useRole();
  const navigate = useNavigate();
  const itemsPerPage = 10;

  const canCreate = hasRole(['admin', 'manager', 'staff']);
  const canComplete = hasRole(['admin', 'manager', 'staff']);

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

  const filteredTransfers = transfers.filter(t => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      t.id?.toString().includes(search);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTransfers = filteredTransfers.slice(startIndex, startIndex + itemsPerPage);

  const handleComplete = async () => {
    if (completingTransfer) {
      await completeTransfer(completingTransfer.id);
      setCompletingTransfer(null);
    }
  };

  const handleRefresh = async () => {
    await loadTransfers();
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Truck className="text-blue-600" size={28} />
            Stock Transfers
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Move inventory between warehouses</p>
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
              New Transfer
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
            placeholder="Search by ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">From → To</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Items</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Loading transfers...</p>
                  </td>
                </tr>
              ) : currentTransfers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <Truck className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={48} />
                    <p>No stock transfers found</p>
                    {canCreate && (
                      <button
                        onClick={() => setShowForm(true)}
                        className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Create your first transfer
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                currentTransfers.map((transfer) => {
                  const StatusIcon = statusIcons[transfer.status] || Clock;
                  const statusColor = statusColors[transfer.status] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';

                  return (
                    <tr 
                      key={transfer.id} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                      onClick={() => navigate(`/transfers/${transfer.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900 dark:text-white">
                        #{transfer.id}
                      </td>
                      {/* ✅ SHOW IDs ONLY: source_warehouse_id → dest_warehouse_id */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-700 dark:text-gray-300">
                            {transfer.source_warehouse_id || 'N/A'}
                          </span>
                          <ArrowRight size={16} className="text-gray-400" />
                          <span className="text-gray-700 dark:text-gray-300">
                            {transfer.dest_warehouse_id || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {transfer.items?.length || 0} items
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${statusColor}`}>
                          <StatusIcon size={12} />
                          {transfer.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/transfers/${transfer.id}`)}
                            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                          {canComplete && transfer.status === 'Pending' && (
                            <button
                              onClick={() => setCompletingTransfer(transfer)}
                              className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                              title="Complete Transfer"
                            >
                              <CheckCircle size={18} />
                            </button>
                          )}
                        </div>
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTransfers.length)} of {filteredTransfers.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transfer Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <TransferForm onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {/* Complete Transfer Confirmation */}
      {completingTransfer && (
        <ConfirmAction
          title="Complete Transfer"
          message={`Are you sure you want to complete transfer #${completingTransfer.id}? This will move the stock between warehouses.`}
          confirmText="Complete Transfer"
          type="success"
          onConfirm={handleComplete}
          onCancel={() => setCompletingTransfer(null)}
        />
      )}
    </div>
  );
};

export default Transfers;