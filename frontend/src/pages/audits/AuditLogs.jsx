import { useState, useEffect } from 'react';
import { useAuditLogs } from '../../hooks/useAuditLogs';
import { 
  Shield, Search, Filter, ChevronLeft, ChevronRight,
  User, Calendar, Clock, FileText , RefreshCw
} from 'lucide-react';

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(50);

  const { logs, loading, error, loadLogs } = useAuditLogs();

  useEffect(() => {
    loadLogs({ limit });
  }, [loadLogs, limit]);

  // Get unique entities for filter
  const entities = ['all', ...new Set(logs.map(log => log.entity).filter(Boolean))];

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = 
      log.id?.toString().includes(search) ||
      log.action?.toLowerCase().includes(search) ||
      log.entity?.toLowerCase().includes(search) ||
      log.entity_id?.toString().includes(search) ||
      log.user?.email?.toLowerCase().includes(search);
    const matchesEntity = entityFilter === 'all' || entityFilter === '' || log.entity === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (action) => {
    if (action.includes('CREATE')) return 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
    if (action.includes('UPDATE')) return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
    if (action.includes('DELETE')) return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
    if (action.includes('RECEIVE') || action.includes('FULFILL')) return 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300';
    if (action.includes('SUBMIT')) return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
    return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Shield className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Audit Logs</h1>
          <p className="text-gray-600 dark:text-gray-400">Track all system changes</p>
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
            placeholder="Search by ID, action, entity, user..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={entityFilter}
          onChange={(e) => {
            setEntityFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {entities.map((entity) => (
            <option key={entity} value={entity}>
              {entity === 'all' ? 'All Entities' : entity}
            </option>
          ))}
        </select>
        <button
          onClick={() => loadLogs({ limit })}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Entity ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date/Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-500 dark:text-gray-400">Loading audit logs...</p>
                  </td>
                </tr>
              ) : currentLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <Shield className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={48} />
                    <p>No audit logs found</p>
                  </td>
                </tr>
              ) : (
                currentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-gray-900 dark:text-white">
                      #{log.id}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {log.entity || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {log.entity_id || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {log.user?.email || 'System'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length}
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

      {/* Stats */}
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Total logs: {filteredLogs.length}
      </div>
    </div>
  );
};

export default AuditLogs;