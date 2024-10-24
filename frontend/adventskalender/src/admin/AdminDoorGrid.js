import AdminContentTypeIcon from './AdminContentTypeIcon';
import AdminContentPreview from './AdminContentPreview';

const AdminDoorGrid = ({ doors, doorContents, pollContents, selectedDoor, onDoorSelect }) => {
  return (
    <div className="grid grid-cols-6 gap-4 mb-6">
      {Array.from({ length: 24 }, (_, i) => i + 1).map((door) => (
        <div key={door} className="relative group aspect-square">
          <button
            onClick={() => onDoorSelect(door)}
            className={`
              absolute inset-0 w-full h-full
              rounded-lg border-2 transition-all 
              flex items-center justify-center
              ${selectedDoor === door 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300'}
              ${doors.hasOwnProperty(door) && doors[door] ? 'bg-green-50' : 'bg-white'}
            `}
          >
            <div className="flex flex-col items-center justify-center w-full h-full p-2">
              <span className="text-lg font-semibold mb-1">{door}</span>
              {doors.hasOwnProperty(door) && doors[door] && (
                <div className="flex flex-col items-center">
                  <AdminContentTypeIcon type={doorContents[door]?.type} />
                  <span className="text-xs text-gray-500 mt-1 capitalize">
                    {doorContents[door]?.type}
                  </span>
                </div>
              )}
            </div>
          </button>
          {doors.hasOwnProperty(door) && doors[door] && (
            <div className="hidden group-hover:block transition-opacity duration-200">
              <AdminContentPreview 
                content={doorContents[door]} 
                pollContent={pollContents[door]}
                doorIndex={door} 
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminDoorGrid;