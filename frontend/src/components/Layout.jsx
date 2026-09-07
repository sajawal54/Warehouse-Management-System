import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useRole } from "../hooks/useRole";
import {
  LogOut,
  Menu,
  X,
  Shield,
  Package,
  Users,
  Warehouse,
  ShoppingCart,
  Truck,
  ClipboardList,
  Settings,
  FileText,
  Activity,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Scale,
  History,
  Building2,
  ShoppingBag,
  Sparkles,
  UserCircle,
  ChevronDown as ChevronDownIcon,
  LayoutDashboard,
  Home,
  Bell,
  Search,
} from "lucide-react";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedModules, setExpandedModules] = useState({
    inventory: true,
    orders: false,
    analytics: false,
  });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { user, logout } = useAuth();
  const { isAdmin, isManager, isStaff, hasRole } = useRole();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const toggleModule = (module) => {
    setExpandedModules((prev) => ({
      ...prev,
      [module]: !prev[module],
    }));
  };

  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const getUsername = () => {
    if (user?.username) {
      return user.username;
    }
    if (user?.email) {
      return user.email.split("@")[0];
    }
    return "User";
  };

  const getInitials = () => {
    const name = getUsername();
    return name.charAt(0).toUpperCase();
  };

  const navModules = [
    {
      name: "AI Dashboard",
      icon: Activity,
      path: "/ai-dashboard",
      show: true,
      isModule: false,
      badge: "AI",
      badgeColor: "bg-purple-500",
    },
    {
      name: "Inventory",
      icon: Package,
      isModule: true,
      show: true,
      items: [
        { name: "Products", icon: Package, path: "/products", show: true },
        { name: "Vendors", icon: Building2, path: "/vendors", show: true },
        {
          name: "Warehouses",
          icon: Warehouse,
          path: "/warehouses",
          show: true,
        },
        {
          name: "Receive Stock",
          icon: Truck,
          path: "/receiving",
          show: isStaff || isManager || isAdmin,
        },
        {
          name: "Stock Transfers",
          icon: ClipboardList,
          path: "/transfers",
          show: isStaff || isManager || isAdmin,
        },
        {
          name: "Adjustments",
          icon: Settings,
          path: "/adjustments",
          show: isStaff || isManager || isAdmin,
        },
        {
          name: "Movement History",
          icon: History,
          path: "/movements",
          show: true,
        },
      ],
    },
    {
      name: "Orders",
      icon: ShoppingCart,
      isModule: true,
      show: isStaff || isManager || isAdmin,
      items: [
        {
          name: "Purchase Orders",
          icon: ShoppingCart,
          path: "/purchases",
          show: isStaff || isManager || isAdmin,
        },
        {
          name: "Sales Orders",
          icon: ShoppingBag,
          path: "/sales",
          show: isStaff || isManager || isAdmin,
        },
      ],
    },
    {
      name: "Analytics",
      icon: Activity,
      isModule: true,
      show: true,
      items: [
        { name: "AI Chat", icon: MessageSquare, path: "/ai-chat", show: true },
        {
          name: "Reconciliation",
          icon: Scale,
          path: "/reconciliation",
          show: isManager || isAdmin,
        },
        {
          name: "Audit Logs",
          icon: Shield,
          path: "/audit-logs",
          show: isManager || isAdmin,
        },
      ],
    },
    {
      name: "Admin Panel",
      icon: Shield,
      path: "/admin",
      show: isAdmin,
      isModule: false,
      badge: "ADMIN",
      badgeColor: "bg-red-500",
    },
  ];

  const visibleModules = navModules.filter((module) => module.show);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200"
        aria-label="Toggle Sidebar"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-70 sm:w-75 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 border-r border-gray-100 dark:border-gray-700/50`}
      >
        {/* ✅ FIXED SCROLLBAR - Custom styled, clean and thin */}
        <style>{`
          /* Custom scrollbar for sidebar */
          .sidebar-scroll::-webkit-scrollbar {
            width: 3px;
          }
          .sidebar-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
          .dark .sidebar-scroll::-webkit-scrollbar-thumb {
            background: #475569;
          }
          .dark .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: #64748b;
          }
          /* Firefox scrollbar */
          .sidebar-scroll {
            scrollbar-width: thin;
            scrollbar-color: #cbd5e1 transparent;
          }
          .dark .sidebar-scroll {
            scrollbar-color: #475569 transparent;
          }
        `}</style>

        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-700/50">
            <Link to="/ai-dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-lg sm:text-xl">
                  W
                </span>
              </div>
              <div>
                <span className="text-lg sm:text-xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  WMS
                </span>
                <span className="block text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                  Warehouse Management
                </span>
              </div>
            </Link>
          </div>

          {/* Profile Section */}
          <Link
            to="/profile"
            className="mx-3 sm:mx-4 mt-3 sm:mt-4 p-3 sm:p-4 rounded-2xl bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100/50 dark:border-blue-800/30 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all duration-300 group cursor-pointer shadow-sm hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                  {getInitials()}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-800 shadow-sm shadow-emerald-500/30"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition duration-200">
                  {getUsername()}
                </p>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
                  <span
                    className={`inline-block px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold rounded-full uppercase tracking-wide ${
                      user?.role === "admin"
                        ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                        : user?.role === "manager"
                          ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                          : user?.role === "staff"
                            ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {user?.role || "Viewer"}
                  </span>
                  <Sparkles size={11} className="text-yellow-500" />
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-white/60 dark:bg-gray-700/60 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition group-hover:bg-white dark:group-hover:bg-gray-600">
                <UserCircle size={16} />
              </div>
            </div>
          </Link>

          {/* ✅ Navigation - Added sidebar-scroll class */}
          <nav className="flex-1 overflow-y-auto p-3 sm:p-4 mt-1 space-y-1 sidebar-scroll">
            {visibleModules.map((module) => (
              <div key={module.name}>
                {module.isModule ? (
                  <div>
                    <button
                      onClick={() => toggleModule(module.name.toLowerCase())}
                      className={`flex items-center justify-between w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl transition-all duration-200 text-sm ${
                        expandedModules[module.name.toLowerCase()]
                          ? "bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-300 font-medium"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <module.icon size={17} className="shrink-0" />
                        <span className="text-xs sm:text-sm font-medium">
                          {module.name}
                        </span>
                      </div>
                      {expandedModules[module.name.toLowerCase()] ? (
                        <ChevronDown size={15} className="text-gray-400" />
                      ) : (
                        <ChevronRight size={15} className="text-gray-400" />
                      )}
                    </button>

                    {expandedModules[module.name.toLowerCase()] && (
                      <div className="ml-3 sm:ml-4 mt-1 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-700 pl-2 sm:pl-3">
                        {module.items.map(
                          (item) =>
                            item.show && (
                              <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all duration-200 ${
                                  isActive(item.path)
                                    ? "bg-linear-to-r from-blue-500/10 to-purple-500/10 text-blue-700 dark:text-blue-300 font-medium"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                }`}
                                onClick={() => setSidebarOpen(false)}
                              >
                                <item.icon
                                  size={14}
                                  className="shrink-0 opacity-70"
                                />
                                <span>{item.name}</span>
                              </Link>
                            ),
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={module.path}
                    className={`flex items-center gap-3 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl transition-all duration-200 text-sm ${
                      isActive(module.path)
                        ? "bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <module.icon size={17} className="shrink-0" />
                    <span className="text-xs sm:text-sm font-medium">
                      {module.name}
                    </span>
                    {module.badge && (
                      <span
                        className={`ml-auto text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full text-white ${module.badgeColor}`}
                      >
                        {module.badge}
                      </span>
                    )}
                    {module.name === "AI Dashboard" && (
                      <Sparkles size={13} className="ml-auto text-yellow-300" />
                    )}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-3 sm:p-4 border-t border-gray-100 dark:border-gray-700/50">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 sm:px-3.5 sm:py-2.5 w-full rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 group text-sm"
            >
              <LogOut
                size={17}
                className="group-hover:rotate-12 transition-transform duration-300"
              />
              <span className="text-xs sm:text-sm font-medium">Logout</span>
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-t border-gray-100 dark:border-gray-700/50">
            <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 text-center font-medium tracking-wider">
              © {new Date().getFullYear()} WMS • v2.0
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content with Header */}
      <div className="flex-1 lg:ml-70 min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-2.5 sm:py-3.5">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
                <h2 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800 dark:text-white tracking-wide truncate">
                  🏢 Maintain Your Business
                </h2>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                <span className="text-[8px] sm:text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Live
                </span>
                <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="hidden sm:block text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-medium truncate max-w-20 md:max-w-none">
                {location.pathname.split("/").filter(Boolean).pop() ||
                  "Dashboard"}
              </span>

              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-1.5 sm:gap-2.5 px-2 sm:px-3.5 py-1.5 sm:py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-all duration-200 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 group"
                >
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-[10px] sm:text-xs shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
                    {getInitials()}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                    {getUsername()}
                  </span>
                  <ChevronDownIcon
                    size={14}
                    className="text-gray-400 group-hover:text-blue-500 transition-colors"
                  />
                </button>

                {profileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileDropdownOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-52 sm:w-60 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                      <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/20">
                            {getInitials()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {getUsername()}
                            </p>
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate max-w-30 sm:max-w-37.5">
                              {user?.email || ""}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-block mt-1.5 px-2 py-0.5 text-[8px] sm:text-[10px] font-semibold rounded-full uppercase tracking-wide ${
                            user?.role === "admin"
                              ? "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300"
                              : user?.role === "manager"
                                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
                                : user?.role === "staff"
                                  ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {user?.role || "Viewer"}
                        </span>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition text-gray-700 dark:text-gray-300 text-sm"
                      >
                        <UserCircle size={16} />
                        <span className="text-xs sm:text-sm font-medium">
                          Profile Settings
                        </span>
                      </Link>
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 w-full hover:bg-red-50 dark:hover:bg-red-900/20 transition text-red-600 dark:text-red-400 border-t border-gray-100 dark:border-gray-700 text-sm"
                      >
                        <LogOut size={16} />
                        <span className="text-xs sm:text-sm font-medium">
                          Logout
                        </span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;