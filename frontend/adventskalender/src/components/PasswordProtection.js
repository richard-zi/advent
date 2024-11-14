import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

const PasswordProtection = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const authData = localStorage.getItem('authData');
    if (!authData) return false;
    
    try {
      const { timestamp } = JSON.parse(authData);
      const now = new Date().getTime();
      const hoursSinceAuth = (now - timestamp) / (1000 * 60 * 60);
      return hoursSinceAuth < 24;
    } catch {
      return false;
    }
  });

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const correctPassword = 'BWICOE2024';

    if (password === correctPassword) {
      const authData = {
        timestamp: new Date().getTime()
      };
      localStorage.setItem('authData', JSON.stringify(authData));
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Falsches Passwort');
      setPassword('');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
          <div className="absolute top-4 right-4">
            <Lock className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Geschützter Bereich
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Bitte geben Sie das Passwort ein, um den Adventskalender zu sehen
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
  }

  return children;
};

export default PasswordProtection;