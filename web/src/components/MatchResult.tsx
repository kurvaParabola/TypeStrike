import React, { useEffect, useState } from 'react';
import type { Player, MatchStats } from '../types';
import { Avatar } from './Avatar';
import { sound } from '../services/sound';
import confetti from 'canvas-confetti';
import { Trophy, Skull, RotateCcw, Search, Home, Share2, Check, ExternalLink, Zap, Heart } from 'lucide-react';

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

  useEffect(() => {
    if (isWinner) {
      sound.playWin();
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.6 },
        colors: ['#6BBF59', '#4FA8E0', '#F6C945', '#9B84D9'],
      });
    } else {
      sound.playLose();
    }
  }, [isWinner]);

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

  const handleShare = async () => {
    sound.playClick();
    const deployLink = typeof window !== 'undefined' ? window.location.origin : 'https://typestrike.vercel.app';
    const shareText = `TypeStrike di Monad!\n${
      isWinner ? 'K.O. VICTORY!' : 'Kalah duel!'
    }\nSisa HP: ${stats.player1FinalHp} HP vs ${stats.player2FinalHp} HP\nSerangan Crit Tertinggi: ${stats.highestCritDamage} DMG\nMainkan sekarang: ${deployLink}`;

    // Try native mobile share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TypeStrike - 1v1 PvP Typing Arena di Monad',
          text: shareText,
          url: deployLink,
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        return;
      } catch {
        // User cancelled or share failed, fallback to clipboard
      }
    }

    // Clipboard copy with fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {
        fallbackCopyText(shareText);
      });
    } else {
      fallbackCopyText(shareText);
    }
  };

  const fallbackCopyText = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignored
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="w-full max-w-3xl mx-auto card-block p-8 md:p-10 my-6 bg-white text-center relative overflow-hidden">
      {/* Result Header */}
      <div className="mb-6">
        {isWinner ? (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blockSun border-4 border-blockText flex items-center justify-center shadow-block mb-3 animate-bounce">
              <Trophy className="w-8 h-8 text-blockText" />
            </div>
            <h2 className="font-pixel text-2xl md:text-3xl text-blockGrass font-black tracking-wide">
              K.O. VICTORY!
            </h2>
            <p className="font-mono text-xs text-gray-500 font-bold mt-1">
              Kamu berhasil menumbangkan HP lawan menjadi 0!
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blockCoral border-4 border-blockText flex items-center justify-center shadow-block mb-3">
              <Skull className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-pixel text-2xl md:text-3xl text-blockCoral font-black tracking-wide">
              K.O. DEFEAT
            </h2>
            <p className="font-mono text-xs text-gray-500 font-bold mt-1">
              HP kamu habis. Ayo coba lagi dan balas serangan lawan!
            </p>
          </div>
        )}
      </div>

      {/* Avatars Duel Result Stage */}
      <div className="flex items-center justify-center gap-8 md:gap-16 my-6 py-4 bg-blockCream border-2 border-blockText rounded-sm shadow-inner">
        {/* Player */}
        <div className="flex flex-col items-center">
          <Avatar
            config={player.avatar}
            role={player.role}
            animation={isWinner ? 'win' : 'lose'}
            size="lg"
            facing="right"
            showBadge="KAMU"
          />
          <span className="font-pixel text-sm font-bold text-blockText mt-3">
            {player.nickname} <span className="text-[10px] text-gray-500 font-pixel">[{player.role}]</span>
          </span>
          <span className={`font-mono text-sm font-black mt-1 flex items-center gap-1 ${
            stats.player1FinalHp > 0 ? 'text-blockGrass' : 'text-gray-400'
          }`}>
            <Heart className="w-3.5 h-3.5 fill-current" /> {stats.player1FinalHp} HP
          </span>
        </div>

        {/* Divider */}
        <div className="font-pixel text-2xl font-black text-blockText">
          VS
        </div>

        {/* Opponent */}
        <div className="flex flex-col items-center">
          <Avatar
            config={opponent.avatar}
            role={opponent.role}
            animation={isWinner ? 'lose' : 'win'}
            size="lg"
            facing="left"
            showBadge="LAWAN"
          />
          <span className="font-pixel text-sm font-bold text-blockText mt-3">
            {opponent.nickname} <span className="text-[10px] text-gray-500 font-pixel">[{opponent.role}]</span>
          </span>
          <span className={`font-mono text-sm font-black mt-1 flex items-center gap-1 ${
            stats.player2FinalHp > 0 ? 'text-blockCoral' : 'text-gray-400'
          }`}>
            <Heart className="w-3.5 h-3.5 fill-current" /> {stats.player2FinalHp} HP
          </span>
        </div>
      </div>

      {/* Combat Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 my-6">
        <div className="card-block-sm p-3 text-center">
          <span className="text-[10px] font-pixel text-gray-500 block mb-1">CRIT TERTINGGI</span>
          <span className="font-mono text-xl font-bold text-blockCoral flex items-center justify-center gap-1">
            <Zap className="w-4 h-4 fill-current text-yellow-500" />
            {stats.highestCritDamage || 22} DMG
          </span>
        </div>
        <div className="card-block-sm p-3 text-center">
          <span className="text-[10px] font-pixel text-gray-500 block mb-1">SISA HP KAMU</span>
          <span className="font-mono text-xl font-bold text-blockGrass">
            {stats.player1FinalHp} / 100
          </span>
        </div>
        <div className="card-block-sm p-3 text-center col-span-2 md:col-span-1">
          <span className="text-[10px] font-pixel text-gray-500 block mb-1">DURASI DUEL</span>
          <span className="font-mono text-xl font-bold text-blockSky">
            {stats.matchDurationSecs} detik
          </span>
        </div>
      </div>

      {/* Onchain Settlement Info if available */}
      {stats.onchainTxHash && (
        <div className={`mb-6 p-3.5 border-2 rounded-sm text-left ${
          isWinner
            ? 'bg-emerald-50 border-blockGrass text-emerald-900'
            : 'bg-purple-50 border-blockPurple text-purple-900'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="font-pixel text-[11px] font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>{isWinner ? '🏆 HADIAH PRIZE POOL BERHASIL DICAIRKAN!' : 'SETTLEMENT ON-CHAIN SELESAI'}</span>
              </span>
              <span className="font-mono text-[11px] text-gray-600 block mt-0.5">
                {isWinner
                  ? 'Koin MON dari smart contract escrow telah dikirim ke wallet kamu!'
                  : 'Pemenang duel telah menerima hadiah Prize Pool on-chain.'}
              </span>
            </div>
            <a
              href={
                stats.onchainTxHash.startsWith('0x') && stats.onchainTxHash.length === 66
                  ? `https://testnet.monadvision.com/tx/${stats.onchainTxHash}`
                  : `https://testnet.monadvision.com/address/0x54dF67541a74121e0C6179757d22Ea466DdcA994`
              }
              target="_blank"
              rel="noreferrer"
              className={`btn-block px-3 py-1.5 text-white text-[11px] font-pixel flex items-center gap-1 shrink-0 ${
                isWinner ? 'bg-blockGrass hover:bg-emerald-500' : 'bg-blockPurple hover:bg-purple-600'
              }`}
            >
              Bukti Tx <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Action Buttons */}
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

        {/* Bagikan */}
        <button
          onClick={handleShare}
          className="w-full sm:w-auto btn-block px-4 py-3 bg-blockSun hover:bg-yellow-400 text-blockText text-xs md:text-sm font-pixel flex items-center justify-center gap-1.5"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-800" /> : <Share2 className="w-4 h-4" />}
          {copied ? 'TERSALIN!' : 'BAGIKAN'}
        </button>

        {/* Home */}
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
