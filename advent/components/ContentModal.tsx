'use client';

import { useEffect, useState } from 'react';
import { DoorContent } from '@/lib/types';
import { Image as ImageIcon, Video, Music, FileText, MessageSquare, Puzzle, Clock, Frame } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ContentModalProps {
  door: DoorContent;
  onClose: () => void;
  darkMode: boolean;
}

export default function ContentModal({ door, onClose, darkMode }: ContentModalProps) {
  const getTypeLabel = () => {
    switch (door.type) {
      case 'image': return 'Bild';
      case 'video': return 'Video';
      case 'audio': return 'Audio';
      case 'text': return 'Text';
      case 'gif': return 'Animation';
      case 'poll': return 'Umfrage';
      case 'puzzle': return 'Puzzle';
      case 'countdown': return 'Countdown';
      case 'iframe': return 'Eingebettet';
      default: return 'Inhalt';
    }
  };

  const renderContent = () => {
    switch (door.type) {
      case 'image':
      case 'gif':
        return (
          <div className="relative w-full max-h-[60vh] overflow-hidden rounded-lg border">
            <img
              src={door.data || ''}
              alt={`Türchen ${door.day}`}
              className="w-full h-full object-contain"
            />
          </div>
        );

      case 'video':
        return (
          <div className="relative w-full max-h-[60vh] overflow-hidden rounded-lg border">
            <video
              src={door.data || ''}
              controls
              className="w-full h-full rounded-lg"
              autoPlay
            />
          </div>
        );

      case 'audio':
        return (
          <div className="w-full p-8 bg-muted/50 rounded-lg border">
            <audio
              src={door.data || ''}
              controls
              className="w-full"
              autoPlay
            />
          </div>
        );

      case 'text':
        return (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{door.data || ''}</ReactMarkdown>
          </div>
        );

      case 'iframe':
        return (
          <div className="relative w-full aspect-video overflow-hidden rounded-lg border">
            <iframe
              src={door.data || ''}
              className="w-full h-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );

      case 'countdown':
        return (
          <div className="text-center py-12">
            <Clock className="w-24 h-24 mx-auto mb-6 text-christmas-gold" />
            <h3 className="text-2xl font-semibold mb-4 text-foreground">
              Countdown bis Weihnachten
            </h3>
            <CountdownTimer darkMode={darkMode} />
          </div>
        );

      case 'poll':
        return (
          <div className="text-center py-8">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-christmas-gold" />
            <p className="text-foreground">Umfrage wird geladen...</p>
          </div>
        );

      case 'puzzle':
        return (
          <div className="text-center py-8">
            <Puzzle className="w-16 h-16 mx-auto mb-4 text-christmas-gold" />
            <p className="text-foreground">Puzzle wird geladen...</p>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-foreground">Kein Inhalt verfügbar</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-2xl font-semibold bg-christmas-gold/10 text-christmas-gold">
                {door.day}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl">Türchen {door.day}</DialogTitle>
              <DialogDescription>{getTypeLabel()}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        <div className="space-y-6">
          {renderContent()}

          {/* Additional Message */}
          {door.text && (
            <>
              <Separator />
              <div className="bg-muted/50 p-6 rounded-lg border">
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{door.text}</ReactMarkdown>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button onClick={onClose} className="w-full sm:w-auto">
            Schließen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CountdownTimer({ darkMode }: { darkMode: boolean }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const christmas = new Date(new Date().getFullYear(), 11, 25);
      const now = new Date();
      const diff = christmas.getTime() - now.getTime();

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div
          key={unit}
          className="bg-muted/50 p-6 rounded-lg border"
        >
          <div className="text-4xl font-semibold mb-2 text-christmas-gold">
            {value}
          </div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            {unit === 'days' && 'Tage'}
            {unit === 'hours' && 'Stunden'}
            {unit === 'minutes' && 'Minuten'}
            {unit === 'seconds' && 'Sekunden'}
          </div>
        </div>
      ))}
    </div>
  );
}
