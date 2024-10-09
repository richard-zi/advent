// src/components/ContentPopup.js
import React from 'react';
import Dialog from './Dialog';

const ContentPopup = ({ isOpen, onClose, content }) => {
  if (!content) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      {/* Display the day number and the content of the opened door */}
      <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-8 text-gray-800">Tag {content.day}</h2>
      <div className="space-y-4 sm:space-y-8">
        {content.type === 'text' && <p className="text-lg sm:text-xl text-gray-800">{content.data}</p>}
        {content.type === 'video' && (
          <div className="aspect-w-16 aspect-h-9">
            <video controls className="w-full h-full object-cover rounded-xl shadow-lg">
              <source src={content.data} type="video/mp4" />
              Ihr Browser unterstützt das Video-Tag nicht.
            </video>
          </div>
        )}
        {content.type === 'audio' && (
          <div className="bg-gray-300 p-4 sm:p-8 rounded-xl shadow-md">
            <audio controls className="w-full">
              <source src={content.data} type="audio/mpeg" />
              Ihr Browser unterstützt das Audio-Tag nicht.
            </audio>
          </div>
        )}
        {content.type === 'image' && (
          <div className="flex justify-center">
            <img src={content.data} alt="Bild" className="w-full max-w-xs sm:max-w-md rounded-xl shadow-lg" />
          </div>
        )}
        {content.text && <p className="text-lg sm:text-xl text-gray-800 text-center mt-4">{content.text}</p>}
      </div>
    </Dialog>
  );
};

export default ContentPopup;