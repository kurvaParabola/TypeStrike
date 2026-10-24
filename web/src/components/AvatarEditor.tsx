import React, { useState } from 'react';
import type { AvatarConfig, HairStyle, FaceExpression, Accessory, GameMode, PlayerRole } from '../types';
import { Avatar } from './Avatar';
import { sound } from '../services/sound';
import { ROLES, getRoleDefinition } from '../services/roles';
import {
  Sparkles,
  Dices,
  User,
  Crown,
  Glasses,
  Headphones,
  X as CloseIcon,
  AlertTriangle,
  Bot,
  Users,
  ArrowLeft,
  ArrowRight,
  Swords,
  Wand2,
  Crosshair,
  Shield,
  Zap,
} from 'lucide-react';

interface AvatarEditorProps {
  nickname: string;
  onNicknameChange: (name: string) => void;
  avatar: AvatarConfig;
  onAvatarChange: (config: AvatarConfig) => void;
  role: PlayerRole;
  onRoleChange: (role: PlayerRole) => void;
  gameMode?: GameMode;
  onProceed: () => void;
  onBack?: () => void;
}

export const SKIN_TONES = [
  '#FFE0BD', '#FCD0A1', '#E4B588', '#D4A373',
  '#C68642', '#A26A42', '#8D5524', '#5C3818',
];

export const HAIR_COLORS = [
  '#2B3440', '#4A3728', '#8B5A2B', '#C19A6B', '#D4AF37',
  '#E67E22', '#C0392B', '#8E44AD', '#2980B9', '#27AE60',
];

export const CLOTH_COLORS = [
  '#6BBF59', '#4FA8E0', '#EF6F61', '#F6C945', '#9B84D9', '#2B3440',
  '#1ABC9C', '#E67E22', '#34495E', '#E91E63', '#795548', '#95A5A6',
];

export const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: 'short', label: 'Pendek' },
  { id: 'spiky', label: 'Spiky' },
  { id: 'pompadour', label: 'Pompadour' },
  { id: 'bob', label: 'Bob' },
  { id: 'long', label: 'Panjang' },
  { id: 'curly', label: 'Kriting' },
];

export const EXPRESSIONS: { id: FaceExpression; label: string }[] = [
  { id: 'normal', label: 'Biasa' },
  { id: 'determined', label: 'Fokus' },
  { id: 'smile', label: 'Senyum' },
  { id: 'hit', label: 'Kaget' },
];

export const ACCESSORIES: { id: Accessory; label: string; iconType: string }[] = [
  { id: 'none', label: 'Polos', iconType: 'none' },
  { id: 'crown', label: 'Mahkota', iconType: 'crown' },
  { id: 'glasses', label: 'Kacamata', iconType: 'glasses' },
  { id: 'headphones', label: 'Headphone', iconType: 'headphones' },
  { id: 'headband', label: 'Headband', iconType: 'headband' },
];

// Simple profanity list
const BANNED_WORDS = ['anjing', 'babi', 'bangsat', 'kontol', 'memek', 'asu', 'taek', 'fuck', 'shit'];

export const AvatarEditor: React.FC<AvatarEditorProps> = ({
  nickname,
  onNicknameChange,
  avatar,
  onAvatarChange,
  role = 'FIGHTER',
  onRoleChange,
  gameMode = 'PRACTICE',
  onProceed,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'skin' | 'hair' | 'face' | 'clothes' | 'acc'>('skin');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedRoleDef = getRoleDefinition(role);

  const handleNicknameChange = (val: string) => {
    // Only allow alphanumeric and spaces, 3-12 chars
    const cleaned = val.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 12);
    onNicknameChange(cleaned);

    const lower = cleaned.toLowerCase();
    const hasProfanity = BANNED_WORDS.some(word => lower.includes(word));

    if (hasProfanity) {
      setErrorMsg('Nickname mengandung kata yang tidak sopan!');
    } else if (cleaned.length > 0 && cleaned.length < 3) {
      setErrorMsg('Nickname minimal 3 karakter');
    } else {
      setErrorMsg(null);
    }
  };

  const handleRandomize = () => {
    sound.playClick();
    const randomSkin = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
    const randomHairStyle = HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)].id;
    const randomHairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
    const randomExpr = EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)].id;
    const randomShirt = CLOTH_COLORS[Math.floor(Math.random() * CLOTH_COLORS.length)];
    const randomPants = CLOTH_COLORS[Math.floor(Math.random() * CLOTH_COLORS.length)];
    const randomAcc = ACCESSORIES[Math.floor(Math.random() * ACCESSORIES.length)].id;

    onAvatarChange({
      skinTone: randomSkin,
      hairStyle: randomHairStyle,
      hairColor: randomHairColor,
      expression: randomExpr,
      shirtColor: randomShirt,
      pantsColor: randomPants,
      accessory: randomAcc,
    });
  };

  const isFormValid = nickname.trim().length >= 3 && !errorMsg;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6 items-stretch">
      {/* Left: Live Avatar Preview Card */}
      <div className="w-full md:w-5/12 card-block p-6 flex flex-col items-center justify-between relative overflow-hidden bg-gradient-to-b from-white to-blockCream">
        <div className="w-full flex items-center justify-between z-10">
          <span className="font-pixel text-xs text-blockText font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blockSun" /> PREVIEW
          </span>
          <button
            onClick={handleRandomize}
            className="btn-block px-2.5 py-1 text-[11px] bg-blockSun hover:bg-yellow-400 text-blockText flex items-center gap-1"
            title="Acak Karakter"
          >
            <Dices className="w-3.5 h-3.5" /> Acak
          </button>
        </div>

        {/* Live Preview Display */}
        <div className="my-6 py-4 flex flex-col items-center justify-center">
          <Avatar config={avatar} role={role} animation="idle" size="lg" showBadge="KAMU" />
          <div className="mt-4 px-4 py-1.5 bg-white border-2 border-blockText rounded shadow-block-sm text-center">
            <span className="font-pixel text-sm font-bold text-blockText block">
              {nickname.trim() || 'Tamu_Blok'}
            </span>
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 bg-blockCream border border-blockText rounded-full text-[10px] font-pixel text-blockText font-bold">
              {role === 'FIGHTER' && <Swords className="w-3 h-3 text-amber-600" />}
              {role === 'WIZARD' && <Wand2 className="w-3 h-3 text-purple-600" />}
              {role === 'ROGUE' && <Crosshair className="w-3 h-3 text-emerald-600" />}
              <span>{role} · {selectedRoleDef.baseHp} HP</span>
            </div>
          </div>
        </div>

        {/* Quick tip */}
        <p className="text-[11px] font-sans text-gray-500 text-center">
          Minecraft-style original voxel avatar. Siap berduel di Monad!
        </p>
      </div>

      {/* Right: Customization Controls & Nickname */}
      <div className="w-full md:w-7/12 card-block p-6 flex flex-col justify-between bg-white">
        <div>
          {/* Nickname Input (F-01) */}
          <div className="mb-4">
            <label className="block font-pixel text-xs text-blockText mb-2 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> NICKNAME (3-12 KARAKTER)
            </label>
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => handleNicknameChange(e.target.value)}
                placeholder="Masukkan namamu..."
                maxLength={12}
                className="w-full px-3.5 py-2.5 border-[3px] border-blockText rounded-sm font-sans text-base font-bold text-blockText placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blockGrass bg-blockCream"
              />
              <span className="absolute right-3 top-3 text-xs font-mono text-gray-500">
                {nickname.length}/12
              </span>
            </div>
            {errorMsg && (
              <p className="mt-1.5 text-xs font-sans font-bold text-blockCoral flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          {/* Role / Class Selection */}
          <div className="mb-5">
            <label className="block font-pixel text-xs text-blockText mb-2 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> PILIH ROLE / CLASS (3 PILIHAN)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => {
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      onRoleChange(r.id);
                    }}
                    className={`p-2.5 rounded border-2 border-blockText text-left transition-all ${
                      isSelected
                        ? r.id === 'FIGHTER'
                          ? 'bg-amber-100 ring-2 ring-blockSun scale-[1.02] shadow-block-sm'
                          : r.id === 'WIZARD'
                          ? 'bg-purple-100 ring-2 ring-blockPurple scale-[1.02] shadow-block-sm'
                          : 'bg-emerald-100 ring-2 ring-blockGrass scale-[1.02] shadow-block-sm'
                        : 'bg-gray-50 hover:bg-gray-100 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      {r.id === 'FIGHTER' && <Swords className="w-4 h-4 text-amber-600" />}
                      {r.id === 'WIZARD' && <Wand2 className="w-4 h-4 text-purple-600" />}
                      {r.id === 'ROGUE' && <Crosshair className="w-4 h-4 text-emerald-600" />}
                      <span className="font-mono text-[10px] font-bold text-gray-600">{r.baseHp} HP</span>
                    </div>
                    <div className="font-pixel text-[11px] font-bold text-blockText truncate">
                      {r.id}
                    </div>
                    <div className="text-[9px] font-sans text-gray-700 font-semibold leading-tight mt-0.5 truncate">
                      {r.weaponName}
                    </div>
                  </button>
                );
              })}
            </div>
            {/* Active role weapon & passive explanation */}
            <div className="mt-2.5 p-2.5 bg-blockCream border-2 border-blockText rounded-sm text-xs font-sans text-gray-800 space-y-1.5 shadow-block-sm">
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[10px] font-bold text-blockText px-1.5 py-0.5 bg-white border border-blockText rounded-xs shrink-0">
                  SENJATA
                </span>
                <span className="font-bold text-blockText">{selectedRoleDef.weaponName}</span>
                <span className="text-gray-500 text-[11px] hidden sm:inline">— {selectedRoleDef.weaponDesc}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-700">
                <span className="font-pixel text-[10px] font-bold text-blockText px-1.5 py-0.5 bg-white border border-blockText rounded-xs shrink-0 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-blockSun" /> PASIF
                </span>
                <span>
                  <strong>{selectedRoleDef.passiveName}:</strong> {selectedRoleDef.passiveDesc}
                </span>
              </div>
            </div>
          </div>

          {/* Customization Tabs */}
          <div className="flex border-b-2 border-blockText mb-4 gap-1 overflow-x-auto pb-1">
            {[
              { id: 'skin', label: 'Kulit' },
              { id: 'hair', label: 'Rambut' },
              { id: 'face', label: 'Ekspresi' },
              { id: 'clothes', label: 'Pakaian' },
              { id: 'acc', label: 'Aksesoris' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`px-3 py-1.5 text-xs font-pixel rounded-t-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blockGrass text-white font-bold border-t-2 border-x-2 border-blockText -mb-[2px]'
                    : 'text-gray-600 hover:text-blockText hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div className="min-h-[140px]">
            {/* Skin Tone Tab */}
            {activeTab === 'skin' && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Pilih warna kulit (8 tone):</p>
                <div className="grid grid-cols-4 gap-2.5">
                  {SKIN_TONES.map((tone) => (
                    <button
                      key={tone}
                      onClick={() => {
                        sound.playClick();
                        onAvatarChange({ ...avatar, skinTone: tone });
                      }}
                      className={`h-10 rounded border-2 border-blockText transition-transform active:scale-95 ${
                        avatar.skinTone === tone ? 'ring-4 ring-blockGrass ring-offset-1 scale-105' : ''
                      }`}
                      style={{ backgroundColor: tone }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Hair Tab */}
            {activeTab === 'hair' && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1.5">Model Rambut:</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {HAIR_STYLES.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => {
                          sound.playClick();
                          onAvatarChange({ ...avatar, hairStyle: style.id });
                        }}
                        className={`py-1 px-2 text-[11px] font-sans font-bold border-2 border-blockText rounded ${
                          avatar.hairStyle === style.id ? 'bg-blockSky text-white' : 'bg-gray-100'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1.5">Warna Rambut:</p>
                  <div className="flex flex-wrap gap-2">
                    {HAIR_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          sound.playClick();
                          onAvatarChange({ ...avatar, hairColor: color });
                        }}
                        className={`w-7 h-7 rounded-sm border-2 border-blockText ${
                          avatar.hairColor === color ? 'ring-2 ring-blockSky scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Expression Tab */}
            {activeTab === 'face' && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Ekspresi Wajah:</p>
                <div className="grid grid-cols-2 gap-2">
                  {EXPRESSIONS.map((expr) => (
                    <button
                      key={expr.id}
                      onClick={() => {
                        sound.playClick();
                        onAvatarChange({ ...avatar, expression: expr.id });
                      }}
                      className={`py-2 px-3 text-xs font-sans font-bold border-2 border-blockText rounded ${
                        avatar.expression === expr.id ? 'bg-blockGrass text-white' : 'bg-gray-100'
                      }`}
                    >
                      {expr.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Clothes Tab */}
            {activeTab === 'clothes' && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600 mb-1.5">Warna Baju (12 Pilihan):</p>
                  <div className="grid grid-cols-6 gap-2">
                    {CLOTH_COLORS.map((color) => (
                      <button
                        key={`shirt-${color}`}
                        onClick={() => {
                          sound.playClick();
                          onAvatarChange({ ...avatar, shirtColor: color });
                        }}
                        className={`h-7 rounded border-2 border-blockText ${
                          avatar.shirtColor === color ? 'ring-2 ring-blockPurple scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-600 mb-1.5">Warna Celana (12 Pilihan):</p>
                  <div className="grid grid-cols-6 gap-2">
                    {CLOTH_COLORS.map((color) => (
                      <button
                        key={`pants-${color}`}
                        onClick={() => {
                          sound.playClick();
                          onAvatarChange({ ...avatar, pantsColor: color });
                        }}
                        className={`h-7 rounded border-2 border-blockText ${
                          avatar.pantsColor === color ? 'ring-2 ring-blockPurple scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Accessory Tab */}
            {activeTab === 'acc' && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Aksesoris Kepala:</p>
                <div className="grid grid-cols-3 gap-2">
                  {ACCESSORIES.map((acc) => {
                    const renderIcon = () => {
                      switch (acc.iconType) {
                        case 'crown':
                          return <Crown className="w-4 h-4 text-amber-500" />;
                        case 'glasses':
                          return <Glasses className="w-4 h-4 text-sky-500" />;
                        case 'headphones':
                          return <Headphones className="w-4 h-4 text-indigo-500" />;
                        case 'headband':
                          return <Sparkles className="w-4 h-4 text-rose-500" />;
                        default:
                          return <CloseIcon className="w-4 h-4 text-gray-400" />;
                      }
                    };

                    return (
                      <button
                        key={acc.id}
                        onClick={() => {
                          sound.playClick();
                          onAvatarChange({ ...avatar, accessory: acc.id });
                        }}
                        className={`py-2 px-2 text-xs font-sans font-bold border-2 border-blockText rounded flex items-center justify-center gap-1.5 ${
                          avatar.accessory === acc.id ? 'bg-blockSun text-blockText' : 'bg-gray-100'
                        }`}
                      >
                        {renderIcon()}
                        <span>{acc.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons: Back + Proceed */}
        <div className="mt-6 pt-4 border-t-2 border-gray-200 flex items-center justify-between gap-3">
          {onBack && (
            <button
              onClick={() => {
                sound.playClick();
                onBack();
              }}
              className="btn-block px-4 py-3 bg-white hover:bg-gray-50 text-blockText font-pixel text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>GANTI MODE</span>
            </button>
          )}

          <button
            onClick={() => {
              if (isFormValid) {
                sound.playClick();
                onProceed();
              }
            }}
            disabled={!isFormValid}
            className={`flex-1 py-3.5 px-4 text-center text-xs md:text-sm font-pixel tracking-wider flex items-center justify-center gap-2 transition-transform ${
              isFormValid
                ? 'btn-block bg-blockGrass hover:bg-emerald-500 text-white cursor-pointer hover:-translate-y-0.5 shadow-block-sm'
                : 'bg-gray-300 text-gray-500 border-[3px] border-gray-400 cursor-not-allowed'
            }`}
          >
            {gameMode === 'PRACTICE' ? (
              <>
                <Bot className="w-4 h-4" />
                <span>MULAI LATIHAN LAWAN BOT</span>
              </>
            ) : (
              <>
                <Users className="w-4 h-4" />
                <span>LANJUT KE ROOM LOBBY</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
