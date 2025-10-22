import React, { useEffect, useRef, useState } from "react";
import { Terminal } from "@/components/ui/terminal";
import { useSession } from "@/contexts/RoomContext";
import { Check, Share2 } from "lucide-react";
import { motion, type MotionProps } from "motion/react";
import { cn } from "@/lib";

interface AnimatedSpanProps extends MotionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const AnimatedSpan = ({
  children,
  delay = 0,
  className,
  ...props
}: AnimatedSpanProps) => (
  <motion.div
    initial={{ opacity: 0, y: -5 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: delay / 1000 }}
    className={cn("grid text-sm font-normal tracking-tight", className)}
    {...props}
  >
    {children}
  </motion.div>
);

interface TypingAnimationProps extends MotionProps {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  as?: React.ElementType;
}

export const TypingAnimation = ({
  children,
  className,
  duration = 30,
  delay = 0,
  as: Component = "span",
  ...props
}: TypingAnimationProps) => {
  if (typeof children !== "string") {
    throw new Error("TypingAnimation: children must be a string.");
  }

  const MotionComponent = motion.create(Component, {
    forwardMotionProps: true,
  });

  const [displayedText, setDisplayedText] = useState<string>("");
  const [started, setStarted] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const typingEffect = setInterval(() => {
      if (i < children.length) {
        setDisplayedText(children.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingEffect);
      }
    }, duration);
    return () => clearInterval(typingEffect);
  }, [children, duration, started]);

  if (!started) return null;

  return (
    <MotionComponent
      ref={elementRef}
      className={cn("text-sm font-normal tracking-tight", className)}
      {...props}
    >
      {displayedText}
    </MotionComponent>
  );
};

interface TerminalLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const TerminalLayout = ({ children, className }: TerminalLayoutProps) => {
  const { session } = useSession();
  const [copied, setCopied] = useState(false);

  if (!session || session.users.length === 0) return null;

  const handleShareLink = async () => {
    const shareUrl = `${window.location.origin}?session=${session.id}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };


  return (
    <Terminal.Root className={cn("h-full w-full flex flex-col", className)}>
      <Terminal.Header>
        <Terminal.Controls />
        <div className="flex flex-row gap-2 items-center mr-4">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
            Session ID
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-700 dark:text-gray-300 truncate">
              {session.id}
            </div>
            <button
              onClick={handleShareLink}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
              title="Share Session Link"
            >
              {copied ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <Share2 className="w-3 h-3 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </Terminal.Header>
      <Terminal.Content className="flex-1 overflow-hidden flex flex-col">
        <div className="flex flex-col mb-4 " >
          <TypingAnimation className="text-gray-600 dark:text-gray-400">
            Enter dice notation to roll dice. For example:
          </TypingAnimation>
          <TypingAnimation delay={2000} className="text-gray-900 dark:text-gray-100">
            $ d20
          </TypingAnimation>
          <AnimatedSpan delay={2500} className="text-blue-600 dark:text-blue-400 font-medium">d20: [10] = 10</AnimatedSpan>
        </div>
        {children}
      </Terminal.Content>
    </Terminal.Root>
  );
};
