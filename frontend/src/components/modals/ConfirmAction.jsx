
import { AlertTriangle, X, CheckCircle } from 'lucide-react';

const ConfirmAction = ({ 
  title, 
  message, 
  confirmText = 'Confirm', 
  onConfirm, 
  onCancel,
  type = 'warning' // 'warning' | 'danger' | 'success'
}) => {
  // Different styles based on type
  const styles = {
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
    },
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      buttonColor: 'bg-red-600 hover:bg-red-700',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      buttonColor: 'bg-green-600 hover:bg-green-700',
    },
  };

  const currentStyle = styles[type] || styles.warning;
  const Icon = currentStyle.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className={`flex items-center gap-3 ${currentStyle.iconColor}`}>
              <Icon size={24} />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {title || 'Confirm Action'}
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Message */}
          <div className={`p-4 rounded-lg ${currentStyle.bgColor} border ${currentStyle.borderColor} mb-6`}>
            <p className="text-gray-700 dark:text-gray-300">
              {message || 'Are you sure you want to perform this action?'}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-lg transition ${currentStyle.buttonColor}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAction;