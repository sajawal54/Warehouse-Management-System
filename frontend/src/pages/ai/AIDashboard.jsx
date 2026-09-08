import { useState, useEffect } from 'react';
import { useAI } from '../../hooks/useAI';
import { useRole } from '../../hooks/useRole';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Activity, AlertTriangle, CheckCircle, Package, 
  RefreshCw, AlertOctagon, TrendingUp, TrendingDown,
  Warehouse, MessageSquare, BarChart3, Clock,
  ArrowUp, ArrowDown, Info, Sparkles, Zap,
  Users, Box, Eye, ChevronRight, ShoppingCart, ArrowRight, ShoppingBag,
  Lock  // ✅ Added Lock icon
} from 'lucide-react';

const AIDashboard = () => {
  const { summary, loading, error, loadDashboardSummary, runReconciliation } = useAI();
  const { hasRole, userRole } = useRole();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showAllFindings, setShowAllFindings] = useState(false);
  const [showAllLowStock, setShowAllLowStock] = useState(false);

  const canRunReconciliation = hasRole(['admin', 'manager']);
  
  // ✅ Check if user can access quick actions (Viewer cannot)
  const canAccessActions = hasRole(['admin', 'manager', 'staff']);

  const getUsername = () => {
    if (user?.username) {
      return user.username;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  useEffect(() => {
    loadDashboardSummary();
    setLastUpdated(new Date().toLocaleString());
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardSummary();
    setLastUpdated(new Date().toLocaleString());
    setRefreshing(false);
  };

  const handleRunReconciliation = async () => {
    await runReconciliation();
    setLastUpdated(new Date().toLocaleString());
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'LOW': 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      'MEDIUM': 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      'HIGH': 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      'CRITICAL': 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    };
    return colors[severity] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
  };

  const getSeverityIcon = (severity) => {
    if (severity === 'LOW') return <AlertTriangle size={14} />;
    if (severity === 'MEDIUM') return <AlertTriangle size={14} />;
    if (severity === 'HIGH') return <AlertOctagon size={14} />;
    if (severity === 'CRITICAL') return <AlertOctagon size={14} />;
    return <AlertTriangle size={14} />;
  };

  const kpis = summary?.kpis || {};
  const lowStockItems = summary?.low_stock_panel || [];
  const findings = summary?.ai_findings_feed || [];

  const stats = [
    {
      title: 'Total Products',
      value: kpis.total_tracked_items || 0,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Low Stock Items',
      value: kpis.low_stock_count || 0,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      gradient: 'from-yellow-500 to-yellow-600',
    },
    {
      title: 'Negative Inventory',
      value: kpis.negative_inventory_count || 0,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      gradient: 'from-red-500 to-red-600',
    },
    {
      title: 'AI Findings',
      value: kpis.total_ai_findings || 0,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      gradient: 'from-purple-500 to-purple-600',
    },
  ];

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading AI Insights...</p>
        </div>
      </div>
    );
  }

  const displayedLowStockItems = showAllLowStock ? lowStockItems : lowStockItems.slice(0, 5);
  const hasMoreLowStock = lowStockItems.length > 5;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 text-white shadow-xl shadow-blue-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <Users size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                Welcome back, {getUsername()}! 👋
              </h2>
              <p className="text-blue-100 text-sm">
                {findings.length > 0 
                  ? `📊 You have ${findings.length} AI findings to review.` 
                  : '✅ All systems are looking good!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => navigate('/ai-chat')}
              className="px-5 py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl transition-all duration-200 flex items-center gap-2 border border-white/30 font-medium"
            >
              <MessageSquare size={18} />
              Ask AI Assistant
              <Sparkles size={14} className="text-yellow-300" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl transition border border-white/30"
            >
              <RefreshCw size={18} className={refreshing || loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        {lastUpdated && (
          <div className="relative z-10 mt-4 text-xs text-blue-200 flex items-center gap-2">
            <Clock size={14} />
            Last updated: {lastUpdated}
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-green-300">Live</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <stat.icon className={stat.color} size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                <AlertTriangle className="text-yellow-600" size={18} />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                Low Stock Items
              </h3>
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 px-2.5 py-0.5 rounded-full font-medium">
                {lowStockItems.length}
              </span>
            </div>
            {hasMoreLowStock && (
              <button
                onClick={() => setShowAllLowStock(!showAllLowStock)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition"
              >
                {showAllLowStock ? 'Show Less' : `View All (${lowStockItems.length})`}
                <ChevronRight size={16} className={showAllLowStock ? 'rotate-90' : ''} />
              </button>
            )}
          </div>

          {lowStockItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="text-green-600" size={36} />
              </div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">No low stock items</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">All products are above reorder point</p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayedLowStockItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-200 dark:border-yellow-800/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      <Package size={18} className="text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        SKU: {item.sku} • Warehouse #{item.warehouse_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                      {item.current_quantity}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Reorder: {item.reorder_point}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✅ Quick Actions - With Viewer Lock */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-4 flex items-center gap-2">
            <Zap className="text-yellow-500" size={20} />
            Quick Actions
          </h3>
          
          {canAccessActions ? (
            <div className="space-y-3">
              <button
                onClick={() => navigate('/receiving')}
                className="w-full p-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl transition-all duration-200 text-left flex items-center gap-3 shadow-lg shadow-emerald-500/20 hover:shadow-xl"
              >
                <Package size={20} />
                <div>
                  <p className="font-semibold">Receive Stock</p>
                  <p className="text-xs text-emerald-100">Add inventory to warehouse</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/transfers')}
                className="w-full p-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 text-left flex items-center gap-3 shadow-lg shadow-blue-500/20 hover:shadow-xl"
              >
                <Warehouse size={20} />
                <div>
                  <p className="font-semibold">Stock Transfer</p>
                  <p className="text-xs text-blue-100">Move inventory between warehouses</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/purchases')}
                className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 text-left flex items-center gap-3 shadow-lg shadow-purple-500/20 hover:shadow-xl"
              >
                <ShoppingCart size={20} />
                <div>
                  <p className="font-semibold">Purchase Order</p>
                  <p className="text-xs text-purple-100">Create new purchase order</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/sales')}
                className="w-full p-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl transition-all duration-200 text-left flex items-center gap-3 shadow-lg shadow-orange-500/20 hover:shadow-xl"
              >
                <ShoppingBag size={20} />
                <div>
                  <p className="font-semibold">Sales Order</p>
                  <p className="text-xs text-orange-100">Process customer orders</p>
                </div>
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                <Lock size={24} className="text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Quick Actions Unavailable
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Upgrade your role to access these features
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Contact your administrator
              </p>
            </div>
          )}
        </div>
      </div>

      {/* AI Findings Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <Activity className="text-purple-600" size={18} />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
              AI Findings
            </h3>
            <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-full font-medium">
              {findings.length}
            </span>
          </div>
          {findings.length > 3 && (
            <button
              onClick={() => setShowAllFindings(!showAllFindings)}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1"
            >
              {showAllFindings ? 'Show Less' : `View All (${findings.length})`}
              <ChevronRight size={16} className={showAllFindings ? 'rotate-90' : ''} />
            </button>
          )}
        </div>

        {findings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
              <Info className="text-gray-400" size={36} />
            </div>
            <p className="text-gray-600 dark:text-gray-400 font-medium">No AI findings yet</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {canRunReconciliation ? 'Run reconciliation to generate AI insights' : 'Check back later for AI insights'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {(showAllFindings ? findings : findings.slice(0, 3)).map((finding, index) => (
              <div
                key={index}
                className={`p-5 border rounded-xl transition-all duration-200 hover:shadow-md ${getSeverityColor(finding.severity)}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getSeverityColor(finding.severity)}`}>
                    {getSeverityIcon(finding.severity)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full ${getSeverityColor(finding.severity)}`}>
                        {finding.severity}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {finding.issue}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {finding.explanation}
                    </p>
                    {finding.possible_cause && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        <span className="font-medium">🔍 Possible Cause:</span> {finding.possible_cause}
                      </p>
                    )}
                    {finding.recommendation && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 flex items-start gap-1.5">
                        <span className="font-medium">💡 Recommendation:</span>
                        {finding.recommendation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDashboard;