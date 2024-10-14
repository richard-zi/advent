import React from 'react';
import Dialog from './Dialog';

const SettingsModal = ({ isOpen, onClose }) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Einstellungen</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="background" className="block text-sm font-medium text-gray-700">
              Hintergrund
            </label>
            <select
              id="background"
              name="background"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option>Standard</option>
              <option>Weihnachtlich</option>
              <option>Winterlich</option>
            </select>
          </div>
          <div>
            <label htmlFor="doorStyle" className="block text-sm font-medium text-gray-700">
              Türchen-Stil
            </label>
            <select
              id="doorStyle"
              name="doorStyle"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option>Klassisch</option>
              <option>Modern</option>
              <option>Vintage</option>
            </select>
          </div>
          <div className="flex items-center">
            <input
              id="snowfall"
              name="snowfall"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="snowfall" className="ml-2 block text-sm text-gray-700">
              Schneefall-Effekt aktivieren
            </label>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default SettingsModal;