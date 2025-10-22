import { useSession } from '@/contexts/RoomContext';

export function TypingIndicator() {
  const { session, currentUser } = useSession();

  if (!session || !currentUser) return null;

  const typingUsers = session.users.filter(
    user => user.id !== currentUser.id && session.isTyping[user.id]
  );

  if (typingUsers.length === 0) return null;

  const names = typingUsers.map(u => u.name).join(', ');

  return (
    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 px-1">
      {names} {typingUsers.length === 1 ? 'is' : 'are'} typing...
    </div>
  );
}
