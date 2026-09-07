import { useState } from 'react';
import { useReconciliation } from '../../hooks/useReconciliation';
import { useRole } from '../../hooks/useRole';
import { 
  Scale, CheckCircle, AlertTriangle, XCircle,
  RefreshCw, Clock, Package, Warehouse
} from 'lucide-react';

const Reconciliation = () => {
  const { loading, error, result, runReconciliation } = useReconciliation();
  const { hasRole } = useRole();
  const [runTime, setRunTime] = useState(null);

  const canRun = hasRole(['admin', 'manager']);

  const handleRun = async () => {
    await runReconciliation();
    setRunTime(new Date().toLocaleString());
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Scale className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Reconciliation</h1>
          <p className="text-gray-600 dark:text-gray-400">Compare expected vs actual stock</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Run Button */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              Run Stock Reconciliation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Compares ledger movements against current stock balances
            </p>
            {runTime && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Last run: {runTime}
              </p>
            )}
          </div>
          {canRun && (
            <button
              onClick={handleRun}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Scale size={18} />
                  Run Reconciliation
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="text-green-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Reconciliation Results</h3>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-gray-700 dark:text-gray-300">{result.message}</p>
          </div>

          {result.issues && result.issues.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-gray-800 dark:text-white mb-3">Issues Found:</h4>
              <div className="space-y-3">
                {result.issues.map((issue, index) => (
                  <div key={index} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-red-600 dark:text-red-400 mt-0.5" size={18} />
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">{issue.issue_type}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{issue.description}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Severity: <span className="font-semibold text-red-600 dark:text-red-400">{issue.severity}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {!result && !loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Scale className="mx-auto text-gray-300 dark:text-gray-600" size={48} />
          <h3 className="text-lg font-medium text-gray-800 dark:text-white mt-4">No Reconciliation Run Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Click "Run Reconciliation" to check stock accuracy
          </p>
        </div>
      )}
    </div>
  );
};

export default Reconciliation;