import { useState } from 'react';
import { NuqsAdapter } from 'nuqs/adapters/react';
import { useQueryState } from 'nuqs';
import { RoomProvider } from '@/contexts/RoomContext';
import { HomePage } from '@/pages/HomePage';
import { RoomPage } from '@/pages/RoomPage';

type Page = 'home' | 'room';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [sessionId, setSessionId] = useQueryState('session');

  const handleStart = () => {
    setCurrentPage('room');
  };

  return (
    <RoomProvider>
      {currentPage === 'home' && (
        <HomePage
          onStart={handleStart}
          initialSessionId={sessionId}
          setUrlSessionId={setSessionId}
        />
      )}
      {currentPage === 'room' && (
        <RoomPage />
      )}
    </RoomProvider>
  );
}

function App() {
  return (
    <NuqsAdapter>
      <AppContent />
    </NuqsAdapter>
  );
}

export default App;
