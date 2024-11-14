import React, { useState, useEffect } from 'react';
import { Lock, X } from 'lucide-react';

const PasswordProtection = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });
  const [showPopup, setShowPopup] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setShowPopup(true);
    }
  }, [isAuthenticated]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Hier können Sie das Passwort anpassen
    const correctPassword = 'BWICOE2024';

    if (password === correctPassword) {
      setIsAuthenticated(true);
      localStorage.setItem('isAuthenticated', 'true');
      setShowPopup(false);
      setError('');
    } else {
      setError('Falsches Passwort');
      setPassword('');
    }
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <div className="absolute top-4 right-4">
          <Lock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Geschützter Bereich
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Bitte geben Sie das Passwort ein, um fortzufahren
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort eingeben"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              autoFocus
            />
          </div>

          {error && (
            <div className="text-red-500 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 
                     rounded-md transition-colors duration-200"
          >
            Zugang bestätigen
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordProtection;