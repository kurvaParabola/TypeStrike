import React, { useState, useEffect, useRef } from 'react';
import type { Player, CombatWord, FloatingText, PlayerRole } from '../types';
import { Avatar } from './Avatar';
import { sound } from '../services/sound';
import { getNextCombatWord, calculateSpeedDamage } from '../services/matchEngine';
import { Shield, Flame, Zap, Heart, Swords, Wand2, Crosshair } from 'lucide-react';

interface ArenaProps {
  player: Player;
  opponent: Player;
  screenShake: boolean;
  onUpdatePlayerHp: (newHp: number, shieldActive: boolean) => void;
  onUpdateOpponentHp: (newHp: number, shieldActive: boolean) => void;
  onMatchFinished: (winnerId: string, highestCrit: number) => void;
}

export const Arena: React.FC<ArenaProps> = ({
  player,
  opponent,
  screenShake,
  onUpdatePlayerHp,
  onUpdateOpponentHp,
  onMatchFinished,
}) => {
  // Combat Word & Typing
  const [currentWord, setCurrentWord] = useState<CombatWord>(() => getNextCombatWord(player.hp));
  const [userInput, setUserInput] = useState('');
  const [wordStartTime, setWordStartTime] = useState<number>(Date.now());
  const [comboStreak, setComboStreak] = useState(0);
  const [highestCrit, setHighestCrit] = useState(0);

  // Floating Combat Texts (Damage numbers, heals)
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);

  // Flying Letter / Attack Projectiles
  const [projectiles, setProjectiles] = useState<{
    id: string;
    char: string;
    from: 'player' | 'opponent';
    role: PlayerRole;
    buffType?: string;
    isFinisher?: boolean;
  }[]>([]);

  // Impact bursts on avatars
  const [impacts, setImpacts] = useState<{ id: string; x: number; y: number }[]>([]);

  // Screen shake & animations
  const [isShaking, setIsShaking] = useState(false);
  const [playerAttacking, setPlayerAttacking] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);
  const [opponentAttacking, setOpponentAttacking] = useState(false);
  const [opponentHit, setOpponentHit] = useState(false);

  // Initial countdown
  const [countdown, setCountdown] = useState<number | null>(3);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMatchOver = useRef(false);

  // 1. Initial 3-2-1 countdown
  useEffect(() => {
    isMatchOver.current = false;
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
      setWordStartTime(Date.now());
      setTimeout(() => inputRef.current?.focus(), 20);
    }, 3000);

    return () => {
      clearTimeout(c3);
      clearTimeout(c2);
      clearTimeout(c1);
    };
  }, []);

  // Auto-focus immediately when countdown finishes
  useEffect(() => {
    if (countdown === null) {
      inputRef.current?.focus();
    }
  }, [countdown]);

  // Global keydown capture: automatically focus input if user presses any key
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (countdown !== null || isMatchOver.current) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (document.activeElement !== inputRef.current) {
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [countdown]);

  // 2. Spawn Floating Text Helper
  const spawnFloatingText = (
    text: string,
    type: 'damage' | 'crit' | 'heal' | 'shield',
    target: 'player' | 'opponent'
  ) => {
    const id = `${Date.now()}_${Math.random()}`;
    setFloatingTexts((prev) => [...prev, { id, text, type, target }]);

    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 1100);
  };

  // 3. Spawn Flying Letter Projectile & Impact Burst
  const spawnProjectile = (
    char: string,
    from: 'player' | 'opponent',
    buffType?: string,
    isFinisher?: boolean,
    customRole?: PlayerRole
  ) => {
    const id = `proj_${Date.now()}_${Math.random()}`;
    const role = customRole || (from === 'player' ? player.role : opponent.role);
    setProjectiles((prev) => [...prev, { id, char, from, role, buffType, isFinisher }]);

    // Flight duration is 380ms -> trigger impact burst when hitting avatar
    setTimeout(() => {
      const impId = `imp_${Date.now()}_${Math.random()}`;
      const targetX = from === 'player' ? 78 : 22;
      setImpacts((prev) => [...prev, { id: impId, x: targetX, y: 48 }]);

      setTimeout(() => {
        setImpacts((prev) => prev.filter((i) => i.id !== impId));
      }, 350);
    }, 380);

    // Clean up projectile after flight
    setTimeout(() => {
      setProjectiles((prev) => prev.filter((p) => p.id !== id));
    }, 420);
  };

  // 4. Opponent Bot Attack Loop (Types word every 0.9s - 1.5s)
  useEffect(() => {
    if (countdown !== null || isMatchOver.current) return;

    const botAttackInterval = setInterval(() => {
      if (isMatchOver.current) return;

      // Spawn bot attack projectile towards player with opponent's weapon/role
      const botAttackWords = ['TEBAS', 'KILAT', 'TUSUK', 'SERANG', 'HANTAM'];
      const botWord = botAttackWords[Math.floor(Math.random() * botAttackWords.length)];
      spawnProjectile(botWord, 'opponent', undefined, false, opponent.role);

      // Bot attacks player
      const botDamage = 10 + Math.floor(Math.random() * 8);

      // ROGUE Passive: 15% chance to dodge attack
      if (player.role === 'ROGUE' && Math.random() < 0.15) {
        sound.playShield();
        spawnFloatingText('DODGE!', 'shield', 'player');
        return;
      }

      if (player.shieldActive) {
        // Player blocks attack with shield!
        sound.playShield();
        onUpdatePlayerHp(player.hp, false);
        spawnFloatingText('BLOCKED!', 'shield', 'player');
      } else {
        // Player takes damage
        const newPlayerHp = Math.max(0, player.hp - botDamage);
        setOpponentAttacking(true);
        setPlayerHit(true);
        sound.playHit();

        if (screenShake) {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 300);
        }

        spawnFloatingText(`-${botDamage}`, 'damage', 'player');
        onUpdatePlayerHp(newPlayerHp, false);

        setTimeout(() => {
          setOpponentAttacking(false);
          setPlayerHit(false);
        }, 350);

        // Check if player died
        if (newPlayerHp <= 0) {
          isMatchOver.current = true;
          clearInterval(botAttackInterval);
          onMatchFinished(opponent.id, highestCrit);
        }
      }
    }, 1100 + Math.random() * 600);

    return () => clearInterval(botAttackInterval);
  }, [countdown, player.hp, player.shieldActive, opponent.id, onUpdatePlayerHp, onMatchFinished, screenShake, highestCrit]);

  // 5. Handle typing input (case-insensitive, fast feedback, flying letters)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (countdown !== null || isMatchOver.current) return;

    const rawValue = e.target.value.toUpperCase();
    const target = currentWord.word.toUpperCase();

    // User pressed backspace
    if (rawValue.length < userInput.length) {
      setUserInput(rawValue);
      return;
    }

    // Verify prefix match
    if (!target.startsWith(rawValue)) {
      sound.playError();
      return;
    }

    sound.playKeypress();

    // If new letter was typed, launch flying letter projectile with role weapon style!
    if (rawValue.length > userInput.length) {
      const charTyped = rawValue[rawValue.length - 1];
      const isFinisher = rawValue === target;
      spawnProjectile(charTyped, 'player', currentWord.buffType, isFinisher, player.role);
    }

    setUserInput(rawValue);

    // Check if word is completed!
    if (rawValue === target) {
      handleWordCompleted();
    }
  };

  // 5. Word Completed Handler: deals damage, applies buffs, advances word
  const handleWordCompleted = () => {
    const elapsedMs = Math.max(Date.now() - wordStartTime, 150);
    const { damage, isCrit, speedTier } = calculateSpeedDamage(elapsedMs, currentWord.buffType, player.role);

    // Update highest crit stat
    if (damage > highestCrit) {
      setHighestCrit(damage);
    }

    // Play attack sound and animation
    setPlayerAttacking(true);
    setOpponentHit(true);

    if (isCrit) {
      sound.playCrit();
    } else {
      sound.playSlash();
    }

    // Apply Buffs
    let newPlayerHp = player.hp;
    let newShieldActive = player.shieldActive;

    if (currentWord.buffType === 'HEAL') {
      sound.playHeal();
      newPlayerHp = Math.min(player.maxHp, player.hp + 25);
      spawnFloatingText('+25 HP!', 'heal', 'player');
    } else if (currentWord.buffType === 'SHIELD') {
      sound.playShield();
      newShieldActive = true;
      spawnFloatingText('PERISAI AKTIF!', 'shield', 'player');
    }

    onUpdatePlayerHp(newPlayerHp, newShieldActive);

    // Deal damage to opponent
    let newOpponentHp = opponent.hp;
    if (opponent.role === 'ROGUE' && Math.random() < 0.15) {
      // Opponent Rogue dodged!
      sound.playShield();
      spawnFloatingText('DODGE!', 'shield', 'opponent');
    } else if (opponent.shieldActive) {
      // Opponent shielded
      sound.playShield();
      onUpdateOpponentHp(opponent.hp, false);
      spawnFloatingText('BLOCKED!', 'shield', 'opponent');
    } else {
      // Direct damage
      newOpponentHp = Math.max(0, opponent.hp - damage);
      spawnFloatingText(
        `-${damage} ${isCrit ? speedTier : ''}`,
        isCrit ? 'crit' : 'damage',
        'opponent'
      );
      onUpdateOpponentHp(newOpponentHp, false);

      if (screenShake && isCrit) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 300);
      }
    }

    setTimeout(() => {
      setPlayerAttacking(false);
      setOpponentHit(false);
    }, 350);

    // Update combo
    setComboStreak((c) => c + 1);

    // Check if opponent defeated!
    if (newOpponentHp <= 0) {
      isMatchOver.current = true;
      onMatchFinished(player.id, Math.max(highestCrit, damage));
      return;
    }

    // Clear input and immediately fetch next word!
    setUserInput('');
    setWordStartTime(Date.now());
    setCurrentWord(getNextCombatWord(newPlayerHp, currentWord.word));
  };

  // Helper for HP Bar color
  const getHpColor = (hp: number, maxHp: number) => {
    const percent = (hp / maxHp) * 100;
    if (percent > 50) return 'bg-blockGrass';
    if (percent > 30) return 'bg-blockSun';
    return 'bg-blockCoral animate-pulse';
  };

  const isLowHp = player.hp <= 30;

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={`w-full max-w-4xl mx-auto flex flex-col gap-5 my-2 select-none cursor-text ${
        isShaking ? 'screen-shake' : ''
      }`}
    >
      {/* Low HP Rage Warning Banner (< 30% HP) */}
      {isLowHp && (
        <div className="card-block-sm p-2.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 text-white text-center font-pixel text-xs tracking-wider animate-pulse flex items-center justify-center gap-2 shadow-block-sm">
          <Flame className="w-4 h-4 text-yellow-300 animate-bounce" />
          <span>HP DIBAWAH 30%! MODE RAGE AKTIF - KATA BUFF TERBUKA!</span>
          <Flame className="w-4 h-4 text-yellow-300 animate-bounce" />
        </div>
      )}

      {/* Main Duel Stage: HP Bars, Avatars, Floating Damage */}
      <div className="card-block p-6 md:p-8 bg-gradient-to-b from-blockCream to-white relative overflow-hidden">
        {/* Stage Header: HP Bars */}
        <div className="grid grid-cols-2 gap-4 md:gap-8 mb-6">
          {/* Player HP Bar */}
          <div>
            <div className="flex items-center justify-between font-pixel text-xs mb-1">
              <span className="text-blockText font-bold truncate max-w-[140px] flex items-center gap-1">
                <span>{player.nickname}</span>
                <span className="text-[10px] text-gray-500 font-pixel">[{player.role}]</span>
              </span>
              <span className={`font-mono font-bold ${player.hp <= 30 ? 'text-blockCoral' : 'text-gray-700'}`}>
                {player.hp} / {player.maxHp} HP
              </span>
            </div>
            <div className="w-full bg-gray-200 border-2 border-blockText h-4 rounded-xs overflow-hidden relative shadow-inner">
              <div
                className={`h-full transition-all duration-200 ${getHpColor(player.hp, player.maxHp)}`}
                style={{ width: `${(player.hp / player.maxHp) * 100}%` }}
              />
              {player.shieldActive && (
                <div className="absolute inset-0 bg-sky-500/60 border border-sky-300 flex items-center justify-center font-pixel text-[9px] text-white gap-1">
                  <Shield className="w-2.5 h-2.5 fill-white" />
                  <span>SHIELD</span>
                </div>
              )}
            </div>
          </div>

          {/* Opponent HP Bar */}
          <div>
            <div className="flex items-center justify-between font-pixel text-xs mb-1">
              <span className="text-blockText font-bold truncate max-w-[140px] flex items-center gap-1">
                <span>{opponent.nickname}</span>
                <span className="text-[10px] text-gray-500 font-pixel">[{opponent.role}]</span>
              </span>
              <span className={`font-mono font-bold ${opponent.hp <= 30 ? 'text-blockCoral' : 'text-gray-700'}`}>
                {opponent.hp} / {opponent.maxHp} HP
              </span>
            </div>
            <div className="w-full bg-gray-200 border-2 border-blockText h-4 rounded-xs overflow-hidden relative shadow-inner">
              <div
                className={`h-full transition-all duration-200 ${getHpColor(opponent.hp, opponent.maxHp)}`}
                style={{ width: `${(opponent.hp / opponent.maxHp) * 100}%` }}
              />
              {opponent.shieldActive && (
                <div className="absolute inset-0 bg-sky-500/60 border border-sky-300 flex items-center justify-center font-pixel text-[9px] text-white gap-1">
                  <Shield className="w-2.5 h-2.5 fill-white" />
                  <span>SHIELD</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Duel Arena: Avatars, Letter Projectiles & Floating Damage Numbers */}
        <div className="flex items-center justify-between gap-4 relative py-4 min-h-[200px]">
          {/* Flying Letter / Attack Projectiles with Role Weapon Styling */}
          {projectiles.map((p) => {
            const isWizard = p.role === 'WIZARD';
            const isRogue = p.role === 'ROGUE';
            const isFighter = p.role === 'FIGHTER';

            let styleClass = '';
            if (p.buffType === 'HEAL') {
              styleClass = 'bg-emerald-500 text-white border-emerald-700 shadow-block-sm';
            } else if (p.buffType === 'DOUBLE_DMG') {
              styleClass = 'bg-rose-500 text-white border-rose-700 animate-pulse shadow-block-sm';
            } else if (p.buffType === 'SHIELD') {
              styleClass = 'bg-sky-400 text-white border-sky-600 shadow-block-sm';
            } else if (p.from === 'opponent') {
              styleClass = isWizard
                ? 'bg-purple-600 text-white border-purple-900 shadow-block-sm'
                : isRogue
                ? 'bg-slate-800 text-emerald-400 border-slate-950 shadow-block-sm'
                : 'bg-rose-600 text-white border-rose-900 shadow-block-sm';
            } else {
              // Player attacks with role weapon aura
              styleClass = isWizard
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-900 shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                : isRogue
                ? 'bg-gradient-to-r from-slate-900 to-emerald-950 text-emerald-300 border-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                : 'bg-gradient-to-r from-amber-400 to-yellow-400 text-blockText border-amber-800 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
            }

            return (
              <div
                key={p.id}
                className={`absolute z-30 pointer-events-none select-none font-pixel font-black text-xs md:text-sm px-2.5 py-1 rounded border-2 flex items-center gap-1 ${
                  p.from === 'player' ? 'animate-letter-strike' : 'animate-bot-strike'
                } ${styleClass} ${p.isFinisher ? 'ring-2 ring-yellow-300 scale-125' : ''}`}
              >
                {/* Role Weapon Icon */}
                {isWizard && <Wand2 className="w-3 h-3 text-purple-200 shrink-0" />}
                {isRogue && <Crosshair className="w-3 h-3 text-emerald-300 shrink-0" />}
                {isFighter && <Swords className="w-3 h-3 text-amber-950 shrink-0" />}
                <span>{p.char}</span>
              </div>
            );
          })}

          {/* Impact Bursts */}
          {impacts.map((imp) => (
            <div
              key={imp.id}
              style={{ left: `${imp.x}%`, top: `${imp.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-35 pointer-events-none animate-impact"
            >
              <div className="w-14 h-14 rounded-full border-4 border-yellow-300 bg-amber-400/70 flex items-center justify-center font-pixel text-white shadow-block">
                <Zap className="w-7 h-7 text-white fill-white" />
              </div>
            </div>
          ))}

          {/* Player (Left) */}
          <div className="flex flex-col items-center w-5/12 relative">
            {/* Floating text on Player */}
            {floatingTexts
              .filter((f) => f.target === 'player')
              .map((f) => (
                <div
                  key={f.id}
                  className={`absolute -top-10 font-pixel text-sm md:text-base font-black animate-bounce z-30 ${
                    f.type === 'heal'
                      ? 'text-emerald-500 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]'
                      : f.type === 'shield'
                      ? 'text-sky-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]'
                      : 'text-rose-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]'
                  }`}
                >
                  {f.text}
                </div>
              ))}

            <Avatar
              config={player.avatar}
              role={player.role}
              animation={player.hp <= 0 ? 'lose' : userInput.length > 0 ? 'typing' : 'idle'}
              size="lg"
              facing="right"
              showBadge="KAMU"
              isAttacking={playerAttacking}
              isHit={playerHit}
            />

            {/* Combo Streak */}
            {comboStreak > 1 && (
              <span className="mt-2 font-pixel text-[11px] text-blockSun bg-blockText px-2 py-0.5 rounded shadow-block-sm animate-pulse flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>COMBO x{comboStreak}!</span>
              </span>
            )}
          </div>

          {/* VS Center Marker */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-blockSun border-2 border-blockText flex items-center justify-center font-pixel text-xs shadow-block-sm">
              VS
            </div>
          </div>

          {/* Opponent (Right) */}
          <div className="flex flex-col items-center w-5/12 relative">
            {/* Floating text on Opponent */}
            {floatingTexts
              .filter((f) => f.target === 'opponent')
              .map((f) => (
                <div
                  key={f.id}
                  className={`absolute -top-10 font-pixel text-sm md:text-base font-black animate-bounce z-30 ${
                    f.type === 'crit'
                      ? 'text-yellow-400 scale-125 drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]'
                      : f.type === 'shield'
                      ? 'text-sky-400 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]'
                      : 'text-rose-600 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]'
                  }`}
                >
                  {f.text}
                </div>
              ))}

            <Avatar
              config={opponent.avatar}
              role={opponent.role}
              animation={opponent.hp <= 0 ? 'lose' : 'idle'}
              size="lg"
              facing="left"
              showBadge="LAWAN"
              isAttacking={opponentAttacking}
              isHit={opponentHit}
            />
          </div>
        </div>
      </div>

      {/* Word-by-Word Combat Input Card */}
      <div className={`card-block p-6 md:p-8 bg-white relative text-center transition-all ${
        currentWord.buffType !== 'BASIC' ? 'ring-4 ring-yellow-400 shadow-block-lg' : ''
      }`}>
        {/* Countdown Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center z-20 rounded-sm">
            <span className="font-pixel text-6xl text-blockCoral font-black animate-ping">
              {countdown}
            </span>
            <span className="font-pixel text-xs text-gray-500 mt-4 tracking-widest">
              SIAPKAN JARI...
            </span>
          </div>
        )}

        {/* Buff Tag Indicator */}
        {currentWord.buffType !== 'BASIC' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100 border-2 border-blockText rounded-full text-xs font-pixel font-bold text-blockText mb-3 shadow-block-sm animate-pulse">
            {currentWord.buffType === 'HEAL' && <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />}
            {currentWord.buffType === 'DOUBLE_DMG' && <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
            {currentWord.buffType === 'SHIELD' && <Shield className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />}
            <span>KATA BUFF: {currentWord.buffLabel}</span>
          </div>
        )}

        {/* Target Word Display (Large 4-5 chars) */}
        <div className="my-2 py-3 bg-blockCream border-[3px] border-blockText rounded-sm flex items-center justify-center gap-1 shadow-inner">
          {currentWord.word.split('').map((char, index) => {
            const isTyped = index < userInput.length;
            const isCurrent = index === userInput.length;

            return (
              <span
                key={index}
                className={`font-monoTyping text-3xl md:text-5xl font-black px-1.5 tracking-wider transition-colors ${
                  isTyped
                    ? 'text-emerald-600 bg-emerald-100 rounded'
                    : 'text-blockText'
                } ${isCurrent ? 'border-b-4 border-blockText' : ''}`}
              >
                {char}
              </span>
            );
          })}
        </div>

        {/* Active Typing Input */}
        <div className="mt-4 relative max-w-md mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={handleInputChange}
            readOnly={countdown !== null}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            onPaste={(e) => e.preventDefault()}
            placeholder={countdown !== null ? 'Menunggu round mulai...' : 'Ketik kata di atas (langsung ketik)...'}
            className="w-full text-center px-4 py-3 border-[3px] border-blockText rounded-sm font-monoTyping text-2xl font-black text-blockText placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-blockGrass bg-white tracking-widest uppercase cursor-text"
          />
        </div>

        {/* Speed Damage Guidance */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs font-sans text-gray-500">
          <span className="flex items-center gap-1 text-emerald-700 font-bold">
            <Zap className="w-3.5 h-3.5 text-blockGrass" /> Makin Cepat = Makin Keras Damagenya!
          </span>
          {player.shieldActive && (
            <span className="flex items-center gap-1 text-sky-700 font-bold">
              <Shield className="w-3.5 h-3.5" /> Shield Siap Menangkis
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
