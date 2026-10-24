import React, { useEffect, useState } from 'react';
import type { Player, MatchStats } from '../types';
import { Avatar } from './Avatar';
import { sound } from '../services/sound';
import confetti from 'canvas-confetti';
import { Trophy, Skull, RotateCcw, Search, Home, Share2, Check, ExternalLink } from 'lucide-react';

interface MatchResultProps {
  player: Player;
  opponent: Player;
  stats: MatchStats;
  isWinner: boolean;
  onRematch: () => void;
  onFindNewMatch: () => void;
  onGoHome: () => void;
}

export const MatchResult: React.FC<MatchResultProps> = ({
  player,
  opponent,
  stats,
  isWinner,
  onRematch,
  onFindNewMatch,
  onGoHome,
}) => {
  const [copied, setCopied] = useState(false);
  const [rematchRequested, setRematchRequested] = useState(false);
  const [rematchCountdown, setRematchCountdown] = useState(15);

  // Trigger sound & confetti on mount
  useEffect(() => {
    if (isWinner) {
      sound.playWin();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6BBF59', '#4FA8E0', '#F6C945', '#9B84D9'],
      });
    } else {
      sound.playLose();
    }
  }, [isWinner]);

  // F-53: 15-second countdown when rematch is requested
  useEffect(() => {
    if (!rematchRequested) return;

    const timer = setInterval(() => {
      setRematchCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onGoHome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rematchRequested, onGoHome]);

  const handleShare = () => {
    sound.playClick();
    const shareText = `⚔️ BlockType Duel di Monad!\n${
      isWinner ? '🏆 AKU MENANG!' : '💀 Kalah tipis!'
    }\nSkor: ${stats.finalScore.player1} - ${stats.finalScore.player2}\n⚡ Rata-rata WPM: ${stats.averageWpm}\n🎯 Akurasi: ${stats.accuracy}%\nMainkan sekarang: https://github.com/kurvaParabola/TypeStrike`;

    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-3xl mx-auto card-block p-8 md:p-10 my-6 bg-white text-center relative overflow-hidden">
      {/* Result Title (F-50) */}
      <div className="mb-6">
        {isWinner ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blockSun border-4 border-blockText flex items-center justify-center shadow-block mb-3 animate-bounce">
              <Trophy className="w-8 h-8 text-blockText" />
            </div>
            <h2 className="font-pixel text-2xl md:text-3xl text-blockGrass font-black tracking-wide">
              VICTORY!
            </h2>
            <p className="font-mono text-xs text-gray-500 font-bold mt-1">
              Kamu berhasil mencapai 7 hit lebih dulu!
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blockCoral border-4 border-blockText flex items-center justify-center shadow-block mb-3">
              <Skull className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-pixel text-2xl md:text-3xl text-blockCoral font-black tracking-wide">
              DEFEAT
            </h2>
            <p className="font-mono text-xs text-gray-500 font-bold mt-1">
              Lawan mencapai 7 hit lebih dulu. Ayo balas dendam!
            </p>
          </div>
        )}
      </div>

      {/* Avatars Comparison */}
      <div className="flex items-center justify-center gap-8 md:gap-16 my-6 py-4 bg-blockCream border-2 border-blockText rounded-sm shadow-inner">
        {/* Player (Self) */}
        <div className="flex flex-col items-center">
          <Avatar
            config={player.avatar}
            animation={isWinner ? 'win' : 'lose'}
            size="lg"
            facing="right"
            showBadge="KAMU"
          />
          <span className="font-pixel text-sm font-bold text-blockText mt-3">
            {player.nickname}
          </span>
          <span className="font-pixel text-xl font-black text-blockGrass mt-1">
            {stats.finalScore.player1} HIT
          </span>
        </div>

        {/* Score Divider */}
        <div className="font-pixel text-2xl font-black text-blockText">
          -
        </div>

        {/* Opponent */}
        <div className="flex flex-col items-center">
          <Avatar
            config={opponent.avatar}
            animation={isWinner ? 'lose' : 'win'}
            size="lg"
            facing="left"
            showBadge="LAWAN"
          />
          <span className="font-pixel text-sm font-bold text-blockText mt-3">
            {opponent.nickname}
          </span>
          <span className="font-pixel text-xl font-black text-blockCoral mt-1">
            {stats.finalScore.player2} HIT
          </span>
        </div>
      </div>

      {/* Match Stats Grid (F-51) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-6">
        <div className="card-block-sm p-3 text-center">
          <span className="text-[10px] font-pixel text-gray-500 block mb-1">RATA-RATA WPM</span>
          <span className="font-mono text-xl font-bold text-blockGrass">
            {stats.averageWpm}
          </span>
        </div>
        <div className="card-block-sm p-3 text-center">
          <span className="text-[10px] font-pixel text-gray-500 block mb-1">AKURASI</span>
          <span className="font-mono text-xl font-bold text-blockSky">
            {stats.accuracy}%
          </span>
        </div>
        <div className="card-block-sm p-3 text-center">
          <span className="text-[10px] font-pixel text-gray-500 block mb-1">RONDE TERCEPAT</span>
          <span className="font-mono text-xl font-bold text-blockPurple">
            {(stats.fastestRoundMs / 1000).toFixed(1)}s
          </span>
        </div>
        <div className="card-block-sm p-3 text-center">
          <span className="text-[10px] font-pixel text-gray-500 block mb-1">TOTAL RONDE</span>
          <span className="font-mono text-xl font-bold text-blockText">
            {stats.rounds.length}
          </span>
        </div>
      </div>

      {/* Onchain Settlement Info if available */}
      {stats.onchainTxHash && (
        <div className="mb-6 p-3 bg-purple-50 border-2 border-blockPurple rounded-sm flex items-center justify-between text-left">
          <div>
            <span className="font-pixel text-[11px] font-bold text-blockPurple block">
              ⚡ ON-CHAIN SETTLEMENT MONAD
            </span>
            <span className="font-mono text-[11px] text-gray-600 truncate block max-w-md">
              Tx: {stats.onchainTxHash}
            </span>
          </div>
          <a
            href={`https://testnet.monadexplorer.com/tx/${stats.onchainTxHash}`}
            target="_blank"
            rel="noreferrer"
            className="btn-block px-3 py-1 bg-blockPurple text-white text-[11px] font-pixel flex items-center gap-1"
          >
            Explorer <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Action Buttons (F-52 & F-53) */}
      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
        {/* Rematch */}
        <button
          onClick={() => {
            sound.playClick();
            setRematchRequested(true);
            onRematch();
          }}
          disabled={rematchRequested}
          className={`w-full sm:w-auto btn-block px-6 py-3 text-xs md:text-sm font-pixel flex items-center justify-center gap-2 ${
            rematchRequested
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blockGrass hover:bg-emerald-500 text-white'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          {rematchRequested
            ? `Menunggu Lawan (${rematchCountdown}s)...`
            : 'REMATCH'}
        </button>

        {/* Cari Lawan Baru */}
        <button
          onClick={() => {
            sound.playClick();
            onFindNewMatch();
          }}
          className="w-full sm:w-auto btn-block px-6 py-3 bg-blockSky hover:bg-sky-500 text-white text-xs md:text-sm font-pixel flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" /> CARI LAWAN BARU
        </button>

        {/* Bagikan Hasil (F-54) */}
        <button
          onClick={handleShare}
          className="w-full sm:w-auto btn-block px-4 py-3 bg-blockSun hover:bg-yellow-400 text-blockText text-xs md:text-sm font-pixel flex items-center justify-center gap-1.5"
          title="Salin ringkasan hasil pertandingan"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-800" /> : <Share2 className="w-4 h-4" />}
          {copied ? 'TERSALIN!' : 'BAGIKAN'}
        </button>

        {/* Kembali ke Home */}
        <button
          onClick={() => {
            sound.playClick();
            onGoHome();
          }}
          className="w-full sm:w-auto btn-block px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs md:text-sm font-pixel flex items-center justify-center gap-1.5"
        >
          <Home className="w-4 h-4" /> HOME
        </button>
      </div>
    </div>
  );
};
