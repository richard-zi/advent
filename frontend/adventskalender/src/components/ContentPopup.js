// src/components/ContentPopup.js
import React from 'react';
import Dialog from './Dialog';

const ContentPopup = ({ isOpen, onClose, content }) => {
  if (!content) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold mb-4 text-green-700">Tag {content.day}</h2>
      <div className="space-y-4">
        {content.type === 'text' && <p className="text-gray-700">{content.data}</p>}
        {content.type === 'video' && (
          <div className="aspect-w-16 aspect-h-9">
            <video controls className="w-full h-full object-cover rounded-lg">
              <source src={content.data} type="video/mp4" />
              Ihr Browser unterstützt das Video-Tag nicht.
            </video>
          </div>
        )}
        {content.type === 'audio' && (
          <div className="bg-gray-100 p-4 rounded-lg">
            <audio controls className="w-full">
              <source src={content.data} type="audio/mpeg" />
              Ihr Browser unterstützt das Audio-Tag nicht.
            </audio>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default ContentPopup;