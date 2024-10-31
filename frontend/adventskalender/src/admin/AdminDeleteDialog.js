import { AlertTriangle } from 'lucide-react';

const AdminDeleteDialog = ({ selectedDoor, onCancel, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="flex items-center mb-4">
          <AlertTriangle className="text-red-500 mr-2" size={24} />
          <h3 className="text-lg font-semibold">Confirm Deletion</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete the content for door {selectedDoor}? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDeleteDialog;