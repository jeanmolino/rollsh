import { cn } from '@/lib';
import type { User } from '@/types';

interface UserAvatarProps {
  user: User;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
  className?: string;
  variant?: 'background' | 'plain';
}

export function UserAvatar({ user, size = 'medium', showName = false, className, variant = 'background' }: UserAvatarProps) {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-10 h-10',
    large: 'w-16 h-16'
  };

  const iconPath = `/src/assets/icons/${user.emoji}.svg`;

  const isPlain = variant === 'plain';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center',
          !isPlain && 'bg-slate-200 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 p-2',
          sizeClasses[size]
        )}
        title={user.name}
      >
        <img
          src={iconPath}
          alt={user.name}
          className={cn(
            'w-full h-full object-contain',
            !isPlain && 'filter dark:invert',
            isPlain && 'brightness-0 invert'
          )}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      {showName && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {user.name}
        </span>
      )}
    </div>
  );
}
