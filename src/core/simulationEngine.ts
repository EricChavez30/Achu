import { NormalizedLiveEvent, LiveUser, GiftEventData } from '../types/tiktok';

const MOCK_USERS: LiveUser[] = [
  { uniqueId: 'carlos_gamer99', nickname: 'Carlos Gamer', profilePictureUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60' },
  { uniqueId: 'sofia_montes', nickname: 'Sofi ✨', profilePictureUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60' },
  { uniqueId: 'el_pepe_live', nickname: 'El Pepe', profilePictureUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60' },
  { uniqueId: 'lucia_stream', nickname: 'Luci 🎮', profilePictureUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=60' },
  { uniqueId: 'matias_xd', nickname: 'Matias Ruiz', profilePictureUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60' },
  { uniqueId: 'valen_flores', nickname: 'Valentina', profilePictureUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=60' },
  { uniqueId: 'alan_walker_fan', nickname: 'Alan 🔥', profilePictureUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60' },
  { uniqueId: 'camila_tiktok', nickname: 'Cami', profilePictureUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&auto=format&fit=crop&q=60' },
];

const MOCK_COMMENTS: string[] = [
  '¡Saludos desde México! 🇲🇽',
  '¡Vamos con todo!',
  'Denle tap tap a la pantalla chicos ❤️',
  '¿De dónde eres?',
  '¡Qué buena transmisión!',
  'compartido el live bro 🔥',
  'jajaja me muero de risa 😂',
  'salúdame porfa',
  '¡Vamos por el objetivo de likes!',
  'apoyo total crack',
  'hola a todos en el chat 👋',
  'sigan al streamer para no perderse nada',
];

export interface MockGiftPreset {
  giftId: number;
  giftName: string;
  diamondCount: number;
  emoji: string;
}

export const MOCK_GIFTS: MockGiftPreset[] = [
  { giftId: 5655, giftName: 'Rosa', diamondCount: 1, emoji: '🌹' },
  { giftId: 5269, giftName: 'TikTok', diamondCount: 1, emoji: '🎵' },
  { giftId: 5880, giftName: 'Corazón de Dedo', diamondCount: 5, emoji: '🫰' },
  { giftId: 5487, giftName: 'Panda', diamondCount: 5, emoji: '🐼' },
  { giftId: 6059, giftName: 'Donas', diamondCount: 30, emoji: '🍩' },
  { giftId: 6114, giftName: 'Corona de Flores', diamondCount: 99, emoji: '👑' },
  { giftId: 6267, giftName: 'Galaxia', diamondCount: 1000, emoji: '🌌' },
  { giftId: 6300, giftName: 'Ballena Buceadora', diamondCount: 2150, emoji: '🐋' },
];

export class SimulationEngine {
  private isRunning: boolean = false;
  private intervalTimer: any = null;
  private onEventCallback: ((event: NormalizedLiveEvent) => void) | null = null;
  private currentViewers: number = 248;

  constructor(onEvent?: (event: NormalizedLiveEvent) => void) {
    if (onEvent) this.onEventCallback = onEvent;
  }

  public setEventCallback(callback: (event: NormalizedLiveEvent) => void) {
    this.onEventCallback = callback;
  }

  public start(intervalMs: number = 1800) {
    if (this.isRunning) return;
    this.isRunning = true;

    // Send initial viewer count
    this.triggerViewerCount(this.currentViewers);

    this.intervalTimer = setInterval(() => {
      this.generateRandomEvent();
    }, intervalMs);
  }

  public stop() {
    this.isRunning = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  private getRandomUser(): LiveUser {
    const randomIndex = Math.floor(Math.random() * MOCK_USERS.length);
    return { ...MOCK_USERS[randomIndex] };
  }

  private emit(event: NormalizedLiveEvent) {
    if (this.onEventCallback) {
      this.onEventCallback(event);
    }
  }

  public generateRandomEvent(): NormalizedLiveEvent {
    // Weighted probabilities: 45% like, 35% comment, 12% gift, 5% follow, 3% viewer update
    const rand = Math.random();
    if (rand < 0.45) {
      return this.triggerLike();
    } else if (rand < 0.80) {
      return this.triggerComment();
    } else if (rand < 0.92) {
      return this.triggerGift();
    } else if (rand < 0.97) {
      return this.triggerFollow();
    } else {
      const delta = Math.floor(Math.random() * 11) - 5;
      this.currentViewers = Math.max(10, this.currentViewers + delta);
      return this.triggerViewerCount(this.currentViewers);
    }
  }

  public triggerLike(customUser?: LiveUser, count?: number): NormalizedLiveEvent {
    const user = customUser || this.getRandomUser();
    const likeCount = count || Math.floor(Math.random() * 15) + 1;
    const rawPayload = {
      uniqueId: user.uniqueId,
      nickname: user.nickname,
      likeCount,
      totalLikeCount: 1500 + Math.floor(Math.random() * 200),
      profilePictureUrl: user.profilePictureUrl,
      simulated: true,
    };
    const event: NormalizedLiveEvent = {
      id: `sim_like_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'like',
      source: 'simulation',
      timestamp: Date.now(),
      user,
      data: {
        likeCount,
      },
      rawPayload,
    };
    this.emit(event);
    return event;
  }

  public triggerComment(customUser?: LiveUser, text?: string): NormalizedLiveEvent {
    const user = customUser || this.getRandomUser();
    const comment = text || MOCK_COMMENTS[Math.floor(Math.random() * MOCK_COMMENTS.length)];
    const rawPayload = {
      uniqueId: user.uniqueId,
      nickname: user.nickname,
      comment,
      profilePictureUrl: user.profilePictureUrl,
      simulated: true,
    };
    const event: NormalizedLiveEvent = {
      id: `sim_comment_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'comment',
      source: 'simulation',
      timestamp: Date.now(),
      user,
      data: {
        comment,
      },
      rawPayload,
    };
    this.emit(event);
    return event;
  }

  public triggerGift(customUser?: LiveUser, giftPreset?: MockGiftPreset, repeats: number = 1): NormalizedLiveEvent {
    const user = customUser || this.getRandomUser();
    const gift = giftPreset || MOCK_GIFTS[Math.floor(Math.random() * (Math.random() > 0.8 ? MOCK_GIFTS.length : 4))];
    const data: GiftEventData = {
      giftId: gift.giftId,
      giftName: `${gift.emoji} ${gift.giftName}`,
      diamondCount: gift.diamondCount,
      repeatCount: repeats,
    };
    const rawPayload = {
      uniqueId: user.uniqueId,
      nickname: user.nickname,
      giftId: gift.giftId,
      giftName: gift.giftName,
      diamondCount: gift.diamondCount,
      repeatCount: repeats,
      profilePictureUrl: user.profilePictureUrl,
      simulated: true,
    };

    const event: NormalizedLiveEvent = {
      id: `sim_gift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'gift',
      source: 'simulation',
      timestamp: Date.now(),
      user,
      data,
      rawPayload,
    };
    this.emit(event);
    return event;
  }

  public triggerFollow(customUser?: LiveUser): NormalizedLiveEvent {
    const user = customUser || this.getRandomUser();
    const rawPayload = {
      uniqueId: user.uniqueId,
      nickname: user.nickname,
      profilePictureUrl: user.profilePictureUrl,
      simulated: true,
    };
    const event: NormalizedLiveEvent = {
      id: `sim_follow_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'follow',
      source: 'simulation',
      timestamp: Date.now(),
      user,
      data: {
        isFollow: true,
      },
      rawPayload,
    };
    this.emit(event);
    return event;
  }

  public triggerViewerCount(count: number): NormalizedLiveEvent {
    this.currentViewers = count;
    const rawPayload = {
      viewerCount: count,
      simulated: true,
    };
    const event: NormalizedLiveEvent = {
      id: `sim_viewers_${Date.now()}`,
      type: 'viewer_count',
      source: 'simulation',
      timestamp: Date.now(),
      user: { uniqueId: 'tiktok_stream', nickname: 'TikTok Stream' },
      data: {
        viewerCount: count,
      },
      rawPayload,
    };
    this.emit(event);
    return event;
  }
}
