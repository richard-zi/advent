import React from 'react';
import ReactMarkdown from 'react-markdown';
import Dialog from './Dialog';

const ContentPopup = ({ isOpen, onClose, content, darkMode }) => {
  if (!content) return null;

  const darkModeClass = darkMode 
    ? 'prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white prose-em:text-white prose-ul:text-white prose-ol:text-white prose-li:text-white prose-a:text-blue-300'
    : '';

  const renderContent = () => {
    switch (content.type) {
      case 'text':
        return (
          <div className={`prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none ${darkModeClass}`}>
            <ReactMarkdown>{content.data}</ReactMarkdown>
          </div>
        );
      case 'video':
        return (
          <div className="aspect-w-16 aspect-h-9">
            <video controls className="w-full h-full object-cover">
              <source src={content.data} type="video/mp4" />
              Ihr Browser unterstützt das Video-Tag nicht.
            </video>
          </div>
        );
      case 'audio':
        return (
          <div>
            <audio controls className="w-full">
              <source src={content.data} type="audio/mpeg" />
              Ihr Browser unterstützt das Audio-Tag nicht.
            </audio>
          </div>
        );
      case 'image':
        return (
          <div className="flex justify-center">
            <img src={content.data} alt="Bild" className="max-w-full h-auto" />
          </div>
        );
      default:
        return null;
    }
  };

  return (content.type === "error" ? 
    <Dialog isOpen={isOpen} onClose={onClose} darkMode={darkMode}>
      <div className={`space-y-6 sm:space-y-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <h2 className={`text-3xl sm:text-4xl font-bold text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Invalide Datenanfrage
        </h2>
      </div>
    </Dialog> 
    : <Dialog isOpen={isOpen} onClose={onClose} darkMode={darkMode}>
      <div className={`space-y-6 sm:space-y-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <h2 className={`text-3xl sm:text-4xl font-bold text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Tag {content.day}
        </h2>
        <div>{renderContent()}</div>
        {content.text && (
          <div className={`prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none text-center ${darkModeClass}`}>
            <ReactMarkdown>{content.text}</ReactMarkdown>
          </div>
        )}
      </div>
    </Dialog>
  );
};

export default ContentPopup;