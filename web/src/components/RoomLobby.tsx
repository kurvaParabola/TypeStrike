import React, { useState } from 'react';
import {
  Crown,
  Users,
  Copy,
  Check,
  LogIn,
  ArrowLeft,
  Coins,
  Swords,
  RefreshCw,
  AlertCircle,
  Radio,
  CheckCircle2,
  User,
} from 'lucide-react';
import { sound } from '../services/sound';
import type { Player } from '../types';
import { createAiBot } from '../services/matchEngine';

interface RoomLobbyProps {
  player: Player;
  walletAddress: string | null;
  walletBalance: string;
  onStartMatch: (opponent: Player, wagerMon: string, roomCode: string) => void;
  onBack: () => void;
}

const WAGER_OPTIONS = ['0.05', '0.10', '0.25', '0.50', '1.00'];

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  player,
  walletAddress,
  walletBalance,
  onStartMatch,
  onBack,
}) => {
  const [tab, setTab] = useState<'create' | 'join'>('create');

  // Host state
  const [wager, setWager] = useState<string>('0.10');
  const [generatedCode, setGeneratedCode] = useState<string>(() => {
    return 'MON-' + Math.floor(1000 + Math.random() * 9000);
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [isWaitingForPlayer, setIsWaitingForPlayer] = useState<boolean>(false);
  const [joinedGuest, setJoinedGuest] = useState<Player | null>(null);

  // Guest state
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [joinError, setJoinError] = useState<string | null>(null);

  // Regenerate room code
  const handleRegenerateCode = () => {
    sound.playClick();
    const newCode = 'MON-' + Math.floor(1000 + Math.random() * 9000);
    setGeneratedCode(newCode);
    setCopied(false);
    setJoinedGuest(null);
    setIsWaitingForPlayer(false);
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Start hosting / wait for opponent
  const handleHostRoom = () => {
    sound.playClick();
    setIsWaitingForPlayer(true);

    // Simulate guest joining after 2.5 seconds for testnet demo
    setTimeout(() => {
      const challenger = createAiBot();
      challenger.nickname = 'MonadChallenger';
      setJoinedGuest(challenger);
      setIsWaitingForPlayer(false);
    }, 2500);
  };

  // Guest joins room
  const handleJoinRoom = () => {
    sound.playClick();
    const cleanCode = joinCodeInput.trim().toUpperCase();
    if (!cleanCode) {
      setJoinError('Harap masukkan kode room terlebih dahulu.');
      return;
    }
    if (cleanCode.length < 6) {
      setJoinError('Format kode room tidak valid (contoh: MON-1234).');
      return;
    }

    setJoinError(null);
    const hostOpponent = createAiBot();
    hostOpponent.nickname = 'MasterRoomHost';

    onStartMatch(hostOpponent, '0.10', cleanCode);
  };

  // Host starts the duel once guest joined
  const handleStartDuelAsHost = () => {
    if (joinedGuest) {
      sound.playClick();
      onStartMatch(joinedGuest, wager, generatedCode);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-4 select-none">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="font-pixel text-xl md:text-3xl text-blockText font-black tracking-wide mb-1">
          LOBBY ROOM ON-CHAIN
        </h2>
        <p className="text-xs md:text-sm text-gray-600 font-sans">
          Buat room sebagai Master atau masukkan kode undangan dari lawan tandingmu.
        </p>
      </div>

      {/* Profile & Wallet info bar */}
      <div className="card-block p-3 mb-6 bg-purple-50/70 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-blockText font-bold">
          <User className="w-4 h-4 text-blockPurple" />
          <span>PEMAIN: <span className="text-blockPurple">{player.nickname}</span></span>
        </div>
        {walletAddress ? (
          <div className="font-bold text-blockText">
            SALDO: <span className="text-blockPurple">{walletBalance} MON</span>
          </div>
        ) : (
          <span className="text-gray-500 text-[11px]">MODE ROOM</span>
        )}
      </div>

      {/* Tabs: Buat Room (Host) vs Gabung Room (Join) */}
      <div className="flex border-b-2 border-blockText mb-6 gap-2">
        <button
          onClick={() => {
            sound.playClick();
            setTab('create');
          }}
          className={`flex-1 py-3 px-4 font-pixel text-xs md:text-sm flex items-center justify-center gap-2 border-t-2 border-x-2 border-blockText rounded-t-sm transition-all ${
            tab === 'create'
              ? 'bg-blockPurple text-white font-bold -mb-[2px] shadow-block-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>BUAT ROOM (MASTER)</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setTab('join');
          }}
          className={`flex-1 py-3 px-4 font-pixel text-xs md:text-sm flex items-center justify-center gap-2 border-t-2 border-x-2 border-blockText rounded-t-sm transition-all ${
            tab === 'join'
              ? 'bg-blockSky text-white font-bold -mb-[2px] shadow-block-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>GABUNG ROOM (INPUT CODE)</span>
        </button>
      </div>

      {/* Tab 1: Buat Room (Master / Host) */}
      {tab === 'create' && (
        <div className="card-block p-6 bg-white space-y-6">
          {/* Wager Selection */}
          <div>
            <label className="block font-pixel text-xs text-blockText mb-2.5 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-blockPurple" /> JUMLAH TARUHAN POOL (MON)
            </label>
            <div className="grid grid-cols-5 gap-2">
              {WAGER_OPTIONS.map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    sound.playClick();
                    setWager(val);
                  }}
                  className={`py-2 px-1 text-center font-mono font-bold text-xs border-2 border-blockText rounded transition-all ${
                    wager === val
                      ? 'bg-blockPurple text-white shadow-block-sm scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {val} MON
                </button>
              ))}
            </div>
            <p className="text-[11px] font-sans text-gray-500 mt-2">
              Total pot taruhan pemenang: <strong>{(parseFloat(wager) * 2 * 0.95).toFixed(2)} MON</strong> (setelah 5% protocol fee).
            </p>
          </div>

          {/* Generated Room Code Box */}
          <div className="p-4 bg-blockCream border-2 border-blockText rounded">
            <span className="block font-pixel text-[10px] text-gray-500 mb-1">
              KODE UNDANGAN ROOM (BAGIKAN KE TEMAN)
            </span>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-2xl md:text-3xl font-black text-blockText tracking-widest">
                {generatedCode}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRegenerateCode}
                  className="btn-block p-2 bg-white text-gray-700 hover:bg-gray-100"
                  title="Acak Kode Baru"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCopyCode}
                  className="btn-block px-3 py-2 bg-blockPurple text-white font-pixel text-xs flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>TERSALIN!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>SALIN KODE</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Host Action: Wait or Start */}
          {!isWaitingForPlayer && !joinedGuest && (
            <button
              onClick={handleHostRoom}
              className="btn-block w-full py-4 bg-blockGrass hover:bg-emerald-500 text-white font-pixel text-sm flex items-center justify-center gap-2"
            >
              <Radio className="w-5 h-5 animate-pulse" />
              <span>BUKA ROOM & TUNGGU LAWAN</span>
            </button>
          )}

          {isWaitingForPlayer && (
            <div className="p-4 border-2 border-dashed border-blockPurple rounded bg-purple-50 flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-3 border-blockPurple border-t-transparent rounded-full animate-spin" />
              <span className="font-pixel text-xs text-blockPurple">
                MENUNGGU PEMAIN 2 BERGABUNG...
              </span>
            </div>
          )}

          {joinedGuest && (
            <div className="p-4 bg-emerald-50 border-2 border-blockGrass rounded space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blockGrass" />
                  <span className="font-pixel text-xs text-emerald-800 font-bold">
                    LAWAN SIAP BERTANDING: {joinedGuest.nickname}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-700">READY</span>
              </div>

              <button
                onClick={handleStartDuelAsHost}
                className="btn-block w-full py-3.5 bg-blockGrass hover:bg-emerald-500 text-white font-pixel text-sm flex items-center justify-center gap-2"
              >
                <Swords className="w-5 h-5" />
                <span>MULAI DUEL SEKARANG</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Gabung Room (Guest Input Code) */}
      {tab === 'join' && (
        <div className="card-block p-6 bg-white space-y-6">
          <div>
            <label className="block font-pixel text-xs text-blockText mb-2.5 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blockSky" /> MASUKKAN KODE INVITE ROOM
            </label>
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => {
                setJoinCodeInput(e.target.value.toUpperCase());
                setJoinError(null);
              }}
              placeholder="Contoh: MON-7821"
              maxLength={10}
              className="w-full px-4 py-3 border-[3px] border-blockText rounded-sm font-mono text-xl font-black text-blockText placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blockSky bg-blockCream uppercase tracking-widest text-center"
            />
            {joinError && (
              <p className="mt-2 text-xs font-sans font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{joinError}</span>
              </p>
            )}
          </div>

          <div className="p-4 bg-sky-50 border-2 border-blockSky rounded text-xs font-sans text-sky-900 space-y-1.5">
            <p className="font-bold font-pixel text-[11px]">PETUNJUK GABUNG:</p>
            <p>1. Minta kode room 8 karakter dari temanmu yang membuat room.</p>
            <p>2. Pastikan saldo MON di wallet mencukupi jumlah taruhan room.</p>
            <p>3. Klik "GABUNG KE ARENA DUEL" untuk langsung bertanding.</p>
          </div>

          <button
            onClick={handleJoinRoom}
            className="btn-block w-full py-4 bg-blockSky hover:bg-sky-500 text-white font-pixel text-sm flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            <span>GABUNG KE ARENA DUEL</span>
          </button>
        </div>
      )}

      {/* Back button */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="btn-block px-5 py-2.5 bg-white text-blockText font-pixel text-xs flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>KEMBALI KE AVATAR</span>
        </button>
      </div>
    </div>
  );
};
