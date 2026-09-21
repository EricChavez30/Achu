import {
  NormalizedLiveEvent,
  CumulativeStats,
  LiveEventType,
  LiveUser,
  LikeEventData,
  GiftEventData,
  CommentEventData,
  FollowEventData,
  ViewerCountData,
  EventSourceOrigin,
  EventTypeCounts,
  ConnectionMode,
  ConnectionState,
  ConnectionStatus,
  PlayerProfile,
} from './tiktok';

// Re-export original TikTok types
export * from './tiktok';

// Game Engine User Status
export type UserGameStatus = 'VISITOR' | 'MEMBER';

// Game User definition
export interface GameUser {
  id: string;
  username: string;
  nickname: string;
  avatarUrl?: string;
  firstSeen: number;
  lastSeen: number;
  status: UserGameStatus;
  xp: number;
  level: number;
  slotNumber: number | null; // 1 to 100 if MEMBER, null if VISITOR
  totalComments: number;
  totalLikes: number;
  totalGifts: number;
  totalFollows: number;
  totalInteractions: number;
  // Moderación y Seguridad
  isBanned?: boolean;
  moderationStatus?: 'APPROVED' | 'PENDING_REVIEW' | 'FLAGGED_BLOCKED';
  moderationReason?: string;
}

// Registro de usuario en cuarentena o pendiente de moderación
export interface ModerationAuditLog {
  id: string;
  timestamp: number;
  username: string;
  nickname: string;
  detectedText: string;
  reason: string;
  actionTaken: 'BLOCKED' | 'FLAGGED' | 'EXCLUDED_FROM_SLOTS';
}

// 100 Slots definition
export interface GameSlot {
  number: number; // 1 - 100
  status: 'EMPTY' | 'OCCUPIED';
  playerId: string | null;
  username: string | null;
  nickname: string | null;
  avatarUrl?: string;
  occupiedAt?: number;
}

// Community Mission definition
export interface CommunityMission {
  id: string;
  title: string;
  description: string;
  type: 'likes' | 'members' | 'comments' | 'gifts';
  current: number;
  target: number;
  rewardText: string;
  completed: boolean;
  isActive: boolean;
}

// Chat Command Execution Result
export interface ChatCommandResult {
  command: string; // '!slot', '!nivel', '!xp', '!meta', '!top', etc.
  username: string;
  nickname: string;
  avatarUrl?: string;
  response: string;
  detail?: string;
  badge?: string;
  timestamp: number;
}

// Community State
export interface CommunityState {
  worldLevel: number;
  communityXP: number;
  communityEnergy: number; // percentage 0 - 100
  activeVisitors: number;
  totalVisitors: number;
  totalMembers: number;
  currentEvent: string;
  activeMission?: CommunityMission;
  isFeverModeActive?: boolean; // x2 XP fever
  feverTimeRemaining?: number; // seconds
}

// Internal Game Engine Event Types
export type GameEngineEventType =
  | 'PLAYER_JOINED'
  | 'PLAYER_INTERACTION'
  | 'PLAYER_LEVEL_UP'
  | 'PLAYER_BECAME_MEMBER'
  | 'COMMUNITY_PROGRESS'
  | 'GIFT_EVENT'
  | 'CHAT_COMMAND'
  | 'COMMUNITY_MISSION_COMPLETED';

export interface GameEngineEvent {
  id: string;
  type: GameEngineEventType;
  timestamp: number;
  player: {
    id: string;
    username: string;
    nickname: string;
    avatarUrl?: string;
    status: UserGameStatus;
    level: number;
    xp: number;
    slotNumber: number | null;
  };
  data: {
    message?: string;
    xpGained?: number;
    oldLevel?: number;
    newLevel?: number;
    slotNumber?: number;
    giftName?: string;
    diamonds?: number;
    interactionType?: string;
    communityXpGained?: number;
  };
}

// Configurable Rules for the Game Engine
export interface GameEngineConfig {
  joinXp: number;
  commentXp: number;
  likeXp: number;
  followXp: number;
  giftXpMultiplier: number; // XP per diamond / gift value
  memberXpRequirement: number; // XP required to become MEMBER (e.g. 500)
  maxSlots: number; // 100 slots
  levels: { level: number; requiredXp: number }[];
  communityXpPerWorldLevel: number;
  // Anti-Spam & Rate Limiting for Chat Commands
  commandCooldownSeconds?: number; // Cooldown per user (e.g. 15s)
  commandGlobalCooldownSeconds?: number; // Global overlay queue cooldown (e.g. 3s)
  allowCommandsFromVisitors?: boolean; // false = only members with slots can trigger on-screen alerts
}
