// src/components/Dialog.js
import React from 'react';
import { X } from 'lucide-react';

const Dialog = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 sm:p-6" 
      onClick={onClose} // Close dialog when clicking outside the content area
    >
      <div 
        className="bg-white rounded-2xl max-w-full sm:max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-10 relative"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the content area
      >
        {/* Close button for the dialog */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors duration-200"
        >
          <X size={28} />
        </button>
        {children}
      </div>
    </div>
  );
};

export default Dialog;