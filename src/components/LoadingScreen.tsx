export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex items-center justify-center z-50">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
            Connecting
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            Establishing secure connection...
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-slate-600 dark:bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-slate-600 dark:bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-slate-600 dark:bg-slate-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
