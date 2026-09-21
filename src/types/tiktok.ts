export type LiveEventType = 'like' | 'gift' | 'comment' | 'follow' | 'viewer_count' | 'share' | 'join' | 'member';
export type EventSourceOrigin = 'real' | 'simulation';

export interface LiveUser {
  userId?: string;
  uniqueId: string;
  nickname: string;
  profilePictureUrl?: string;
}

export interface JoinEventData {
  joinedAt: number;
}

export interface LikeEventData {
  likeCount: number; // likes in this burst
  totalLikes?: number; // cumulative reported by tiktok
}

export interface GiftEventData {
  giftId: number | string;
  giftName: string;
  diamondCount: number; // diamonds per gift
  repeatCount: number; // repeat count (e.g., streak combo)
  giftPictureUrl?: string;
}

export interface CommentEventData {
  comment: string;
}

export interface FollowEventData {
  isFollow: boolean;
}

export interface ViewerCountData {
  viewerCount: number;
}

export interface ShareEventData {
  shareType?: string;
}

export interface EventTypeCounts {
  likes: number;
  comments: number;
  follows: number;
  gifts: number;
  viewers: number;
  shares: number;
  total: number;
}

export interface NormalizedLiveEvent {
  id: string;
  type: LiveEventType;
  source: EventSourceOrigin; // 'real' = TikTok LIVE real | 'simulation' = Bot/manual
  timestamp: number;
  user: LiveUser;
  data: LikeEventData | GiftEventData | CommentEventData | FollowEventData | ViewerCountData | ShareEventData | JoinEventData;
  rawPayload?: any; // Payload crudo original para depuración
}

export interface CumulativeStats {
  totalLikes: number;
  totalGifts: number;
  totalDiamonds: number;
  totalComments: number;
  totalFollowers: number;
  currentViewers: number;
  lastUpdated: number;
  eventCounts: EventTypeCounts;
}

export type ConnectionMode = 'real' | 'simulation';
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ConnectionStatus {
  state: ConnectionState;
  mode: ConnectionMode;
  username: string;
  roomId?: string | null;
  errorMessage?: string | null;
  connectedAt?: number;
}

/**
 * Game state interfaces prepared for future game expansion:
 * Players, XP, Levels, Casillas (tiles), Actions.
 */
export interface PlayerProfile {
  id: string;
  username: string;
  nickname: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  currentTile: number;
  lastInteractionAt: number;
  interactionsCount: {
    likes: number;
    gifts: number;
    comments: number;
  };
}
