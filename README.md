# rollsh - Dice Roller Terminal

A modern, retro-styled terminal interface for rolling dice in your RPG sessions! Built with React, TypeScript, and Vite. Powered by [@dice-roller/rpg-dice-roller](https://dice-roller.github.io/documentation/).

## Features

- Clean, light-themed terminal interface with dark mode support
- Advanced dice notation support:
  - Basic rolls: `d20`, `2d6+3`
  - Keep/Drop: `4d6kh3` (keep highest 3), `4d6kl1` (drop highest 3)
  - Advantage/Disadvantage: `2d20kh1` / `2d20kl1`
  - Exploding dice: `d20!`
  - Rerolls: `3d6r<2` (reroll values less than 2)
  - And many more modifiers!
- Commands: `/help`, `/clear`, `/id`
- TypeScript for type safety
- Responsive design
- **Multiplayer support** via PeerJS (peer-to-peer WebRTC)
  - Create a room and share the link
  - Real-time dice rolls shared with all players
  - No server required - fully P2P!

## Usage

Try these commands:
```
d20        - Roll a single d20
2d6+3      - Roll 2d6 and add 3
4d6kh3     - Roll 4d6, keep highest 3 (character stats)
2d20kh1    - Advantage (keep highest)
2d20kl1    - Disadvantage (keep lowest)
d20!       - Exploding d20
3d6r<2     - Reroll results less than 2
/help      - Show help message
/clear     - Clear terminal history
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- [@dice-roller/rpg-dice-roller](https://www.npmjs.com/package/@dice-roller/rpg-dice-roller)
- PeerJS (WebRTC for multiplayer)
- Motion (Framer Motion)

## License

MIT
