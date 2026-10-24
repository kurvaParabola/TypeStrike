import type { AvatarConfig, Player, CombatWord, WordBuffType } from '../types';

// Curated 4-5 character Indonesian basic combat words
export const BASIC_WORDS: string[] = [
  'KILAT', 'PEDANG', 'BADAI', 'PANAH', 'CEPAT', 'ANGIN', 'FOKUS', 'TAJAM',
  'TEBAS', 'BUSUR', 'SIAP', 'TITIK', 'LEBAR', 'KOKOH', 'PETIR', 'KERAS',
  'TUSUK', 'TIKAM', 'PACU', 'KAPAK', 'PISAU', 'GAGAH', 'HEBAT', 'RACUN',
  'DARAT', 'RIMBA', 'JEJAK', 'HANTU', 'BUSA', 'EMAS', 'PERAK', 'BATU',
  'KAYU', 'BESI', 'BUMI', 'AWAN', 'KABUT', 'HUTAN', 'NYALA', 'SINAR'
];

// Special Buff Words for Comeback Mechanic (< 30% HP)
export const BUFF_HEAL_WORDS = ['PULIH', 'SEHAT', 'DARAH', 'SEGAR', 'HIDUP'];
export const BUFF_RAGE_WORDS = ['MURKA', 'LEDAK', 'BAKAR', 'AMUK', 'KOBAR'];
export const BUFF_SHIELD_WORDS = ['KEBAL', 'BAJA', 'KUAT', 'KOKOH', 'TAMENG'];

/**
 * Generates a combat word. If HP < 30%, has high chance to trigger a powerful buff word!
 */
export function getNextCombatWord(currentHp: number, previousWord?: string): CombatWord {
  // Low HP (< 30%) Rage Mechanic: 50% chance for special buff word
  if (currentHp <= 30 && Math.random() < 0.55) {
    const roll = Math.random();

    if (roll < 0.38) {
      // HEAL Buff (+25 HP)
      const word = pickRandom(BUFF_HEAL_WORDS, previousWord);
      return {
        word,
        buffType: 'HEAL',
        buffLabel: '+25 HP RECOVER',
        buffIcon: '❤️',
      };
    } else if (roll < 0.72) {
      // 2X DAMAGE / RAGE Buff
      const word = pickRandom(BUFF_RAGE_WORDS, previousWord);
      return {
        word,
        buffType: 'DOUBLE_DMG',
        buffLabel: '2X DAMAGE RAGE',
        buffIcon: '🔥',
      };
    } else {
      // SHIELD Buff
      const word = pickRandom(BUFF_SHIELD_WORDS, previousWord);
      return {
        word,
        buffType: 'SHIELD',
        buffLabel: 'PERISAI KEBAL',
        buffIcon: '🛡️',
      };
    }
  }

  // Normal Basic Word
  const word = pickRandom(BASIC_WORDS, previousWord);
  return {
    word,
    buffType: 'BASIC',
  };
}

function pickRandom(list: string[], exclude?: string): string {
  const filtered = exclude ? list.filter((w) => w !== exclude) : list;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * Calculates attack damage based on typing speed (faster = higher damage)
 * and active buff multipliers.
 */
export function calculateSpeedDamage(
  timeTakenMs: number,
  buffType: WordBuffType
): { damage: number; isCrit: boolean; speedTier: string } {
  let baseDamage = 11;
  let isCrit = false;
  let speedTier = 'NORMAL';

  if (timeTakenMs <= 450) {
    // Ultra fast (< 0.45s)
    baseDamage = 22;
    isCrit = true;
    speedTier = '⚡ HYPER CRIT!';
  } else if (timeTakenMs <= 800) {
    // Fast (0.45s - 0.8s)
    baseDamage = 17;
    isCrit = true;
    speedTier = '💥 CRIT!';
  } else if (timeTakenMs <= 1300) {
    // Solid (0.8s - 1.3s)
    baseDamage = 13;
    speedTier = 'BAGUS';
  } else {
    // Slower (> 1.3s)
    baseDamage = 10;
    speedTier = 'LAMBAT';
  }

  // Apply 2X Damage Buff if active
  if (buffType === 'DOUBLE_DMG') {
    baseDamage *= 2;
    isCrit = true;
    speedTier = '🔥 2X RAGE CRIT!';
  }

  return { damage: baseDamage, isCrit, speedTier };
}

// Bot Generator with 100 HP
export function createAiBot(): Player {
  const botNames = ['Bot_Kilat', 'Bot_Voxel', 'Bot_Monad', 'Bot_Ninja'];
  const name = botNames[Math.floor(Math.random() * botNames.length)];

  const botAvatar: AvatarConfig = {
    skinTone: '#E4B588',
    hairStyle: 'spiky',
    hairColor: '#EF6F61',
    expression: 'determined',
    shirtColor: '#4FA8E0',
    pantsColor: '#2B3440',
    accessory: 'headband',
  };

  return {
    id: `bot_${Date.now()}`,
    nickname: name,
    avatar: botAvatar,
    hp: 100,
    maxHp: 100,
    shieldActive: false,
    hits: 0,
    wpm: 70,
    accuracy: 98,
    progressPercent: 0,
    isBot: true,
  };
}
