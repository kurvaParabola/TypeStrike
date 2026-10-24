import { useState, useEffect, useRef } from 'react';
import type { AvatarConfig, Player, GameScreen, MatchStats, RoundStats } from './types';
import { Header } from './components/Header';
import { AvatarEditor } from './components/AvatarEditor';
import { Matchmaking } from './components/Matchmaking';
import { Arena } from './components/Arena';
import { MatchResult } from './components/MatchResult';
import { sound } from './services/sound';
import { getSentenceForRound, createAiBot } from './services/matchEngine';
import { Monitor } from 'lucide-react';

const DEFAULT_AVATAR: AvatarConfig = {
  skinTone: '#FCD0A1',
  hairStyle: 'pompadour',
  hairColor: '#2B3440',
  expression: 'determined',
  shirtColor: '#6BBF59',
  pantsColor: '#4FA8E0',
  accessory: 'crown',
};

export function App() {
  // Screen router
  const [screen, setScreen] = useState<GameScreen>('HOME');

  // Player state & LocalStorage persistence (F-03)
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('blocktype_nickname') || 'Pendekar';
  });

  const [avatar, setAvatar] = useState<AvatarConfig>(() => {
    const saved = localStorage.getItem('blocktype_avatar');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_AVATAR;
      }
    }
    return DEFAULT_AVATAR;
  });

  // Settings
  const [isMuted, setIsMuted] = useState(() => sound.isMuted);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [screenShake, setScreenShake] = useState(true);

  // Match state
  const [player, setPlayer] = useState<Player>({
    id: 'p1',
    nickname: nickname || 'Pemain',
    avatar: avatar,
    hits: 0,
    wpm: 0,
    accuracy: 100,
    progressPercent: 0,
  });

  const [opponent, setOpponent] = useState<Player | null>(null);
  const [roundNumber, setRoundNumber] = useState(1);
  const [targetSentence, setTargetSentence] = useState('');
  const [roundsStats, setRoundsStats] = useState<RoundStats[]>([]);
  const [lastRoundWinner, setLastRoundWinner] = useState<'player' | 'opponent' | 'timeout' | null>(null);
  const [lastRoundDiffMs, setLastRoundDiffMs] = useState<number>(0);
  const [roundBannerActive, setRoundBannerActive] = useState(false);

  // Bot simulation timer ref
  const botIntervalRef = useRef<number | null>(null);

  // Save nickname and avatar to localStorage on change
  useEffect(() => {
    localStorage.setItem('blocktype_nickname', nickname);
  }, [nickname]);

  useEffect(() => {
    localStorage.setItem('blocktype_avatar', JSON.stringify(avatar));
  }, [avatar]);

  // Sync player object with nickname/avatar
  useEffect(() => {
    setPlayer((prev) => ({
      ...prev,
      nickname: nickname || 'Pemain_1',
      avatar: avatar,
    }));
  }, [nickname, avatar]);

  // Bot typing simulation (F-13)
  useEffect(() => {
    if (screen !== 'ARENA' || !opponent?.isBot || roundBannerActive) {
      if (botIntervalRef.current) clearInterval(botIntervalRef.current);
      return;
    }

    // Bot types with human-like pace: 60-80 WPM
    const botWpm = 65 + Math.floor(Math.random() * 20);
    const totalChars = targetSentence.length || 50;
    const estimatedTotalMs = ((totalChars / 5) / botWpm) * 60 * 1000;
    const intervalStepMs = 150;
    const stepPercent = (intervalStepMs / estimatedTotalMs) * 100;

    let currentPercent = 0;

    botIntervalRef.current = window.setInterval(() => {
      currentPercent += stepPercent + (Math.random() * 2 - 1);

      if (currentPercent >= 100) {
        if (botIntervalRef.current) clearInterval(botIntervalRef.current);
        currentPercent = 100;
        setOpponent((prev) => (prev ? { ...prev, progressPercent: 100 } : null));

        // Opponent bot finished first!
        handleOpponentFinishedRound(estimatedTotalMs);
      } else {
        setOpponent((prev) =>
          prev ? { ...prev, progressPercent: Math.min(currentPercent, 98), wpm: botWpm } : null
        );
      }
    }, intervalStepMs);

    return () => {
      if (botIntervalRef.current) clearInterval(botIntervalRef.current);
    };
  }, [screen, opponent?.isBot, roundNumber, roundBannerActive, targetSentence]);

  // Start matchmaking queue
  const handleStartQueue = () => {
    setScreen('QUEUE');

    // Simulate matchmaking: after 4 seconds, either find opponent or bot
    setTimeout(() => {
      const matchedOpponent = createAiBot();
      setOpponent(matchedOpponent);
      setScreen('VERSUS');
    }, 4000);
  };

  // Start with AI bot directly
  const handlePlayWithBot = () => {
    const matchedOpponent = createAiBot();
    setOpponent(matchedOpponent);
    setScreen('VERSUS');
  };

  // Transition from Versus screen to Arena
  const handleVersusComplete = () => {
    setRoundNumber(1);
    setPlayer((prev) => ({ ...prev, hits: 0, progressPercent: 0 }));
    setOpponent((prev) => (prev ? { ...prev, hits: 0, progressPercent: 0 } : null));
    setRoundsStats([]);
    setTargetSentence(getSentenceForRound(1));
    setScreen('ARENA');
  };

  // Player finished typing sentence correctly (F-25)
  const handlePlayerFinishedSentence = (timeTakenMs: number, wpm: number, accuracy: number) => {
    if (roundBannerActive) return;

    if (botIntervalRef.current) clearInterval(botIntervalRef.current);

    const newHits = player.hits + 1;
    setPlayer((prev) => ({ ...prev, hits: newHits, wpm, accuracy }));

    const roundStat: RoundStats = {
      roundNumber,
      targetSentence,
      winnerId: player.id,
      timeTakenMs,
      wpm,
      accuracy,
    };
    setRoundsStats((prev) => [...prev, roundStat]);

    setLastRoundWinner('player');
    setLastRoundDiffMs(Math.round(400 + Math.random() * 800));
    setRoundBannerActive(true);

    // Check if match won (Rule #6: 7 hits to win)
    if (newHits >= 7) {
      setTimeout(() => {
        setRoundBannerActive(false);
        setScreen('RESULT');
      }, 2000);
      return;
    }

    // Next round after 2 seconds (F-40)
    setTimeout(() => {
      setRoundBannerActive(false);
      setLastRoundWinner(null);
      setRoundNumber((r) => r + 1);
      setTargetSentence(getSentenceForRound(roundNumber + 1));
      setOpponent((prev) => (prev ? { ...prev, progressPercent: 0 } : null));
    }, 2000);
  };

  // Opponent finished first
  const handleOpponentFinishedRound = (botTimeMs: number) => {
    if (roundBannerActive || !opponent) return;

    const newHits = opponent.hits + 1;
    setOpponent((prev) => (prev ? { ...prev, hits: newHits } : null));

    const roundStat: RoundStats = {
      roundNumber,
      targetSentence,
      winnerId: opponent.id,
      timeTakenMs: botTimeMs,
      wpm: opponent.wpm,
      accuracy: 98,
    };
    setRoundsStats((prev) => [...prev, roundStat]);

    setLastRoundWinner('opponent');
    setLastRoundDiffMs(Math.round(300 + Math.random() * 600));
    setRoundBannerActive(true);

    // Check if opponent reached 7 hits
    if (newHits >= 7) {
      setTimeout(() => {
        setRoundBannerActive(false);
        setScreen('RESULT');
      }, 2000);
      return;
    }

    // Next round
    setTimeout(() => {
      setRoundBannerActive(false);
      setLastRoundWinner(null);
      setRoundNumber((r) => r + 1);
      setTargetSentence(getSentenceForRound(roundNumber + 1));
      setOpponent((prev) => (prev ? { ...prev, progressPercent: 0 } : null));
    }, 2000);
  };

  // Round 30s timeout (F-41)
  const handleRoundTimeout = () => {
    setLastRoundWinner('timeout');
    setRoundBannerActive(true);

    setTimeout(() => {
      setRoundBannerActive(false);
      setLastRoundWinner(null);
      setRoundNumber((r) => r + 1);
      setTargetSentence(getSentenceForRound(roundNumber + 1));
      setOpponent((prev) => (prev ? { ...prev, progressPercent: 0 } : null));
    }, 2000);
  };

  // Calculate Match Statistics (F-51)
  const calculateMatchStats = (): MatchStats => {
    const playerRounds = roundsStats.filter((r) => r.winnerId === player.id);
    const avgWpm =
      playerRounds.length > 0
        ? Math.round(playerRounds.reduce((acc, cur) => acc + cur.wpm, 0) / playerRounds.length)
        : 68;

    const avgAcc =
      playerRounds.length > 0
        ? Math.round(playerRounds.reduce((acc, cur) => acc + cur.accuracy, 0) / playerRounds.length)
        : 97;

    const fastestMs =
      playerRounds.length > 0
        ? Math.min(...playerRounds.map((r) => r.timeTakenMs))
        : 5200;

    return {
      winnerId: player.hits >= 7 ? player.id : (opponent?.id || 'opponent'),
      finalScore: {
        player1: player.hits,
        player2: opponent?.hits || 0,
      },
      averageWpm: avgWpm,
      accuracy: avgAcc,
      fastestRoundMs: fastestMs,
      rounds: roundsStats,
      onchainTxHash: '0x8f4b73c21a9e3d8f...74143', // Simulated Monad testnet tx hash
    };
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between ${reduceMotion ? 'motion-reduce' : ''}`}>
      {/* Header */}
      <Header
        isMuted={isMuted}
        onToggleMute={() => setIsMuted(sound.toggleMute())}
        reduceMotion={reduceMotion}
        onToggleReduceMotion={() => setReduceMotion((v) => !v)}
        screenShake={screenShake}
        onToggleScreenShake={() => setScreenShake((v) => !v)}
        onGoHome={() => setScreen('HOME')}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 w-full max-w-6xl mx-auto">
        {/* Responsive Desktop Notice (PRD Section 12) */}
        <div className="lg:hidden w-full mb-3 p-2 bg-amber-100 border border-amber-300 rounded text-center text-xs font-sans font-semibold text-amber-900 flex items-center justify-center gap-1.5">
          <Monitor className="w-3.5 h-3.5" /> Main terbaik di desktop dengan keyboard fisik.
        </div>

        {/* Screen 1: Home & Avatar Editor */}
        {screen === 'HOME' && (
          <div className="w-full">
            <div className="text-center mb-6">
              <h2 className="font-pixel text-xl md:text-3xl text-blockText font-black tracking-wide mb-2">
                ARENA DUEL KETIK CEPAT 1v1
              </h2>
              <p className="text-xs md:text-sm font-sans text-gray-600 max-w-lg mx-auto">
                Kustomisasi karakter blokmu, masuk antrean duel, dan cetak 7 hit lebih dulu untuk menang!
              </p>
            </div>

            <AvatarEditor
              nickname={nickname}
              onNicknameChange={setNickname}
              avatar={avatar}
              onAvatarChange={setAvatar}
              onFindMatch={handleStartQueue}
            />
          </div>
        )}

        {/* Screen 2 & 3: Matchmaking Queue / Versus Screen */}
        {(screen === 'QUEUE' || screen === 'VERSUS') && (
          <Matchmaking
            player={player}
            opponent={opponent}
            phase={screen}
            onCancel={() => setScreen('HOME')}
            onPlayWithBot={handlePlayWithBot}
            onVersusComplete={handleVersusComplete}
          />
        )}

        {/* Screen 4: Arena (Game Core) */}
        {screen === 'ARENA' && opponent && (
          <Arena
            player={player}
            opponent={opponent}
            targetSentence={targetSentence}
            roundNumber={roundNumber}
            screenShake={screenShake}
            onSentenceFinished={handlePlayerFinishedSentence}
            onOpponentHitReceived={() => {}}
            onRoundTimeout={handleRoundTimeout}
            lastRoundWinner={lastRoundWinner}
            lastRoundDiffMs={lastRoundDiffMs}
            roundBannerActive={roundBannerActive}
          />
        )}

        {/* Screen 5: Match Result */}
        {screen === 'RESULT' && opponent && (
          <MatchResult
            player={player}
            opponent={opponent}
            stats={calculateMatchStats()}
            isWinner={player.hits >= 7}
            onRematch={handleVersusComplete}
            onFindNewMatch={handleStartQueue}
            onGoHome={() => setScreen('HOME')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-3 px-4 border-t-2 border-blockText/20 bg-white/60 text-center text-[11px] font-mono text-gray-500">
        BlockType Duel · Built for Monad Blitz Hackathon · Contract:{' '}
        <a
          href="https://testnet.monadexplorer.com/address/0x54dF67541a74121e0C6179757d22Ea466DdcA994"
          target="_blank"
          rel="noreferrer"
          className="text-blockSky font-bold hover:underline"
        >
          0x54dF...A994
        </a>
      </footer>
    </div>
  );
}
export default App;
