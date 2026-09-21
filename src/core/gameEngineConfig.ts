import { GameEngineConfig } from '../types/game';

export const DEFAULT_GAME_CONFIG: GameEngineConfig = {
  // Configurable XP actions
  joinXp: 5,
  commentXp: 10,
  likeXp: 1,
  followXp: 25,
  giftXpMultiplier: 20, // 20 XP per diamond/coin
  
  // Requirement to become MEMBER
  memberXpRequirement: 500,

  // Community slots
  maxSlots: 100,

  // Level Progression Table (Configurable)
  levels: [
    { level: 1, requiredXp: 0 },
    { level: 2, requiredXp: 100 },
    { level: 3, requiredXp: 250 },
    { level: 4, requiredXp: 500 },
    { level: 5, requiredXp: 1000 },
    { level: 6, requiredXp: 2000 },
    { level: 7, requiredXp: 3500 },
    { level: 8, requiredXp: 5000 },
  ],

  // Community progress per world level
  communityXpPerWorldLevel: 1000,

  // Anti-Spam / Cooldown para comandos de chat
  commandCooldownSeconds: 15, // 15 segundos entre comandos del mismo usuario
  commandGlobalCooldownSeconds: 4, // 4 segundos entre alertas en pantalla
  allowCommandsFromVisitors: true, // Permitir a visitantes consultar progreso
};
