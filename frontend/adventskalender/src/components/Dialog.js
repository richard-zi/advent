// src/components/Dialog.js
import React from 'react';
import { X } from 'lucide-react';

const Dialog = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-6">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-10">
        <div className="relative">
          <button 
            onClick={onClose} 
            className="absolute top-0 right-0 text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <X size={28} />
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Dialog;