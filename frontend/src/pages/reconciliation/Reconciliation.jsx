import React, { useState } from 'react';
import { useReconciliation } from '../../hooks/useReconciliation';
import { useRole } from '../../hooks/useRole';
import { 
  Scale, CheckCircle, AlertTriangle, XCircle,
  RefreshCw, Clock, Package, Warehouse, Sparkles
} from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';

const Reconciliation = () => {
  const { loading, error, results, runReconciliation, loadResults } = useReconciliation();
  const { hasRole } = useRole();
  const [runTime, setRunTime] = useState(null);

  const canRun = hasRole(['admin', 'manager']);

  const handleRun = async () => {
    await runReconciliation();
    setRunTime(new Date().toLocaleString());
  };

  const handleRefresh = async () => {
    await loadResults();
    setRunTime(new Date().toLocaleString());
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'LOW': 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
      'MEDIUM': 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300',
      'HIGH': 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
      'CRITICAL': 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300',
    };
    return colors[severity] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  const actions = (
    <>
      <button
        onClick={handleRefresh}
        disabled={loading}
        className="p-2.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition border border-gray-200 dark:border-gray-700"
      >
        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
      </button>
      {canRun && (
        <button
          onClick={handleRun}
          disabled={loading}
          className="px-5 py-2.5 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/25"
        >
          <Scale size={18} />
          Run Reconciliation
        </button>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Scale}
        title="Reconciliation"
        subtitle="Compare expected vs actual stock"
        actions={actions}
      />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {runTime && (
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Clock size={16} />
          Last run: {runTime}
        </div>
      )}

      {/* Results */}
      {results.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="text-yellow-600" size={18} />
              Reconciliation Findings
              <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full font-medium">
                {results.length}
              </span>
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {results.map((result, index) => (
              <div key={index} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getSeverityColor(result.severity)}`}>
                    {result.severity === 'HIGH' || result.severity === 'CRITICAL' ? (
                      <XCircle size={16} />
                    ) : (
                      <AlertTriangle size={16} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${getSeverityColor(result.severity)}`}>
                        {result.severity}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {result.issue}
                      </span>
                    </div>
                    {result.explanation && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {result.explanation}
                      </p>
                    )}
                    {result.recommendation && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                        💡 {result.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center shadow-lg">
          <Scale className="mx-auto text-gray-300 dark:text-gray-600" size={48} />
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mt-4">No Reconciliation Issues</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {canRun ? 'Click "Run Reconciliation" to check stock accuracy' : 'Check back later for reconciliation results'}
          </p>
          {runTime && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Last checked: {runTime}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Reconciliation;