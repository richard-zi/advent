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

      case 'countdown': {
        const meta = (door.meta ?? {}) as Record<string, unknown>;
        const targetDate =
          typeof meta?.targetDate === 'string' ? meta.targetDate : '';
        const countdownText =
          typeof meta?.text === 'string' ? meta.text : '';
        const displayDate = (() => {
          if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
            return null;
          }
          const [year, month, day] = targetDate.split('-').map(Number);
          return new Date(year, month - 1, day);
        })();

        return (
          <div className="space-y-8 py-8 text-center">
            <div>
              <Clock className="mx-auto mb-6 h-24 w-24 text-christmas-gold" />
              <h3 className="text-2xl font-semibold text-foreground">
                Countdown
              </h3>
              {displayDate && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Bis zum {displayDate.toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
            <CountdownTimer targetDate={targetDate} />
            {countdownText && (
              <div className="prose prose-sm mx-auto max-w-2xl text-left dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {countdownText}
                </ReactMarkdown>
              </div>
            )}
          </div>
        );
      }

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

function CountdownTimer({ targetDate }: { targetDate?: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [hasReachedTarget, setHasReachedTarget] = useState(false);

  const resolveTargetDate = () => {
    if (targetDate && /^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      const [year, month, day] = targetDate.split('-').map(Number);
      return new Date(year, month - 1, day, 0, 0, 0);
    }

    const now = new Date();
    return new Date(now.getFullYear(), 11, 25);
  };

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = resolveTargetDate();
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
        setHasReachedTarget(false);
        return;
      }

      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      setHasReachedTarget(true);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
      <div className="grid w-full grid-cols-4 gap-4">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div
            key={unit}
            className="rounded-lg border bg-muted/50 p-6"
          >
            <div className="mb-2 text-4xl font-semibold text-christmas-gold">
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
      {hasReachedTarget && (
        <p className="text-sm font-medium text-christmas-gold">
          🎉 Der große Moment ist da!
        </p>
      )}
    </div>
  );
}
