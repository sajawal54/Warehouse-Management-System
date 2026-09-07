
import { Sparkles } from 'lucide-react';

const PageHeader = ({ icon: Icon, title, subtitle, actions }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-3 rounded-2xl bg-linear-to-br from-blue-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-800">
            <Icon className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {title}
            <Sparkles className="text-yellow-500" size={16} />
          </h1>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;