import { useState, useEffect } from 'react';
import axios from 'axios';

const CACHE_CHECK_INTERVAL = 30000; // Alle 30 Sekunden prüfen

export const useCache = () => {
  const [lastCacheCheck, setLastCacheCheck] = useState(Date.now());

  const checkCacheValidity = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/api/cache-timestamp`);
      const serverTimestamp = response.data.timestamp;

      // Wenn der Server-Timestamp neuer ist als unser letzter Check
      if (serverTimestamp > lastCacheCheck) {
        // Cache leeren, aber wichtige Daten behalten
        const statesToKeep = {
          openDoors: localStorage.getItem('openDoors'),
          doorStates: localStorage.getItem('doorStates'),
          pollUserId: localStorage.getItem('pollUserId'),
          darkMode: localStorage.getItem('darkMode'),
          snowfall: localStorage.getItem('snowfall')
        };
        
        localStorage.clear();
        
        // Wichtige States wiederherstellen
        Object.entries(statesToKeep).forEach(([key, value]) => {
          if (value !== null) localStorage.setItem(key, value);
        });

        setLastCacheCheck(Date.now());
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking cache validity:', error);
      return false;
    }
  };

  useEffect(() => {
    const interval = setInterval(checkCacheValidity, CACHE_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return { checkCacheValidity };
};