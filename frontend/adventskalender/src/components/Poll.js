import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AlertTriangle, Users } from 'lucide-react';

const Poll = ({ doorNumber, darkMode }) => {
  const [pollData, setPollData] = useState(null);
  const [votes, setVotes] = useState({});
  const [userVote, setUserVote] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const getUserId = () => {
    let userId = localStorage.getItem('pollUserId');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('pollUserId', userId);
    }
    return userId;
  };

  const fetchPollData = useCallback(async () => {
    try {
      const userId = getUserId();
      const response = await axios.get(`http://localhost:5000/api/poll/${doorNumber}?userId=${userId}`);
      setPollData(response.data.pollData);
      setVotes(response.data.votes);
      setUserVote(response.data.userVote);
    } catch (error) {
      setError('Fehler beim Laden der Umfrage');
    } finally {
      setLoading(false);
    }
  }, [doorNumber]);

  useEffect(() => {
    fetchPollData();
  }, [fetchPollData]);

  const handleVote = async (option) => {
    try {
      const userId = getUserId();
      const response = await axios.post(`http://localhost:5000/api/poll/${doorNumber}/vote`, {
        option,
        userId
      });

      if (response.data.success) {
        setVotes(response.data.results);
        setUserVote(response.data.userVote);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError('Fehler beim Abstimmen');
    }
  };

  const calculatePercentage = (votes, option) => {
    const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
    return totalVotes === 0 ? 0 : Math.round((votes[option] || 0) / totalVotes * 100);
  };

  const getTotalVotes = () => {
    return Object.values(votes).reduce((a, b) => a + b, 0);
  };

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
                {/* Progress Bar Background */}
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
    </div>
  );
};

export default Poll;