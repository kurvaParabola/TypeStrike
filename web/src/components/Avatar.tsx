import React from 'react';
import type { AvatarConfig, AvatarAnimation, PlayerRole } from '../types';

interface AvatarProps {
  config: AvatarConfig;
  role?: PlayerRole;
  animation?: AvatarAnimation;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  facing?: 'right' | 'left';
  showBadge?: 'KAMU' | 'LAWAN';
  isAttacking?: boolean;
  isHit?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  config,
  role = 'FIGHTER',
  animation = 'idle',
  size = 'md',
  facing = 'right',
  showBadge,
  isAttacking,
  isHit,
}) => {
  const sizeMap = {
    sm: 'w-16 h-20',
    md: 'w-28 h-36',
    lg: 'w-40 h-52',
    xl: 'w-52 h-64',
  };

  // Determine active animation class
  let animClass = 'animate-idle';
  if (isHit || animation === 'hit') animClass = 'animate-hit';
  else if (isAttacking || animation === 'attack') animClass = 'animate-attack';
  else if (animation === 'typing') animClass = 'animate-typing';
  else if (animation === 'win') animClass = 'animate-win';
  else if (animation === 'lose') animClass = 'animate-lose';

  // Hair style renderer
  const renderHair = () => {
    switch (config.hairStyle) {
      case 'spiky':
        return (
          <>
            <polygon points="18,12 24,0 30,12" fill={config.hairColor} />
            <polygon points="30,12 38,-2 46,12" fill={config.hairColor} />
            <polygon points="46,12 54,2 60,12" fill={config.hairColor} />
            <rect x="18" y="10" width="44" height="8" fill={config.hairColor} />
          </>
        );
      case 'pompadour':
        return (
          <>
            <rect x="18" y="0" width="44" height="14" rx="2" fill={config.hairColor} />
            <rect x="16" y="8" width="8" height="18" fill={config.hairColor} />
          </>
        );
      case 'bob':
        return (
          <>
            <rect x="18" y="8" width="44" height="12" fill={config.hairColor} />
            <rect x="14" y="14" width="8" height="24" fill={config.hairColor} />
            <rect x="58" y="14" width="8" height="24" fill={config.hairColor} />
          </>
        );
      case 'long':
        return (
          <>
            <rect x="18" y="8" width="44" height="12" fill={config.hairColor} />
            <rect x="14" y="14" width="8" height="34" fill={config.hairColor} />
            <rect x="58" y="14" width="8" height="34" fill={config.hairColor} />
          </>
        );
      case 'curly':
        return (
          <>
            <circle cx="24" cy="8" r="8" fill={config.hairColor} />
            <circle cx="36" cy="6" r="8" fill={config.hairColor} />
            <circle cx="48" cy="6" r="8" fill={config.hairColor} />
            <circle cx="58" cy="10" r="8" fill={config.hairColor} />
            <rect x="18" y="8" width="44" height="10" fill={config.hairColor} />
          </>
        );
      case 'short':
      default:
        return (
          <>
            <rect x="18" y="8" width="44" height="10" fill={config.hairColor} />
            <rect x="16" y="12" width="6" height="12" fill={config.hairColor} />
          </>
        );
    }
  };

  // Expression renderer
  const renderExpression = () => {
    switch (config.expression) {
      case 'determined':
        return (
          <>
            {/* Eyes */}
            <rect x="28" y="24" width="6" height="4" fill="#2B3440" />
            <rect x="46" y="24" width="6" height="4" fill="#2B3440" />
            {/* Angled Brows */}
            <polygon points="26,20 36,22 36,20" fill="#2B3440" />
            <polygon points="54,20 44,22 44,20" fill="#2B3440" />
            {/* Straight Mouth */}
            <rect x="34" y="36" width="12" height="3" fill="#2B3440" />
          </>
        );
      case 'smile':
        return (
          <>
            {/* Happy Eyes */}
            <path d="M 27 26 Q 31 22 35 26" stroke="#2B3440" strokeWidth="3" fill="none" />
            <path d="M 45 26 Q 49 22 53 26" stroke="#2B3440" strokeWidth="3" fill="none" />
            {/* Smile Mouth */}
            <path d="M 33 34 Q 40 40 47 34" stroke="#2B3440" strokeWidth="3" fill="#2B3440" />
          </>
        );
      case 'hit':
        return (
          <>
            {/* X X Eyes */}
            <line x1="28" y1="22" x2="34" y2="28" stroke="#EF6F61" strokeWidth="3" />
            <line x1="34" y1="22" x2="28" y2="28" stroke="#EF6F61" strokeWidth="3" />
            <line x1="46" y1="22" x2="52" y2="28" stroke="#EF6F61" strokeWidth="3" />
            <line x1="52" y1="22" x2="46" y2="28" stroke="#EF6F61" strokeWidth="3" />
            {/* Open O Mouth */}
            <ellipse cx="40" cy="36" rx="4" ry="5" fill="#2B3440" />
          </>
        );
      case 'normal':
      default:
        return (
          <>
            {/* Pupil & highlight */}
            <rect x="28" y="23" width="6" height="6" fill="#2B3440" />
            <rect x="28" y="23" width="2" height="2" fill="#FFFFFF" />
            <rect x="46" y="23" width="6" height="6" fill="#2B3440" />
            <rect x="46" y="23" width="2" height="2" fill="#FFFFFF" />
            {/* Mouth */}
            <rect x="36" y="36" width="8" height="3" fill="#2B3440" />
          </>
        );
    }
  };

  // Accessory renderer
  const renderAccessory = () => {
    switch (config.accessory) {
      case 'crown':
        return (
          <g>
            <polygon points="20,8 24,-2 32,5 40,-4 48,5 56,-2 60,8" fill="#F6C945" stroke="#2B3440" strokeWidth="2" />
            <circle cx="40" cy="-1" r="2" fill="#EF6F61" />
          </g>
        );
      case 'glasses':
        return (
          <g>
            <rect x="24" y="21" width="13" height="9" fill="#2B3440" rx="1" />
            <rect x="43" y="21" width="13" height="9" fill="#2B3440" rx="1" />
            <rect x="37" y="24" width="6" height="3" fill="#2B3440" />
            <rect x="26" y="23" width="4" height="2" fill="#FFFFFF" opacity="0.6" />
            <rect x="45" y="23" width="4" height="2" fill="#FFFFFF" opacity="0.6" />
          </g>
        );
      case 'headphones':
        return (
          <g>
            <path d="M 16 26 A 24 24 0 0 1 64 26" fill="none" stroke="#EF6F61" strokeWidth="4" />
            <rect x="14" y="20" width="6" height="14" rx="2" fill="#EF6F61" stroke="#2B3440" strokeWidth="2" />
            <rect x="60" y="20" width="6" height="14" rx="2" fill="#EF6F61" stroke="#2B3440" strokeWidth="2" />
          </g>
        );
      case 'headband':
        return (
          <g>
            <rect x="18" y="16" width="44" height="6" fill="#9B84D9" stroke="#2B3440" strokeWidth="1.5" />
            <rect x="37" y="17" width="6" height="4" fill="#FFFFFF" />
          </g>
        );
      case 'none':
      default:
        return null;
    }
  };

  return (
    <div className={`relative flex flex-col items-center select-none ${facing === 'left' ? 'scale-x-[-1]' : ''}`}>
      {/* Player Badge */}
      {showBadge && (
        <div
          className={`absolute -top-7 px-2.5 py-0.5 rounded-sm font-pixel text-[10px] font-bold border-2 border-blockText z-20 ${
            showBadge === 'KAMU'
              ? 'bg-blockGrass text-white shadow-block-sm'
              : 'bg-blockCoral text-white shadow-block-sm'
          } ${facing === 'left' ? 'scale-x-[-1]' : ''}`}
        >
          {showBadge}
        </div>
      )}

      {/* Voxel Avatar SVG */}
      <div className={`${sizeMap[size]} ${animClass} filter drop-shadow-[2px_3px_0px_rgba(43,52,64,0.4)]`}>
        <svg viewBox="0 0 80 100" className="w-full h-full overflow-visible">
          {/* Shadow beneath avatar */}
          <ellipse cx="40" cy="96" rx="22" ry="4" fill="#2B3440" opacity="0.25" />

          {/* Left Arm (Behind) */}
          <rect x="12" y="44" width="10" height="26" rx="2" fill={config.shirtColor} stroke="#2B3440" strokeWidth="2.5" />
          <rect x="12" y="62" width="10" height="8" rx="1" fill={config.skinTone} stroke="#2B3440" strokeWidth="2" />

          {/* Legs / Pants */}
          {/* Left Leg */}
          <rect x="26" y="68" width="12" height="24" rx="2" fill={config.pantsColor} stroke="#2B3440" strokeWidth="2.5" />
          {/* Left Shoe */}
          <rect x="24" y="88" width="14" height="6" rx="1" fill="#2B3440" stroke="#2B3440" strokeWidth="1" />

          {/* Right Leg */}
          <rect x="42" y="68" width="12" height="24" rx="2" fill={config.pantsColor} stroke="#2B3440" strokeWidth="2.5" />
          {/* Right Shoe */}
          <rect x="42" y="88" width="14" height="6" rx="1" fill="#2B3440" stroke="#2B3440" strokeWidth="1" />

          {/* Torso / Shirt */}
          <rect x="22" y="42" width="36" height="28" rx="2" fill={config.shirtColor} stroke="#2B3440" strokeWidth="2.5" />
          {/* Belt / Shirt trim */}
          <line x1="22" y1="64" x2="58" y2="64" stroke="#2B3440" strokeWidth="2" />
          {/* Collar */}
          <polygon points="34,42 40,48 46,42" fill={config.skinTone} />

          {/* Head (Voxel Cube) */}
          <rect x="18" y="10" width="44" height="34" rx="2" fill={config.skinTone} stroke="#2B3440" strokeWidth="3" />

          {/* Hair */}
          {renderHair()}

          {/* Face Expression */}
          {renderExpression()}

          {/* Accessory */}
          {renderAccessory()}

          {/* Right Arm (In front) */}
          <rect x="58" y="44" width="10" height="26" rx="2" fill={config.shirtColor} stroke="#2B3440" strokeWidth="2.5" />
          <rect x="58" y="62" width="10" height="8" rx="1" fill={config.skinTone} stroke="#2B3440" strokeWidth="2" />

          {/* Role-Specific Weapons in Hand */}
          {role === 'WIZARD' ? (
            /* WIZARD: Arcane Magic Staff with Glowing Gem */
            <g transform="translate(62, 38) rotate(15)">
              {/* Wooden Staff Shaft */}
              <rect x="1" y="-24" width="4" height="46" fill="#78350F" stroke="#2B3440" strokeWidth="1.5" rx="1" />
              {/* Golden Prongs */}
              <polygon points="-2,-24 2,-32 6,-32 10,-24 4,-20" fill="#F59E0B" stroke="#2B3440" strokeWidth="1.5" />
              {/* Glowing Purple Magical Crystal Orb */}
              <circle cx="4" cy="-32" r="7.5" fill="#A855F7" stroke="#2B3440" strokeWidth="2" />
              <circle cx="2.5" cy="-34.5" r="3" fill="#E9D5FF" />
              {/* Arcane Magic Sparks */}
              <circle cx="-3" cy="-34" r="1.5" fill="#38BDF8" className="animate-ping" />
              <circle cx="11" cy="-30" r="1.5" fill="#F472B6" />
            </g>
          ) : role === 'ROGUE' ? (
            /* ROGUE: Dual Shadow Kunai / Daggers */
            <g transform="translate(60, 44) rotate(35)">
              {/* Main Hand Kunai Blade */}
              <polygon points="2,-24 -3,-8 7,-8" fill="#334155" stroke="#2B3440" strokeWidth="1.5" />
              <line x1="2" y1="-24" x2="2" y2="-8" stroke="#94A3B8" strokeWidth="1" />
              {/* Handle / Red Wrap */}
              <rect x="0" y="-8" width="4" height="10" fill="#EF4444" stroke="#2B3440" strokeWidth="1.2" />
              {/* Pommel Ring */}
              <circle cx="2" cy="5" r="3.5" fill="none" stroke="#64748B" strokeWidth="2" />

              {/* Second Kunai (Crossed Behind) */}
              <g transform="translate(-10, 4) rotate(-65)">
                <polygon points="2,-20 -2,-6 6,-6" fill="#1E293B" stroke="#2B3440" strokeWidth="1.5" />
                <rect x="0" y="-6" width="4" height="8" fill="#EF4444" stroke="#2B3440" strokeWidth="1.2" />
                <circle cx="2" cy="4" r="3" fill="none" stroke="#64748B" strokeWidth="2" />
              </g>
            </g>
          ) : (
            /* FIGHTER: Heavy Knight Broadsword */
            <g transform="translate(62, 42) rotate(25)">
              {/* Sword blade */}
              <rect x="0" y="-32" width="7" height="32" fill="#E2E8F0" stroke="#2B3440" strokeWidth="2" rx="1" />
              {/* Blade Fuller / Center Line */}
              <line x1="3.5" y1="-28" x2="3.5" y2="-2" stroke="#94A3B8" strokeWidth="1.5" />
              {/* Blade Tip */}
              <polygon points="-1,-32 3.5,-38 8,-32" fill="#CBD5E1" stroke="#2B3440" strokeWidth="1.5" />
              {/* Golden Crossguard */}
              <rect x="-6" y="0" width="19" height="5" fill="#F59E0B" stroke="#2B3440" strokeWidth="2" rx="1" />
              {/* Leather Hilt */}
              <rect x="1.5" y="5" width="4" height="9" fill="#78350F" stroke="#2B3440" strokeWidth="1.5" />
              {/* Golden Pommel */}
              <circle cx="3.5" cy="16" r="3" fill="#F59E0B" stroke="#2B3440" strokeWidth="1.5" />
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};
