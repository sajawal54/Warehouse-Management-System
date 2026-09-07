
import { AlertTriangle, X } from 'lucide-react';

const ConfirmDelete = ({ title, message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <AlertTriangle size={24} />
              <h2 className="text-lg font-semibold">{title || 'Confirm Delete'}</h2>
            </div>
            <button onClick={onCancel} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              <X size={20} />
            </button>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            {message || 'Are you sure you want to delete this item?'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button onClick={onCancel} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Cancel
            </button>
            <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDelete;