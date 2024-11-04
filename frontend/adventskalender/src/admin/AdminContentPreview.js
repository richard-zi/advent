import React, { useState, useEffect } from 'react';
import { BarChart2, Music, Clock, Puzzle } from 'lucide-react';
import AdminContentTypeIcon from './AdminContentTypeIcon';

const AdminContentPreview = ({ content, pollContent, doorIndex }) => {
  const [puzzleImageUrl, setPuzzleImageUrl] = useState(null);

  useEffect(() => {
    if (content?.type === 'puzzle' && content.data) {
      // Verwende die vollständige URL ohne HTTP-Protokoll, um sowohl HTTP als auch HTTPS zu unterstützen
      setPuzzleImageUrl(content.data);
    } else {
      setPuzzleImageUrl(null);
    }
  }, [content]);

  if (!content) return null;

  const isTopRow = doorIndex < 12;

  const getPreviewText = (text) => {
    if (!text) return '';
    const cleanText = text
      .replace(/#{1,6}\s?[^\n]+/g, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`{1,3}[^`\n]+`{1,3}/g, '')
      .replace(/^\s*[-+*]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      .replace(/\n/g, ' ').trim();

    return cleanText.length > 80 ? cleanText.substring(0, 77) + '...' : cleanText;
  };

  const renderPuzzlePreview = () => {
    if (content.type !== 'puzzle') return null;
  
    return (
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Puzzle className="text-gray-500 mt-1" size={14} />
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-700">Sliding Puzzle Game</p>
            {puzzleImageUrl && (
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-700 mb-1">Original Image:</p>
                <div className="relative w-full h-32 border border-gray-200 rounded overflow-hidden">
                  <img 
                    src={content.data}
                    alt={`Puzzle for door ${doorIndex}`} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      console.error('Failed to load puzzle image:', content.data);
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`
      absolute 
      ${isTopRow ? 'top-full mt-2' : 'bottom-full mb-2'} 
      left-1/2 transform -translate-x-1/2
      w-64 bg-white p-3 rounded-lg shadow-xl border border-gray-200 z-10
    `}>
      <div className="flex items-center gap-2 pb-2 mb-2 border-b border-gray-200">
        <AdminContentTypeIcon type={content.type} />
        <span className="font-medium capitalize">{content.type} Content</span>
      </div>

      <div className="space-y-2">
        {content.type === 'puzzle' && renderPuzzlePreview()}  

        {content.type === 'poll' && pollContent && (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <BarChart2 className="text-gray-500 mt-1" size={14} />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-700">Poll Question:</p>
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1">
                  {pollContent.question}
                </p>
                {pollContent.options?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-700">Options:</p>
                    <div className="mt-1 space-y-1">
                      {pollContent.options.map((option, index) => (
                        <div key={index} className="text-xs text-gray-600 bg-gray-50 p-1 px-2 rounded">
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {content.type === 'text' && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-gray-700">Preview:</p>
            <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
              {getPreviewText(content.data)}
            </p>
          </div>
        )}

        {(content.type === 'image' || content.type === 'video' || content.type === 'gif') && (
          <div className="space-y-1">
            {content.thumbnail ? (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Preview:</p>
                <img 
                  src={content.thumbnail} 
                  alt="Content preview" 
                  className="w-full h-32 object-cover rounded"
                />
              </div>
            ) : (
              <div className="text-xs text-gray-500 italic">
                No preview available
              </div>
            )}
          </div>
        )}

        {content.type === 'audio' && (
          <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded flex items-center gap-2">
            <Music size={14} />
            <span>Audio file uploaded</span>
          </div>
        )}

        {content.type === 'countdown' && (
          <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded flex items-center gap-2">
            <Clock size={14} />
            <span>Christmas countdown display</span>
          </div>
        )}

        {content.text && (
          <div className="pt-2 mt-2 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-1">Additional Message:</p>
            <p className="text-xs text-gray-600 line-clamp-2 italic">
              "{getPreviewText(content.text)}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContentPreview;