import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useRole } from '../../hooks/useRole';
import { 
  Plus, Search, Edit, Trash2, Warehouse, RefreshCw,
  ChevronLeft, ChevronRight, MapPin
} from 'lucide-react';
import WarehouseForm from './WarehouseForm';
import ConfirmDelete from '../../components/modals/ConfirmDelete';

const Warehouses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [deletingWarehouse, setDeletingWarehouse] = useState(null);

  const { warehouses, loading, error, loadWarehouses, deleteWarehouse } = useWarehouses();
  const { hasRole } = useRole();
  const navigate = useNavigate();
  const itemsPerPage = 10;

  const canCreate = hasRole(['admin', 'manager']);
  const canEdit = hasRole(['admin', 'manager']);
  const canDelete = hasRole(['admin']);

  const filteredWarehouses = warehouses.filter(w => {
    const search = searchTerm.toLowerCase();
    return w.name?.toLowerCase().includes(search) ||
           w.location?.toLowerCase().includes(search);
  });

  const totalPages = Math.ceil(filteredWarehouses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentWarehouses = filteredWarehouses.slice(startIndex, startIndex + itemsPerPage);

  const handleDelete = async () => {
    if (deletingWarehouse) {
      await deleteWarehouse(deletingWarehouse.id);
      setDeletingWarehouse(null);
    }
  };

  const handleEdit = (warehouse) => {
    setEditingWarehouse(warehouse);
    setShowForm(true);
  };

  const handleRefresh = async () => {
    await loadWarehouses();
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Warehouse className="text-blue-600" size={28} />
            Warehouses
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your storage locations</p>
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
              onClick={() => {
                setEditingWarehouse(null);
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Plus size={20} />
              Add Warehouse
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search warehouses..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))
        ) : currentWarehouses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Warehouse className="mx-auto text-gray-300 dark:text-gray-600" size={48} />
            <p className="text-gray-500 dark:text-gray-400 mt-4">No warehouses found</p>
            {canCreate && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Add your first warehouse
              </button>
            )}
          </div>
        ) : (
          currentWarehouses.map((warehouse) => (
            <div
              key={warehouse.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition cursor-pointer"
              onClick={() => navigate(`/warehouses/${warehouse.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Warehouse className="text-blue-600 dark:text-blue-400" size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">{warehouse.name}</h3>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                      warehouse.is_active 
                        ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                      {warehouse.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                {(canEdit || canDelete) && (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {canEdit && (
                      <button
                        onClick={() => handleEdit(warehouse)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeletingWarehouse(warehouse)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {warehouse.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <MapPin size={14} />
                  <span>{warehouse.location}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredWarehouses.length)} of {filteredWarehouses.length}
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

      {/* Warehouse Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <WarehouseForm
              warehouse={editingWarehouse}
              onClose={() => {
                setShowForm(false);
                setEditingWarehouse(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingWarehouse && (
        <ConfirmDelete
          title="Delete Warehouse"
          message={`Are you sure you want to delete "${deletingWarehouse.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingWarehouse(null)}
        />
      )}
    </div>
  );
};

export default Warehouses;