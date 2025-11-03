'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Sparkles } from 'lucide-react';
import AdminPanel from '@/components/admin/AdminPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    verifyAuth();
  }, []);

  const verifyAuth = async () => {
    try {
      const response = await fetch('/api/admin/verify', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCsrfToken(data.csrfToken);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setCsrfToken('');
      }
    } catch (err) {
      console.error('Auth verification failed:', err);
      setIsAuthenticated(false);
      setCsrfToken('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.csrfToken) {
        setCsrfToken(data.csrfToken);
        setIsAuthenticated(true);
        setUsername('');
        setPassword('');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Login request failed');
      console.error('Login error:', err);
    }
  };

  const handleLogout = (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
      }).catch((err) => console.error('Logout failed:', err));
    }
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setCsrfToken('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="h-8 w-8 animate-pulse text-primary" />
          <div className="text-foreground dark:text-white text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute top-4 right-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            title={resolvedTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <span className="rounded-full bg-primary/10 p-3 text-primary">
                <Sparkles className="h-8 w-8" />
              </span>
            </div>
            <CardTitle className="text-3xl font-heading dark:text-white">Admin Login</CardTitle>
            <CardDescription className="dark:text-gray-300">Melde dich an, um den Adventskalender zu verwalten</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="dark:text-white">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Benutzername eingeben"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="dark:text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Passwort eingeben"
                  required
                />
              </div>
              {error && (
                <div className="text-destructive dark:text-red-400 text-sm text-center bg-destructive/10 p-2 rounded-md">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AdminPanel
      onLogout={() => handleLogout()}
      onSessionExpired={() => handleLogout({ silent: true })}
      csrfToken={csrfToken}
    />
  );
}
