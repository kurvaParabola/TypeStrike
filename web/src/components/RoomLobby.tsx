import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Info,
} from 'lucide-react';
import { sound } from '../services/sound';
import type { Player } from '../types';
import { p2p } from '../services/p2p';
import { createRoomOnchain, joinRoomOnchain, getRoomOnchain } from '../services/contract';
import { getNextCombatWord } from '../services/matchEngine';

interface RoomLobbyProps {
  player: Player;
  walletAddress: string | null;
  walletBalance: string;
  onStartMatch: (
    opponent: Player,
    wagerMon: string,
    roomCode: string,
    isP2p?: boolean,
    txHash?: string
  ) => void;
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
  const [wager, setWager] = useState<string>('0.05');
  const [depositOnchain, setDepositOnchain] = useState<boolean>(true);
  const [generatedCode, setGeneratedCode] = useState<string>(() => {
    return 'MON-' + Math.floor(1000 + Math.random() * 9000);
  });
  const [copied, setCopied] = useState<boolean>(false);
  const [isHosting, setIsHosting] = useState<boolean>(false);
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [hostTxHash, setHostTxHash] = useState<string | null>(null);
  const [joinedGuest, setJoinedGuest] = useState<Player | null>(null);
  const [hostError, setHostError] = useState<string | null>(null);

  // Guest state
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const [connectedHost, setConnectedHost] = useState<Player | null>(null);
  const [guestTxHash, setGuestTxHash] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Clean up P2P on unmount
  useEffect(() => {
    return () => {
      // Don't kill connection if match started
    };
  }, []);

  // Regenerate room code
  const handleRegenerateCode = () => {
    sound.playClick();
    const newCode = 'MON-' + Math.floor(1000 + Math.random() * 9000);
    setGeneratedCode(newCode);
    setCopied(false);
    setJoinedGuest(null);
    setIsHosting(false);
    setHostTxHash(null);
    setHostError(null);
    p2p.cleanup();
  };

  // Copy code to clipboard
  const handleCopyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. Host creates room and listens for Guest peer
  const handleHostRoom = async () => {
    sound.playClick();
    setHostError(null);

    // Optional onchain wager deposit
    let txHash: string | undefined = undefined;
    if (depositOnchain && walletAddress) {
      try {
        setIsDepositing(true);
        txHash = await createRoomOnchain(generatedCode, wager, walletAddress);
        setHostTxHash(txHash);
      } catch (err: any) {
        console.error('Onchain deposit failed:', err);
        setHostError(
          err.message?.includes('rejected')
            ? 'Penyetoran tiket arena dibatalkan di wallet.'
            : `Gagal setor tiket arena ke vault: ${err.message || 'Transaksi gagal'}`
        );
        setIsDepositing(false);
        return;
      } finally {
        setIsDepositing(false);
      }
    }

    setIsHosting(true);

    const hostPlayerWithWallet = {
      ...player,
      walletAddress: walletAddress || undefined,
    };

    // Initialize Host P2P listener
    p2p.initHost(
      generatedCode,
      hostPlayerWithWallet,
      (guest) => {
        sound.playHeal();
        setJoinedGuest(guest);
      },
      (msg) => {
        console.log('[Host got message in lobby]', msg);
      },
      (errMsg) => {
        setHostError(errMsg);
        setIsHosting(false);
      },
      wager,
      depositOnchain
    );
  };

  // 2. Host starts the duel once guest joined
  const handleStartDuelAsHost = () => {
    if (joinedGuest) {
      sound.playClick();
      const initialWord = getNextCombatWord(player.hp);
      // Broadcast START_MATCH to guest's device
      p2p.send({
        type: 'START_MATCH',
        initialWord,
      });

      onStartMatch(joinedGuest, wager, generatedCode, true, hostTxHash || undefined);
    }
  };

  // 3. Guest connects to Host's room
  const handleJoinRoom = async () => {
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
    setIsJoining(true);

    // Check if room exists on-chain and auto-match host's wager
    let txHash: string | undefined = undefined;
    let effectiveWager = wager;

    if (walletAddress) {
      try {
        const onchainRoom = await getRoomOnchain(cleanCode);
        if (onchainRoom && onchainRoom.wagerMon && parseFloat(onchainRoom.wagerMon) > 0) {
          effectiveWager = onchainRoom.wagerMon;
          setWager(effectiveWager);
        }
      } catch {
        // Proceed with default wager
      }

      if (depositOnchain) {
        try {
          setIsDepositing(true);
          txHash = await joinRoomOnchain(cleanCode, effectiveWager, walletAddress);
          setGuestTxHash(txHash);
        } catch (err: any) {
          console.error('Guest onchain deposit failed:', err);
          setJoinError(
            err.message?.includes('rejected')
              ? 'Penyetoran tiket arena dibatalkan di wallet.'
              : `Gagal setor tiket arena ke vault: ${err.message || 'Transaksi gagal'}`
          );
          setIsJoining(false);
          setIsDepositing(false);
          return;
        } finally {
          setIsDepositing(false);
        }
      }
    }

    const guestPlayerWithWallet = {
      ...player,
      walletAddress: walletAddress || undefined,
    };

    // Connect to host via WebRTC DataChannel
    p2p.connectGuest(
      cleanCode,
      guestPlayerWithWallet,
      (host) => {
        sound.playHeal();
        setConnectedHost(host);
        setIsJoining(false);
      },
      (msg) => {
        // When Host signals match start, Guest synchronously transitions to ARENA!
        if (msg.type === 'START_MATCH') {
          sound.playCountdown(true);
          onStartMatch(p2p.opponent || connectedHost!, effectiveWager, cleanCode, true, txHash || guestTxHash || undefined);
        }
      },
      (errMsg) => {
        setJoinError(errMsg);
        setIsJoining(false);
      }
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto my-6 px-4 select-none">
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="font-pixel text-xl md:text-3xl text-blockText font-black tracking-wide mb-1">
          LOBBY 1v1 REAL-TIME (BY ONE)
        </h2>
        <p className="text-xs md:text-sm text-gray-600 font-sans">
          Duel ketik langsung melawan temanmu secara real-time via koneksi peer-to-peer di Monad.
        </p>
      </div>

      {/* Security Note Banner */}
      <div className="mb-4 p-3 bg-amber-50 border-2 border-amber-300 rounded text-xs font-sans text-amber-900 flex items-start gap-2 shadow-block-sm">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Info Keamanan Wallet:</strong> Notifikasi <em>"Jaringan Tidak Dikenal" / "Unverified Network"</em> di MetaMask adalah standar wajar browser untuk semua jaringan testnet baru (Monad Chain ID 10143). Smart contract TypeStrike (<span className="font-mono">0x54dF...A994</span>) 100% aman dan berjalan di RPC resmi Monad.
        </div>
      </div>

      {/* Profile & Wallet info bar */}
      <div className="card-block p-3 mb-6 bg-purple-50/70 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 text-blockText font-bold">
          <User className="w-4 h-4 text-blockPurple" />
          <span>PEMAIN: <span className="text-blockPurple">{player.nickname}</span> [{player.role}]</span>
        </div>
        {walletAddress ? (
          <div className="font-bold text-blockText flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-blockPurple" />
            <span>SALDO: <span className="text-blockPurple">{walletBalance} MON</span></span>
          </div>
        ) : (
          <span className="text-gray-500 text-[11px]">WALLET TIDAK TERHUBUNG</span>
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
          <span>BUAT ROOM (MASTER / HOST)</span>
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
          <span>GABUNG ROOM (INPUT KODE)</span>
        </button>
      </div>

      {/* Tab 1: Buat Room (Master / Host) */}
      {tab === 'create' && (
        <div className="card-block p-6 bg-white space-y-6">
          {/* Wager Selection & Onchain Deposit Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-pixel text-xs text-blockText flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-blockPurple" /> TIKET ARENA & PRIZE POOL (MON)
              </label>
              {walletAddress && (
                <label className="flex items-center gap-1.5 text-xs font-sans font-bold text-blockPurple cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depositOnchain}
                    onChange={(e) => setDepositOnchain(e.target.checked)}
                    className="w-4 h-4 rounded text-blockPurple focus:ring-blockPurple"
                  />
                  <span>Kunci Prize Pool ke Smart Vault</span>
                </label>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              {WAGER_OPTIONS.map((val) => (
                <button
                  key={val}
                  disabled={isHosting}
                  onClick={() => {
                    sound.playClick();
                    setWager(val);
                  }}
                  className={`py-2 px-1 text-center font-mono font-bold text-xs border-2 border-blockText rounded transition-all ${
                    wager === val
                      ? 'bg-blockPurple text-white shadow-block-sm scale-105'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:opacity-50'
                  }`}
                >
                  {val} MON
                </button>
              ))}
            </div>

            <p className="text-[11px] font-sans text-gray-500 mt-2">
              {depositOnchain && walletAddress ? (
                <span>
                  Kedua gladiator menyetor tiket masuk <strong>{wager} MON</strong> ke vault. Total Trophy Prize Pool pemenang: <strong>{(parseFloat(wager) * 2).toFixed(2)} MON</strong>.
                </span>
              ) : (
                <span>Mode duel sparring persahabatan (gratis tanpa tiket masuk on-chain).</span>
              )}
            </p>
          </div>

          {/* Generated Room Code Box */}
          <div className="p-4 bg-blockCream border-2 border-blockText rounded">
            <span className="block font-pixel text-[10px] text-gray-500 mb-1">
              KODE UNDANGAN ROOM (BAGIKAN KE TEMANMU)
            </span>
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-2xl md:text-3xl font-black text-blockText tracking-widest">
                {generatedCode}
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRegenerateCode}
                  disabled={isHosting}
                  className="btn-block p-2 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
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

          {/* Onchain Tx status */}
          {hostTxHash && (
            <div className="p-2.5 bg-purple-50 border border-blockPurple rounded text-xs font-mono text-blockPurple flex items-center justify-between">
              <span>Tiket Arena Terdaftar di Vault!</span>
              <a
                href={`https://testnet.monadvision.com/tx/${hostTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold underline flex items-center gap-1"
              >
                Lihat di Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Error Message */}
          {hostError && (
            <div className="p-3 bg-rose-50 border-2 border-rose-400 rounded text-xs font-sans text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{hostError}</span>
            </div>
          )}

          {/* Host Action: Wait or Start */}
          {!isHosting && !joinedGuest && (
            <button
              onClick={handleHostRoom}
              disabled={isDepositing}
              className="btn-block w-full py-4 bg-blockGrass hover:bg-emerald-500 text-white font-pixel text-sm flex items-center justify-center gap-2"
            >
              <Radio className="w-5 h-5 animate-pulse" />
              <span>{isDepositing ? 'MENYETOR TIKET KE VAULT...' : 'BUKA ROOM & TUNGGU TEMAN'}</span>
            </button>
          )}

          {isHosting && !joinedGuest && (
            <div className="p-5 border-2 border-dashed border-blockPurple rounded bg-purple-50 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-8 h-8 border-4 border-blockPurple border-t-transparent rounded-full animate-spin" />
              <div>
                <span className="font-pixel text-sm text-blockPurple block">
                  MENUNGGU TEMAN BERGABUNG...
                </span>
                <span className="text-xs font-sans text-gray-500 mt-1 block">
                  Kirimkan kode <strong>{generatedCode}</strong> ke temanmu agar ia bisa masuk.
                </span>
              </div>
            </div>
          )}

          {joinedGuest && (
            <div className="p-4 bg-emerald-50 border-2 border-blockGrass rounded space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blockGrass" />
                  <span className="font-pixel text-xs text-emerald-800 font-bold">
                    TEMAN TERHUBUNG: {joinedGuest.nickname} [{joinedGuest.role}]
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-700 px-2 py-0.5 bg-emerald-100 rounded border border-emerald-300">
                  SIAP TANDING
                </span>
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
              <Users className="w-4 h-4 text-blockSky" /> MASUKKAN KODE INVITE DARI HOST
            </label>
            <input
              type="text"
              value={joinCodeInput}
              disabled={isJoining || connectedHost !== null}
              onChange={(e) => {
                setJoinCodeInput(e.target.value.toUpperCase());
                setJoinError(null);
              }}
              placeholder="Contoh: MON-7821"
              maxLength={10}
              className="w-full px-4 py-3 border-[3px] border-blockText rounded-sm font-mono text-xl font-black text-blockText placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blockSky bg-blockCream uppercase tracking-widest text-center disabled:opacity-60"
            />
            {joinError && (
              <p className="mt-2 text-xs font-sans font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{joinError}</span>
              </p>
            )}
          </div>

          {/* Onchain Tx status for guest */}
          {guestTxHash && (
            <div className="p-2.5 bg-sky-50 border border-blockSky rounded text-xs font-mono text-blockSky flex items-center justify-between">
              <span>Tiket Arena Terdaftar di Vault!</span>
              <a
                href={`https://testnet.monadvision.com/tx/${guestTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="font-bold underline flex items-center gap-1"
              >
                Lihat di Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Connecting State */}
          {isJoining && (
            <div className="p-4 border-2 border-dashed border-blockSky rounded bg-sky-50 flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-3 border-blockSky border-t-transparent rounded-full animate-spin" />
              <span className="font-pixel text-xs text-blockSky">
                MENGHUBUNGKAN KE ROOM TEMAN...
              </span>
            </div>
          )}

          {/* Connected State (Waiting for Host to press Start) */}
          {connectedHost && (
            <div className="p-5 bg-emerald-50 border-2 border-blockGrass rounded text-center space-y-2">
              <div className="inline-flex items-center gap-2 text-emerald-800 font-bold font-pixel text-sm">
                <CheckCircle2 className="w-5 h-5 text-blockGrass" />
                <span>TERHUBUNG KE HOST: {connectedHost.nickname} [{connectedHost.role}]!</span>
              </div>
              <p className="font-mono text-xs text-gray-600 animate-pulse">
                Menunggu Host menekan tombol "Mulai Duel"... Layar akan otomatis bertransisi bersamaan!
              </p>
            </div>
          )}

          {!connectedHost && !isJoining && (
            <>
              <div className="p-4 bg-sky-50 border-2 border-blockSky rounded text-xs font-sans text-sky-900 space-y-1.5">
                <p className="font-bold font-pixel text-[11px]">PETUNJUK GABUNG:</p>
                <p>1. Minta kode room dari temanmu yang membuka room (Host).</p>
                <p>2. Pastikan Host sudah mengklik <strong>"Buka Room & Tunggu Teman"</strong> terlebih dahulu.</p>
                <p>3. Klik tombol di bawah untuk langsung terhubung ke room temanmu.</p>
              </div>

              <button
                onClick={handleJoinRoom}
                className="btn-block w-full py-4 bg-blockSky hover:bg-sky-500 text-white font-pixel text-sm flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                <span>GABUNG KE ROOM TEMAN</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Back button */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => {
            sound.playClick();
            p2p.cleanup();
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
