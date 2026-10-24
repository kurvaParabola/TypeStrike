import React, { useState } from 'react';
import type { GameMode } from '../types';
import { sound } from '../services/sound';
import { connectMonadWallet } from '../services/wallet';
import { Bot, Coins, Wallet, CheckCircle2, ArrowRight, ArrowLeft, Loader2, AlertCircle, Info } from 'lucide-react';

interface ModeSelectProps {
  walletAddress: string | null;
  walletBalance: string;
  onWalletConnected: (address: string, balance: string) => void;
  onSelectMode: (mode: GameMode) => void;
  onBack: () => void;
}

export const ModeSelect: React.FC<ModeSelectProps> = ({
  walletAddress,
  walletBalance,
  onWalletConnected,
  onSelectMode,
  onBack,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('PRACTICE');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const handleConnect = async () => {
    sound.playClick();
    setIsConnecting(true);
    setConnectError(null);

    try {
      const res = await connectMonadWallet();
      onWalletConnected(res.address, res.balance);
    } catch (err: any) {
      setConnectError(err.message || 'Gagal menyambungkan wallet.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleContinue = () => {
    sound.playClick();
    if (selectedMode === 'WAGER' && !walletAddress) {
      setConnectError('Harap sambungkan wallet terlebih dahulu untuk Mode Taruhan.');
      return;
    }
    onSelectMode(selectedMode);
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-6 px-4 select-none">
      <div className="text-center mb-8">
        <h2 className="font-pixel text-xl md:text-3xl text-blockText font-black tracking-wide mb-2">
          PILIH MODE PERMAINAN
        </h2>
        <p className="text-xs md:text-sm text-gray-600 font-sans max-w-md mx-auto">
          Pilih mode latihan solo gratis atau mode taruhan on-chain dengan token MON.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Mode 1: Practice (Solo / Bot) */}
        <div
          onClick={() => {
            sound.playClick();
            setSelectedMode('PRACTICE');
            setConnectError(null);
          }}
          className={`card-block p-6 cursor-pointer transition-all ${
            selectedMode === 'PRACTICE'
              ? 'ring-4 ring-blockGrass bg-emerald-50/50 scale-[1.02]'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded bg-emerald-100 border-2 border-blockText flex items-center justify-center text-blockGrass">
              <Bot className="w-6 h-6" />
            </div>
            {selectedMode === 'PRACTICE' && (
              <span className="font-pixel text-[10px] text-blockGrass font-bold bg-white px-2 py-1 border border-blockGrass rounded">
                DIPILIH
              </span>
            )}
          </div>

          <h3 className="font-pixel text-sm md:text-base text-blockText font-bold mb-1.5">
            MODE LATIHAN (GRATIS)
          </h3>
          <p className="text-xs text-gray-600 font-sans mb-4">
            Uji refleks dan asah kecepatan jarimu melawan bot AI dengan kecepatan manusiawi. Tanpa biaya ataupun taruhan.
          </p>

          <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-800 font-bold bg-emerald-100/60 p-2 rounded border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-blockGrass shrink-0" />
            <span>Gratis · Cocok untuk pemanasan</span>
          </div>
        </div>

        {/* Mode 2: Wager Mode (Monad Token) */}
        <div
          onClick={() => {
            sound.playClick();
            setSelectedMode('WAGER');
          }}
          className={`card-block p-6 cursor-pointer transition-all ${
            selectedMode === 'WAGER'
              ? 'ring-4 ring-blockPurple bg-purple-50/50 scale-[1.02]'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded bg-purple-100 border-2 border-blockText flex items-center justify-center text-blockPurple">
              <Coins className="w-6 h-6" />
            </div>
            {selectedMode === 'WAGER' && (
              <span className="font-pixel text-[10px] text-blockPurple font-bold bg-white px-2 py-1 border border-blockPurple rounded">
                DIPILIH
              </span>
            )}
          </div>

          <h3 className="font-pixel text-sm md:text-base text-blockText font-bold mb-1.5">
            MODE TARUHAN (MONAD WAGER)
          </h3>
          <p className="text-xs text-gray-600 font-sans mb-4">
            Duel PvP kompetitif menggunakan smart contract escrow di Monad Testnet. Pemenang mendapatkan seluruh prize pool!
          </p>

          {/* Wallet Status or Connect Action */}
          {walletAddress ? (
            <div className="p-2.5 bg-purple-100/70 border border-blockPurple rounded text-[11px] font-mono flex items-center justify-between">
              <div>
                <span className="text-gray-500 block text-[9px]">WALLET TERHUBUNG</span>
                <span className="font-bold text-blockPurple">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-gray-500 block text-[9px]">SALDO</span>
                <span className="font-bold text-blockText">{walletBalance} MON</span>
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleConnect();
              }}
              disabled={isConnecting}
              className="btn-block w-full py-2.5 bg-blockPurple text-white font-pixel text-xs flex items-center justify-center gap-2 hover:bg-purple-600 transition-colors"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>MENYAMBUNGKAN...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-3.5 h-3.5" />
                  <span>HUBUNGKAN WALLET MONAD</span>
                </>
              )}
            </button>
          )}

          {connectError && (
            <div className="mt-2 space-y-2">
              <p className="text-[11px] font-sans font-semibold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{connectError}</span>
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  onWalletConnected('0x71CB05EE1b1F506fF321Da3CE62f450974268F21', '2.50');
                  setConnectError(null);
                }}
                className="w-full py-1.5 px-2 bg-purple-100 hover:bg-purple-200 border border-blockPurple rounded text-[10px] font-mono font-bold text-blockPurple flex items-center justify-center gap-1.5 transition-colors"
              >
                <Wallet className="w-3 h-3" />
                <span>Gunakan Akun Demo Testnet (2.50 MON)</span>
              </button>
            </div>
          )}

          {/* Security Notice Card */}
          <div className="mt-3 p-2.5 bg-amber-50/90 border border-amber-300 rounded text-[11px] font-sans text-amber-900 leading-tight flex items-start gap-1.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>
              <strong>Info Keamanan:</strong> Notifikasi <em>"Jaringan Tidak Dikenal"</em> di MetaMask adalah standar wajar untuk jaringan testnet baru (Monad Chain ID 10143). Transaksi di TypeStrike 100% aman dan terhubung ke RPC resmi Monad.
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t-2 border-blockText/20">
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="btn-block px-5 py-2.5 bg-white text-blockText font-pixel text-xs flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>KEMBALI</span>
        </button>

        <button
          onClick={handleContinue}
          className="btn-block px-7 py-3 bg-blockGrass hover:bg-emerald-500 text-white font-pixel text-xs md:text-sm flex items-center gap-2"
        >
          <span>LANJUTKAN KE SETUP AVATAR</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
