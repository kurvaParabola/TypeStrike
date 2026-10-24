import React from 'react';
import { Volume2, VolumeX, Activity, ShieldCheck, Zap } from 'lucide-react';
import { sound } from '../services/sound';

interface HeaderProps {
  isMuted: boolean;
  onToggleMute: () => void;
  reduceMotion: boolean;
  onToggleReduceMotion: () => void;
  screenShake: boolean;
  onToggleScreenShake: () => void;
  pingMs?: number;
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isMuted,
  onToggleMute,
  reduceMotion,
  onToggleReduceMotion,
  screenShake,
  onToggleScreenShake,
  pingMs = 28,
  onGoHome,
}) => {
  return (
    <header className="w-full bg-white border-b-[3px] border-blockText py-3 px-4 md:px-8 shadow-block-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo / Brand */}
        <div
          onClick={onGoHome}
          className="flex items-center gap-2 cursor-pointer group"
          title="Kembali ke Beranda"
        >
          <div className="w-8 h-8 rounded-sm bg-blockGrass border-2 border-blockText flex items-center justify-center font-pixel text-white text-base shadow-block-sm group-hover:scale-105 transition-transform">
            ⚔️
          </div>
          <div>
            <h1 className="font-pixel text-sm md:text-base text-blockText font-black tracking-wide leading-none">
              BLOCKTYPE<span className="text-blockSky">DUEL</span>
            </h1>
            <p className="text-[10px] font-mono text-gray-500 font-semibold leading-tight">
              1v1 PvP Typing Arena · Monad
            </p>
          </div>
        </div>

        {/* Status & Quick Settings */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Monad Chain Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 border-2 border-blockPurple rounded text-[11px] font-mono font-bold text-blockPurple">
            <Zap className="w-3.5 h-3.5 fill-blockPurple" />
            <span>Monad 10143</span>
          </div>

          {/* Ping Indicator (F-31) */}
          <div
            className={`hidden xs:flex items-center gap-1 px-2 py-1 rounded border-2 border-blockText text-[11px] font-mono font-bold ${
              pingMs < 100
                ? 'bg-emerald-100 text-emerald-800'
                : pingMs < 250
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}
            title={`Ping RTT: ${pingMs} ms`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{pingMs}ms</span>
          </div>

          {/* Screen Shake Toggle (F-32) */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleScreenShake();
            }}
            className={`p-1.5 rounded border-2 border-blockText text-xs font-pixel ${
              screenShake ? 'bg-blockCream text-blockText' : 'bg-gray-200 text-gray-400'
            }`}
            title={screenShake ? 'Getar Layar: Aktif' : 'Getar Layar: Nonaktif'}
          >
            📳
          </button>

          {/* Motion Toggle (F-05) */}
          <button
            onClick={() => {
              sound.playClick();
              onToggleReduceMotion();
            }}
            className={`p-1.5 rounded border-2 border-blockText text-xs font-pixel ${
              !reduceMotion ? 'bg-blockCream text-blockText' : 'bg-gray-200 text-gray-400'
            }`}
            title={reduceMotion ? 'Mode Hemat Gerak (Reduced Motion): Aktif' : 'Animasi Penuh: Aktif'}
          >
            <ShieldCheck className="w-4 h-4" />
          </button>

          {/* Sound Mute Toggle (F-05) */}
          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded border-2 border-blockText text-xs font-bold transition-transform active:scale-90 ${
              !isMuted ? 'bg-blockSun text-blockText shadow-block-sm' : 'bg-gray-200 text-gray-500'
            }`}
            title={isMuted ? 'Bunyi: Mute' : 'Bunyi: Aktif'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
