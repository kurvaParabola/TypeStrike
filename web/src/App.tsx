import { useState, useEffect } from 'react';
import type { AvatarConfig, Player, GameScreen, GameMode, PlayerRole, MatchStats } from './types';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { ModeSelect } from './components/ModeSelect';
import { AvatarEditor } from './components/AvatarEditor';
import { RoomLobby } from './components/RoomLobby';
import { Matchmaking } from './components/Matchmaking';
import { Arena } from './components/Arena';
import { MatchResult } from './components/MatchResult';
import { sound } from './services/sound';
import { createAiBot } from './services/matchEngine';
import { getRoleDefinition } from './services/roles';
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
  const [screen, setScreen] = useState<GameScreen>('LANDING');
  const [gameMode, setGameMode] = useState<GameMode>('PRACTICE');

  // Wallet State
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>('0.00');

  // Room & P2P State
  const [_roomCode, setRoomCode] = useState<string>('');
  const [_wagerAmount, setWagerAmount] = useState<string>('0.10');
  const [isP2pMatch, setIsP2pMatch] = useState<boolean>(false);
  const [onchainTxHash, setOnchainTxHash] = useState<string | null>(null);

  // Player state & LocalStorage persistence
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('typestrike_nickname') || localStorage.getItem('blocktype_nickname') || 'Pendekar';
  });

  const [avatar, setAvatar] = useState<AvatarConfig>(() => {
    const saved = localStorage.getItem('typestrike_avatar') || localStorage.getItem('blocktype_avatar');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_AVATAR;
      }
    }
    return DEFAULT_AVATAR;
  });

  // Accessibility & audio settings
  const [isMuted, setIsMuted] = useState(() => sound.isMuted);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [screenShake, setScreenShake] = useState(true);

  // Player role state
  const [role, setRole] = useState<PlayerRole>(() => {
    return (localStorage.getItem('typestrike_role') as PlayerRole) || (localStorage.getItem('blocktype_role') as PlayerRole) || 'FIGHTER';
  });

  // Combatants with dynamic HP based on role
  const initialRoleDef = getRoleDefinition(role);
  const [player, setPlayer] = useState<Player>({
    id: 'p1',
    nickname: nickname || 'Pendekar',
    avatar: avatar,
    role: role,
    hp: initialRoleDef.baseHp,
    maxHp: initialRoleDef.baseHp,
    shieldActive: false,
    hits: 0,
    wpm: 0,
    accuracy: 100,
    progressPercent: 0,
  });

  const [opponent, setOpponent] = useState<Player | null>(null);
  const [matchStartTime, setMatchStartTime] = useState<number>(0);
  const [highestCrit, setHighestCrit] = useState<number>(0);

  // LocalStorage sync
  useEffect(() => {
    localStorage.setItem('typestrike_nickname', nickname);
  }, [nickname]);

  useEffect(() => {
    localStorage.setItem('typestrike_avatar', JSON.stringify(avatar));
  }, [avatar]);

  useEffect(() => {
    localStorage.setItem('typestrike_role', role);
    const roleDef = getRoleDefinition(role);
    setPlayer((prev) => ({
      ...prev,
      role: role,
      hp: roleDef.baseHp,
      maxHp: roleDef.baseHp,
    }));
  }, [role]);

  useEffect(() => {
    setPlayer((prev) => ({
      ...prev,
      nickname: nickname || 'Pendekar',
      avatar: avatar,
    }));
  }, [nickname, avatar]);

  // Start with AI bot directly (Practice Mode)
  const handlePlayWithBot = () => {
    setIsP2pMatch(false);
    setOnchainTxHash(null);
    const matchedOpponent = createAiBot();
    setOpponent(matchedOpponent);
    setScreen('VERSUS');
  };

  // Start match from Room Lobby (1v1 P2P / Wager Mode)
  const handleStartRoomMatch = (
    matchedOpponent: Player,
    wager: string,
    code: string,
    isP2p: boolean = true,
    txHash?: string
  ) => {
    setIsP2pMatch(isP2p);
    setOnchainTxHash(txHash || null);
    setOpponent(matchedOpponent);
    setWagerAmount(wager);
    setRoomCode(code);
    setScreen('VERSUS');
  };

  // Transition from Versus screen to Arena
  const handleVersusComplete = () => {
    const roleDef = getRoleDefinition(role);
    setPlayer((prev) => ({
      ...prev,
      hp: roleDef.baseHp,
      maxHp: roleDef.baseHp,
      shieldActive: false,
    }));

    setOpponent((prev) =>
      prev
        ? {
            ...prev,
            hp: prev.maxHp,
            shieldActive: false,
          }
        : createAiBot()
    );

    setMatchStartTime(Date.now());
    setHighestCrit(0);
    setScreen('ARENA');
  };

  // HP update handlers
  const handleUpdatePlayerHp = (newHp: number, shieldActive: boolean) => {
    setPlayer((prev) => ({
      ...prev,
      hp: newHp,
      shieldActive,
    }));
  };

  const handleUpdateOpponentHp = (newHp: number, shieldActive: boolean) => {
    setOpponent((prev) =>
      prev
        ? {
            ...prev,
            hp: newHp,
            shieldActive,
          }
        : null
    );
  };

  // Match finished (One combatant reached 0 HP)
  const handleMatchFinished = (_winnerId: string, finalCrit: number) => {
    setHighestCrit(finalCrit);
    setTimeout(() => {
      setScreen('RESULT');
    }, 800);
  };

  // Compute final match stats for result screen
  const calculateMatchStats = (): MatchStats => {
    const durationSecs = Math.max(1, Math.round((Date.now() - matchStartTime) / 1000));
    const winnerId = player.hp > 0 ? player.id : (opponent?.id || 'opponent');

    return {
      winnerId,
      finalScore: {
        player1: player.hp,
        player2: opponent?.hp || 0,
      },
      player1FinalHp: player.hp,
      player2FinalHp: opponent?.hp || 0,
      totalWordsTyped: Math.round(durationSecs * 1.2),
      highestCritDamage: highestCrit || 22,
      averageWpm: 75,
      accuracy: 98,
      matchDurationSecs: durationSecs,
      onchainTxHash: onchainTxHash || '0x54dF...A994',
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
        walletAddress={walletAddress}
        onGoHome={() => setScreen('LANDING')}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 w-full max-w-5xl mx-auto">
        {/* Desktop Notice */}
        <div className="lg:hidden w-full mb-3 p-2 bg-amber-100 border border-amber-300 rounded text-center text-xs font-sans font-semibold text-amber-900 flex items-center justify-center gap-1.5">
          <Monitor className="w-3.5 h-3.5" /> Main terbaik di desktop dengan keyboard fisik.
        </div>

        {/* Screen 1: Landing Page (Start + How to play) */}
        {screen === 'LANDING' && (
          <LandingPage onStart={() => setScreen('MODE_SELECT')} />
        )}

        {/* Screen 2: Mode Selection (Practice vs Wager / Wallet connect) */}
        {screen === 'MODE_SELECT' && (
          <ModeSelect
            walletAddress={walletAddress}
            walletBalance={walletBalance}
            onWalletConnected={(addr, bal) => {
              setWalletAddress(addr);
              setWalletBalance(bal);
            }}
            onSelectMode={(mode) => {
              setGameMode(mode);
              setScreen('CUSTOMIZE');
            }}
            onBack={() => setScreen('LANDING')}
          />
        )}

        {/* Screen 3: Avatar Customization */}
        {screen === 'CUSTOMIZE' && (
          <div className="w-full">
            <div className="text-center mb-6">
              <h2 className="font-pixel text-xl md:text-3xl text-blockText font-black tracking-wide mb-2">
                KUSTOMISASI KARAKTER DUEL
              </h2>
              <p className="text-xs md:text-sm font-sans text-gray-600 max-w-lg mx-auto">
                {gameMode === 'PRACTICE'
                  ? 'Atur tampilan avatarmu sebelum latihan melawan Bot AI.'
                  : 'Siapkan karakter petarungmu sebelum memasuki Room Wager on-chain.'}
              </p>
            </div>

            <AvatarEditor
              nickname={nickname}
              onNicknameChange={setNickname}
              avatar={avatar}
              onAvatarChange={setAvatar}
              role={role}
              onRoleChange={setRole}
              gameMode={gameMode}
              onProceed={() => {
                if (gameMode === 'PRACTICE') {
                  handlePlayWithBot();
                } else {
                  setScreen('ROOM_LOBBY');
                }
              }}
              onBack={() => setScreen('MODE_SELECT')}
            />
          </div>
        )}

        {/* Screen 4: Room Lobby (Host generate code / Guest input code) */}
        {screen === 'ROOM_LOBBY' && (
          <RoomLobby
            player={player}
            walletAddress={walletAddress}
            walletBalance={walletBalance}
            onStartMatch={handleStartRoomMatch}
            onBack={() => setScreen('CUSTOMIZE')}
          />
        )}

        {/* Screen 5: Matchmaking Queue / Versus Screen */}
        {(screen === 'QUEUE' || screen === 'VERSUS') && (
          <Matchmaking
            player={player}
            opponent={opponent}
            phase={screen}
            onCancel={() => setScreen(gameMode === 'WAGER' ? 'ROOM_LOBBY' : 'CUSTOMIZE')}
            onPlayWithBot={handlePlayWithBot}
            onVersusComplete={handleVersusComplete}
          />
        )}

        {/* Screen 6: Real-Time Word Combat Arena */}
        {screen === 'ARENA' && opponent && (
          <Arena
            player={player}
            opponent={opponent}
            screenShake={screenShake}
            isP2p={isP2pMatch}
            onUpdatePlayerHp={handleUpdatePlayerHp}
            onUpdateOpponentHp={handleUpdateOpponentHp}
            onMatchFinished={handleMatchFinished}
          />
        )}

        {/* Screen 7: Match Result */}
        {screen === 'RESULT' && opponent && (
          <MatchResult
            player={player}
            opponent={opponent}
            stats={calculateMatchStats()}
            isWinner={player.hp > 0}
            onRematch={handleVersusComplete}
            onFindNewMatch={() => setScreen(gameMode === 'WAGER' ? 'ROOM_LOBBY' : 'MODE_SELECT')}
            onGoHome={() => setScreen('LANDING')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-3 px-4 border-t-2 border-blockText/20 bg-white/60 text-center text-[11px] font-mono text-gray-500">
        TypeStrike · Built for Monad Blitz Hackathon · Contract:{' '}
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
