import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/UserAvatar';
import { AvatarSelector } from '@/components/AvatarSelector';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useSession } from '@/contexts/RoomContext';
import type { User } from '@/types';
import { Terminal } from '@/components/ui/terminal';
import { AnimatedSpan, TypingAnimation } from '@/components/team/TerminalLayout';

const PREVIEW_LINES = [
  '$ 2d20+5',
  '2d20+5: [10, 13]+5 = 28',
  '',
  '$ 4d6kh3',
  '4d6kh3: [6, 4, 2, 1] = 12',
  '',
  'Welcome to rollsh!',
  'Roll dice for your RPG sessions.'
];

interface HomePageProps {
  onStart: () => void;
  initialSessionId?: string | null;
}

export function HomePage({ onStart, initialSessionId }: HomePageProps) {
  const { isPeerReady, setCurrentUser, createSession, joinSession, currentUser, connectionError } = useSession();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('dragon-head');
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(!!initialSessionId);
  const [sessionId, setSessionId] = useState(initialSessionId || '');
  const [isLoading, setIsLoading] = useState(false);

  const createUser = (): User => ({
    id: Math.random().toString(36).substring(7),
    name: name.trim(),
    emoji
  });

  const executeSessionAction = async (action: (user: User) => Promise<void>) => {
    setIsLoading(true);
    try {
      const user = createUser();
      setCurrentUser(user);
      await action(user);
      onStart();
    } catch (error) {
      console.error('Failed to execute session action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!name.trim()) return;
    await executeSessionAction(createSession);
  };

  const handleJoinSession = async () => {
    if (!name.trim() || !sessionId.trim()) return;
    await executeSessionAction((user) => joinSession(user, sessionId.trim()));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      if (showJoinInput && sessionId.trim()) {
        handleJoinSession();
      } else if (!showJoinInput) {
        handleCreateSession();
      }
    }
  };

  if (!isPeerReady && currentUser && !isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-4xl h-full max-h-[80vh] flex flex-col gap-6">
        <Terminal.Root className="flex-1 opacity-60 pointer-events-none">
          <Terminal.Header>
            <Terminal.Controls />
          </Terminal.Header>
          <Terminal.Content>
            <div className="font-mono text-sm space-y-1">
              {PREVIEW_LINES.map((line, i) => line.startsWith('$') ? (
                <TypingAnimation
                  key={i}
                  className="text-gray-900 dark:text-gray-100"
                  delay={i * 500}
                >
                  {line}
                </TypingAnimation>
              ) : (<AnimatedSpan
                key={i}
                className="text-blue-600 dark:text-blue-400 font-medium"
                delay={i * 500}
              >
                {line}
              </AnimatedSpan>))}
            </div>
          </Terminal.Content>
        </Terminal.Root>
        <div className="bg-white dark:bg-slate-950 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 p-8">
          {connectionError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 rounded text-red-700 dark:text-red-400 text-sm">
              Error: {connectionError}
            </div>
          )}

          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => setAvatarModalOpen(true)}
                className="hover:scale-110 transition-transform"
              >
                <UserAvatar user={{ id: '', name, emoji }} size="large" variant='plain'  />
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Click to choose avatar
              </p>
            </div>

            <div className="w-full max-w-sm">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your name
              </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Enter your name..."
                autoFocus
                className="h-10"
              />
            </div>

            {!showJoinInput ? (
              <div className="w-full max-w-sm flex flex-col gap-3">
                <Button
                  onClick={handleCreateSession}
                  disabled={!name.trim() || isLoading}
                  size="lg"
                  className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700"
                >
                  {isLoading ? 'Creating...' : 'Create New Session'}
                </Button>
                <Button
                  onClick={() => setShowJoinInput(true)}
                  disabled={!name.trim() || isLoading}
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  Join Existing Session
                </Button>
              </div>
            ) : (
              <div className="w-full max-w-sm flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Session ID
                  </label>
                  <Input
                    type="text"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Enter session ID..."
                    className="h-10"
                  />
                </div>
                <Button
                  onClick={handleJoinSession}
                  disabled={!name.trim() || !sessionId.trim() || isLoading}
                  size="lg"
                  className="w-full bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700"
                >
                  {isLoading ? 'Joining...' : 'Join Session'}
                </Button>
                <Button
                  onClick={() => setShowJoinInput(false)}
                  disabled={isLoading}
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  Back
                </Button>
              </div>
            )}
          </div>
        </div>

        <AvatarSelector
          open={avatarModalOpen}
          onOpenChange={setAvatarModalOpen}
          selectedEmoji={emoji}
          onSelect={setEmoji}
          userName={name}
        />
      </div>
    </div>
  );
}
