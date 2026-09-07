import { useState } from 'react';
import { useInventory } from '../../hooks/useInventory';
import { 
  History, Search, ChevronLeft, ChevronRight,
  ArrowUpCircle, ArrowDownCircle, Truck, Package, Warehouse
} from 'lucide-react';

const MovementHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');

  const { movements, loading, error } = useInventory();
  const itemsPerPage = 10;

  const movementTypeColors = {
    'RECEIPT': 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    'TRANSFER_OUT': 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    'TRANSFER_IN': 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    'OUT': 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    'ADJUSTMENT': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
  };

  const movementIcons = {
    'RECEIPT': ArrowUpCircle,
    'TRANSFER_OUT': ArrowUpCircle,
    'TRANSFER_IN': ArrowDownCircle,
    'OUT': ArrowDownCircle,
    'ADJUSTMENT': ArrowUpCircle,
  };

  // ✅ Filter movements
  const filteredMovements = movements.filter(m => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      m.id?.toString().includes(search) ||
      m.product?.name?.toLowerCase().includes(search) ||
      m.reference_type?.toLowerCase().includes(search) ||
      m.movement_type?.toLowerCase().includes(search);
    const matchesType = typeFilter === 'all' || m.movement_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredMovements.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMovements = filteredMovements.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <History className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Inventory Movements</h1>
          <p className="text-gray-600 dark:text-gray-400">Complete history of all stock movements</p>
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
            placeholder="Search by ID, product, or reference..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="RECEIPT">📦 Receipt</option>
          <option value="TRANSFER_OUT">📤 Transfer Out</option>
          <option value="TRANSFER_IN">📥 Transfer In</option>
          <option value="OUT">🚚 Sales Out</option>
          <option value="ADJUSTMENT">🔧 Adjustment</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Warehouse</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qty</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Loading movements...</p>
                  </td>
                </tr>
              ) : currentMovements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <History className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={48} />
                    <p>No movements found</p>
                  </td>
                </tr>
              ) : (
                currentMovements.map((movement) => {
                  const Icon = movementIcons[movement.movement_type] || ArrowUpCircle;
                  const colorClass = movementTypeColors[movement.movement_type] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
                  
                  return (
                    <tr key={movement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                      <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900 dark:text-white">
                        #{movement.id}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${colorClass}`}>
                          <Icon size={14} />
                          {movement.movement_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {movement.product?.name || `Product #${movement.product_id}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {movement.warehouse?.name || `Warehouse #${movement.warehouse_id}`}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-sm font-semibold ${
                          movement.qty_delta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {movement.qty_delta > 0 ? '+' : ''}{movement.qty_delta}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {movement.reference_type || 'N/A'}
                        {movement.reference_id && ` #${movement.reference_id}`}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(movement.created_at)}
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredMovements.length)} of {filteredMovements.length}
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
    </div>
  );
};

export default MovementHistory;