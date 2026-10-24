import type { PlayerRole, RoleDefinition } from '../types';

export const ROLES: RoleDefinition[] = [
  {
    id: 'FIGHTER',
    name: 'FIGHTER (PENDEKAR)',
    tagline: 'Petarung tangguh bertubuh baja',
    passiveName: 'Baja Tangguh (+10 HP)',
    passiveDesc: 'Memulai pertarungan dengan 110 HP maksimum, lebih tahan terhadap gempuran serangan.',
    baseHp: 110,
  },
  {
    id: 'WIZARD',
    name: 'WIZARD (PENYIHIR)',
    tagline: 'Master mantra ledakan burst',
    passiveName: 'Arcane Burst (+5 Crit DMG)',
    passiveDesc: 'Serangan kecepatan tinggi (Hyper Crit) menghasilkan ledakan +5 damage tambahan.',
    baseHp: 95,
  },
  {
    id: 'ROGUE',
    name: 'ROGUE (NINJA)',
    tagline: 'Lincah bersenjatakan shuriken',
    passiveName: 'Refleks Bayangan (15% Dodge)',
    passiveDesc: 'Memiliki peluang 15% secara otomatis menghindar dari serangan lawan (DODGE).',
    baseHp: 100,
  },
];

export function getRoleDefinition(role: PlayerRole): RoleDefinition {
  return ROLES.find((r) => r.id === role) || ROLES[0];
}
