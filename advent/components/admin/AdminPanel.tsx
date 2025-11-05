'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Upload,
  Settings,
  Calendar,
  LogOut,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Repeat,
  PieChart,
  Link as LinkIcon,
  Sparkles,
  Trash2,
  Save,
  Sun,
  Moon,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { DoorContent } from '@/lib/types';
import dynamic from 'next/dynamic';
import '@mdxeditor/editor/style.css';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  CodeToggle,
  ListsToggle,
  BlockTypeSelect,
  CreateLink,
  type MDXEditorMethods,
} from '@mdxeditor/editor';

interface AdminPanelProps {
  onLogout: () => void;
  onSessionExpired: () => void;
  csrfToken: string;
}

const textareaClasses =
  'min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const countdownDateRegex = /^\d{4}-\d{2}-\d{2}$/;

type ContentOption = {
  value: string;
  label: string;
  description: string;
  icon: typeof FileText;
};

type CountdownMeta = {
  targetDate?: string;
  text?: string;
};

type AdminDoor = DoorContent & { day: number };

const contentTypeOptions: ContentOption[] = [
  { value: 'text', label: 'Text', description: 'Markdown oder Klartext', icon: FileText },
  { value: 'image', label: 'Bild', description: 'JPG, PNG, WebP', icon: ImageIcon },
  { value: 'video', label: 'Video', description: 'MP4, WebM, MOV', icon: Video },
  { value: 'audio', label: 'Audio', description: 'MP3, WAV, OGG', icon: Music },
  { value: 'gif', label: 'GIF', description: 'Animierte GIFs', icon: Repeat },
  { value: 'poll', label: 'Umfrage', description: 'Frage mit Antworten', icon: PieChart },
  { value: 'puzzle', label: 'Puzzle', description: 'Bild-Puzzle', icon: Sparkles },
  { value: 'iframe', label: 'iFrame', description: 'z.B. YouTube Links', icon: LinkIcon },
  { value: 'countdown', label: 'Countdown', description: 'Ziel-Datum + Text', icon: Calendar },
];

const defaultSettings = {
  startDate: '',
  title: '',
};

function getCountdownMeta(meta: unknown): CountdownMeta {
  if (meta && typeof meta === 'object') {
    const record = meta as Record<string, unknown>;
    return {
      targetDate: typeof record.targetDate === 'string' ? record.targetDate : undefined,
      text: typeof record.text === 'string' ? record.text : undefined,
    };
  }
  return {};
}

type MarkdownEditorProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

function MarkdownEditor({ id, value, onChange, placeholder }: MarkdownEditorProps) {
  return (
    <div className="space-y-2">
      <div className="rounded-md border border-input bg-background overflow-hidden">
        <MDXEditor
          key={id}
          markdown={value}
          onChange={onChange}
          placeholder={placeholder}
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            markdownShortcutPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <>
                  <UndoRedo />
                  <Separator orientation="vertical" className="mx-2 h-6" />
                  <BoldItalicUnderlineToggles />
                  <CodeToggle />
                  <Separator orientation="vertical" className="mx-2 h-6" />
                  <BlockTypeSelect />
                  <Separator orientation="vertical" className="mx-2 h-6" />
                  <ListsToggle />
                  <Separator orientation="vertical" className="mx-2 h-6" />
                  <CreateLink />
                </>
              ),
            }),
          ]}
          contentEditableClassName="prose prose-sm max-w-none p-4 min-h-[200px] focus:outline-none"
        />
      </div>
    </div>
  );
}

export default function AdminPanel({ onLogout, onSessionExpired, csrfToken }: AdminPanelProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'doors' | 'settings'>('doors');
  const [settings, setSettings] = useState(defaultSettings);
  const [selectedDoor, setSelectedDoor] = useState(1);
  const [doors, setDoors] = useState<AdminDoor[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedContentType, setSelectedContentType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [iframeUrl, setIframeUrl] = useState('');
  const [countdownDate, setCountdownDate] = useState('');
  const [countdownText, setCountdownText] = useState('');
  const [previewMode, setPreviewMode] = useState<'content' | 'thumbnails'>('content');

  const currentDoor = useMemo(
    () => doors.find((door) => door.day === selectedDoor) || null,
    [doors, selectedDoor]
  );
  const hasExistingContent = Boolean(
    currentDoor && currentDoor.type && currentDoor.type !== 'not available yet'
  );

  useEffect(() => {
    setPreviewMode('content');
  }, [selectedDoor]);

  const handleUnauthorized = (status: number) => {
    if (status === 401 || status === 403) {
      alert('Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.');
      onSessionExpired();
      return true;
    }
    return false;
  };

  const resetForm = () => {
    setSelectedContentType('text');
    setTextContent('');
    setMessageContent('');
    setFile(null);
    setPollQuestion('');
    setPollOptions(['', '']);
    setIframeUrl('');
    setCountdownDate(settings.startDate || '');
    setCountdownText('');
    setPreviewMode('content');
  };

  useEffect(() => {
    const doorMeta = currentDoor?.meta;

    if (!currentDoor || currentDoor.type === 'not available yet') {
      resetForm();
      return;
    }

    setSelectedContentType(currentDoor.type);

    if (currentDoor.type === 'text') {
      setTextContent(currentDoor.data || '');
      setMessageContent('');
    } else {
      setTextContent('');
      setMessageContent(currentDoor.text || '');
    }

    if (currentDoor.type === 'iframe') {
      setIframeUrl(currentDoor.data || '');
    } else {
      setIframeUrl('');
    }

    if (currentDoor.type === 'countdown') {
      const meta = getCountdownMeta(doorMeta);
      setCountdownDate(meta.targetDate || settings.startDate || '');
      setCountdownText(meta.text || '');
    } else {
      setCountdownDate(settings.startDate || '');
      setCountdownText('');
    }

    setPollQuestion('');
    setPollOptions(['', '']);
  }, [currentDoor, settings.startDate]);

  useEffect(() => {
    const loadData = async () => {
      if (!csrfToken) {
        return;
      }

      try {
        const settingsRes = await fetch('/api/admin/settings', {
          credentials: 'include',
        });
        if (handleUnauthorized(settingsRes.status)) {
          return;
        }
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSettings({
            startDate: data.startDate || '',
            title: data.title || '',
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }

      try {
        const doorsRes = await fetch('/api/admin/doors', {
          credentials: 'include',
        });
        if (handleUnauthorized(doorsRes.status)) {
          return;
        }
        if (doorsRes.ok) {
          const data = await doorsRes.json();
          const mapped = Object.entries(data).map(([key, value]) => ({
            ...(value as DoorContent),
            day: parseInt(key, 10),
          })) as AdminDoor[];
          setDoors(mapped.sort((a, b) => a.day - b.day));
        }
      } catch (error) {
        console.error('Error loading doors:', error);
      }
    };

    loadData();
  }, [csrfToken]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (handleUnauthorized(response.status)) {
        return;
      }

      if (response.ok) {
        alert('✅ Einstellungen gespeichert! Das Startdatum aktualisiert sich innerhalb weniger Sekunden im Kalender.');
      } else {
        alert('❌ Fehler beim Speichern');
      }
    } catch (error) {
      alert('❌ Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadContent = async () => {
    if (uploading) return;

    if (selectedContentType === 'text' && !textContent.trim()) {
      alert('Bitte gib einen Text ein.');
      return;
    }

    if (
      ['image', 'video', 'audio', 'gif', 'puzzle'].includes(selectedContentType) &&
      !file
    ) {
      alert('Bitte wähle eine Datei aus.');
      return;
    }

    if (selectedContentType === 'poll') {
      const trimmedOptions = pollOptions.filter((option) => option.trim());
      if (!pollQuestion.trim() || trimmedOptions.length < 2) {
        alert('Bitte gib eine Frage und mindestens zwei Antwortoptionen ein.');
        return;
      }
    }

    if (selectedContentType === 'iframe' && !iframeUrl.trim()) {
      alert('Bitte gib eine gültige URL ein.');
      return;
    }

    if (selectedContentType === 'countdown') {
      if (!countdownDate || !countdownDateRegex.test(countdownDate)) {
        alert('Bitte wähle ein gültiges Countdown-Datum (YYYY-MM-DD).');
        return;
      }
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('doorNumber', selectedDoor.toString());
      formData.append('contentType', selectedContentType);

      if (selectedContentType === 'text') {
        formData.append('text', textContent);
      } else if (selectedContentType === 'poll') {
        formData.append('pollQuestion', pollQuestion);
        formData.append('pollOptions', JSON.stringify(pollOptions.filter((option) => option.trim())));
      } else if (selectedContentType === 'iframe') {
        formData.append('iframeUrl', iframeUrl);
      } else if (selectedContentType === 'countdown') {
        formData.append('countdownDate', countdownDate);
        formData.append('countdownText', countdownText);
      } else if (file) {
        formData.append('file', file);
      }

      if (messageContent && !['text', 'countdown'].includes(selectedContentType)) {
        formData.append('text', messageContent);
      }

      const response = await fetch('/api/admin/doors/upload', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: formData,
      });

      if (handleUnauthorized(response.status)) {
        return;
      }

      if (response.ok) {
        alert('✅ Inhalt gespeichert!');
        resetForm();
        const doorsRes = await fetch('/api/admin/doors', {
          credentials: 'include',
        });
        if (handleUnauthorized(doorsRes.status)) {
          return;
        }
        if (doorsRes.ok) {
          const data = await doorsRes.json();
          const mapped = Object.entries(data).map(([key, value]) => ({
            ...(value as DoorContent),
            day: parseInt(key, 10),
          })) as AdminDoor[];
          setDoors(mapped.sort((a, b) => a.day - b.day));
        }
      } else {
        const data = await response.json();
        alert(`❌ Fehler: ${data.error || 'Upload fehlgeschlagen'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteContent = async () => {
    if (!hasExistingContent) {
      alert('Für dieses Türchen ist kein Inhalt gespeichert.');
      return;
    }

    if (!confirm('Möchtest du den Inhalt wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/admin/doors/${selectedDoor}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
      });

      if (handleUnauthorized(response.status)) {
        return;
      }

      if (response.ok) {
        alert('✅ Inhalt gelöscht!');
        resetForm();
        setDoors((prev) =>
          prev
            .map((door) =>
              door.day === selectedDoor
                ? {
                    ...door,
                    type: 'not available yet',
                    data: null,
                    text: null,
                    thumbnailLight: null,
                    thumbnailDark: null,
                    meta: null,
                  }
                : door
            )
        );
      } else {
        alert('❌ Inhalt konnte nicht gelöscht werden');
      }
    } catch (error) {
      alert('❌ Fehler beim Löschen');
    }
  };

  const renderContentPreview = () => {
    if (!currentDoor || !hasExistingContent) {
      return (
        <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/30 text-sm text-muted-foreground dark:text-gray-400">
          Noch kein Inhalt gespeichert.
        </div>
      );
    }

    switch (currentDoor.type) {
      case 'text':
        return (
          <div className="prose prose-sm max-w-none rounded-md border bg-muted/30 p-4 dark:prose-invert prose-headings:dark:text-white prose-p:dark:text-white prose-li:dark:text-white prose-strong:dark:text-white prose-a:dark:text-blue-400 prose-code:dark:text-white">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentDoor.data || ''}</ReactMarkdown>
          </div>
        );
      case 'image':
      case 'gif':
        return (
          <div className="overflow-hidden rounded-md border">
            <img src={currentDoor.data || ''} alt="Türchen Vorschau" className="max-h-80 w-full object-contain" />
          </div>
        );
      case 'video':
        return (
          <div className="overflow-hidden rounded-md border">
            <video
              src={currentDoor.data || ''}
              controls
              controlsList=""
              className="max-h-80 w-full"
              preload="metadata"
              playsInline
            />
          </div>
        );
      case 'audio':
        return (
          <div className="rounded-md border bg-muted/30 p-4">
            <audio src={currentDoor.data || ''} controls className="w-full" />
          </div>
        );
      case 'iframe':
        return (
          <div className="rounded-md border bg-muted/30 p-4 text-left text-sm text-muted-foreground dark:text-gray-400">
            <span className="font-medium text-foreground dark:text-white">Eingebettete URL:</span>
            <div className="mt-1 break-words text-primary">{currentDoor.data}</div>
          </div>
        );
      case 'puzzle':
        return (
          <div className="overflow-hidden rounded-md border">
            <img src={currentDoor.data || ''} alt="Puzzle Vorschau" className="max-h-80 w-full object-contain" />
          </div>
        );
      case 'countdown': {
        const meta = getCountdownMeta(currentDoor.meta);
        const displayDate = (() => {
          if (!meta.targetDate || !countdownDateRegex.test(meta.targetDate)) {
            return null;
          }
          const [year, month, day] = meta.targetDate.split('-').map(Number);
          return new Date(year, month - 1, day).toLocaleDateString('de-DE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
        })();
        return (
          <div className="space-y-3 rounded-md border bg-muted/30 p-4 text-left text-sm text-muted-foreground dark:text-gray-400">
            {displayDate && <p>Zieldatum: {displayDate}</p>}
            {meta.text && (
              <div className="prose prose-sm max-w-none text-left text-foreground dark:text-white dark:prose-invert prose-headings:dark:text-white prose-p:dark:text-white prose-li:dark:text-white prose-strong:dark:text-white prose-a:dark:text-blue-400 prose-code:dark:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{meta.text}</ReactMarkdown>
              </div>
            )}
            {!meta.text && !displayDate && <p>Noch keine Details hinterlegt.</p>}
          </div>
        );
      }
      case 'poll': {
        let pollQuestionPreview = '';
        let pollOptionsPreview: string[] = [];
        try {
          if (currentDoor.data) {
            const parsed = JSON.parse(currentDoor.data) as Record<string, unknown>;
            const pollData = parsed.question as { question?: string; options?: string[] } | undefined;
            pollQuestionPreview = pollData?.question || '';
            if (Array.isArray(pollData?.options)) {
              pollOptionsPreview = pollData.options as string[];
            }
          }
        } catch {
          // ignore
        }
        return (
          <div className="space-y-2 rounded-md border bg-muted/30 p-4 text-left text-sm">
            <p className="font-medium text-foreground dark:text-white">Umfrage konfiguriert</p>
            {pollQuestionPreview && (
              <p className="text-muted-foreground dark:text-gray-400">Frage: {pollQuestionPreview}</p>
            )}
            {pollOptionsPreview.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground dark:text-gray-400">
                {pollOptionsPreview.map((option, index) => (
                  <li key={index}>{option}</li>
                ))}
              </ul>
            )}
          </div>
        );
      }
      default:
        return (
          <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground dark:text-gray-400">
            Vorschau für diesen Typ ist nicht verfügbar.
          </div>
        );
    }
  };

  const renderThumbnailPreview = () => {
    if (!currentDoor || !hasExistingContent) {
      return (
        <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/30 text-sm text-muted-foreground dark:text-gray-400">
          Noch kein Inhalt gespeichert.
        </div>
      );
    }

    const { thumbnailLight, thumbnailDark } = currentDoor;

    if (!thumbnailLight && !thumbnailDark) {
      return (
        <div className="space-y-3 rounded-md border border-dashed border-muted-foreground/30 p-6 text-sm text-muted-foreground dark:text-gray-400">
          <p className="font-medium text-foreground dark:text-white">Keine Thumbnails vorhanden</p>
          <p>
            Sobald für diesen Inhalt ein Thumbnail generiert wird, erscheint es hier. Prüfe, ob der Inhalt einen
            unterstützten Typ besitzt oder generiere den Inhalt erneut.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {thumbnailLight && (
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-gray-400">
                Light-Version
              </span>
              <div className="overflow-hidden rounded-md border bg-muted/30 p-2">
                <img
                  src={thumbnailLight}
                  alt={`Light Thumbnail Türchen ${selectedDoor}`}
                  className="w-full rounded-sm object-contain"
                />
              </div>
            </div>
          )}
          {thumbnailDark && (
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-gray-400">
                Dark-Version
              </span>
              <div className="overflow-hidden rounded-md border bg-muted/30 p-2">
                <img
                  src={thumbnailDark}
                  alt={`Dark Thumbnail Türchen ${selectedDoor}`}
                  className="w-full rounded-sm object-contain"
                />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-md border bg-muted/30 p-4 text-xs text-muted-foreground dark:text-gray-400">
          <p className="font-medium text-foreground dark:text-white">Hinweis</p>
          <p className="mt-1">
            Die Thumbnails werden automatisch generiert und sowohl im hellen als auch im dunklen Modus der Startseite verwendet.
            Überprüfe hier das Ergebnis, bevor du den Inhalt freigibst.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 p-2 text-primary">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-heading font-semibold dark:text-white">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground dark:text-gray-300">
                Inhalte, Umfragen und Einstellungen verwalten
              </p>
            </div>
          </div>
          <div className="flex gap-2 self-start sm:self-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              title={resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            >
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="outline" onClick={onLogout} className="gap-2">
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-6 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'doors' | 'settings')}>
          <TabsList className="grid w-full grid-cols-2 sm:w-auto">
            <TabsTrigger value="doors" className="gap-2">
              <Upload className="h-4 w-4" /> Türchen
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" /> Einstellungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="doors" className="space-y-6 pt-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
              <Card>
                <CardHeader>
                  <CardTitle className="dark:text-white">Türchen auswählen</CardTitle>
                  <CardDescription className="dark:text-gray-300">Wähle ein Türchen, um den Inhalt zu bearbeiten.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                    {Array.from({ length: 24 }, (_, idx) => idx + 1).map((day) => {
                      const door = doors.find((d) => d.day === day);
                      const filled = Boolean(door && door.type && door.type !== 'not available yet');
                      const isActive = selectedDoor === day;

                      return (
                        <Button
                          key={day}
                          type="button"
                          variant={isActive ? 'default' : filled ? 'secondary' : 'outline'}
                          className={`h-12 items-center justify-center rounded-md p-0 text-sm font-semibold ${
                            isActive ? '' : filled ? 'text-foreground dark:text-white' : 'text-muted-foreground dark:text-gray-400'
                          }`}
                          onClick={() => setSelectedDoor(day)}
                        >
                          {day}
                        </Button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="dark:text-white">Aktueller Inhalt</CardTitle>
                      <CardDescription className="dark:text-gray-300">Vorschau für Türchen {selectedDoor}</CardDescription>
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm font-semibold">{selectedDoor}</AvatarFallback>
                    </Avatar>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {currentDoor && (
                          <>
                            <Badge variant="outline" className="capitalize">
                              {currentDoor.type}
                            </Badge>
                            {(currentDoor.thumbnailLight || currentDoor.thumbnailDark) && (
                              <Badge variant="secondary">Thumbnails vorhanden</Badge>
                            )}
                          </>
                        )}
                      </div>
                      {hasExistingContent && currentDoor && (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={previewMode === 'content' ? 'default' : 'outline'}
                            onClick={() => setPreviewMode('content')}
                          >
                            Türchenvorschau
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={previewMode === 'thumbnails' ? 'default' : 'outline'}
                            onClick={() => setPreviewMode('thumbnails')}
                          >
                            Thumbnail-Vorschau
                          </Button>
                        </div>
                      )}
                    </div>

                    {hasExistingContent && currentDoor && previewMode === 'thumbnails'
                      ? renderThumbnailPreview()
                      : renderContentPreview()}

                    {previewMode === 'content' && currentDoor?.text && (
                      <div className="space-y-2 text-sm">
                        <Separator />
                        <p className="font-medium text-muted-foreground dark:text-gray-300">Zusätzliche Nachricht</p>
                        <div className="prose prose-sm max-w-none rounded-md border bg-muted/30 p-3 dark:prose-invert prose-headings:dark:text-white prose-p:dark:text-white prose-li:dark:text-white prose-strong:dark:text-white prose-a:dark:text-blue-400 prose-code:dark:text-white">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentDoor.text}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="dark:text-white">Inhalt bearbeiten</CardTitle>
                    <CardDescription className="dark:text-gray-300">Wähle Format und gib neue Inhalte ein.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label className="dark:text-white">Content-Typ</Label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {contentTypeOptions.map((option) => {
                          const Icon = option.icon;
                          const isActive = selectedContentType === option.value;
                          return (
                            <Button
                              key={option.value}
                              type="button"
                              variant={isActive ? 'default' : 'outline'}
                              className="justify-start gap-3"
                              onClick={() => setSelectedContentType(option.value)}
                            >
                              <Icon className="h-4 w-4" />
                              <div className="text-left text-xs">
                                <p className="font-semibold leading-tight">{option.label}</p>
                                <p className="text-muted-foreground dark:text-gray-400">{option.description}</p>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {selectedContentType === 'text' && (
                      <div className="space-y-2">
                        <Label htmlFor="text-content" className="dark:text-white">Text (Markdown möglich)</Label>
                        <MarkdownEditor
                          id="text-content"
                          value={textContent}
                          onChange={setTextContent}
                          placeholder="Schreibe hier den Inhalt..."
                        />
                      </div>
                    )}

                    {['image', 'video', 'audio', 'gif', 'puzzle'].includes(selectedContentType) && (
                      <div className="space-y-2">
                        <Label htmlFor="file-upload" className="dark:text-white">Datei hochladen</Label>
                        <Input
                          id="file-upload"
                          type="file"
                          accept={
                            selectedContentType === 'image'
                              ? 'image/*'
                              : selectedContentType === 'video'
                              ? 'video/*'
                              : selectedContentType === 'audio'
                              ? 'audio/*'
                              : selectedContentType === 'gif'
                              ? 'image/gif'
                              : 'image/*'
                          }
                          onChange={(event) => setFile(event.target.files?.[0] || null)}
                        />
                      </div>
                    )}

                    {selectedContentType === 'poll' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="poll-question" className="dark:text-white">Frage</Label>
                          <Input
                            id="poll-question"
                            value={pollQuestion}
                            onChange={(event) => setPollQuestion(event.target.value)}
                            placeholder="Was möchtest du fragen?"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="dark:text-white">Antwortmöglichkeiten</Label>
                          {pollOptions.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Input
                                value={option}
                                onChange={(event) => {
                                  const updated = [...pollOptions];
                                  updated[index] = event.target.value;
                                  setPollOptions(updated);
                                }}
                                placeholder={`Option ${index + 1}`}
                              />
                              {pollOptions.length > 2 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== index))}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setPollOptions([...pollOptions, ''])}
                          >
                            + Option hinzufügen
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedContentType === 'iframe' && (
                      <div className="space-y-2">
                        <Label htmlFor="iframe-url" className="dark:text-white">URL einbetten</Label>
                        <Input
                          id="iframe-url"
                          type="url"
                          value={iframeUrl}
                          onChange={(event) => setIframeUrl(event.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    )}

                    {selectedContentType === 'countdown' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="countdown-date" className="dark:text-white">Countdown-Datum</Label>
                          <Input
                            id="countdown-date"
                            type="date"
                            value={countdownDate}
                            onChange={(event) => setCountdownDate(event.target.value)}
                          />
                          <p className="text-xs text-muted-foreground dark:text-gray-400">
                            Das Datum bestimmt, bis wann der Countdown läuft.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="countdown-text" className="dark:text-white">Countdown-Text (Markdown)</Label>
                          <MarkdownEditor
                            id="countdown-text"
                            value={countdownText}
                            onChange={setCountdownText}
                            placeholder="Optionaler Text, der unter dem Countdown angezeigt wird"
                          />
                        </div>
                      </div>
                    )}

                    {selectedContentType !== 'text' && selectedContentType !== 'countdown' && (
                      <div className="space-y-2">
                        <Label htmlFor="message-content" className="dark:text-white">Optionale Nachricht (Markdown)</Label>
                        <MarkdownEditor
                          id="message-content"
                          value={messageContent}
                          onChange={setMessageContent}
                          placeholder="Zusätzliche Nachricht, die im Türchen angezeigt wird"
                        />
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex flex-wrap justify-between gap-3">
                    <Button type="button" variant="destructive" onClick={handleDeleteContent} disabled={!hasExistingContent} className="gap-2">
                      <Trash2 className="h-4 w-4" /> Löschen
                    </Button>
                    <Button type="button" onClick={handleUploadContent} disabled={uploading} className="gap-2">
                      <Save className="h-4 w-4" />
                      {uploading ? 'Speichert...' : 'Inhalt speichern'}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle className="dark:text-white">Kalender-Einstellungen</CardTitle>
                <CardDescription className="dark:text-gray-300">Steuere Startdatum, Titel und Beschreibung.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="start-date" className="dark:text-white">Startdatum (Türchen 1)</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={settings.startDate}
                    onChange={(event) => setSettings({ ...settings, startDate: event.target.value })}
                  />
                  <p className="text-xs text-muted-foreground dark:text-gray-400">
                    Türchen 1 öffnet an diesem Datum um 00:00 Uhr. Jedes weitere Türchen folgt an den darauffolgenden Tagen.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calendar-title" className="dark:text-white">Titel</Label>
                  <Input
                    id="calendar-title"
                    value={settings.title}
                    onChange={(event) => setSettings({ ...settings, title: event.target.value })}
                    placeholder="Adventskalender 2024"
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="button" onClick={handleSaveSettings} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? 'Speichert...' : 'Einstellungen sichern'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
