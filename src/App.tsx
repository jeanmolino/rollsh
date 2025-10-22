import { useState, useEffect } from 'react';
import { RoomProvider } from '@/contexts/RoomContext';
import { HomePage } from '@/pages/HomePage';
import { RoomPage } from '@/pages/RoomPage';

type Page = 'home' | 'room';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [initialSessionId, setInitialSessionId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('room');

    if (sessionId) {
      setInitialSessionId(sessionId);
    }
  }, []);

  const handleStart = () => {
    setCurrentPage('room');

    if (!initialSessionId) {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url.toString());
    }
  };

  return (
    <RoomProvider>
      {currentPage === 'home' && (
        <HomePage
          onStart={handleStart}
          initialSessionId={initialSessionId}
        />
      )}
      {currentPage === 'room' && (
        <RoomPage />
      )}
    </RoomProvider>
  );
}

export default App;
