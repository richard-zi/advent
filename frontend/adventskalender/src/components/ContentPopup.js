// src/components/ContentPopup.js
import React from 'react';
import Dialog from './Dialog';

const ContentPopup = ({ isOpen, onClose, content }) => {
  if (!content) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <h2 className="text-4xl font-bold mb-8 text-gray-800 text-center">Tag {content.day}</h2>
      <div className="space-y-8">
        {content.type === 'text' && <p className="text-xl text-gray-800 text-center">{content.data}</p>}
        {content.type === 'video' && (
          <div className="aspect-w-16 aspect-h-9">
            <video controls className="w-full h-full object-cover rounded-xl shadow-lg">
              <source src={content.data} type="video/mp4" />
              Ihr Browser unterstützt das Video-Tag nicht.
            </video>
          </div>
        )}
        {content.type === 'audio' && (
          <div className="bg-gray-300 p-8 rounded-xl shadow-md">
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