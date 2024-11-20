import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { AlertTriangle, Users } from 'lucide-react';

const Poll = ({ doorNumber, darkMode }) => {
  const [pollData, setPollData] = useState(() => {
    const saved = localStorage.getItem(`poll-data-${doorNumber}`);
    return saved ? JSON.parse(saved) : null;
  });
  const [votes, setVotes] = useState(() => {
    const saved = localStorage.getItem(`poll-votes-${doorNumber}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [userVote, setUserVote] = useState(() => {
    const saved = localStorage.getItem(`poll-user-vote-${doorNumber}`);
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(() => {
    const saved = localStorage.getItem(`poll-last-update-${doorNumber}`);
    return saved ? parseInt(saved) : 0;
  });

  const getUserId = useCallback(() => {
    let userId = localStorage.getItem('pollUserId');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('pollUserId', userId);
    }
    return userId;
  }, []);

  const fetchPollData = useCallback(async () => {
    try {
      const now = Date.now();
      // Only update every 5 minutes unless there's no data
      if (pollData && now - lastUpdate < 5 * 60 * 1000) {
        setLoading(false);
        return;
      }

      const userId = getUserId();
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/poll/${doorNumber}?userId=${userId}`
      );
      
      setPollData(response.data.pollData);
      setVotes(response.data.votes);
      setUserVote(response.data.userVote);
      
      // Cache the poll data
      localStorage.setItem(`poll-data-${doorNumber}`, JSON.stringify(response.data.pollData));
      localStorage.setItem(`poll-votes-${doorNumber}`, JSON.stringify(response.data.votes));
      localStorage.setItem(`poll-user-vote-${doorNumber}`, JSON.stringify(response.data.userVote));
      localStorage.setItem(`poll-last-update-${doorNumber}`, now.toString());
      setLastUpdate(now);
    } catch (error) {
      setError('Fehler beim Laden der Umfrage');
      // Use cached data if available
      const cachedData = localStorage.getItem(`poll-data-${doorNumber}`);
      const cachedVotes = localStorage.getItem(`poll-votes-${doorNumber}`);
      const cachedUserVote = localStorage.getItem(`poll-user-vote-${doorNumber}`);
      
      if (cachedData && cachedVotes && cachedUserVote) {
        setPollData(JSON.parse(cachedData));
        setVotes(JSON.parse(cachedVotes));
        setUserVote(JSON.parse(cachedUserVote));
      }
    } finally {
      setLoading(false);
    }
  }, [doorNumber, lastUpdate, pollData, getUserId]);

  useEffect(() => {
    fetchPollData();
    
    // Set up periodic refresh
    const intervalId = setInterval(fetchPollData, 5 * 60 * 1000); // Refresh every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [fetchPollData]);

  const handleVote = async (option) => {
    try {
      const userId = getUserId();
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/poll/${doorNumber}/vote`,
        {
          option,
          userId
        }
      );

      if (response.data.success) {
        setVotes(response.data.results);
        setUserVote(response.data.userVote);
        
        // Update cache
        localStorage.setItem(`poll-votes-${doorNumber}`, JSON.stringify(response.data.results));
        localStorage.setItem(`poll-user-vote-${doorNumber}`, JSON.stringify(response.data.userVote));
        localStorage.setItem(`poll-last-update-${doorNumber}`, Date.now().toString());
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError('Fehler beim Abstimmen');
    }
  };

  const calculatePercentage = useCallback((votes, option) => {
    const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
    return totalVotes === 0 ? 0 : Math.round((votes[option] || 0) / totalVotes * 100);
  }, []);

  const getTotalVotes = useCallback(() => {
    return Object.values(votes).reduce((a, b) => a + b, 0);
  }, [votes]);

  if (loading) {
    return (
      <div className={`text-center p-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Lade Umfrage...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 text-red-500 flex items-center justify-center gap-2">
        <AlertTriangle size={20} />
        <span>{error}</span>
      </div>
    );
  }

  const totalVotes = getTotalVotes();

  return (
    <div className="w-full max-w-lg mx-auto p-4 flex flex-col items-center">
      <div className={`
        mb-6 text-xl font-semibold text-center 
        ${darkMode ? 'text-gray-200' : 'text-gray-800'}
        max-w-[80%] mx-auto
      `}>
        {pollData?.question || "Was ist deine Meinung?"}
      </div>

      <div className="space-y-4 w-full">
        {pollData?.options.map((option) => {
          const percentage = calculatePercentage(votes, option);
          const voteCount = votes[option] || 0;
          const hasVoted = userVote !== null;
          const isSelected = userVote === option;

          return (
            <div
              key={option}
              className={`relative ${
                hasVoted ? 'cursor-default' : 'cursor-pointer hover:scale-[1.02]'
              } transition-transform duration-200`}
              onClick={() => !hasVoted && handleVote(option)}
            >
              <div className={`
                relative z-10 p-4 rounded-lg border 
                ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200'}
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
                ${!hasVoted && 'hover:border-blue-500'}
                overflow-hidden
              `}>
                <div className={`
                  absolute inset-0 transition-all duration-500
                  ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}
                `}
                style={{ width: `${percentage}%` }}
                />

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {option}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {voteCount} {voteCount === 1 ? 'Stimme' : 'Stimmen'}
                      </span>
                      <span className={`font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {percentage}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`mt-6 flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        <Users size={20} />
        <span>Gesamt: {totalVotes} {totalVotes === 1 ? 'Stimme' : 'Stimmen'}</span>
      </div>

      {error && (
        <div className="mt-4 text-red-500 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default Poll;