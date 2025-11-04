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
import Confetti from '@/components/Confetti';
import PuzzleGame from '@/components/PuzzleGame';

interface ContentModalProps {
  door: DoorContent;
  onClose: () => void;
  darkMode: boolean;
  onPuzzleSolved?: (doorNumber: number) => void;
}

export default function ContentModal({ door, onClose, darkMode, onPuzzleSolved }: ContentModalProps) {
  // Poll state management
  const [pollData, setPollData] = useState<any>(null);
  const [pollVotes, setPollVotes] = useState<Record<string, number>>({});
  const [userVote, setUserVote] = useState<string | null>(null);
  const [pollLoading, setPollLoading] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [puzzleSolved, setPuzzleSolved] = useState(door.isSolved ?? false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Get or create userId for poll voting
  const getUserId = () => {
    if (typeof window === 'undefined') return null;

    let userId = localStorage.getItem('adventCalendarUserId');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('adventCalendarUserId', userId);
    }
    return userId;
  };

  // Load poll data when door is a poll
  useEffect(() => {
    if (door.type === 'poll' && door.day) {
      const loadPoll = async () => {
        setPollLoading(true);
        setPollError(null);

        try {
          const userId = getUserId();
          const response = await fetch(`/api/poll/${door.day}${userId ? `?userId=${userId}` : ''}`);

          if (!response.ok) {
            throw new Error('Fehler beim Laden der Umfrage');
          }

          const data = await response.json();
          setPollData(data.pollData);
          setPollVotes(data.votes || {});
          setUserVote(data.userVote || null);
          setHasVoted(!!data.userVote);
        } catch (error) {
          console.error('Poll load error:', error);
          setPollError('Umfrage konnte nicht geladen werden');
        } finally {
          setPollLoading(false);
        }
      };

      loadPoll();
    }
  }, [door.type, door.day]);

  useEffect(() => {
    const solved = door.isSolved ?? false;
    setPuzzleSolved(solved);
    if (!solved) {
      setShowConfetti(false);
    }
  }, [door.isSolved]);

  // Handle poll vote submission
  const handleVote = async (option: string) => {
    if (hasVoted || !pollData) return;

    const userId = getUserId();
    if (!userId) {
      setPollError('Fehler beim Speichern der Stimme');
      return;
    }

    try {
      const response = await fetch(`/api/poll/${door.day}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option, userId }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Abstimmen');
      }

      const data = await response.json();

      if (data.success) {
        setPollVotes(data.votes);
        setUserVote(option);
        setHasVoted(true);
      } else {
        setPollError('Du hast bereits abgestimmt');
      }
    } catch (error) {
      console.error('Vote error:', error);
      setPollError('Fehler beim Abstimmen');
    }
  };

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

  const handlePuzzleSolved = () => {
    if (!door.day) return;
    setPuzzleSolved(true);
    setShowConfetti(true);
    onPuzzleSolved?.(door.day);
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
              controlsList=""
              className="w-full h-full rounded-lg"
              autoPlay
              preload="metadata"
              playsInline
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
          <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:dark:text-white prose-p:dark:text-white prose-li:dark:text-white prose-strong:dark:text-white prose-a:dark:text-blue-400 prose-code:dark:text-white text-foreground dark:text-white">
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
              <h3 className="text-2xl font-semibold text-foreground dark:text-white">
                Countdown
              </h3>
            </div>
            <CountdownTimer targetDate={targetDate} />
            {countdownText && (
              <div className="prose prose-sm mx-auto max-w-2xl text-left dark:prose-invert prose-headings:dark:text-white prose-p:dark:text-white prose-li:dark:text-white prose-strong:dark:text-white prose-a:dark:text-blue-400 prose-code:dark:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {countdownText}
                </ReactMarkdown>
              </div>
            )}
          </div>
        );
      }

      case 'poll':
        if (pollLoading) {
          return (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-christmas-gold" />
              <p className="text-foreground dark:text-white">Umfrage wird geladen...</p>
            </div>
          );
        }

        if (pollError) {
          return (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <p className="text-red-500 dark:text-red-400">{pollError}</p>
            </div>
          );
        }

        if (!pollData) {
          return (
            <div className="text-center py-8">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-christmas-gold" />
              <p className="text-foreground dark:text-white">Keine Umfrage verfügbar</p>
            </div>
          );
        }

        const totalVotes = Object.values(pollVotes).reduce((sum: number, count) => sum + (count as number), 0);

        return (
          <div className="space-y-6 py-4">
            {/* Poll Question */}
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-christmas-gold" />
              <h3 className="text-xl font-semibold text-foreground dark:text-white mb-2">
                {pollData.question}
              </h3>
              {hasVoted && (
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Du hast abgestimmt • {totalVotes} {totalVotes === 1 ? 'Stimme' : 'Stimmen'} insgesamt
                </p>
              )}
            </div>

            {/* Poll Options */}
            <div className="space-y-3">
              {pollData.options.map((option: string) => {
                const votes = pollVotes[option] || 0;
                const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                const isUserChoice = userVote === option;

                return (
                  <div key={option} className="relative">
                    {hasVoted ? (
                      // Show results after voting
                      <div className="relative overflow-hidden rounded-lg border bg-background">
                        {/* Progress bar */}
                        <div
                          className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                            isUserChoice
                              ? 'bg-christmas-gold/20'
                              : 'bg-muted/50'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />

                        {/* Content */}
                        <div className="relative px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground dark:text-white font-medium">
                              {option}
                            </span>
                            {isUserChoice && (
                              <span className="text-xs bg-christmas-gold text-white px-2 py-0.5 rounded-full">
                                Deine Wahl
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground dark:text-gray-400">
                              {votes} {votes === 1 ? 'Stimme' : 'Stimmen'}
                            </span>
                            <span className="text-lg font-semibold text-foreground dark:text-white min-w-[3rem] text-right">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Show voting buttons before voting
                      <Button
                        onClick={() => handleVote(option)}
                        variant="outline"
                        className="w-full justify-start text-left h-auto py-3 px-4 hover:bg-christmas-gold/10 hover:border-christmas-gold transition-colors"
                      >
                        <span className="text-foreground dark:text-white font-medium">
                          {option}
                        </span>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {!hasVoted && (
              <p className="text-center text-sm text-muted-foreground dark:text-gray-400">
                Wähle eine Option, um abzustimmen
              </p>
            )}
          </div>
        );

      case 'puzzle': {
        if (!door.data) {
          return (
            <div className="text-center py-8">
              <Puzzle className="w-16 h-16 mx-auto mb-4 text-christmas-gold" />
              <p className="text-foreground dark:text-white">Puzzle wird geladen...</p>
            </div>
          );
        }

        if (puzzleSolved) {
          return (
            <div className="space-y-4">
              <div className="relative w-full max-h-[60vh] overflow-hidden rounded-lg border">
                <img
                  src={door.data}
                  alt="Gelöstes Puzzle"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-center text-foreground dark:text-white text-base font-medium">
                Herzlichen Glückwunsch! Das Puzzle ist gelöst.
              </p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <PuzzleGame
              imageUrl={door.data}
              onSolved={handlePuzzleSolved}
              darkMode={darkMode}
            />
            <p className="text-sm text-muted-foreground dark:text-gray-300 text-center">
              Tippe auf eine Kachel neben dem freien Feld, um sie zu verschieben. Bringe das Bild in die richtige Reihenfolge.
            </p>
          </div>
        );
      }

      default:
        return (
          <div className="text-center py-8">
            <p className="text-foreground dark:text-white">Kein Inhalt verfügbar</p>
          </div>
        );
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      {showConfetti && (
        <Confetti
          trigger={showConfetti}
          onComplete={() => setShowConfetti(false)}
        />
      )}
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-2xl font-semibold bg-christmas-gold/10 text-christmas-gold">
                {door.day}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl dark:text-white">Türchen {door.day}</DialogTitle>
              <DialogDescription className="dark:text-gray-300">{getTypeLabel()}</DialogDescription>
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
                <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:dark:text-white prose-p:dark:text-white prose-li:dark:text-white prose-strong:dark:text-white prose-a:dark:text-blue-400 prose-code:dark:text-white text-foreground dark:text-white">
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
            <div className="text-xs uppercase tracking-wider text-muted-foreground dark:text-gray-400">
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
