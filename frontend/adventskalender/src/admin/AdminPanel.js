import React, { useState, useEffect } from 'react';
import { Lock, Trash, RefreshCcw } from 'lucide-react';
import axios from 'axios';
import AdminDoorGrid from './AdminDoorGrid';
import AdminContentForm from './AdminContentForm';
import AdminDeleteDialog from './AdminDeleteDialog';

const AdminPanel = () => {
  // State Management
  const [doors, setDoors] = useState({});
  const [doorContents, setDoorContents] = useState({});
  const [pollContents, setPollContents] = useState({});
  const [selectedDoor, setSelectedDoor] = useState(null);
  const [uploadType, setUploadType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pollOptions, setPollOptions] = useState(['']);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [showCacheClearSuccess, setShowCacheClearSuccess] = useState(false);

  // Initial data fetching
  useEffect(() => {
    fetchDoors();
    fetchAllContents();
    fetchPollData();
  }, []);

  // Success message timer
  useEffect(() => {
    if (showCacheClearSuccess) {
      const timer = setTimeout(() => {
        setShowCacheClearSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showCacheClearSuccess]);

  const fetchDoors = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/api/doors`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setDoors(response.data || {});
    } catch (error) {
      setError('Failed to fetch doors');
      setDoors({});
    }
  };

  const fetchAllContents = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setDoorContents(response.data || {});
    } catch (error) {
      console.error('Failed to fetch contents:', error);
    }
  };

  const fetchPollData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/admin/api/polls`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      setPollContents(response.data || {});
    } catch (error) {
      console.error('Error fetching poll data:', error);
    }
  };

  // Cache Management
  const clearCache = async () => {
    setClearingCache(true);
    try {
      // Rufe den Backend-Endpoint auf
      await axios.post(
        `${process.env.REACT_APP_API_URL}/admin/api/clear-cache`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        }
      );

      // Lokalen Cache leeren
      const statesToKeep = {
        openDoors: localStorage.getItem('openDoors'),
        doorStates: localStorage.getItem('doorStates'),
        pollUserId: localStorage.getItem('pollUserId'),
        darkMode: localStorage.getItem('darkMode'),
        snowfall: localStorage.getItem('snowfall'),
        adminToken: localStorage.getItem('adminToken')
      };
      
      localStorage.clear();
      
      // Wichtige States wiederherstellen
      Object.entries(statesToKeep).forEach(([key, value]) => {
        if (value !== null) localStorage.setItem(key, value);
      });

      // Daten neu laden
      await Promise.all([
        fetchDoors(),
        fetchAllContents(),
        fetchPollData()
      ]);

      setShowCacheClearSuccess(true);
      setError('');
    } catch (err) {
      setError('Error clearing cache');
    } finally {
      setClearingCache(false);
    }
  };

  // Content Management
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handlePollOptionAdd = () => {
    setPollOptions([...pollOptions, '']);
  };

  const handlePollOptionRemove = (index) => {
    setPollOptions(pollOptions.filter((_, i) => i !== index));
  };

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const handleDeleteContent = async () => {
    if (!selectedDoor) return;

    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/admin/api/content/${selectedDoor}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      
      setFile(null);
      setTextContent('');
      setMessage('');
      setPollOptions(['']);
      setShowDeleteConfirm(false);
      
      setDoors(prev => {
        const newDoors = { ...prev };
        delete newDoors[selectedDoor];
        return newDoors;
      });
      
      setDoorContents(prev => {
        const newContents = { ...prev };
        delete newContents[selectedDoor];
        return newContents;
      });
      
      setError('Content deleted successfully!');
      await fetchPollData();
    } catch (error) {
      setError(error.response?.data?.error || 'Delete failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDoor) {
      setError('Please select a door');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('type', uploadType);
    
    if (uploadType === 'text') {
      formData.append('content', textContent);
    } else if (uploadType === 'iframe') {
      formData.append('content', textContent);
    } else if (uploadType === 'poll') {
      formData.append('content', JSON.stringify({
        question: textContent,
        options: pollOptions.filter(opt => opt.trim() !== '')
      }));
    } else if (file) {
      formData.append('file', file);
    }

    if (message) {
      formData.append('message', message);
    }

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/admin/api/upload/${selectedDoor}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setFile(null);
      setTextContent('');
      setMessage('');
      setPollOptions(['']);
      await Promise.all([fetchDoors(), fetchAllContents(), fetchPollData()]);
      setError('Content uploaded successfully!');
    } catch (error) {
      setError(error.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {showDeleteConfirm && (
        <AdminDeleteDialog 
          selectedDoor={selectedDoor}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteContent}
        />
      )}
      
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Advent Calendar Admin</h1>
          <div className="flex items-center gap-4">
            {/* Cache Clear Button */}
            <button
              onClick={clearCache}
              disabled={clearingCache}
              className={`
                flex items-center gap-2 px-4 py-2 text-white 
                rounded-md transition-colors
                ${clearingCache 
                  ? 'bg-orange-300 cursor-not-allowed' 
                  : 'bg-orange-500 hover:bg-orange-600'}
              `}
            >
              {clearingCache ? (
                <RefreshCcw size={16} className="animate-spin" />
              ) : (
                <Trash size={16} />
              )}
              {clearingCache ? 'Clearing...' : 'Clear Cache'}
            </button>
            <Lock className="text-gray-500" />
          </div>
        </div>

        {/* Success Message */}
        {showCacheClearSuccess && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            Cache cleared successfully!
          </div>
        )}

        <AdminDoorGrid 
          doors={doors}
          doorContents={doorContents}
          pollContents={pollContents}
          selectedDoor={selectedDoor}
          onDoorSelect={setSelectedDoor}
        />

        {selectedDoor && (
          <AdminContentForm 
            selectedDoor={selectedDoor}
            doors={doors}
            doorContents={doorContents}
            uploadType={uploadType}
            textContent={textContent}
            message={message}
            pollOptions={pollOptions}
            loading={loading}
            error={error}
            onUploadTypeChange={setUploadType}
            onTextContentChange={setTextContent}
            onMessageChange={setMessage}
            onFileChange={handleFileChange}
            onPollOptionAdd={handlePollOptionAdd}
            onPollOptionRemove={handlePollOptionRemove}
            onPollOptionChange={handlePollOptionChange}
            onDeleteClick={() => setShowDeleteConfirm(true)}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPanel;