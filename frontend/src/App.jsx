
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./routes/protectedRoute";
import Layout from "./components/Layout";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Profile
import Profile from "./pages/profile/Profile";

// Products
import Products from "./pages/products/Products";
import ProductDetails from "./pages/products/ProductDetails";

// Vendors
import Vendors from "./pages/vendors/Vendors";
import VendorDetails from "./pages/vendors/VendorDetails";

// Warehouses
import Warehouses from "./pages/warehouses/Warehouses";
import WarehouseDetails from "./pages/warehouses/WarehouseDetails";

// Stock Transfers
import Transfers from "./pages/transfers/Transfers";
import TransferDetails from "./pages/transfers/TransferDetails";

// Purchase Orders
import PurchaseOrders from "./pages/purchases/PurchaseOrders";
import PurchaseOrderDetails from "./pages/purchases/PurchaseOrderDetails";

// Sales Orders
import SalesOrders from "./pages/sales/SalesOrders";
import SalesOrderDetails from "./pages/sales/SalesOrderDetails";

// Adjustments
import Adjustments from "./pages/adjustments/Adjustments";
import AdjustmentDetails from "./pages/adjustments/AdjustmentDetails";

// Stock Receiving
import StockReceiving from "./pages/receiving/StockReceiving";
import MovementHistory from "./pages/receiving/MovementHistory";

// Audit Logs
import AuditLogs from "./pages/audits/AuditLogs";

// Reconciliation
import Reconciliation from "./pages/reconciliation/Reconciliation";

import AdminPanel from "./pages/admin/AdminPannel";

// AI
import AIDashboard from "./pages/ai/AIDashboard";
import AIChat from "./pages/ai/AIChat";
import AIChatFloat from "./components/AIChatFloat";

// Unauthorized Page
const Unauthorized = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-red-500">403</h1>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mt-4">
        Unauthorized Access
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mt-2">
        You don't have permission to view this page
      </p>
      <a
        href="/ai-dashboard"
        className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline"
      >
        Go back to Dashboard
      </a>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes with Layout and Chat Float */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <>
                  <Layout />
                  <AIChatFloat />
                </>
              </ProtectedRoute>
            }
          >
            {/* ✅ Default redirect to AI Dashboard */}
            <Route index element={<Navigate to="/ai-dashboard" replace />} />

            {/* Profile */}
            <Route path="profile" element={<Profile />} />

            {/* ✅ AI Dashboard - Now the main dashboard */}
            <Route path="ai-dashboard" element={<AIDashboard />} />

            {/* Products */}
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetails />} />

            {/* Vendors */}
            <Route path="vendors" element={<Vendors />} />
            <Route path="vendors/:id" element={<VendorDetails />} />

            {/* Warehouses */}
            <Route path="warehouses" element={<Warehouses />} />
            <Route path="warehouses/:id" element={<WarehouseDetails />} />

            {/* Stock Transfers */}
            <Route path="transfers" element={<Transfers />} />
            <Route path="transfers/:id" element={<TransferDetails />} />

            {/* Purchase Orders */}
            <Route path="purchases" element={<PurchaseOrders />} />
            <Route path="purchases/:id" element={<PurchaseOrderDetails />} />

            {/* Sales Orders */}
            <Route path="sales" element={<SalesOrders />} />
            <Route path="sales/:id" element={<SalesOrderDetails />} />

            {/* Adjustments */}
            <Route path="adjustments" element={<Adjustments />} />
            <Route path="adjustments/:id" element={<AdjustmentDetails />} />

            {/* Stock Receiving */}
            <Route path="receiving" element={<StockReceiving />} />
            <Route path="movements" element={<MovementHistory />} />

            {/* AI Chat */}
            <Route path="ai-chat" element={<AIChat />} />

            {/* Audit Logs - Manager+ Only */}
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager"]}>
                  <AuditLogs />
                </ProtectedRoute>
              }
            />

            {/* Reconciliation - Manager+ Only */}
            <Route
              path="reconciliation"
              element={
                <ProtectedRoute allowedRoles={["admin", "manager"]}>
                  <Reconciliation />
                </ProtectedRoute>
              }
            />

            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/ai-dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
