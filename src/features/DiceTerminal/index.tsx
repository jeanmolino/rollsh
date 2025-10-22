import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { executeDiceRoll } from '@/utils/dice';
import { TerminalLayout } from '@/components/team/TerminalLayout';
import { TypingIndicator } from '@/components/TypingIndicator';
import { useSession } from '@/contexts/RoomContext';
import { UserAvatar } from '@/components/UserAvatar';
import type { Message } from '@/types';
import { cn } from '@/lib';

const HELP_MESSAGE: Message[] = [
  { type: 'text', content: 'Available commands:' },
  { type: 'text', content: '  /help  - Show this help message' },
  { type: 'text', content: '  /clear - Clear the terminal history' },
  { type: 'text', content: '  /id - See session id' },
  { type: 'text', content: '' },
  { type: 'text', content: 'Dice notation examples:' },
  { type: 'text', content: '  d20        - Roll a single d20' },
  { type: 'text', content: '  2d6+3      - Roll 2d6 and add 3' },
  { type: 'text', content: '  4d6kh3     - Roll 4d6, keep highest 3' },
  { type: 'text', content: '  4d6kl3     - Roll 4d6, keep lowest 3' },
  { type: 'text', content: '  2d20kh1    - Advantage (keep highest)' },
  { type: 'text', content: '  2d20kl1    - Disadvantage (keep lowest)' },
  { type: 'text', content: '  d20!       - Exploding d20' },
  { type: 'text', content: '  3d6r<2     - Reroll results less than 2' },
];

function DiceTerminal() {
  const { messages, currentUser, session, sendMessage, setTyping, receiveMessages, clearMessages } = useSession();
  const [inputValue, setInputValue] = useState('');
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getUser = (userId?: string) => {
    if (!userId || !session) return null;
    const user = session.users.find(u => u.id === userId);
    return user || null;
  };


  const handleCommand = (command: string) => {
    const trimmedCommand = command.trim();

    if (!trimmedCommand) return;

    const commands: Record<string, () => void> = {
      '/id': () => {
        const sessionId = session?.id || 'No session active';
        receiveMessages(
          { type: 'command', content: trimmedCommand, userId: currentUser?.id },
          { type: 'text', content: `Session ID: ${sessionId}` },
          { type: 'text', content: '' }
        );
      },
      '/clear': () => {
        clearMessages();
      },
      '/help': () => {
        receiveMessages(
          { type: 'command', content: trimmedCommand, userId: currentUser?.id },
          ...HELP_MESSAGE,
          { type: 'text', content: '' }
        );
      },
    };

    if (commands[trimmedCommand]) {
      commands[trimmedCommand]();
      return;
    }

    receiveMessages({ type: 'command', content: trimmedCommand, userId: currentUser?.id });

    try {
      const result = executeDiceRoll(trimmedCommand);
      const resultContent = result.output || `${result.total}`;

      receiveMessages(
        { type: 'result', content: resultContent, userId: currentUser?.id },
        { type: 'text', content: '' }
      );

      sendMessage({
        type: 'roll',
        data: {
          command: trimmedCommand,
          result: resultContent,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorContent = `Error: ${errorMessage}`;

      receiveMessages(
        { type: 'error', content: errorContent, userId: currentUser?.id },
        { type: 'text', content: '' }
      );

      sendMessage({
        type: 'roll',
        data: {
          command: trimmedCommand,
          error: errorContent,
        },
      });
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (value.length > 0) {
      setTyping(true);

      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 1000);
    } else {
      setTyping(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setTyping(false);
      handleCommand(inputValue);
      setInputValue('');
    }
  };

  const handleClick = () => {
    inputRef.current?.focus();
  };

  return (
    <TerminalLayout className="max-h-full w-full shadow-2xl">
      <div className="flex flex-col h-full overflow-hidden">
        <div
          ref={outputRef}
          className="flex-1 overflow-y-auto mb-3 text-sm leading-relaxed px-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent"
        >
          {messages.map((line, index) => {
            const user = getUser(line.userId);
            return (
              <div key={index}>
                {line.userId && user && line.type === 'command' && (
                  <div className="flex items-center gap-2 mt-2 mb-1">
                    <UserAvatar user={user} size="small" showName variant='plain' />
                  </div>
                )}
                <div
                  className={cn(
                    "my-1 whitespace-pre-wrap break-words",
                    line.type === 'command' && "text-gray-900 dark:text-gray-100",
                    line.type === 'result' && "text-blue-600 dark:text-blue-400 font-medium",
                    line.type === 'error' && "text-red-600 dark:text-red-400",
                    line.type === 'text' && "text-gray-600 dark:text-gray-400"
                  )}
                >
                  {line.type === 'command' && (
                    <span className="text-gray-900 dark:text-gray-100 font-semibold select-none">$ </span>
                  )}
                  {line.content}
                </div>
              </div>
            );
          })}
        </div>

        <TypingIndicator />

        <form
          onSubmit={handleSubmit}
          onClick={handleClick}
          className="flex items-center"
        >
          <span className="text-gray-900 dark:text-gray-100 font-semibold mr-2 select-none">$ </span>
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 caret-blue-600 dark:caret-blue-400"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            autoComplete="off"
            spellCheck="false"
          />
        </form>
      </div>
    </TerminalLayout>
  );
}

export default DiceTerminal;
