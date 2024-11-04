import { Image, FileText, Film, Music, BarChart2, Clock, Puzzle } from 'lucide-react';

const AdminContentTypeIcon = ({ type }) => {
  const iconProps = { size: 16, className: "text-gray-500" };
  
  switch (type) {
    case 'image':
      return <Image {...iconProps} />;
    case 'text':
      return <FileText {...iconProps} />;
    case 'video':
      return <Film {...iconProps} />;
    case 'audio':
      return <Music {...iconProps} />;
    case 'poll':
      return <BarChart2 {...iconProps} />;
    case 'countdown':
      return <Clock {...iconProps} />;
    case 'puzzle':
      return <Puzzle {...iconProps} />;
    default:
      return null;
  }
};

export default AdminContentTypeIcon;