import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLogin from './AdminLogin';
import AdminPanel from './AdminPanel';

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setChecking(false);
      return;
    }

    try {
      await axios.get('http://localhost:5000/admin/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem('adminToken');
    } finally {
      setChecking(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    navigate('/admin');
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return isAuthenticated ? (
    <div>
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Logout
        </button>
      </div>
      <AdminPanel />
    </div>
  ) : (
    <AdminLogin onLogin={handleLogin} />
  );
};

export default Admin;