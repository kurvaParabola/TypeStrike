import type { AvatarConfig, Player } from '../types';

// Curated Indonesian sentences adhering to PRD Section 7:
// 6-12 words, 35-80 chars, capital at start, simple punctuation (dots and commas).
export const INDONESIAN_SENTENCES: string[] = [
  "Kecepatan jari dan ketepatan ketik menentukan kemenangan di arena ini.",
  "Setiap huruf yang kamu ketik membawa serangan telak ke arah lawan.",
  "Monad mengeksekusi ribuan transaksi per detik tanpa jeda sama sekali.",
  "Fokuskan pikiranmu, tarik napas dalam, dan ketik setiap kata dengan benar.",
  "Pemain pertama yang berhasil meraih tujuh pukulan akan menjadi juara.",
  "Pertarungan ketik cepat ini menguji konsentrasi serta kelincahan jarimu.",
  "Koreksi setiap kesalahan ketik dengan segera sebelum melanjutkan kata berikutnya.",
  "Serangan balok meluncur deras saat kalimat berhasil diselesaikan sempurna.",
  "Kecepatan tanpa akurasi hanya akan memperlambat langkah kemenanganmu di sini.",
  "Pertahankan ritme mengetikmu agar lawan tidak sempat membalas seranganmu.",
  "Dua pendekar blok beradu ketangkasan kata demi memperebutkan mahkota juara.",
  "Sentuhan keyboard fisik memberikan sensasi mengetik yang jauh lebih responsif.",
  "Waktu terus berjalan cepat, jangan biarkan konsentrasimu terpecah di tengah ronde.",
  "Ketukan demi ketukan mengalun cepat membawa petarung menuju garis finis.",
  "Kemenangan sejati diraih oleh mereka yang pantang menyerah hingga akhir."
];

export function getSentenceForRound(roundNumber: number): string {
  const index = (roundNumber - 1) % INDONESIAN_SENTENCES.length;
  return INDONESIAN_SENTENCES[index];
}

// Bot Generator for F-13 (clearly labeled as AI Bot)
export function createAiBot(): Player {
  const botNames = ['Bot_Kilat', 'Bot_Voxel', 'Bot_Monad', 'Bot_Cyber'];
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
    hits: 0,
    wpm: 65,
    accuracy: 98,
    progressPercent: 0,
    isBot: true,
  };
}
