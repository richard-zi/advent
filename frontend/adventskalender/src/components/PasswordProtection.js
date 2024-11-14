import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import axios from 'axios';

const PasswordProtection = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [systemTheme, setSystemTheme] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => setSystemTheme(e.matches);
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('siteToken');
      
      if (!token) {
        setIsChecking(false);
        return;
      }

      try {
        await axios.get(`${process.env.REACT_APP_API_URL}/admin/validate-token`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('siteToken');
      } finally {
        setIsChecking(false);
      }
    };

    validateToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/admin/verify-password`, {
        password
      });

      if (response.data.success) {
        localStorage.setItem('siteToken', response.data.token);
        setIsAuthenticated(true);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Falsches Passwort');
      setPassword('');
    }
  };

  if (isChecking) {
    return (
      <div className={`fixed inset-0 flex items-center justify-center ${
        systemTheme ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        Laden...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`fixed inset-0 flex items-center justify-center p-4 z-50 ${
        systemTheme ? 'bg-gray-900' : 'bg-gray-100'
      }`}>
        <div className={`rounded-lg shadow-xl max-w-md w-full p-6 relative ${
          systemTheme ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="absolute top-4 right-4">
            <Lock className={`w-6 h-6 ${
              systemTheme ? 'text-gray-500' : 'text-gray-400'
            }`} />
          </div>
          
          <div className="text-center mb-6">
            <h2 className={`text-2xl font-bold mb-2 ${
              systemTheme ? 'text-white' : 'text-gray-900'
            }`}>
              Geschützter Bereich
            </h2>
            <p className={`${
              systemTheme ? 'text-gray-400' : 'text-gray-600'
            }`}>
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
                className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  systemTheme 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
                autoFocus
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">
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