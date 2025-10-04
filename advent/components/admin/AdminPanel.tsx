'use client';

import { useState, useEffect } from 'react';
import { Settings, Upload, Calendar, Eye, LogOut, Save, Sparkles, Trash2, FileText, Image as ImageIcon, Video, Music, Repeat, PieChart, Link as LinkIcon } from 'lucide-react';

interface AdminPanelProps {
  onLogout: () => void;
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'doors' | 'settings'>('doors');
  const [settings, setSettings] = useState({
    startDate: '',
    title: '',
    description: '',
  });
  const [selectedDoor, setSelectedDoor] = useState<number>(1);
  const [doors, setDoors] = useState<any[]>([]);
  const [previewContent, setPreviewContent] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState<string>('text');
  const [textContent, setTextContent] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [iframeUrl, setIframeUrl] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Reset form when door selection changes
    resetForm();
  }, [selectedDoor]);

  const loadData = async () => {
    const token = localStorage.getItem('adminToken');

    // Load settings
    try {
      const settingsRes = await fetch('/api/admin/settings', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }

    // Load doors - use the main API endpoint that includes full content info
    try {
      const doorsRes = await fetch('/api');
      if (doorsRes.ok) {
        const data = await doorsRes.json();
        setDoors(Object.entries(data).map(([key, value]: [string, any]) => ({
          ...value,
          day: parseInt(key)
        })));
      }
    } catch (error) {
      console.error('Error loading doors:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert('✅ Einstellungen gespeichert!');
      }
    } catch (error) {
      alert('❌ Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadContent = async () => {
    setUploading(true);
    const token = localStorage.getItem('adminToken');

    try {
      const formData = new FormData();
      formData.append('doorNumber', selectedDoor.toString());
      formData.append('contentType', selectedContentType);

      if (selectedContentType === 'text') {
        formData.append('text', textContent);
      } else if (selectedContentType === 'poll') {
        formData.append('pollQuestion', pollQuestion);
        formData.append('pollOptions', JSON.stringify(pollOptions.filter(o => o.trim())));
      } else if (selectedContentType === 'iframe') {
        formData.append('iframeUrl', iframeUrl);
      } else if (selectedContentType === 'countdown') {
        // No additional data needed
      } else if (file) {
        formData.append('file', file);
      }

      if (messageContent && selectedContentType !== 'text') {
        formData.append('text', messageContent);
      }

      const response = await fetch('/api/admin/doors/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert('✅ Inhalt hochgeladen!');
        resetForm();
        await loadData();
      } else {
        const data = await response.json();
        alert(`❌ Fehler: ${data.error}`);
      }
    } catch (error) {
      alert('❌ Fehler beim Hochladen');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteContent = async () => {
    if (!confirm('Möchtest du den Inhalt wirklich löschen?')) return;

    const token = localStorage.getItem('adminToken');
    try {
      const response = await fetch(`/api/admin/doors/${selectedDoor}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('✅ Inhalt gelöscht!');
        await loadData();
      }
    } catch (error) {
      alert('❌ Fehler beim Löschen');
    }
  };

  const resetForm = () => {
    setTextContent('');
    setMessageContent('');
    setFile(null);
    setPollQuestion('');
    setPollOptions(['', '']);
    setIframeUrl('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-yellow-400" />
              Admin Dashboard
            </h1>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/50 rounded-lg text-white transition-all hover:scale-105"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('doors')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all transform hover:scale-105 ${
              activeTab === 'doors'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50 text-white'
                : 'bg-white/10 border border-white/20 text-white/70 hover:bg-white/15'
            }`}
          >
            <Upload className="w-5 h-5" />
            Türchen verwalten
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all transform hover:scale-105 ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-purple-500/50 text-white'
                : 'bg-white/10 border border-white/20 text-white/70 hover:bg-white/15'
            }`}
          >
            <Settings className="w-5 h-5" />
            Einstellungen
          </button>
        </div>

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
              <Settings className="w-8 h-8 text-yellow-400" />
              Kalender-Einstellungen
            </h2>

            <div className="space-y-8">
              {/* Start Date */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <label className="block text-white text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-6 h-6 text-green-400" />
                  Startdatum (1. Türchen)
                </label>
                <input
                  type="date"
                  value={settings.startDate}
                  onChange={(e) => setSettings({ ...settings, startDate: e.target.value })}
                  className="w-full px-5 py-4 bg-white/10 border-2 border-white/30 rounded-xl text-white text-lg focus:outline-none focus:border-pink-400 transition-colors"
                />
                <p className="text-white/60 text-sm mt-3 leading-relaxed">
                  📅 Türchen 1 wird an diesem Datum freigeschaltet. Jedes weitere Türchen öffnet sich einen Tag später.
                </p>
              </div>

              {/* Title */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <label className="block text-white text-lg font-semibold mb-3">Titel</label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  className="w-full px-5 py-4 bg-white/10 border-2 border-white/30 rounded-xl text-white text-lg focus:outline-none focus:border-pink-400 transition-colors"
                  placeholder="Adventskalender 2024"
                />
              </div>

              {/* Description */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <label className="block text-white text-lg font-semibold mb-3">Beschreibung</label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  rows={4}
                  className="w-full px-5 py-4 bg-white/10 border-2 border-white/30 rounded-xl text-white text-lg focus:outline-none focus:border-pink-400 transition-colors resize-none"
                  placeholder="Öffne jeden Tag ein neues Türchen..."
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-6 h-6" />
                {saving ? 'Speichert...' : 'Einstellungen speichern'}
              </button>
            </div>
          </div>
        )}

        {/* Doors Tab */}
        {activeTab === 'doors' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Door Selector */}
            <div className="xl:col-span-1">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-5">Türchen auswählen</h3>
                <div className="grid grid-cols-4 gap-3">
                  {Array.from({ length: 24 }, (_, i) => i + 1).map((day) => {
                    const door = doors.find((d) => d.day === day);
                    const hasContent = door?.type && door.type !== 'not available yet';

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDoor(day)}
                        className={`aspect-square rounded-xl flex items-center justify-center text-lg font-bold transition-all transform hover:scale-110 ${
                          selectedDoor === day
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-110'
                            : hasContent
                            ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-2 border-green-400/60 text-green-200 hover:border-green-300'
                            : 'bg-white/5 border-2 border-white/20 text-white/50 hover:bg-white/10 hover:border-white/40'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="xl:col-span-2">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1 rounded-lg">
                      Türchen {selectedDoor}
                    </span>
                  </h3>
                  {doors.find((d) => d.day === selectedDoor)?.type && doors.find((d) => d.day === selectedDoor)?.type !== 'not available yet' && (
                    <button
                      onClick={() => setPreviewContent(doors.find((d) => d.day === selectedDoor))}
                      className="flex items-center gap-2 px-5 py-3 bg-blue-500/20 border-2 border-blue-400/50 rounded-xl text-blue-300 hover:bg-blue-500/30 transition-all hover:scale-105"
                    >
                      <Eye className="w-5 h-5" />
                      Vorschau
                    </button>
                  )}
                </div>

                {/* Current Content Info */}
                {doors.find((d) => d.day === selectedDoor)?.type && doors.find((d) => d.day === selectedDoor)?.type !== 'not available yet' ? (
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 rounded-xl p-6 mb-6">
                    <p className="text-green-300 font-semibold text-lg mb-2">✅ Inhalt vorhanden</p>
                    <p className="text-white/80">Typ: <span className="font-bold text-yellow-300">{doors.find((d) => d.day === selectedDoor)?.type}</span></p>
                  </div>
                ) : (
                  <div className="bg-white/5 border-2 border-white/20 rounded-xl p-8 text-center mb-6">
                    <Upload className="w-16 h-16 mx-auto mb-4 text-white/30" />
                    <p className="text-white/50 text-lg">Noch kein Inhalt vorhanden</p>
                  </div>
                )}

                {/* Content Type Selector */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                  <label className="block text-white text-lg font-semibold mb-4">Content-Typ auswählen</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { type: 'text', label: 'Text', icon: FileText },
                      { type: 'image', label: 'Bild', icon: ImageIcon },
                      { type: 'video', label: 'Video', icon: Video },
                      { type: 'audio', label: 'Audio', icon: Music },
                      { type: 'gif', label: 'GIF', icon: Repeat },
                      { type: 'poll', label: 'Umfrage', icon: PieChart },
                      { type: 'puzzle', label: 'Puzzle', icon: Sparkles },
                      { type: 'iframe', label: 'iFrame', icon: LinkIcon },
                      { type: 'countdown', label: 'Countdown', icon: Calendar },
                    ].map(({ type, label, icon: Icon }) => (
                      <button
                        key={type}
                        onClick={() => setSelectedContentType(type)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                          selectedContentType === type
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                            : 'bg-white/10 text-white/70 hover:bg-white/15'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                        <span className="text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Input Forms */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-6">
                  {selectedContentType === 'text' && (
                    <div>
                      <label className="block text-white text-lg font-semibold mb-3">Text-Inhalt (Markdown unterstützt)</label>
                      <textarea
                        value={textContent}
                        onChange={(e) => setTextContent(e.target.value)}
                        rows={10}
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white focus:outline-none focus:border-pink-400 transition-colors resize-none font-mono"
                        placeholder="# Überschrift\n\n**Fettgedruckt** und *kursiv*\n\n- Listenpunkt 1\n- Listenpunkt 2"
                      />
                    </div>
                  )}

                  {(selectedContentType === 'image' || selectedContentType === 'video' || selectedContentType === 'audio' || selectedContentType === 'gif' || selectedContentType === 'puzzle') && (
                    <div>
                      <label className="block text-white text-lg font-semibold mb-3">
                        {selectedContentType === 'puzzle' ? 'Puzzle-Bild hochladen' : 'Datei hochladen'}
                      </label>
                      <input
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        accept={
                          selectedContentType === 'image' || selectedContentType === 'puzzle' ? 'image/*' :
                          selectedContentType === 'video' ? 'video/*' :
                          selectedContentType === 'audio' ? 'audio/*' :
                          selectedContentType === 'gif' ? 'image/gif' : '*'
                        }
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                      />
                      {file && (
                        <p className="text-green-300 mt-2">✓ {file.name}</p>
                      )}
                    </div>
                  )}

                  {selectedContentType === 'poll' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-white text-lg font-semibold mb-3">Umfrage-Frage</label>
                        <input
                          type="text"
                          value={pollQuestion}
                          onChange={(e) => setPollQuestion(e.target.value)}
                          className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white focus:outline-none focus:border-pink-400"
                          placeholder="Was ist deine Lieblingsfarbe?"
                        />
                      </div>
                      <div>
                        <label className="block text-white text-lg font-semibold mb-3">Antwortmöglichkeiten</label>
                        {pollOptions.map((option, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => {
                                const newOptions = [...pollOptions];
                                newOptions[index] = e.target.value;
                                setPollOptions(newOptions);
                              }}
                              className="flex-1 px-4 py-2 bg-white/10 border-2 border-white/30 rounded-xl text-white focus:outline-none focus:border-pink-400"
                              placeholder={`Option ${index + 1}`}
                            />
                            {pollOptions.length > 2 && (
                              <button
                                onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                                className="px-3 py-2 bg-red-500/20 border-2 border-red-400/50 rounded-xl text-red-300 hover:bg-red-500/30"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => setPollOptions([...pollOptions, ''])}
                          className="mt-2 px-4 py-2 bg-green-500/20 border-2 border-green-400/50 rounded-xl text-green-300 hover:bg-green-500/30"
                        >
                          + Option hinzufügen
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedContentType === 'iframe' && (
                    <div>
                      <label className="block text-white text-lg font-semibold mb-3">URL einbetten</label>
                      <input
                        type="url"
                        value={iframeUrl}
                        onChange={(e) => setIframeUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white focus:outline-none focus:border-pink-400"
                        placeholder="https://www.youtube.com/embed/..."
                      />
                    </div>
                  )}

                  {selectedContentType === 'countdown' && (
                    <div className="bg-blue-500/10 border-2 border-blue-400/30 rounded-xl p-6 text-center">
                      <Calendar className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                      <p className="text-blue-300 text-lg">
                        Countdown bis Weihnachten wird automatisch angezeigt
                      </p>
                    </div>
                  )}

                  {/* Optional Message for non-text types */}
                  {selectedContentType !== 'text' && selectedContentType !== 'countdown' && (
                    <div>
                      <label className="block text-white text-lg font-semibold mb-3">
                        Optionale Nachricht (Markdown)
                      </label>
                      <textarea
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 bg-white/10 border-2 border-white/30 rounded-xl text-white focus:outline-none focus:border-pink-400 transition-colors resize-none font-mono"
                        placeholder="Eine zusätzliche Nachricht zum Inhalt..."
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleUploadContent}
                      disabled={uploading}
                      className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl text-white font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-6 h-6" />
                      {uploading ? 'Hochladen...' : 'Inhalt speichern'}
                    </button>
                    {doors.find((d) => d.day === selectedDoor)?.type && doors.find((d) => d.day === selectedDoor)?.type !== 'not available yet' && (
                      <button
                        onClick={handleDeleteContent}
                        className="px-6 py-4 bg-red-500/20 border-2 border-red-400/50 rounded-xl text-red-300 hover:bg-red-500/30 transition-all transform hover:scale-105"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewContent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={() => setPreviewContent(null)}
        >
          <div
            className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-purple-400/50 rounded-3xl p-8 max-w-3xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-3xl font-bold text-white flex items-center gap-3">
                <Eye className="w-8 h-8 text-purple-400" />
                Vorschau: Türchen {previewContent.day}
              </h3>
              <button
                onClick={() => setPreviewContent(null)}
                className="text-white/60 hover:text-white text-3xl transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="bg-white/5 border border-white/20 rounded-xl p-6 space-y-4">
              <div>
                <span className="text-white/60">Typ:</span>
                <span className="ml-3 text-yellow-300 font-bold text-lg">{previewContent.type}</span>
              </div>

              {/* Preview Media */}
              {previewContent.type === 'image' && previewContent.data && (
                <div className="pt-4 border-t border-white/20">
                  <p className="text-white/60 font-semibold mb-2">🖼️ Bild:</p>
                  <img
                    src={`/${previewContent.data}`}
                    alt="Preview"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}

              {previewContent.type === 'video' && previewContent.data && (
                <div className="pt-4 border-t border-white/20">
                  <p className="text-white/60 font-semibold mb-2">🎥 Video:</p>
                  <video
                    src={`/${previewContent.data}`}
                    controls
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}

              {previewContent.type === 'audio' && previewContent.data && (
                <div className="pt-4 border-t border-white/20">
                  <p className="text-white/60 font-semibold mb-2">🎵 Audio:</p>
                  <audio
                    src={`/${previewContent.data}`}
                    controls
                    className="w-full"
                  />
                </div>
              )}

              {previewContent.type === 'gif' && previewContent.data && (
                <div className="pt-4 border-t border-white/20">
                  <p className="text-white/60 font-semibold mb-2">🔄 GIF:</p>
                  <img
                    src={`/${previewContent.data}`}
                    alt="Preview"
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}

              {previewContent.type === 'iframe' && previewContent.data && (
                <div className="pt-4 border-t border-white/20">
                  <p className="text-white/60 font-semibold mb-2">🔗 iFrame URL:</p>
                  <p className="text-blue-300 break-all">{previewContent.data}</p>
                </div>
              )}

              {previewContent.text && (
                <div className="pt-4 border-t border-white/20">
                  <p className="text-white/60 font-semibold mb-2">📝 Nachricht:</p>
                  <div className="text-white/90 leading-relaxed whitespace-pre-wrap">{previewContent.text}</div>
                </div>
              )}

              {previewContent.type === 'poll' && (
                <div className="pt-4 border-t border-white/20">
                  <p className="text-white/60 font-semibold mb-2">📊 Umfrage-Daten sind vorhanden</p>
                </div>
              )}

              {previewContent.type === 'puzzle' && (
                <div className="pt-4 border-t border-white/20">
                  <p className="text-white/60 font-semibold mb-2">🧩 Puzzle-Spiel ist konfiguriert</p>
                </div>
              )}

              {previewContent.type === 'countdown' && (
                <div className="pt-4 border-t border-white/20">
                  <p className="text-white/60 font-semibold mb-2">⏱️ Countdown ist aktiviert</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
