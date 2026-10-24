export const DUEL_SENTENCES: string[] = [
  "Monad executes ten thousand transactions per second with parallel pipelining.",
  "Type fast to deal lethal combo damage and claim the escrowed prize pool.",
  "Smart contracts on Monad finalize blocks in less than one second.",
  "Keep your accuracy high because every typing mistake delays your next attack.",
  "Decentralized speed meets competitive esports in the ultimate onchain typing duel.",
  "The faster you finish this sentence the higher your chances of striking the enemy.",
  "Monad introduces superscalar execution pipelining for EVM performance.",
  "Hit seven lethal keystroke combos to trigger authoritative smart contract settlement.",
  "TypeStrike tests your muscle memory while staking native Monad tokens.",
  "Asynchronous execution separates transaction execution from consensus in Monad.",
  "Fast fingers decide who walks away with double the escrowed wager today.",
  "Reentrancy guards and cryptographic proofs safeguard the prize pool for the victor.",
  "Every keystroke counts when you are dueling for native tokens on the fastest blockchain.",
  "Focus your mind breathe steadily and strike your opponent with flawless precision.",
  "Sub-second block times ensure instant settlement right when you reach seven hits."
];

export function getRandomSentence(exclude?: string): string {
  const filtered = exclude ? DUEL_SENTENCES.filter((s) => s !== exclude) : DUEL_SENTENCES;
  const index = Math.floor(Math.random() * filtered.length);
  return filtered[index];
}
