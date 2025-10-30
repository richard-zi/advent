'use client';

import { useEffect, useMemo, useState } from 'react';
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
  description: '',
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
  const [mode, setMode] = useState<'write' | 'preview'>('write');

  return (
    <div className="space-y-2">
      <Tabs value={mode} onValueChange={(val) => setMode(val as 'write' | 'preview')} className="space-y-2">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="write">Bearbeiten</TabsTrigger>
          <TabsTrigger value="preview">Vorschau</TabsTrigger>
        </TabsList>
        <TabsContent value="write">
          <textarea
            id={id}
            className={textareaClasses}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
          />
        </TabsContent>
        <TabsContent value="preview">
          <div className="prose prose-sm max-w-none rounded-md border bg-muted/30 p-4 text-left dark:prose-invert">
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
            ) : (
              <p className="text-sm text-muted-foreground">Noch kein Inhalt</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AdminPanel({ onLogout, onSessionExpired, csrfToken }: AdminPanelProps) {
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

  const currentDoor = useMemo(
    () => doors.find((door) => door.day === selectedDoor) || null,
    [doors, selectedDoor]
  );
  const hasExistingContent = Boolean(
    currentDoor && currentDoor.type && currentDoor.type !== 'not available yet'
  );

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
            description: data.description || '',
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
                ? { ...door, type: 'not available yet', data: null, text: null, thumbnail: null, meta: null }
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

  const renderPreview = () => {
    if (!currentDoor || !hasExistingContent) {
      return (
        <div className="flex h-32 flex-col items-center justify-center rounded-md border border-dashed border-muted-foreground/30 text-sm text-muted-foreground">
          Noch kein Inhalt gespeichert.
        </div>
      );
    }

    switch (currentDoor.type) {
      case 'text':
        return (
          <div className="prose prose-sm max-w-none rounded-md border bg-muted/30 p-4 dark:prose-invert">
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
            <video src={currentDoor.data || ''} controls className="max-h-80 w-full" preload="metadata" />
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
          <div className="rounded-md border bg-muted/30 p-4 text-left text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Eingebettete URL:</span>
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
          <div className="space-y-3 rounded-md border bg-muted/30 p-4 text-left text-sm text-muted-foreground">
            {displayDate && <p>Zieldatum: {displayDate}</p>}
            {meta.text && (
              <div className="prose prose-sm max-w-none text-left text-foreground dark:prose-invert">
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
            <p className="font-medium text-foreground">Umfrage konfiguriert</p>
            {pollQuestionPreview && (
              <p className="text-muted-foreground">Frage: {pollQuestionPreview}</p>
            )}
            {pollOptionsPreview.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
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
          <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
            Vorschau für diesen Typ ist nicht verfügbar.
          </div>
        );
    }
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
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Inhalte, Umfragen und Einstellungen verwalten
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout} className="gap-2 self-start sm:self-auto">
            <LogOut className="h-4 w-4" /> Logout
          </Button>
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
                  <CardTitle>Türchen auswählen</CardTitle>
                  <CardDescription>Wähle ein Türchen, um den Inhalt zu bearbeiten.</CardDescription>
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
                            isActive ? '' : filled ? 'text-foreground' : 'text-muted-foreground'
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
                      <CardTitle>Aktueller Inhalt</CardTitle>
                      <CardDescription>Vorschau für Türchen {selectedDoor}</CardDescription>
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-sm font-semibold">{selectedDoor}</AvatarFallback>
                    </Avatar>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {hasExistingContent && currentDoor ? (
                      <>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="capitalize">
                            {currentDoor.type}
                          </Badge>
                          {currentDoor.thumbnail && (
                            <Badge variant="secondary">Thumbnail vorhanden</Badge>
                          )}
                        </div>
                        {renderPreview()}
                        {currentDoor.text && (
                          <div className="space-y-2 text-sm">
                            <Separator />
                            <p className="font-medium text-muted-foreground">Zusätzliche Nachricht</p>
                            <div className="prose prose-sm max-w-none rounded-md border bg-muted/30 p-3 dark:prose-invert">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentDoor.text}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      renderPreview()
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Inhalt bearbeiten</CardTitle>
                    <CardDescription>Wähle Format und gib neue Inhalte ein.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label>Content-Typ</Label>
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
                                <p className="text-muted-foreground">{option.description}</p>
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                    </div>

                    {selectedContentType === 'text' && (
                      <div className="space-y-2">
                        <Label htmlFor="text-content">Text (Markdown möglich)</Label>
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
                        <Label htmlFor="file-upload">Datei hochladen</Label>
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
                          <Label htmlFor="poll-question">Frage</Label>
                          <Input
                            id="poll-question"
                            value={pollQuestion}
                            onChange={(event) => setPollQuestion(event.target.value)}
                            placeholder="Was möchtest du fragen?"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Antwortmöglichkeiten</Label>
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
                        <Label htmlFor="iframe-url">URL einbetten</Label>
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
                          <Label htmlFor="countdown-date">Countdown-Datum</Label>
                          <Input
                            id="countdown-date"
                            type="date"
                            value={countdownDate}
                            onChange={(event) => setCountdownDate(event.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Das Datum bestimmt, bis wann der Countdown läuft.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="countdown-text">Countdown-Text (Markdown)</Label>
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
                        <Label htmlFor="message-content">Optionale Nachricht (Markdown)</Label>
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
                <CardTitle>Kalender-Einstellungen</CardTitle>
                <CardDescription>Steuere Startdatum, Titel und Beschreibung.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Startdatum (Türchen 1)</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={settings.startDate}
                    onChange={(event) => setSettings({ ...settings, startDate: event.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Türchen 1 öffnet an diesem Datum um 00:00 Uhr. Jedes weitere Türchen folgt an den darauffolgenden Tagen.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calendar-title">Titel</Label>
                  <Input
                    id="calendar-title"
                    value={settings.title}
                    onChange={(event) => setSettings({ ...settings, title: event.target.value })}
                    placeholder="Adventskalender 2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="calendar-description">Beschreibung</Label>
                  <textarea
                    id="calendar-description"
                    className={textareaClasses}
                    value={settings.description}
                    onChange={(event) => setSettings({ ...settings, description: event.target.value })}
                    placeholder="Öffne jeden Tag ein neues Türchen..."
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
