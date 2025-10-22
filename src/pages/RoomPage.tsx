import DiceTerminal from '@/features/DiceTerminal';

export function RoomPage() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
      <DiceTerminal />
    </div>
  );
}
