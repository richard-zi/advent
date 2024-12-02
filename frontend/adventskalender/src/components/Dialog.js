import React from 'react';
import { X } from 'lucide-react';

const Dialog = ({ isOpen, onClose, children, darkMode }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 sm:p-6" 
      onClick={onClose}
      style={{ zIndex: 100 }}
    >
      <div 
        className={`
          ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}
          rounded-2xl w-full max-w-6xl max-h-[90vh] shadow-2xl relative
          flex flex-col
          mx-auto
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className={`absolute top-4 right-4 ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} transition-colors duration-200 z-10`}
        >
          <X size={28} />
        </button>
        <div className={`
          overflow-y-auto flex-grow
          scrollbar-thin ${darkMode ? 'scrollbar-thumb-gray-600' : 'scrollbar-thumb-gray-400'} 
          scrollbar-track-transparent hover:scrollbar-thumb-opacity-100 scrollbar-thumb-rounded
          p-6 sm:p-10
        `}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Dialog;