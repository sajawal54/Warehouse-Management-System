import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVendors } from '../../hooks/useVendors';
import { useRole } from '../../hooks/useRole';
import { ArrowLeft, Building2, Phone, MapPin, Edit, Trash2 } from 'lucide-react';

const VendorDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getVendor, deleteVendor } = useVendors();
  const { hasRole } = useRole();
  
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const canEdit = hasRole(['admin', 'manager']);
  const canDelete = hasRole(['admin']);

  useEffect(() => {
    const loadVendor = async () => {
      try {
        const data = await getVendor(id);
        setVendor(data);
      } catch (err) {
        setError('Vendor not found');
      } finally {
        setLoading(false);
      }
    };
    loadVendor();
  }, [id, getVendor]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this vendor?')) {
      await deleteVendor(id);
      navigate('/vendors');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto text-gray-400" size={48} />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mt-4">Vendor Not Found</h2>
        <button
          onClick={() => navigate('/vendors')}
          className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          Go back to vendors
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <button
        onClick={() => navigate('/vendors')}
        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6 transition"
      >
        <ArrowLeft size={20} />
        Back to Vendors
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Building2 className="text-blue-600 dark:text-blue-400" size={32} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{vendor.name}</h1>
              <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                vendor.is_active 
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                {vendor.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          {(canEdit || canDelete) && (
            <div className="flex gap-2">
              {canEdit && (
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2">
                  <Edit size={18} />
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Phone size={16} />
              Contact Info
            </p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white mt-1">
              {vendor.contact_info || 'N/A'}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <MapPin size={16} />
              Address
            </p>
            <p className="text-lg font-semibold text-gray-800 dark:text-white mt-1">
              {vendor.address || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDetails;