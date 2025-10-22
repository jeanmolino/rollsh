import BarbarianIcon from '@/assets/icons/barbarian.svg?react';
import BarbuteIcon from '@/assets/icons/barbute.svg?react';
import BrutalHelmIcon from '@/assets/icons/brutal-helm.svg?react';
import CowledIcon from '@/assets/icons/cowled.svg?react';
import CrownedSkullIcon from '@/assets/icons/crowned-skull.svg?react';
import CultistIcon from '@/assets/icons/cultist.svg?react';
import DiabloSkullIcon from '@/assets/icons/diablo-skull.svg?react';
import DragonHeadIcon from '@/assets/icons/dragon-head.svg?react';
import DwarfFaceIcon from '@/assets/icons/dwarf-face.svg?react';
import DwarfHelmetIcon from '@/assets/icons/dwarf-helmet.svg?react';
import DwarfKingIcon from '@/assets/icons/dwarf-king.svg?react';
import ElfHelmetIcon from '@/assets/icons/elf-helmet.svg?react';
import ExecutionerHoodIcon from '@/assets/icons/executioner-hood.svg?react';
import FemaleVampireIcon from '@/assets/icons/female-vampire.svg?react';
import FishMonsterIcon from '@/assets/icons/fish-monster.svg?react';
import GoblinHeadIcon from '@/assets/icons/goblin-head.svg?react';
import GolemHeadIcon from '@/assets/icons/golem-head.svg?react';
import KenkuHeadIcon from '@/assets/icons/kenku-head.svg?react';
import MonkFaceIcon from '@/assets/icons/monk-face.svg?react';
import NunFaceIcon from '@/assets/icons/nun-face.svg?react';
import OgreIcon from '@/assets/icons/ogre.svg?react';
import OrcHeadIcon from '@/assets/icons/orc-head.svg?react';
import OverlordHelmIcon from '@/assets/icons/overlord-helm.svg?react';
import TrollIcon from '@/assets/icons/troll.svg?react';
import VampireDraculaIcon from '@/assets/icons/vampire-dracula.svg?react';
import VisoredHelmIcon from '@/assets/icons/visored-helm.svg?react';
import WarlockHoodIcon from '@/assets/icons/warlock-hood.svg?react';
import WitchFaceIcon from '@/assets/icons/witch-face.svg?react';
import WizardFaceIcon from '@/assets/icons/wizard-face.svg?react';
import WomanElfFaceIcon from '@/assets/icons/woman-elf-face.svg?react';
export const iconComponents: Record<string, React.FunctionComponent<React.SVGProps<SVGSVGElement>>> = {
  'barbarian': BarbarianIcon,
  'barbute': BarbuteIcon,
  'brutal-helm': BrutalHelmIcon,
  'cowled': CowledIcon,
  'crowned-skull': CrownedSkullIcon,
  'cultist': CultistIcon,
  'diablo-skull': DiabloSkullIcon,
  'dragon-head': DragonHeadIcon,
  'dwarf-face': DwarfFaceIcon,
  'dwarf-helmet': DwarfHelmetIcon,
  'dwarf-king': DwarfKingIcon,
  'elf-helmet': ElfHelmetIcon,
  'executioner-hood': ExecutionerHoodIcon,
  'female-vampire': FemaleVampireIcon,
  'fish-monster': FishMonsterIcon,
  'goblin-head': GoblinHeadIcon,
  'golem-head': GolemHeadIcon,
  'kenku-head': KenkuHeadIcon,
  'monk-face': MonkFaceIcon,
  'nun-face': NunFaceIcon,
  'ogre': OgreIcon,
  'orc-head': OrcHeadIcon,
  'overlord-helm': OverlordHelmIcon,
  'troll': TrollIcon,
  'vampire-dracula': VampireDraculaIcon,
  'visored-helm': VisoredHelmIcon,
  'warlock-hood': WarlockHoodIcon,
  'witch-face': WitchFaceIcon,
  'wizard-face': WizardFaceIcon,
  'woman-elf-face': WomanElfFaceIcon,
};

export const ICON_NAMES = Object.keys(iconComponents);
