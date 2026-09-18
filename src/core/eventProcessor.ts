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
} from '../types/tiktok';

export type EventListener = (event: NormalizedLiveEvent, stats: CumulativeStats) => void;

const INITIAL_EVENT_COUNTS: EventTypeCounts = {
  likes: 0,
  comments: 0,
  follows: 0,
  gifts: 0,
  viewers: 0,
  shares: 0,
  total: 0,
};

export class EventProcessor {
  private stats: CumulativeStats = {
    totalLikes: 0,
    totalGifts: 0,
    totalDiamonds: 0,
    totalComments: 0,
    totalFollowers: 0,
    currentViewers: 0,
    lastUpdated: Date.now(),
    eventCounts: { ...INITIAL_EVENT_COUNTS },
  };

  private lastEvent: NormalizedLiveEvent | null = null;
  private recentEvents: NormalizedLiveEvent[] = [];
  private maxHistory: number = 50;
  private listeners: Set<EventListener> = new Set();

  constructor() {
    this.resetStats();
  }

  public resetStats() {
    this.stats = {
      totalLikes: 0,
      totalGifts: 0,
      totalDiamonds: 0,
      totalComments: 0,
      totalFollowers: 0,
      currentViewers: 0,
      lastUpdated: Date.now(),
      eventCounts: { ...INITIAL_EVENT_COUNTS },
    };
    this.lastEvent = null;
    this.recentEvents = [];
  }

  public clearHistory() {
    this.recentEvents = [];
    this.lastEvent = null;
  }

  public subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getStats(): CumulativeStats {
    return {
      ...this.stats,
      eventCounts: { ...this.stats.eventCounts },
    };
  }

  public getLastEvent(): NormalizedLiveEvent | null {
    return this.lastEvent;
  }

  public getRecentEvents(): NormalizedLiveEvent[] {
    return [...this.recentEvents];
  }

  /**
   * Main entry point to process any incoming normalized event
   */
  public processEvent(event: NormalizedLiveEvent): void {
    this.lastEvent = event;
    this.stats.lastUpdated = event.timestamp;
    this.stats.eventCounts.total += 1;

    // Update cumulative tallies and type counters based on event type
    switch (event.type) {
      case 'like': {
        const data = event.data as LikeEventData;
        const count = data.likeCount || 1;
        this.stats.totalLikes += count;
        this.stats.eventCounts.likes += 1;
        break;
      }
      case 'gift': {
        const data = event.data as GiftEventData;
        const repeat = data.repeatCount || 1;
        const diamonds = (data.diamondCount || 1) * repeat;
        this.stats.totalGifts += repeat;
        this.stats.totalDiamonds += diamonds;
        this.stats.eventCounts.gifts += 1;
        break;
      }
      case 'comment': {
        this.stats.totalComments += 1;
        this.stats.eventCounts.comments += 1;
        break;
      }
      case 'follow': {
        this.stats.totalFollowers += 1;
        this.stats.eventCounts.follows += 1;
        break;
      }
      case 'viewer_count': {
        const data = event.data as ViewerCountData;
        this.stats.currentViewers = data.viewerCount;
        this.stats.eventCounts.viewers += 1;
        break;
      }
    }

    // Keep history ring buffer (newest first, maximum 50 events)
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > this.maxHistory) {
      this.recentEvents.pop();
    }

    // Notify registered listeners
    this.listeners.forEach((listener) => {
      try {
        listener(event, this.getStats());
      } catch (err) {
        console.error('Error in event listener:', err);
      }
    });
  }

  /**
   * Helper to normalize raw events coming from third-party WebcastPushConnection or simulation
   */
  public normalizeRawEvent(
    rawType: string,
    rawData: any,
    source: EventSourceOrigin = 'real'
  ): NormalizedLiveEvent | null {
    const timestamp = Date.now();
    const id = `evt_${timestamp}_${Math.random().toString(36).substring(2, 9)}`;

    const user: LiveUser = {
      uniqueId: rawData?.uniqueId || rawData?.user?.uniqueId || rawData?.nickname || 'usuario_anonimo',
      nickname: rawData?.nickname || rawData?.user?.nickname || rawData?.uniqueId || 'Anónimo',
      profilePictureUrl:
        rawData?.profilePictureUrl ||
        rawData?.user?.profilePictureUrl ||
        rawData?.user?.avatarThumb?.urlList?.[0] ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(rawData?.uniqueId || 'user')}`,
    };

    switch (rawType) {
      case 'like': {
        const data: LikeEventData = {
          likeCount: typeof rawData?.likeCount === 'number' ? rawData.likeCount : 1,
          totalLikes: rawData?.totalLikeCount || undefined,
        };
        return { id, type: 'like', source, timestamp, user, data, rawPayload: rawData };
      }
      case 'chat':
      case 'comment': {
        const data: CommentEventData = {
          comment: rawData?.comment || rawData?.text || '',
        };
        return { id, type: 'comment', source, timestamp, user, data, rawPayload: rawData };
      }
      case 'gift': {
        const data: GiftEventData = {
          giftId: rawData?.giftId || rawData?.giftDetails?.giftId || 1,
          giftName: rawData?.giftName || rawData?.giftDetails?.giftName || 'Regalo',
          diamondCount: rawData?.diamondCount || rawData?.giftDetails?.diamondCount || 1,
          repeatCount: rawData?.repeatCount || 1,
          giftPictureUrl: rawData?.giftPictureUrl || rawData?.giftDetails?.giftImage?.urlList?.[0],
        };
        return { id, type: 'gift', source, timestamp, user, data, rawPayload: rawData };
      }
      case 'follow': {
        const data: FollowEventData = {
          isFollow: true,
        };
        return { id, type: 'follow', source, timestamp, user, data, rawPayload: rawData };
      }
      case 'roomUser':
      case 'viewer_count': {
        const count = typeof rawData?.viewerCount === 'number' ? rawData.viewerCount : 0;
        const data: ViewerCountData = {
          viewerCount: count,
        };
        return {
          id,
          type: 'viewer_count',
          source,
          timestamp,
          user: { uniqueId: 'system', nickname: 'Sistema' },
          data,
          rawPayload: rawData,
        };
      }
      default:
        return null;
    }
  }
}
