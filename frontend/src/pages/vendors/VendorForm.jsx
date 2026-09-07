import  { useState, useEffect } from 'react';
import { useVendors } from '../../hooks/useVendors';
import { X } from 'lucide-react';

const VendorForm = ({ vendor, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    contact_info: '',
    address: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const { createVendor, updateVendor } = useVendors();

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || '',
        contact_info: vendor.contact_info || '',
        address: vendor.address || '',
      });
    }
  }, [vendor]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Vendor name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (vendor) {
        await updateVendor(vendor.id, formData);
      } else {
        await createVendor(formData);
      }
      onClose();
    } catch (error) {
      const msg = error.response?.data?.detail || 'Operation failed';
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          {vendor ? 'Edit Vendor' : 'Add New Vendor'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
        >
          <X size={24} className="text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Vendor Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-4 py-2 rounded-lg border ${
            errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
          } dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          placeholder="Enter vendor name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
      </div>

      {/* Contact Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Contact Info
        </label>
        <input
          type="text"
          name="contact_info"
          value={formData.contact_info}
          onChange={handleChange}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Phone or email"
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Address
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows="3"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter vendor address"
        />
      </div>

      {errors.submit && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg">
          {errors.submit}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
              {vendor ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            vendor ? 'Update Vendor' : 'Create Vendor'
          )}
        </button>
      </div>
    </form>
  );
};

export default VendorForm;