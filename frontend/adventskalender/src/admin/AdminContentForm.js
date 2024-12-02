import { Plus, Save, Trash2 } from 'lucide-react';
import AdminContentTypeIcon from './AdminContentTypeIcon';

const AdminContentForm = ({ 
  selectedDoor,
  doors,
  doorContents,
  uploadType,
  textContent,
  message,
  pollOptions,
  loading,
  error,
  onUploadTypeChange,
  onTextContentChange,
  onMessageChange,
  onFileChange,
  onPollOptionAdd,
  onPollOptionRemove,
  onPollOptionChange,
  onDeleteClick,
  onSubmit
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold text-gray-700">
            Door {selectedDoor} Content
          </h2>
          {doors[selectedDoor] && doorContents[selectedDoor] && (
            <div className="mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <AdminContentTypeIcon type={doorContents[selectedDoor].type} />
                <span>Current content: {doorContents[selectedDoor].type}</span>
              </div>
              {doorContents[selectedDoor].text && (
                <div className="mt-1 text-gray-500">
                  Has additional message
                </div>
              )}
            </div>
          )}
        </div>
        {doors[selectedDoor] && (
          <button
            type="button"
            onClick={onDeleteClick}
            className="flex items-center gap-2 px-4 py-2 text-red-500 hover:text-red-700 transition-colors"
          >
            <Trash2 size={20} />
            Delete Content
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content Type
          </label>
          <select
            value={uploadType}
            onChange={(e) => onUploadTypeChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="text">Text</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
            <option value="audio">Audio</option>
            <option value="poll">Poll</option>
            <option value="puzzle">Sliding Puzzle</option>
            <option value="countdown">Countdown</option>
            <option value="iframe">Embedded Content (iframe)</option>
          </select>
        </div>

        {uploadType === 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Content (Markdown supported)
            </label>
            <textarea
              value={textContent}
              onChange={(e) => onTextContentChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md h-32"
              placeholder="Enter your content here..."
            />
          </div>
        )}

        {uploadType === 'iframe' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Embedded URL (e.g., YouTube Embed URL)
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={textContent}
                  onChange={(e) => onTextContentChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="https://www.youtube.com/embed/VIDEO_ID"
                />
                <div className="text-sm text-gray-500">
                  <p>For YouTube videos:</p>
                  <ol className="list-decimal ml-4 space-y-1">
                    <li>Go to the YouTube video</li>
                    <li>Click "Share" and then "Embed"</li>
                    <li>Copy the URL from the embed code (starts with https://www.youtube.com/embed/)</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {uploadType === 'puzzle' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Puzzle Image
            </label>
            <input
              type="file"
              onChange={onFileChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              accept="image/*"
            />
            <p className="mt-2 text-sm text-gray-500">
              Upload the image that will be used for the sliding puzzle. The image will be automatically split into pieces.
            </p>
          </div>
        )}

        {uploadType === 'poll' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Question
              </label>
              <input
                type="text"
                value={textContent}
                onChange={(e) => onTextContentChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="Enter your question here..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Options
              </label>
              {pollOptions.map((option, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => onPollOptionChange(index, e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                    placeholder={`Option ${index + 1}`}
                  />
                  {pollOptions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onPollOptionRemove(index)}
                      className="p-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={onPollOptionAdd}
                className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
              >
                <Plus size={20} />
                Add Option
              </button>
            </div>
          </div>
        )}

        {['image', 'video', 'audio'].includes(uploadType) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File
            </label>
            <input
              type="file"
              onChange={onFileChange}
              className="w-full p-2 border border-gray-300 rounded-md"
              accept={uploadType === 'image' ? 'image/*' : uploadType === 'video' ? 'video/*' : 'audio/*'}
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md h-20"
            placeholder="Enter an additional message..."
          />
        </div>

        {error && (
          <div className={`p-3 rounded-md ${
            error.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
        >
          {loading ? (
            'Uploading...'
          ) : (
            <>
              <Save size={20} />
              Save Content
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AdminContentForm;