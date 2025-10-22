import { DiceRoller } from '@dice-roller/rpg-dice-roller';
import type { DiceRollResult } from '../types';

const roller = new DiceRoller();

export function executeDiceRoll(notation: string): DiceRollResult {
  try {
    const rollResult = roller.roll(notation) as any;

    const rolls: number[] = [];
    const rollsArray = Array.isArray(rollResult.rolls) ? rollResult.rolls : [rollResult.rolls];

    rollsArray.forEach((diceRoll: any) => {
      if (diceRoll && typeof diceRoll === 'object' && 'rolls' in diceRoll && Array.isArray(diceRoll.rolls)) {
        diceRoll.rolls.forEach((r: any) => {
          if (r && typeof r === 'object' && 'value' in r && typeof r.value === 'number') {
            rolls.push(r.value);
          }
        });
      }
    });

    return {
      notation,
      rolls,
      modifier: 0,
      sum: rolls.reduce((acc, val) => acc + val, 0),
      total: rollResult.total,
      output: rollResult.output
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Invalid dice notation: ${error.message}`);
    }
    throw new Error('Invalid dice notation');
  }
}
