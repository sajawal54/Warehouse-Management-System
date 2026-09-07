import { useAuth } from '../contexts/AuthContext';

export const useRole = () => {
  const { user, hasRole, userRole } = useAuth();

  return {
    userRole,
    isAdmin: hasRole('admin'),
    isManager: hasRole(['admin', 'manager']),
    isStaff: hasRole(['admin', 'manager', 'staff']),
    isViewer: true,
    hasRole,
    canManageProducts: hasRole(['admin', 'manager']),
    canManageVendors: hasRole(['admin', 'manager']),
    canManageWarehouses: hasRole(['admin', 'manager']),
    canManageStock: hasRole(['admin', 'manager', 'staff']),
    canViewAuditLogs: hasRole(['admin', 'manager']),
  };
};