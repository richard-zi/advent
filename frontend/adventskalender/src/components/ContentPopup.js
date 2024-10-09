import React from 'react';
import Dialog from './Dialog';

const ContentPopup = ({ isOpen, onClose, content }) => {
  if (!content) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6 sm:space-y-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 text-center">Tag {content.day}</h2>
        <div className="bg-gray-50 p-6 rounded-xl shadow-inner">
          {content.type === 'text' && <p className="text-lg sm:text-xl text-gray-700">{content.data}</p>}
          {content.type === 'video' && (
            <div className="aspect-w-16 aspect-h-9">
              <video controls className="w-full h-full object-cover rounded-lg shadow">
                <source src={content.data} type="video/mp4" />
                Ihr Browser unterstützt das Video-Tag nicht.
              </video>
            </div>
          )}
          {content.type === 'audio' && (
            <div className="bg-white p-4 rounded-lg shadow">
              <audio controls className="w-full">
                <source src={content.data} type="audio/mpeg" />
                Ihr Browser unterstützt das Audio-Tag nicht.
              </audio>
            </div>
          )}
          {content.type === 'image' && (
            <div className="flex justify-center">
              <img src={content.data} alt="Bild" className="max-w-full h-auto rounded-lg shadow" />
            </div>
          )}
        </div>
        {content.text && <p className="text-lg sm:text-xl text-gray-700 text-center">{content.text}</p>}
      </div>
    </Dialog>
  );
};

export default ContentPopup;