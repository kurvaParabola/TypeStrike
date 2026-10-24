import React, { useState, useEffect, useRef } from 'react';
import type { Player } from '../types';
import { Avatar } from './Avatar';
import { sound } from '../services/sound';
import { Timer, Zap, AlertCircle } from 'lucide-react';

interface ArenaProps {
  player: Player;
  opponent: Player;
  targetSentence: string;
  roundNumber: number;
  screenShake: boolean;
  onSentenceFinished: (timeTakenMs: number, wpm: number, accuracy: number) => void;
  onOpponentHitReceived: () => void;
  onRoundTimeout: () => void;
  lastRoundWinner: 'player' | 'opponent' | 'timeout' | null;
  lastRoundDiffMs?: number;
  roundBannerActive: boolean;
}

export const Arena: React.FC<ArenaProps> = ({
  player,
  opponent,
  targetSentence,
  roundNumber,
  screenShake,
  onSentenceFinished,
  onRoundTimeout,
  lastRoundWinner,
  lastRoundDiffMs,
  roundBannerActive,
}) => {
  // Game states
  const [countdown, setCountdown] = useState<number | null>(3);
  const [userInput, setUserInput] = useState('');
  const [roundTimer, setRoundTimer] = useState(30);
  const [startTime, setStartTime] = useState<number>(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [isFinishedWaiting, setIsFinishedWaiting] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Animation triggers
  const [playerAttacking, setPlayerAttacking] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);
  const [opponentAttacking, setOpponentAttacking] = useState(false);
  const [opponentHit, setOpponentHit] = useState(false);

  // DOM ref for persistent focus
  const inputRef = useRef<HTMLInputElement>(null);

  // 1. Initial 3-2-1 Countdown (F-20)
  useEffect(() => {
    setCountdown(3);
    setUserInput('');
    setIsFinishedWaiting(false);
    setRoundTimer(30);

    sound.playCountdown(false);

    const c3 = setTimeout(() => {
      setCountdown(2);
      sound.playCountdown(false);
    }, 1000);

    const c2 = setTimeout(() => {
      setCountdown(1);
      sound.playCountdown(false);
    }, 2000);

    const c1 = setTimeout(() => {
      setCountdown(null);
      sound.playCountdown(true);
      setStartTime(Date.now());
      inputRef.current?.focus();
    }, 3000);

    return () => {
      clearTimeout(c3);
      clearTimeout(c2);
      clearTimeout(c1);
    };
  }, [roundNumber]);

  // 2. Round Timer Countdown 30s (F-28)
  useEffect(() => {
    if (countdown !== null || roundBannerActive || isFinishedWaiting) return;

    const timer = setInterval(() => {
      setRoundTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onRoundTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, roundBannerActive, isFinishedWaiting, onRoundTimeout]);

  // 3. Persistent focus: clicking anywhere on screen refocuses input (F-22)
  const handleContainerClick = () => {
    if (countdown === null && !isFinishedWaiting && !roundBannerActive) {
      inputRef.current?.focus();
    }
  };

  // 4. Hit animations when a round winner is declared (F-30)
  useEffect(() => {
    if (lastRoundWinner === 'player') {
      setPlayerAttacking(true);
      setOpponentHit(true);
      sound.playHit();
      if (screenShake) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
      }
      setTimeout(() => {
        setPlayerAttacking(false);
        setOpponentHit(false);
      }, 600);
    } else if (lastRoundWinner === 'opponent') {
      setOpponentAttacking(true);
      setPlayerHit(true);
      sound.playHit();
      if (screenShake) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 400);
      }
      setTimeout(() => {
        setOpponentAttacking(false);
        setPlayerHit(false);
      }, 600);
    }
  }, [lastRoundWinner, screenShake]);

  // 5. Typing Input Handler with strict error backspace requirement (F-23 & F-24)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (countdown !== null || isFinishedWaiting || roundBannerActive) return;

    const value = e.target.value;
    setTotalKeystrokes((prev) => prev + 1);

    // Check if the current typed input matches prefix of target sentence
    const isPrefixCorrect = targetSentence.startsWith(value);

    // If typing an error, don't allow typing beyond 1 incorrect char (must backspace)
    if (!isPrefixCorrect) {
      // Find where mismatch occurred
      let mismatchIndex = 0;
      while (
        mismatchIndex < value.length &&
        mismatchIndex < targetSentence.length &&
        value[mismatchIndex] === targetSentence[mismatchIndex]
      ) {
        mismatchIndex++;
      }

      // If already at mismatch, allow only up to mismatchIndex + 1 (prevent typing forward without backspacing)
      if (value.length > mismatchIndex + 1) {
        sound.playError();
        return;
      }
      sound.playError();
    } else {
      sound.playKeypress();
    }

    setUserInput(value);

    // Check completion (F-25)
    if (value === targetSentence) {
      setIsFinishedWaiting(true);
      const elapsedMs = Math.max(Date.now() - startTime, 1000);
      const words = targetSentence.split(' ').length;
      const wpm = Math.round(words / (elapsedMs / 1000 / 60));
      const accuracy = Math.round((targetSentence.length / (totalKeystrokes + 1)) * 100);

      onSentenceFinished(elapsedMs, wpm, Math.min(accuracy, 100));
    }
  };

  // Render character feedback (F-23)
  const renderSentenceFeedback = () => {
    return (
      <div className="font-monoTyping text-xl md:text-2xl leading-relaxed tracking-wide select-none break-words">
        {targetSentence.split('').map((char, index) => {
          let charClass = 'text-gray-400'; // unentered
          let isCurrent = false;

          if (index < userInput.length) {
            if (userInput[index] === char) {
              charClass = 'text-emerald-700 font-bold bg-emerald-100 rounded-xs px-[1px]'; // correct
            } else {
              charClass = 'text-rose-600 font-bold bg-rose-200 underline decoration-wavy decoration-rose-500 rounded-xs px-[1px]'; // error
            }
          } else if (index === userInput.length) {
            isCurrent = true;
          }

          return (
            <span key={index} className={`relative ${charClass}`}>
              {isCurrent && (
                <span className="inline-block w-2.5 h-6 bg-blockText align-middle animate-block-cursor -mr-2.5" />
              )}
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  // Render 7-Hit Scoreboard Block Slots (F-27)
  const renderHitSlots = (hits: number, isSelf: boolean) => {
    const slots = [];
    for (let i = 0; i < 7; i++) {
      const isFilled = i < hits;
      slots.push(
        <div
          key={i}
          className={`w-7 h-7 md:w-8 md:h-8 rounded-xs border-2 border-blockText flex items-center justify-center font-pixel text-xs transition-all duration-300 ${
            isFilled
              ? isSelf
                ? 'bg-blockGrass text-white shadow-block-sm scale-105'
                : 'bg-blockPurple text-white shadow-block-sm scale-105'
              : 'bg-gray-200 text-gray-400'
          }`}
          title={`Hit Slot ${i + 1}/7`}
        >
          {isFilled ? '⚔️' : ''}
        </div>
      );
    }
    return slots;
  };

  // Calculate live player WPM
  const elapsedSecs = Math.max((Date.now() - startTime) / 1000, 1);
  const liveWpm = Math.round((userInput.length / 5) / (elapsedSecs / 60));

  return (
    <div
      onClick={handleContainerClick}
      className={`w-full max-w-5xl mx-auto flex flex-col gap-6 my-4 select-none cursor-text ${
        isShaking ? 'screen-shake' : ''
      }`}
    >
      {/* Top Bar: Round & 30s Timer */}
      <div className="card-block px-6 py-3 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <span className="font-pixel text-sm md:text-base font-bold text-blockText">
            RONDE {roundNumber}
          </span>
          <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
            Target 7 Hit
          </span>
        </div>

        {/* Round Timer (F-28) */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded border-2 border-blockText font-mono font-bold text-sm ${
            roundTimer <= 5 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-blockCream text-blockText'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>{roundTimer}s</span>
        </div>
      </div>

      {/* Duel Arena: Two Avatars & 7-Hit Scoreboards */}
      <div className="card-block p-6 md:p-8 bg-gradient-to-b from-blockCream to-white relative overflow-hidden">
        {/* Opponent Progress Lane (F-26) */}
        <div className="w-full bg-gray-200 border-2 border-blockText rounded-xs h-3 mb-6 relative overflow-hidden shadow-inner">
          <div
            className="h-full bg-blockCoral transition-all duration-200"
            style={{ width: `${opponent.progressPercent}%` }}
          />
          <span className="absolute right-2 -top-4 text-[10px] font-mono font-bold text-gray-600">
            Lawan: {Math.round(opponent.progressPercent)}%
          </span>
        </div>

        {/* Character Stage & Scoreboards */}
        <div className="flex items-center justify-between gap-4 relative py-2">
          {/* Player 1 (Left) */}
          <div className="flex flex-col items-center gap-2 w-5/12">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-pixel text-xs md:text-sm font-bold text-blockText truncate max-w-[140px]">
                {player.nickname}
              </span>
            </div>

            {/* 7-Slot Scoreboard (F-27) */}
            <div className="flex gap-1 mb-3">
              {renderHitSlots(player.hits, true)}
            </div>

            {/* Avatar with animation states */}
            <div className="my-2">
              <Avatar
                config={player.avatar}
                animation={player.hits >= 7 ? 'win' : userInput.length > 0 ? 'typing' : 'idle'}
                size="lg"
                facing="right"
                showBadge="KAMU"
                isAttacking={playerAttacking}
                isHit={playerHit}
              />
            </div>

            {/* Live Speed */}
            <div className="font-mono text-xs font-bold text-blockGrass bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
              ⚡ {liveWpm} WPM
            </div>
          </div>

          {/* VS Center Marker */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-blockSun border-2 border-blockText flex items-center justify-center font-pixel text-xs shadow-block-sm">
              VS
            </div>
          </div>

          {/* Player 2 / Opponent (Right) */}
          <div className="flex flex-col items-center gap-2 w-5/12">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-pixel text-xs md:text-sm font-bold text-blockText truncate max-w-[140px]">
                {opponent.nickname}
              </span>
              {opponent.isBot && (
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-1 rounded border border-amber-300">
                  BOT
                </span>
              )}
            </div>

            {/* 7-Slot Scoreboard (F-27) */}
            <div className="flex gap-1 mb-3">
              {renderHitSlots(opponent.hits, false)}
            </div>

            {/* Opponent Avatar */}
            <div className="my-2">
              <Avatar
                config={opponent.avatar}
                animation={opponent.hits >= 7 ? 'win' : opponent.progressPercent > 0 ? 'typing' : 'idle'}
                size="lg"
                facing="left"
                showBadge="LAWAN"
                isAttacking={opponentAttacking}
                isHit={opponentHit}
              />
            </div>

            {/* Opponent Speed */}
            <div className="font-mono text-xs font-bold text-blockPurple bg-purple-50 px-2 py-0.5 rounded border border-purple-300">
              ⚡ {opponent.wpm || 65} WPM
            </div>
          </div>
        </div>
      </div>

      {/* Typing Card (F-21 & F-23) */}
      <div className="card-block p-6 md:p-8 bg-white relative">
        {/* Countdown Overlay (F-20) */}
        {countdown !== null && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center z-20 rounded-sm">
            <span className="font-pixel text-5xl md:text-6xl text-blockCoral font-black animate-ping">
              {countdown}
            </span>
            <span className="font-pixel text-xs text-gray-500 mt-4 tracking-widest">
              SIAPKAN JARI...
            </span>
          </div>
        )}

        {/* Round Result Quick Banner (F-40 & F-41) */}
        {roundBannerActive && (
          <div className="absolute inset-0 bg-blockCream/95 flex flex-col items-center justify-center z-30 rounded-sm p-4 text-center">
            {lastRoundWinner === 'player' ? (
              <div className="animate-bounce">
                <span className="font-pixel text-lg md:text-xl text-blockGrass font-bold block mb-1">
                  💥 KAMU MENCETAK HIT! (+1)
                </span>
                <span className="text-xs font-mono font-semibold text-gray-600">
                  Lebih cepat {lastRoundDiffMs ? (lastRoundDiffMs / 1000).toFixed(2) : '0.4'}s dari lawan!
                </span>
              </div>
            ) : lastRoundWinner === 'opponent' ? (
              <div>
                <span className="font-pixel text-lg md:text-xl text-blockCoral font-bold block mb-1">
                  🛡️ LAWAN MENCETAK HIT! (+1)
                </span>
                <span className="text-xs font-mono font-semibold text-gray-600">
                  Lawan selesai lebih dulu. Jangan menyerah!
                </span>
              </div>
            ) : (
              <div>
                <span className="font-pixel text-base md:text-lg text-amber-700 font-bold block mb-1">
                  ⏰ WAKTU HABIS (SERI)!
                </span>
                <span className="text-xs font-mono text-gray-600">
                  Tidak ada yang selesai dalam 30 detik. Lanjut ronde berikutnya.
                </span>
              </div>
            )}
            <span className="text-[11px] font-mono text-gray-400 mt-3 animate-pulse">
              Mempersiapkan kalimat baru...
            </span>
          </div>
        )}

        {/* Target Sentence Display (F-21) */}
        <div className="mb-6 p-4 bg-blockCream border-2 border-blockText rounded-sm min-h-[90px] flex items-center">
          {renderSentenceFeedback()}
        </div>

        {/* Hidden / Focused Input (F-22 & F-29) */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            disabled={countdown !== null || roundBannerActive || isFinishedWaiting}
            onPaste={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            placeholder={
              countdown !== null
                ? 'Menunggu countdown...'
                : isFinishedWaiting
                ? 'Kalimat selesai! Menunggu hasil...'
                : 'Ketik kalimat persis sama di sini...'
            }
            className={`w-full px-4 py-3.5 border-[3px] border-blockText rounded-sm font-monoTyping text-lg font-bold text-blockText placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blockGrass bg-white ${
              isFinishedWaiting ? 'bg-emerald-50 border-blockGrass' : ''
            }`}
          />

          {isFinishedWaiting && (
            <div className="mt-2 text-xs font-mono font-bold text-blockGrass flex items-center gap-1.5 animate-pulse">
              <Zap className="w-3.5 h-3.5" /> Kalimat selesai! Menunggu sinkronisasi ronde...
            </div>
          )}
        </div>

        {/* Helper Footer */}
        <div className="mt-3 flex items-center justify-between text-xs text-gray-500 font-sans">
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Klik di mana saja untuk fokus mengetik
          </span>
          <span className="font-mono text-gray-400">
            {userInput.length} / {targetSentence.length} karakter
          </span>
        </div>
      </div>
    </div>
  );
};
