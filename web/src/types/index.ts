export type HairStyle = 'short' | 'spiky' | 'pompadour' | 'bob' | 'long' | 'curly';
export type FaceExpression = 'normal' | 'determined' | 'smile' | 'hit';
export type Accessory = 'none' | 'crown' | 'glasses' | 'headphones' | 'headband';

export interface AvatarConfig {
  skinTone: string;
  hairStyle: HairStyle;
  hairColor: string;
  expression: FaceExpression;
  shirtColor: string;
  pantsColor: string;
  accessory: Accessory;
}

export type AvatarAnimation = 'idle' | 'typing' | 'attack' | 'hit' | 'win' | 'lose';

export type WordBuffType = 'BASIC' | 'HEAL' | 'DOUBLE_DMG' | 'SHIELD';

export interface CombatWord {
  word: string;
  buffType: WordBuffType;
  buffLabel?: string;
}

export interface FloatingText {
  id: string;
  text: string;
  type: 'damage' | 'crit' | 'heal' | 'shield';
  target: 'player' | 'opponent';
}

export interface Player {
  id: string;
  nickname: string;
  avatar: AvatarConfig;
  hp: number;
  maxHp: number;
  shieldActive: boolean;
  hits: number;
  wpm: number;
  accuracy: number;
  progressPercent: number;
  isBot?: boolean;
}

export type GameMode = 'PRACTICE' | 'WAGER';

export type GameScreen =
  | 'LANDING'
  | 'MODE_SELECT'
  | 'CUSTOMIZE'
  | 'ROOM_LOBBY'
  | 'QUEUE'
  | 'VERSUS'
  | 'ARENA'
  | 'RESULT';

export interface RoomDetails {
  code: string;
  isHost: boolean;
  wagerMon: string;
}

export interface MatchStats {
  winnerId: string;
  finalScore: { player1: number; player2: number };
  player1FinalHp: number;
  player2FinalHp: number;
  totalWordsTyped: number;
  highestCritDamage: number;
  averageWpm: number;
  accuracy: number;
  matchDurationSecs: number;
  onchainTxHash?: string;
}
