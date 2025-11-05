'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { DoorContent } from '@/lib/types';
import { Lock, Gift, CheckCircle, Sun, Moon, Snowflake } from 'lucide-react';
import Snowfall from '@/components/Snowfall';
import ContentModal from '@/components/ContentModal';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function Home() {
  const { resolvedTheme, setTheme } = useTheme();
  const [doors, setDoors] = useState<DoorContent[]>([]);
  const [doorStates, setDoorStates] = useState<Record<number, { win?: boolean }>>({});
  const [doorOrder, setDoorOrder] = useState<number[]>([]);
  const [openedDoors, setOpenedDoors] = useState<number[]>([]);
  const [selectedDoor, setSelectedDoor] = useState<DoorContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSnow, setShowSnow] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [title, setTitle] = useState('Adventskalender 2024');

  // Shuffle logic: generate or load door order
  useEffect(() => {
    const storedOrder = localStorage.getItem('doorOrder');
    if (storedOrder) {
      setDoorOrder(JSON.parse(storedOrder));
    } else {
      // Fisher-Yates shuffle
      const numbers = Array.from({ length: 24 }, (_, i) => i + 1);
      for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
      }
      setDoorOrder(numbers);
      localStorage.setItem('doorOrder', JSON.stringify(numbers));
    }
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('openedDoors');
    if (stored) setOpenedDoors(JSON.parse(stored));

    const snowPref = localStorage.getItem('showSnow');
    if (snowPref !== null) setShowSnow(JSON.parse(snowPref));

    const storedDoorStates = localStorage.getItem('doorStates');
    let initialDoorStates: Record<number, { win?: boolean }> | undefined;

    if (storedDoorStates) {
      try {
        initialDoorStates = JSON.parse(storedDoorStates);
        if (initialDoorStates && typeof initialDoorStates === 'object') {
          setDoorStates(initialDoorStates);
        }
      } catch (error) {
        console.error('Error parsing stored door states:', error);
      }
    }

    fetchDoors(initialDoorStates);
    fetchSettings();
  }, []);

  useEffect(() => {
    localStorage.setItem('openedDoors', JSON.stringify(openedDoors));
  }, [openedDoors]);

  useEffect(() => {
    localStorage.setItem('showSnow', JSON.stringify(showSnow));
  }, [showSnow]);

  const fetchDoors = async (statesOverride?: Record<number, { win?: boolean }>) => {
    try {
      const params = new URLSearchParams();
      const effectiveStates = statesOverride ?? doorStates;

      if (effectiveStates && Object.keys(effectiveStates).length > 0) {
        params.set('doorStates', JSON.stringify(effectiveStates));
      }

      const query = params.toString();
      const response = await fetch(query ? `/api?${query}` : '/api');
      const data = await response.json();

      // Convert object to array if needed
      const doorsArray: DoorContent[] = Array.isArray(data)
        ? data
        : Object.entries(data).map(([key, value]: [string, any]) => ({
            day: parseInt(key),
            type: value.type || 'not available yet',
            data: value.data || null,
            text: value.text || null,
            thumbnailLight: value.thumbnailLight || null,
            thumbnailDark: value.thumbnailDark || null,
            meta: value.meta || null,
            isSolved: value.isSolved ?? undefined,
          }));

      setDoors(doorsArray);
    } catch (error) {
      console.error('Error fetching doors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();

      if (data.startDate) setStartDate(new Date(data.startDate));
      if (data.title) setTitle(data.title);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleDoorClick = async (door: DoorContent) => {
    if (!door.day || !startDate) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const doorDate = new Date(startDate);
    doorDate.setDate(doorDate.getDate() + (door.day - 1));
    doorDate.setHours(0, 0, 0, 0);

    if (today >= doorDate && door.type !== 'not available yet') {
      try {
        const params = new URLSearchParams();
        if (doorStates && Object.keys(doorStates).length > 0) {
          params.set('doorStates', JSON.stringify(doorStates));
        }

        const query = params.toString();
        const response = await fetch(
          `/api/doors/${door.day}${query ? `?${query}` : ''}`
        );

        if (response.status === 403) {
          return;
        }

        if (!response.ok) {
          return;
        }

        const content = await response.json();
        setSelectedDoor({ ...content, day: door.day });

        if (!openedDoors.includes(door.day)) {
          setOpenedDoors([...openedDoors, door.day]);
        }
      } catch (error) {
        console.error('Error loading door content:', error);
      }
    }
  };

  const isDoorAvailable = (day: number) => {
    if (!startDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const doorDate = new Date(startDate);
    doorDate.setDate(doorDate.getDate() + (day - 1));
    doorDate.setHours(0, 0, 0, 0);

    return today >= doorDate;
  };

  const isDoorOpened = (day: number) => openedDoors.includes(day);

  const handlePuzzleSolved = (doorNumber: number) => {
    if (!doorNumber) return;

    setDoorStates((prev) => {
      if (prev[doorNumber]?.win) {
        return prev;
      }

      const updated = {
        ...prev,
        [doorNumber]: { ...(prev[doorNumber] || {}), win: true },
      };

      try {
        localStorage.setItem('doorStates', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving door states:', error);
      }

      fetchDoors(updated);
      return updated;
    });

    setDoors((current) =>
      current.map((doorItem) =>
        doorItem.day === doorNumber
          ? {
              ...doorItem,
              isSolved: true,
              thumbnailLight: doorItem.data ?? doorItem.thumbnailLight,
              thumbnailDark: doorItem.data ?? doorItem.thumbnailDark,
            }
          : doorItem
      )
    );

    setSelectedDoor((current) =>
      current && current.day === doorNumber
        ? { ...current, isSolved: true }
        : current
    );
  };

  if (loading || doorOrder.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-christmas-gold mb-4 mx-auto"></div>
          <p className="text-foreground dark:text-white text-lg">Laden...</p>
        </div>
      </div>
    );
  }

  const isDarkMode = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background flex flex-col">
      {showSnow && <Snowfall darkMode={isDarkMode} />}

      {/* Header */}
      <header className="bg-background z-40 h-16 flex items-center px-4 sm:px-6 flex-shrink-0">
        <div className="flex items-center justify-center flex-1">
          <h1 className="text-xl sm:text-2xl font-heading font-semibold tracking-tight text-foreground dark:text-white">
            {title}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
          >
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSnow(!showSnow)}
            title={showSnow ? 'Schnee ausschalten' : 'Schnee einschalten'}
          >
            <Snowflake className={cn("h-5 w-5", showSnow && "text-blue-400")} />
          </Button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 overflow-hidden p-2 sm:p-3 md:p-4">
        <div className="h-full w-full grid grid-cols-4 grid-rows-6 sm:grid-cols-6 sm:grid-rows-4 gap-1.5 sm:gap-2 md:gap-3">
          {doorOrder.map((day) => {
            const door = doors.find(d => d.day === day);
            const available = isDoorAvailable(day);
            const opened = isDoorOpened(day);
            const hasContent = door && door.type !== 'not available yet';
            const isLocked = !available || !hasContent;

            // Thumbnail logic - select based on theme
            const thumbnailUrl = isDarkMode ? door?.thumbnailDark : door?.thumbnailLight;
            const hasThumbnail = opened && thumbnailUrl;

            // Status icon and badge
            const StatusIcon = isLocked ? Lock : opened ? CheckCircle : Gift;
            const badgeVariant = isLocked ? 'secondary' : 'default';
            const badgeClass = opened
              ? 'bg-christmas-red text-white'
              : !isLocked
                ? 'bg-christmas-green text-white'
                : '';

            return (
              <Card
                key={day}
                onClick={() => door && !isLocked && handleDoorClick(door)}
                className={cn(
                  "relative flex flex-col h-full overflow-hidden",
                  opened ? "transition-none" : "transition-all duration-300",
                  !isLocked && "cursor-pointer hover:shadow-[0_12px_35px_rgba(214,174,56,0.25)]",
                  isLocked && "cursor-not-allowed opacity-60",
                  opened && "border border-christmas-red/70 shadow-inner shadow-christmas-red/40",
                  opened && !hasThumbnail && "bg-gradient-to-br from-christmas-red/18 via-transparent to-christmas-gold/10",
                  !isLocked && !opened && "border border-christmas-green/60",
                  !isLocked && !opened && !hasThumbnail && "bg-gradient-to-br from-christmas-green/12 via-transparent to-christmas-gold/5"
                )}
                style={hasThumbnail ? {
                  backgroundImage: `url(${thumbnailUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : undefined}
              >
                {/* Dark overlay for opened doors with thumbnails */}
                {hasThumbnail && (
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 z-0" />
                )}

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-2 sm:p-3 relative z-10">
                  <Avatar className={cn(
                    "h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12",
                    opened && hasThumbnail && "border-2 border-christmas-red bg-white/90 dark:bg-black/90",
                    opened && !hasThumbnail && "border-2 border-christmas-red",
                    !isLocked && !opened && "border-2 border-christmas-green",
                    isLocked && "border-2 border-muted"
                  )}>
                    <AvatarFallback className={cn(
                      "font-semibold text-sm sm:text-base md:text-lg",
                      opened && "bg-red-50 dark:bg-red-950 text-christmas-red dark:text-red-300",
                      !isLocked && !opened && "bg-green-50 dark:bg-green-950 text-christmas-green dark:text-green-300",
                      isLocked && "bg-muted text-muted-foreground dark:text-gray-400"
                    )}>
                      {day}
                    </AvatarFallback>
                  </Avatar>

                  <Badge variant={badgeVariant} className={cn(badgeClass, "h-5 w-5 sm:h-6 sm:w-6 p-0 flex items-center justify-center")}>
                    <StatusIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  </Badge>
                </CardHeader>

                <CardContent className="p-2 sm:p-3 pt-0 relative z-10">
                  <p className={cn(
                    "text-xs sm:text-sm font-medium text-foreground dark:text-white",
                    hasThumbnail && "text-white drop-shadow-md",
                    isLocked && "text-muted-foreground dark:text-gray-400"
                  )}>
                    Türchen {day}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      {/* Content Modal */}
      {selectedDoor && (
        <ContentModal
          door={selectedDoor}
          onClose={() => setSelectedDoor(null)}
          darkMode={isDarkMode}
          onPuzzleSolved={handlePuzzleSolved}
        />
      )}
    </div>
  );
}
