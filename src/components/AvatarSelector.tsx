import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { UserAvatar } from '@/components/UserAvatar';

const ICON_OPTIONS = [
  'barbarian',
  'barbute',
  'brutal-helm',
  'cowled',
  'crowned-skull',
  'cultist',
  'diablo-skull',
  'dragon-head',
  'dwarf-face',
  'dwarf-helmet',
  'dwarf-king',
  'elf-helmet',
  'executioner-hood',
  'female-vampire',
  'goblin-head',
  'golem-head',
  'kenku-head',
  'monk-face',
  'nun-face',
  'ogre',
  'orc-head',
  'overlord-helm',
  'troll',
  'vampire-dracula',
  'visored-helm',
  'warlock-hood',
  'witch-face',
  'wizard-face',
  'woman-elf-face'
];

interface AvatarSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEmoji: string;
  onSelect: (emoji: string) => void;
  userName: string;
}

export function AvatarSelector({ open, onOpenChange, selectedEmoji, onSelect, userName }: AvatarSelectorProps) {
  const handleSelect = (icon: string) => {
    onSelect(icon);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
          <DialogDescription>
            Select an icon to represent you in the session
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-6 gap-3 py-4">
          {ICON_OPTIONS.map((icon) => (
            <button
              key={icon}
              onClick={() => handleSelect(icon)}
              className={`
                flex items-center justify-center p-3 rounded-lg transition-all
                hover:scale-110 hover:shadow-lg
                ${selectedEmoji === icon ? 'ring-2 ring-slate-500 ring-offset-2 bg-slate-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
              `}
            >
              <UserAvatar
                user={{ id: '', name: userName, emoji: icon }}
                size="medium"
                variant="plain"
              />
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
