import React, { useEffect, useState } from 'react';
import type { Player } from '../types';
import { Avatar } from './Avatar';
import { sound } from '../services/sound';
import { Swords, Bot, Loader2, ArrowLeft } from 'lucide-react';

interface MatchmakingProps {
  player: Player;
  opponent: Player | null;
  phase: 'QUEUE' | 'VERSUS';
  onCancel: () => void;
  onPlayWithBot: () => void;
  onVersusComplete: () => void;
}

export const Matchmaking: React.FC<MatchmakingProps> = ({
  player,
  opponent,
  phase,
  onCancel,
  onPlayWithBot,
  onVersusComplete,
}) => {
  const [queueTimer, setQueueTimer] = useState(0);
  const [showBotOption, setShowBotOption] = useState(false);

  // Queue timer ticker
  useEffect(() => {
    if (phase !== 'QUEUE') return;

    const interval = setInterval(() => {
      setQueueTimer((prev) => {
        const next = prev + 1;
        // F-13: If 20 seconds passed without opponent, offer bot match
        if (next >= 15) {
          setShowBotOption(true);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase]);

  // Versus countdown (F-12: 2.5 seconds)
  useEffect(() => {
    if (phase !== 'VERSUS') return;

    sound.playCountdown(false);
    const timer = setTimeout(() => {
      onVersusComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [phase, onVersusComplete]);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Phase 1: Queueing
  if (phase === 'QUEUE') {
    return (
      <div className="w-full max-w-xl mx-auto card-block p-8 flex flex-col items-center justify-center text-center my-8 bg-white relative">
        {/* Animated Avatar waiting */}
        <div className="my-6">
          <Avatar config={player.avatar} animation="idle" size="lg" showBadge="KAMU" />
        </div>

        <h2 className="font-pixel text-lg text-blockText font-bold mb-1 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-blockSky" />
          MENCARI LAWAN DUEL...
        </h2>

        {/* Timer (F-10) */}
        <div className="mt-2 px-4 py-1.5 bg-blockCream border-2 border-blockText rounded-sm font-mono font-bold text-sm text-blockText shadow-block-sm">
          Waktu Menunggu: {formatTime(queueTimer)}
        </div>

        <p className="text-xs text-gray-500 mt-4 max-w-sm">
          Menghubungkan ke matchmaking server Monad. Siapkan jarimu untuk duel ketik 1v1!
        </p>

        {/* F-13: Bot option if waiting >= 15-20s */}
        {showBotOption && (
          <div className="w-full mt-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-sm card-block-sm flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-amber-900 font-pixel text-xs font-bold">
              <Bot className="w-4 h-4 text-amber-600" /> Antrean agak sepi?
            </div>
            <p className="text-xs text-amber-800">
              Kamu bisa langsung latihan duel melawan AI Bot (Bot berlatih mengetik).
            </p>
            <button
              onClick={() => {
                sound.playClick();
                onPlayWithBot();
              }}
              className="btn-block px-4 py-2 bg-blockSun hover:bg-yellow-400 text-blockText text-xs font-pixel flex items-center gap-1.5"
            >
              <Bot className="w-4 h-4" /> MAIN LAWAN BOT SEKARANG
            </button>
          </div>
        )}

        {/* Cancel Button (F-11) */}
        <div className="mt-8 pt-4 border-t-2 border-gray-100 w-full flex justify-center">
          <button
            onClick={() => {
              sound.playClick();
              onCancel();
            }}
            className="btn-block px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-pixel flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> BATALKAN ANTREAN
          </button>
        </div>
      </div>
    );
  }

  // Phase 2: Versus Screen (F-12: 2-3s facing each other)
  return (
    <div className="w-full max-w-3xl mx-auto card-block p-8 md:p-12 my-6 bg-gradient-to-b from-white via-blockCream to-blockBg text-center overflow-hidden relative">
      <div className="font-pixel text-xs text-blockSky font-bold tracking-widest uppercase mb-4 animate-pulse flex items-center justify-center gap-2">
        <Swords className="w-4 h-4" />
        <span>LAWAN DITEMUKAN!</span>
        <Swords className="w-4 h-4" />
      </div>

      <div className="flex flex-col md:flex-row items-center justify-around gap-6 my-6">
        {/* Player 1 (Left) */}
        <div className="flex flex-col items-center">
          <div className="transform hover:scale-105 transition-transform">
            <Avatar config={player.avatar} animation="idle" size="lg" facing="right" showBadge="KAMU" />
          </div>
          <div className="mt-4 px-4 py-1.5 bg-white border-[3px] border-blockText rounded shadow-block text-center">
            <span className="font-pixel text-sm font-bold text-blockText block">
              {player.nickname}
            </span>
            <span className="text-[10px] font-pixel text-blockGrass font-bold block">
              [{player.role}] · {player.maxHp} HP
            </span>
          </div>
        </div>

        {/* VS Emblem */}
        <div className="flex flex-col items-center justify-center my-2">
          <div className="w-16 h-16 rounded-full bg-blockCoral border-4 border-blockText flex items-center justify-center shadow-block animate-bounce">
            <Swords className="w-8 h-8 text-white" />
          </div>
          <span className="font-pixel text-2xl font-black text-blockCoral mt-2 tracking-wider">
            VS
          </span>
        </div>

        {/* Player 2 / Opponent (Right) */}
        {opponent && (
          <div className="flex flex-col items-center">
            <div className="transform hover:scale-105 transition-transform">
              <Avatar config={opponent.avatar} animation="idle" size="lg" facing="left" showBadge="LAWAN" />
            </div>
            <div className="mt-4 px-4 py-1.5 bg-white border-[3px] border-blockText rounded shadow-block text-center">
              <span className="font-pixel text-sm font-bold text-blockText block">
                {opponent.nickname}
              </span>
              <span className="text-[10px] font-pixel text-blockSky font-bold block">
                [{opponent.role}] · {opponent.maxHp} HP
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 font-pixel text-xs text-gray-500 animate-pulse">
        MEMASUKI ARENA PERTARUNGAN...
      </div>
    </div>
  );
};
