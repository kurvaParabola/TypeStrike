import React, { useState } from 'react';
import { Play, HelpCircle, Zap, Trophy, X, ChevronRight, Flame } from 'lucide-react';
import { sound } from '../services/sound';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center text-center my-6 md:my-12 px-4 select-none">
      {/* Monad Chain Pill */}
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 border-2 border-blockPurple rounded-full text-xs font-mono font-bold text-blockPurple mb-4 shadow-block-sm">
        <Zap className="w-3.5 h-3.5 fill-current" />
        <span>POWERED BY MONAD BLOCKCHAIN</span>
      </div>

      {/* Main Hero Title */}
      <h1 className="font-pixel text-3xl md:text-5xl lg:text-6xl text-blockText font-black tracking-wide leading-tight mb-3">
        BLOCKTYPE<span className="text-blockSky">DUEL</span>
      </h1>

      <p className="font-sans text-sm md:text-base text-gray-600 max-w-xl mb-8 leading-relaxed font-semibold">
        Arena pertarungan ketik kata 1v1 secara real-time. Ketik kata demi kata secepat kilat, lancarkan tebasan kombo, dan habisi HP lawan hingga K.O.!
      </p>

      {/* Feature Highlights (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-10 text-left">
        <div className="card-block p-4 bg-white">
          <div className="w-9 h-9 rounded bg-emerald-100 border-2 border-blockText flex items-center justify-center mb-2.5 text-blockGrass">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <h3 className="font-pixel text-xs text-blockText font-bold mb-1">
            SPEED-SCALING DAMAGE
          </h3>
          <p className="text-xs text-gray-600 font-sans">
            Makin cepat kamu mengetik kata, makin dahsyat tebasan damage critical yang kamu berikan ke lawan.
          </p>
        </div>

        <div className="card-block p-4 bg-white">
          <div className="w-9 h-9 rounded bg-amber-100 border-2 border-blockText flex items-center justify-center mb-2.5 text-amber-700">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <h3 className="font-pixel text-xs text-blockText font-bold mb-1">
            RAGE COMEBACK BUFF
          </h3>
          <p className="text-xs text-gray-600 font-sans">
            Saat HP di bawah 30%, kata buff spesial terbuka: pulihkan HP, aktifkan perisai, atau gandakan 2x damage!
          </p>
        </div>

        <div className="card-block p-4 bg-white">
          <div className="w-9 h-9 rounded bg-purple-100 border-2 border-blockText flex items-center justify-center mb-2.5 text-blockPurple">
            <Trophy className="w-5 h-5 fill-current" />
          </div>
          <h3 className="font-pixel text-xs text-blockText font-bold mb-1">
            MONAD WAGER ESCROW
          </h3>
          <p className="text-xs text-gray-600 font-sans">
            Bisa main latihan gratis atau tanding bertaruh token MON di Monad Testnet dengan pencairan instan.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        <button
          onClick={() => {
            sound.playClick();
            onStart();
          }}
          className="btn-block w-full sm:w-auto px-8 py-4 bg-blockGrass hover:bg-emerald-500 text-white font-pixel text-sm md:text-base flex items-center justify-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>MULAI BERMAIN</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            setShowHowToPlay(true);
          }}
          className="btn-block w-full sm:w-auto px-6 py-4 bg-white hover:bg-blockCream text-blockText font-pixel text-xs md:text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 text-blockSky" />
          <span>CARA BERMAIN</span>
        </button>
      </div>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="card-block max-w-xl w-full p-6 bg-white text-left relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-blockText pb-3 mb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blockSky" />
                <h3 className="font-pixel text-sm md:text-base font-bold text-blockText">
                  CARA BERMAIN (GAME GUIDE)
                </h3>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  setShowHowToPlay(false);
                }}
                className="p-1 rounded hover:bg-gray-100 text-gray-600 border border-transparent hover:border-blockText"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-sans text-gray-700">
              <div className="flex items-start gap-3 p-3 bg-blockCream border border-blockText rounded-xs">
                <div className="w-7 h-7 rounded bg-blockGrass text-white flex items-center justify-center font-pixel text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-pixel text-xs text-blockText font-bold mb-1">
                    Serangan Kata per Kata
                  </h4>
                  <p>
                    Target kata acak (4–5 huruf bahasa Indonesia) akan muncul di layar. Ketik kata tersebut secepat mungkin untuk menebaskan pedang ke arah lawan.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blockCream border border-blockText rounded-xs">
                <div className="w-7 h-7 rounded bg-blockSky text-white flex items-center justify-center font-pixel text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-pixel text-xs text-blockText font-bold mb-1">
                    Damage Mengikuti Kecepatan
                  </h4>
                  <p>
                    Makin singkat waktu ketikmu, damage serangan makin besar!
                    Ketik &lt; 0.45s menghasilkan <strong>22 DMG (HYPER CRIT)</strong>, sedangkan ketik santai menghasilkan 10–13 DMG.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blockCream border border-blockText rounded-xs">
                <div className="w-7 h-7 rounded bg-blockCoral text-white flex items-center justify-center font-pixel text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-pixel text-xs text-blockText font-bold mb-1">
                    Kata Buff Darurat (HP &lt; 30%)
                  </h4>
                  <p>
                    Ketika HP mencapai batas kritis (&lt; 30 HP), kamu berpeluang mendapatkan kata buff khusus:
                  </p>
                  <ul className="mt-1 list-disc list-inside space-y-0.5 text-gray-600">
                    <li><strong>PULIH / SEHAT</strong>: Menambah +25 HP seketika.</li>
                    <li><strong>MURKA / LEDAK</strong>: Melipatgandakan serangan 2x lipat!</li>
                    <li><strong>KEBAL / KUAT</strong>: Memasang perisai yang menangkis 1 serangan lawan.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blockCream border border-blockText rounded-xs">
                <div className="w-7 h-7 rounded bg-blockPurple text-white flex items-center justify-center font-pixel text-xs shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="font-pixel text-xs text-blockText font-bold mb-1">
                    Kemenangan K.O.
                  </h4>
                  <p>
                    Pemain pertama yang berhasil menghabiskan seluruh HP lawan (menjadi 0 HP) keluar sebagai pemenang mutlak!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blockCream border border-blockText rounded-xs">
                <div className="w-7 h-7 rounded bg-amber-500 text-white flex items-center justify-center font-pixel text-xs shrink-0 mt-0.5">
                  5
                </div>
                <div>
                  <h4 className="font-pixel text-xs text-blockText font-bold mb-1">
                    3 Pilihan Role / Class Karakter
                  </h4>
                  <p>
                    Sesuaikan gaya bertarungmu sebelum bertanding:
                  </p>
                  <ul className="mt-1 list-disc list-inside space-y-0.5 text-gray-600">
                    <li><strong>FIGHTER (110 HP)</strong>: Tubuh baja lebih tangguh menghadapi gempuran.</li>
                    <li><strong>WIZARD (95 HP)</strong>: Arcane Burst memberi bonus +5 damage pada Hyper Crit.</li>
                    <li><strong>ROGUE (100 HP)</strong>: Refleks bayangan dengan 15% peluang Dodge otomatis menangkis serangan lawan.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t-2 border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  sound.playClick();
                  setShowHowToPlay(false);
                  onStart();
                }}
                className="btn-block px-5 py-2.5 bg-blockGrass text-white font-pixel text-xs flex items-center gap-1.5"
              >
                <span>SAYA MENGERTI, AYO MAIN!</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
