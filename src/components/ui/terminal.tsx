import { cn } from "@/lib";
import React from "react";

interface TerminalProps {
    children: React.ReactNode;
    className?: string;
}

const TerminalRoot = ({ children, className }: TerminalProps) => {
    return (
        <div
            className={cn(
                "z-0 w-full font-mono flex flex-col",
                className,
            )}
        >
            {children}
        </div>
    );
};

const TerminalHeader = ({ children, className }: TerminalProps) => {
    return (
        <div className={cn(
            "flex gap-y-2 pt-2 justify-between bg-gray-50 dark:bg-gray-900/50  border-x border-t border-gray-200 dark:border-gray-800 w-full",
            className
        )}>
            {children}
        </div>
    );
};


const TerminalControls = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        "flex items-center ml-4 self-end p-4 justify-center text-gray-100 rounded-t-lg h-[80%] align border-gray-700 text-sm select-none bg-white dark:bg-gray-950 inverted",
        className
      )}
    >
      <div className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
        <span className="text-emerald-500 dark:text-emerald-400">❯</span>
        <span className="font-mono font-semibold tracking-tight">roll.sh</span>
      </div>
    </div>
  );
};

const TerminalTitle = ({ children, className }: TerminalProps) => {
    return (
        <div className={cn("text-sm text-gray-600 dark:text-gray-400", className)}>
            {children}
        </div>
    );
};

const TerminalContent = ({ children, className }: TerminalProps) => {
    return (
        <div className={cn("p-4 border border-gray-200 dark:border-gray-800 border-t-0 bg-white dark:bg-gray-950 flex-1 overflow-hidden", className)}>
            {children}
        </div>
    );
};

export const Terminal = Object.assign(TerminalRoot, {
    Root: TerminalRoot,
    Header: TerminalHeader,
    Controls: TerminalControls,
    Title: TerminalTitle,
    Content: TerminalContent,
});
