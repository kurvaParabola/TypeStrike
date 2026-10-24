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

export interface Player {
  id: string;
  nickname: string;
  avatar: AvatarConfig;
  hits: number;
  wpm: number;
  accuracy: number;
  progressPercent: number;
  isBot?: boolean;
}

export type GameScreen = 'HOME' | 'QUEUE' | 'VERSUS' | 'ARENA' | 'RESULT';

export interface RoundStats {
  roundNumber: number;
  targetSentence: string;
  winnerId: string | null;
  timeTakenMs: number;
  wpm: number;
  accuracy: number;
}

export interface MatchStats {
  winnerId: string;
  finalScore: { player1: number; player2: number };
  averageWpm: number;
  accuracy: number;
  fastestRoundMs: number;
  rounds: RoundStats[];
  onchainTxHash?: string;
}
