import {
  GameUser,
  GameSlot,
  CommunityState,
  GameEngineEvent,
  GameEngineConfig,
  NormalizedLiveEvent,
  UserGameStatus,
  CommunityMission,
  ChatCommandResult,
  ModerationAuditLog,
} from '../types/game';
import { DEFAULT_GAME_CONFIG } from './gameEngineConfig';
import { checkContentSafety } from './moderation';

export type GameEngineListener = (
  communityState: CommunityState,
  lastEvent: GameEngineEvent | null,
  slots: GameSlot[],
  lastUser: GameUser | null
) => void;

const STORAGE_USERS_KEY = 'tiktok_live_game_users_v1';
const STORAGE_SLOTS_KEY = 'tiktok_live_game_slots_v1';
const STORAGE_COMMUNITY_KEY = 'tiktok_live_game_community_v1';
const STORAGE_MODERATION_KEY = 'tiktok_live_moderation_logs_v1';

export class GameEngine {
  private config: GameEngineConfig;
  private users: Map<string, GameUser> = new Map();
  private slots: GameSlot[] = [];
  private moderationLogs: ModerationAuditLog[] = [];
  private customBlockedWords: string[] = [];
  private requireApprovalForMembers: boolean = false;
  private communityState: CommunityState = {
    worldLevel: 1,
    communityXP: 0,
    communityEnergy: 0,
    activeVisitors: 0,
    totalVisitors: 0,
    totalMembers: 0,
    currentEvent: 'Despertar de la Comunidad',
    activeMission: {
      id: 'mission_likes_goal',
      title: 'Meta del Directo: 2,500 Likes',
      description: 'Toquen la pantalla juntos para activar Fiebre de XP x2',
      type: 'likes',
      current: 0,
      target: 2500,
      rewardText: 'Fiebre de XP x2 durante 5 minutos',
      completed: false,
      isActive: true,
    },
    isFeverModeActive: false,
    feverTimeRemaining: 0,
  };
  private recentEvents: GameEngineEvent[] = [];
  private maxEventHistory: number = 50;
  private lastEngineEvent: GameEngineEvent | null = null;
  private lastActiveUser: GameUser | null = null;
  private lastCommandResult: ChatCommandResult | null = null;
  private feverTimer: any = null;
  private listeners: Set<GameEngineListener> = new Set();

  constructor(customConfig?: Partial<GameEngineConfig>) {
    this.config = { ...DEFAULT_GAME_CONFIG, ...customConfig };
    this.initializeSlots();
    this.loadFromStorage();
    this.recalculateCommunityCounts();
  }

  /**
   * Inicializa las 100 slots vacías
   */
  private initializeSlots() {
    this.slots = [];
    for (let i = 1; i <= this.config.maxSlots; i++) {
      this.slots.push({
        number: i,
        status: 'EMPTY',
        playerId: null,
        username: null,
        nickname: null,
      });
    }
  }

  /**
   * Carga persistencia: Primero desde localStorage para carga instantánea,
   * y luego sincroniza de manera asíncrona desde data/game_database.json en el servidor
   */
  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined') {
        const rawUsers = localStorage.getItem(STORAGE_USERS_KEY);
        if (rawUsers) {
          const parsed = JSON.parse(rawUsers) as GameUser[];
          parsed.forEach((u) => this.users.set(u.id, u));
        }

        const rawSlots = localStorage.getItem(STORAGE_SLOTS_KEY);
        if (rawSlots) {
          const parsedSlots = JSON.parse(rawSlots) as GameSlot[];
          if (Array.isArray(parsedSlots) && parsedSlots.length === this.config.maxSlots) {
            this.slots = parsedSlots;
          }
        }

        const rawComm = localStorage.getItem(STORAGE_COMMUNITY_KEY);
        if (rawComm) {
          this.communityState = { ...this.communityState, ...JSON.parse(rawComm) };
        }

        const rawModLogs = localStorage.getItem(STORAGE_MODERATION_KEY);
        if (rawModLogs) {
          this.moderationLogs = JSON.parse(rawModLogs);
        }
      }
    } catch (e) {
      console.warn('Could not load game state from localStorage, starting fresh:', e);
    }

    // Sincronizar desde archivo persistente data/game_database.json
    this.syncFromFileDatabase();
  }

  /**
   * Carga los datos desde el archivo del servidor
   */
  public async syncFromFileDatabase(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      const res = await fetch('/api/game/data');
      if (!res.ok) return false;
      const json = await res.json();
      if (json.success && json.exists && json.data) {
        const { users, slots, communityState } = json.data;
        if (Array.isArray(users) && users.length > 0) {
          users.forEach((u: GameUser) => this.users.set(u.id, u));
        }
        if (Array.isArray(slots) && slots.length === this.config.maxSlots) {
          this.slots = slots;
        }
        if (communityState) {
          this.communityState = { ...this.communityState, ...communityState };
        }
        this.recalculateCommunityCounts();
        this.notifyListeners();
        return true;
      }
    } catch (err) {
      // Servidor o red no disponible, usar memoria local
    }
    return false;
  }

  private saveDebounceTimer: any = null;

  /**
   * Guarda persistencia local y sincroniza al archivo físico data/game_database.json
   */
  private saveToStorage() {
    try {
      if (typeof window === 'undefined') return;

      const userList = Array.from(this.users.values());
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(userList));
      localStorage.setItem(STORAGE_SLOTS_KEY, JSON.stringify(this.slots));
      localStorage.setItem(STORAGE_COMMUNITY_KEY, JSON.stringify(this.communityState));
      localStorage.setItem(STORAGE_MODERATION_KEY, JSON.stringify(this.moderationLogs));

      // Guardar también en el servidor (archivo JSON) con debounce para optimizar I/O
      if (this.saveDebounceTimer) {
        clearTimeout(this.saveDebounceTimer);
      }
      this.saveDebounceTimer = setTimeout(() => {
        this.saveToFileDatabase();
      }, 1000);
    } catch (e) {
      // ignore storage write errors
    }
  }

  /**
   * Envía el estado al endpoint /api/game/save para escribir a disco
   */
  public async saveToFileDatabase(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      const userList = Array.from(this.users.values());
      const payload = {
        users: userList,
        slots: this.slots,
        communityState: this.communityState,
      };
      const res = await fetch('/api/game/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  /**
   * Recalcula contadores globales de miembros y visitantes
   */
  private recalculateCommunityCounts() {
    let visitors = 0;
    let members = 0;

    this.users.forEach((u) => {
      if (u.status === 'MEMBER') members++;
      else visitors++;
    });

    this.communityState.totalVisitors = visitors;
    this.communityState.totalMembers = members;
    this.communityState.activeVisitors = visitors;
  }

  /**
   * Calcula el nivel de un usuario en base a su XP según la tabla configurable
   */
  public calculateLevel(xp: number): number {
    let currentLevel = 1;
    for (const lvl of this.config.levels) {
      if (xp >= lvl.requiredXp) {
        currentLevel = lvl.level;
      } else {
        break;
      }
    }
    return currentLevel;
  }

  /**
   * Busca la primera slot libre (1 a 100)
   */
  private findFirstAvailableSlot(): GameSlot | null {
    for (const slot of this.slots) {
      if (slot.status === 'EMPTY') {
        return slot;
      }
    }
    return null;
  }

  /**
   * Emite un evento interno del Game Engine
   */
  private emitGameEvent(
    type: GameEngineEvent['type'],
    user: GameUser,
    data: GameEngineEvent['data']
  ) {
    const event: GameEngineEvent = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      timestamp: Date.now(),
      player: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        status: user.status,
        level: user.level,
        xp: user.xp,
        slotNumber: user.slotNumber,
      },
      data,
    };

    this.lastEngineEvent = event;
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > this.maxEventHistory) {
      this.recentEvents.pop();
    }

    this.notifyListeners();
  }

  /**
   * Suma progreso comunitario y actualiza nivel de mundo
   */
  private addCommunityXp(xp: number) {
    this.communityState.communityXP += xp;

    // Calcular nivel de mundo y energía (0-100% de la meta del nivel actual)
    const requiredForNext = this.config.communityXpPerWorldLevel;
    const currentWorldXp = this.communityState.communityXP % requiredForNext;
    const calculatedWorldLevel = Math.floor(this.communityState.communityXP / requiredForNext) + 1;

    this.communityState.worldLevel = calculatedWorldLevel;
    this.communityState.communityEnergy = Math.min(100, Math.round((currentWorldXp / requiredForNext) * 100));

    if (calculatedWorldLevel > 1) {
      this.communityState.currentEvent = `Era de la Comunidad Nivel ${calculatedWorldLevel}`;
    }
  }

  /**
   * Otorga XP a un usuario, evalúa subida de nivel y ascenso a MEMBER
   */
  private awardUserXp(user: GameUser, xpToAdd: number, reason: string): { leveledUp: boolean; becameMember: boolean } {
    if (user.isBanned || user.moderationStatus === 'FLAGGED_BLOCKED') {
      return { leveledUp: false, becameMember: false };
    }

    const oldLevel = user.level;
    user.xp += xpToAdd;

    // Actualizar progreso comunitario proporcional
    this.addCommunityXp(xpToAdd);

    // 1. Evaluar Nivel
    const newLevel = this.calculateLevel(user.xp);
    let leveledUp = false;
    if (newLevel > oldLevel) {
      user.level = newLevel;
      leveledUp = true;
      this.emitGameEvent('PLAYER_LEVEL_UP', user, {
        oldLevel,
        newLevel,
        xpGained: xpToAdd,
        message: `¡@${user.username} subió al Nivel ${newLevel}!`,
      });
    }

    // 2. Evaluar Ascenso: VISITOR -> MEMBER
    let becameMember = false;
    if (user.status === 'VISITOR' && user.xp >= this.config.memberXpRequirement) {
      // Si requiere aprobación de moderador o está pendiente de revisión
      if (this.requireApprovalForMembers && user.moderationStatus === 'PENDING_REVIEW') {
        return { leveledUp, becameMember: false };
      }

      // Buscar primera slot libre (1 a 100)
      const freeSlot = this.findFirstAvailableSlot();
      if (freeSlot) {
        user.status = 'MEMBER';
        user.slotNumber = freeSlot.number;

        freeSlot.status = 'OCCUPIED';
        freeSlot.playerId = user.id;
        freeSlot.username = user.username;
        freeSlot.nickname = user.nickname;
        freeSlot.avatarUrl = user.avatarUrl;
        freeSlot.occupiedAt = Date.now();

        this.communityState.totalMembers = this.slots.filter((s) => s.status === 'OCCUPIED').length;
        this.communityState.totalVisitors = Math.max(0, this.users.size - this.communityState.totalMembers);

        becameMember = true;
        this.emitGameEvent('PLAYER_BECAME_MEMBER', user, {
          slotNumber: freeSlot.number,
          message: `¡@${user.username} desbloqueó el Slot #${freeSlot.number} y ahora es MEMBER!`,
        });
      } else {
        // Todas las 100 slots están ocupadas: el usuario sigue ganando XP como VISITOR sin perder datos
        console.info(`Slots 100 ocupadas. @${user.username} permanece en lista de espera de slots.`);
      }
    }

    return { leveledUp, becameMember };
  }

  /**
   * NÚCLEO: Obtiene o crea un usuario como VISITOR
   */
  public getOrCreateUser(userId: string, username: string, nickname?: string, avatarUrl?: string): { user: GameUser; isNew: boolean } {
    const cleanId = (userId || username).toLowerCase().trim();
    let user = this.users.get(cleanId);
    let isNew = false;

    if (!user) {
      isNew = true;

      // Evaluación de seguridad automática de nombre de usuario y apodo
      const safetyUser = checkContentSafety(`${username} ${nickname || ''}`, this.customBlockedWords);
      const isBlocked = !safetyUser.isAllowed;

      user = {
        id: cleanId,
        username: username || cleanId,
        nickname: nickname || username || cleanId,
        avatarUrl: avatarUrl,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        status: 'VISITOR', // Siempre entra inicialmente como VISITOR
        xp: 0,
        level: 1,
        slotNumber: null,
        totalComments: 0,
        totalLikes: 0,
        totalGifts: 0,
        totalFollows: 0,
        totalInteractions: 0,
        isBanned: isBlocked,
        moderationStatus: isBlocked
          ? 'FLAGGED_BLOCKED'
          : this.requireApprovalForMembers
          ? 'PENDING_REVIEW'
          : 'APPROVED',
        moderationReason: safetyUser.reason,
      };

      if (isBlocked) {
        this.logModerationAudit(
          user.username,
          user.nickname,
          `${username} / ${nickname || ''}`,
          safetyUser.reason || 'Palabras que violan políticas de comunidad',
          'BLOCKED'
        );
      }

      this.users.set(cleanId, user);
      this.recalculateCommunityCounts();

      // Si no está bloqueado, emitir evento de bienvenida y otorgar XP inicial
      if (!isBlocked) {
        this.emitGameEvent('PLAYER_JOINED', user, {
          xpGained: this.config.joinXp,
          message: `@${user.username} se unió a la comunidad como VISITOR (+${this.config.joinXp} XP)`,
        });
        this.awardUserXp(user, this.config.joinXp, 'JOIN');
      }
    } else {
      user.lastSeen = Date.now();
      if (nickname) user.nickname = nickname;
      if (avatarUrl) user.avatarUrl = avatarUrl;
    }

    return { user, isNew };
  }

  /**
   * PROCESADOR PRINCIPAL: Recibe evento normalizado (sea REAL de TikTok o SIMULADO)
   */
  public processLiveEvent(event: NormalizedLiveEvent): GameUser | null {
    if (!event || !event.user) return null;

    const rawId = event.user.uniqueId || event.user.userId || 'anon_guest';
    const rawUsername = event.user.uniqueId || 'anon_guest';
    const rawNickname = event.user.nickname || rawUsername;
    const rawAvatar = event.user.profilePictureUrl;

    const { user } = this.getOrCreateUser(rawId, rawUsername, rawNickname, rawAvatar);
    user.lastSeen = Date.now();
    user.totalInteractions += 1;
    this.lastActiveUser = user;

    let xpGained = 0;
    let interactionDesc = '';

    switch (event.type) {
      case 'comment': {
        const commentText = (event.data as any)?.comment || '';

        // Filtro de seguridad de comentarios en vivo
        const commentSafety = checkContentSafety(commentText, this.customBlockedWords);
        if (!commentSafety.isAllowed) {
          // Registrar log de moderación y no procesar XP ni comandos
          this.logModerationAudit(
            user.username,
            user.nickname,
            commentText,
            commentSafety.reason || 'Comentario con lenguaje ofensivo o inapropiado',
            'BLOCKED'
          );
          user.moderationReason = commentSafety.reason;
          interactionDesc = `Comentario bloqueado por moderación de seguridad`;
          break;
        }

        user.totalComments += 1;
        xpGained = this.config.commentXp;
        interactionDesc = `Comentó: "${commentText.slice(0, 30)}${commentText.length > 30 ? '...' : ''}"`;

        // Detección de comandos de chat (!slot, !nivel, !meta, etc.)
        if (commentText.trim().startsWith('!')) {
          this.handleChatCommand(user, commentText.trim());
        }

        // Progreso de misión si aplica
        this.updateMissionProgress('comments', 1, user);
        break;
      }
      case 'like': {
        const likeCount = (event.data as any)?.likeCount || 1;
        user.totalLikes += likeCount;
        xpGained = this.config.likeXp * Math.max(1, Math.min(likeCount, 50));
        interactionDesc = `Envió ${likeCount} like(s)`;

        // Progreso de misión de likes
        this.updateMissionProgress('likes', likeCount, user);
        break;
      }
      case 'follow': {
        user.totalFollows += 1;
        xpGained = this.config.followXp;
        interactionDesc = `Comenzó a seguir el directo`;
        break;
      }
      case 'join':
      case 'member': {
        xpGained = this.config.joinXp;
        interactionDesc = `se ha unido al directo`;
        break;
      }
      case 'gift': {
        user.totalGifts += 1;
        const giftData = event.data as any;
        const diamonds = (giftData?.diamondCount || 1) * (giftData?.repeatCount || 1);
        const giftName = giftData?.giftName || 'Regalo';
        xpGained = diamonds * this.config.giftXpMultiplier;
        interactionDesc = `Envió regalo ${giftName} (${diamonds} diamantes)`;

        // Progreso de misión de regalos
        this.updateMissionProgress('gifts', diamonds, user);

        this.emitGameEvent('GIFT_EVENT', user, {
          giftName,
          diamonds,
          xpGained,
          message: `@${user.username} envió ${giftName} (+${xpGained} XP)`,
        });
        break;
      }
      case 'viewer_count': {
        // Actualiza el número de espectadores sin sumar XP a un usuario individual
        return user;
      }
      default: {
        xpGained = 1;
        interactionDesc = `Interactuó con el directo`;
        break;
      }
    }

    // Si está activo el modo Fiebre (Fever x2), duplicar la XP ganada
    const finalXp = this.communityState.isFeverModeActive ? xpGained * 2 : xpGained;

    if (finalXp > 0) {
      this.awardUserXp(user, finalXp, event.type.toUpperCase());
    }

    this.emitGameEvent('PLAYER_INTERACTION', user, {
      interactionType: event.type,
      xpGained: finalXp,
      message: `@${user.username} ${interactionDesc} (+${finalXp} XP)${this.communityState.isFeverModeActive ? ' [FIEBRE x2]' : ''}`,
    });

    this.saveToStorage();
    this.notifyListeners();
    return user;
  }

  /**
   * Método de conveniencia para simulación directa con username
   */
  public simulateAction(
    username: string,
    actionType: 'join' | 'comment' | 'like' | 'follow' | 'gift',
    payload?: { comment?: string; giftName?: string; diamonds?: number; count?: number }
  ): GameUser {
    const cleanUser = username.replace(/^@/, '').trim() || 'testuser';

    const mockEvent: NormalizedLiveEvent = {
      id: `sim_${Date.now()}_${Math.random()}`,
      type: actionType === 'join' ? 'join' : (actionType as any),
      timestamp: Date.now(),
      source: 'simulation',
      user: {
        userId: cleanUser.toLowerCase(),
        uniqueId: cleanUser,
        nickname: cleanUser.toUpperCase(),
        profilePictureUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUser}`,
      },
      data:
        actionType === 'comment'
          ? { comment: payload?.comment || '¡Hola a todos en el stream!' }
          : actionType === 'like'
          ? { likeCount: payload?.count || 5, totalLikes: 100 }
          : actionType === 'follow'
          ? { isFollow: true }
          : actionType === 'gift'
          ? {
              giftId: 1,
              giftName: payload?.giftName || 'Rosa de TikTok',
              diamondCount: payload?.diamonds || 1,
              repeatCount: 1,
            }
          : { joinedAt: Date.now() },
    };

    return this.processLiveEvent(mockEvent)!;
  }

  /**
   * Resetea el estado del juego (para pruebas)
   */
  public resetGameData() {
    this.users.clear();
    this.initializeSlots();
    this.communityState = {
      worldLevel: 1,
      communityXP: 0,
      communityEnergy: 0,
      activeVisitors: 0,
      totalVisitors: 0,
      totalMembers: 0,
      currentEvent: 'Despertar de la Comunidad',
      activeMission: {
        id: 'mission_likes_goal',
        title: 'Meta del Directo: 2,500 Likes',
        description: 'Toquen la pantalla juntos para activar Fiebre de XP x2',
        type: 'likes',
        current: 0,
        target: 2500,
        rewardText: 'Fiebre de XP x2 durante 5 minutos',
        completed: false,
        isActive: true,
      },
      isFeverModeActive: false,
      feverTimeRemaining: 0,
    };
    this.recentEvents = [];
    this.lastEngineEvent = null;
    this.lastActiveUser = null;
    this.lastCommandResult = null;

    if (this.feverTimer) {
      clearInterval(this.feverTimer);
      this.feverTimer = null;
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_USERS_KEY);
      localStorage.removeItem(STORAGE_SLOTS_KEY);
      localStorage.removeItem(STORAGE_COMMUNITY_KEY);
    }

    this.notifyListeners();
  }

  /**
   * Procesa comandos de chat ingresados por los espectadores
   */
  public handleChatCommand(user: GameUser, rawCommand: string): ChatCommandResult | null {
    const parts = rawCommand.toLowerCase().split(/\s+/);
    const cmd = parts[0];

    let response = '';
    let detail = '';
    let badge = '';

    switch (cmd) {
      case '!slot':
      case '!slots':
      case '!lugar': {
        if (user.status === 'MEMBER' && user.slotNumber !== null) {
          response = `★ Slot #${user.slotNumber} OFICIAL`;
          detail = `@${user.username} es MEMBER Nivel ${user.level} (${user.xp} XP acumulados)`;
          badge = `Slot #${user.slotNumber}`;
        } else {
          const needed = Math.max(0, this.config.memberXpRequirement - user.xp);
          response = `Visitante en progreso (${user.xp}/${this.config.memberXpRequirement} XP)`;
          detail = `Faltan ${needed} XP para desbloquear tu Slot de Member. ¡Comenta y envía likes!`;
          badge = `Nivel ${user.level}`;
        }
        break;
      }

      case '!nivel':
      case '!level':
      case '!rank':
      case '!xp': {
        response = `Nivel ${user.level} (${user.xp} XP)`;
        detail = `@${user.username} • Estado: ${user.status} • Interacciones: ${user.totalInteractions}`;
        badge = user.status === 'MEMBER' ? `Slot #${user.slotNumber}` : `Nivel ${user.level}`;
        break;
      }

      case '!meta':
      case '!mision':
      case '!goal': {
        const mission = this.communityState.activeMission;
        if (mission) {
          const pct = Math.min(100, Math.round((mission.current / mission.target) * 100));
          response = `${mission.title} (${pct}%)`;
          detail = `Progreso: ${mission.current.toLocaleString()} / ${mission.target.toLocaleString()} • Recompensa: ${mission.rewardText}`;
          badge = `${pct}%`;
        } else {
          response = `Sin misión activa`;
          detail = `La comunidad está en Nivel de Mundo ${this.communityState.worldLevel}`;
          badge = `Mundo ${this.communityState.worldLevel}`;
        }
        break;
      }

      case '!top':
      case '!miembros':
      case '!members': {
        const topMembers = Array.from(this.users.values())
          .filter((u) => u.status === 'MEMBER')
          .sort((a, b) => b.xp - a.xp)
          .slice(0, 3);

        if (topMembers.length > 0) {
          const names = topMembers.map((m, idx) => `#${idx + 1} Slot #${m.slotNumber} @${m.username} (Lvl ${m.level})`).join(' | ');
          response = `Top Members: ${names}`;
          detail = `Total de ${this.communityState.totalMembers} slots ocupadas de 100`;
          badge = `Top Members`;
        } else {
          response = `Aún no hay Members en las 100 slots`;
          detail = `Sé el primero en llegar a 500 XP para reclamar el Slot #1`;
          badge = `100 Libres`;
        }
        break;
      }

      case '!comandos':
      case '!ayuda':
      case '!help': {
        response = `Comandos de Chat disponibles:`;
        detail = `!slot (tu posición), !nivel (tu XP/rango), !meta (misión comunitaria), !top (mejores members)`;
        badge = `Comandos`;
        break;
      }

      default:
        return null;
    }

    const result: ChatCommandResult = {
      command: cmd,
      username: user.username,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      response,
      detail,
      badge,
      timestamp: Date.now(),
    };

    this.lastCommandResult = result;
    this.emitGameEvent('CHAT_COMMAND', user, {
      message: `Comando ${cmd} de @${user.username}: ${response}`,
    });

    this.notifyListeners();
    return result;
  }

  /**
   * Ejecuta un comando simulado desde el panel
   */
  public executeChatCommand(username: string, commandText: string): ChatCommandResult | null {
    const cleanUser = username.trim().replace(/^@/, '');
    const { user } = this.getOrCreateUser(cleanUser.toLowerCase(), cleanUser);
    return this.handleChatCommand(user, commandText.trim());
  }

  /**
   * Actualiza el progreso de la misión comunitaria activa
   */
  private updateMissionProgress(type: CommunityMission['type'], amount: number, user: GameUser) {
    const mission = this.communityState.activeMission;
    if (!mission || !mission.isActive || mission.completed) return;

    if (mission.type === type) {
      mission.current = Math.min(mission.target, mission.current + amount);

      if (mission.current >= mission.target && !mission.completed) {
        mission.completed = true;
        this.emitGameEvent('COMMUNITY_MISSION_COMPLETED', user, {
          message: `¡MISIÓN COMPLETADA! ${mission.title}. ${mission.rewardText}`,
        });

        // Activa la Fiebre de XP x2
        this.triggerFeverMode(300);
      }

      this.notifyListeners();
    }
  }

  /**
   * Activa el modo Fiebre (Fever x2 XP) por una duración en segundos
   */
  public triggerFeverMode(seconds: number = 300) {
    this.communityState.isFeverModeActive = true;
    this.communityState.feverTimeRemaining = seconds;

    if (this.feverTimer) {
      clearInterval(this.feverTimer);
    }

    this.feverTimer = setInterval(() => {
      if (this.communityState.feverTimeRemaining && this.communityState.feverTimeRemaining > 0) {
        this.communityState.feverTimeRemaining -= 1;
        this.notifyListeners();
      } else {
        this.communityState.isFeverModeActive = false;
        this.communityState.feverTimeRemaining = 0;
        clearInterval(this.feverTimer);
        this.feverTimer = null;
        this.notifyListeners();
      }
    }, 1000);

    this.notifyListeners();
  }

  /**
   * Detiene el modo Fiebre manualmente
   */
  public stopFeverMode() {
    this.communityState.isFeverModeActive = false;
    this.communityState.feverTimeRemaining = 0;
    if (this.feverTimer) {
      clearInterval(this.feverTimer);
      this.feverTimer = null;
    }
    this.notifyListeners();
  }

  /**
   * Configura o actualiza la misión comunitaria
   */
  public setCommunityMission(mission: Partial<CommunityMission>) {
    if (!this.communityState.activeMission) {
      this.communityState.activeMission = {
        id: `mission_${Date.now()}`,
        title: mission.title || 'Meta del Directo',
        description: mission.description || 'Interacción comunitaria',
        type: mission.type || 'likes',
        current: mission.current || 0,
        target: mission.target || 2000,
        rewardText: mission.rewardText || 'Fiebre de XP x2',
        completed: false,
        isActive: true,
      };
    } else {
      this.communityState.activeMission = {
        ...this.communityState.activeMission,
        ...mission,
      };
    }
    this.notifyListeners();
  }

  public getLastCommandResult(): ChatCommandResult | null {
    return this.lastCommandResult;
  }

  // Getters
  public getCommunityState(): CommunityState {
    return { ...this.communityState };
  }

  public getSlots(): GameSlot[] {
    return [...this.slots];
  }

  public getUsers(): GameUser[] {
    return Array.from(this.users.values());
  }

  public getUser(userId: string): GameUser | undefined {
    return this.users.get(userId.toLowerCase());
  }

  public getLastActiveUser(): GameUser | null {
    return this.lastActiveUser;
  }

  public getLastEngineEvent(): GameEngineEvent | null {
    return this.lastEngineEvent;
  }

  public getRecentEngineEvents(): GameEngineEvent[] {
    return [...this.recentEvents];
  }

  public getConfig(): GameEngineConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<GameEngineConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.notifyListeners();
  }

  /**
   * Registra un log de auditoría de moderación
   */
  public logModerationAudit(
    username: string,
    nickname: string,
    detectedText: string,
    reason: string,
    actionTaken: ModerationAuditLog['actionTaken']
  ) {
    const log: ModerationAuditLog = {
      id: `mod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      username,
      nickname,
      detectedText,
      reason,
      actionTaken,
    };
    this.moderationLogs.unshift(log);
    if (this.moderationLogs.length > 100) {
      this.moderationLogs.pop();
    }
    this.saveToStorage();
    this.notifyListeners();
  }

  public getModerationLogs(): ModerationAuditLog[] {
    return [...this.moderationLogs];
  }

  public clearModerationLogs() {
    this.moderationLogs = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  public getRequireApprovalForMembers(): boolean {
    return this.requireApprovalForMembers;
  }

  public setRequireApprovalForMembers(enabled: boolean) {
    this.requireApprovalForMembers = enabled;
    this.notifyListeners();
  }

  public getCustomBlockedWords(): string[] {
    return [...this.customBlockedWords];
  }

  public addCustomBlockedWord(word: string) {
    const clean = word.trim().toLowerCase();
    if (clean && !this.customBlockedWords.includes(clean)) {
      this.customBlockedWords.push(clean);
      this.notifyListeners();
    }
  }

  public removeCustomBlockedWord(word: string) {
    this.customBlockedWords = this.customBlockedWords.filter((w) => w !== word.toLowerCase().trim());
    this.notifyListeners();
  }

  /**
   * Bloquea o expulsa a un usuario de inmediato y libera su slot si la tenía
   */
  public banUser(username: string, reason: string = 'Violación de políticas de comunidad') {
    const cleanUser = username.trim().toLowerCase().replace(/^@/, '');
    const user = this.users.get(cleanUser);
    if (!user) return false;

    user.isBanned = true;
    user.moderationStatus = 'FLAGGED_BLOCKED';
    user.moderationReason = reason;

    // Si ocupaba un slot, liberarlo inmediatamente
    if (user.slotNumber !== null) {
      const slot = this.slots.find((s) => s.number === user.slotNumber);
      if (slot) {
        slot.status = 'EMPTY';
        slot.playerId = null;
        slot.username = null;
        slot.nickname = null;
        slot.avatarUrl = undefined;
        slot.occupiedAt = undefined;
      }
      user.slotNumber = null;
      user.status = 'VISITOR';
    }

    this.logModerationAudit(
      user.username,
      user.nickname,
      user.username,
      reason,
      'BLOCKED'
    );

    this.recalculateCommunityCounts();
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  /**
   * Aprueba a un usuario pendiente de revisión para que pueda optar a los slots
   */
  public approveUser(username: string) {
    const cleanUser = username.trim().toLowerCase().replace(/^@/, '');
    const user = this.users.get(cleanUser);
    if (!user) return false;

    user.isBanned = false;
    user.moderationStatus = 'APPROVED';
    user.moderationReason = undefined;

    // Si cumplía con XP de MEMBER y no tenía slot, asignarle uno
    if (user.status === 'VISITOR' && user.xp >= this.config.memberXpRequirement) {
      const freeSlot = this.findFirstAvailableSlot();
      if (freeSlot) {
        user.status = 'MEMBER';
        user.slotNumber = freeSlot.number;
        freeSlot.status = 'OCCUPIED';
        freeSlot.playerId = user.id;
        freeSlot.username = user.username;
        freeSlot.nickname = user.nickname;
        freeSlot.avatarUrl = user.avatarUrl;
        freeSlot.occupiedAt = Date.now();
      }
    }

    this.recalculateCommunityCounts();
    this.saveToStorage();
    this.notifyListeners();
    return true;
  }

  // Suscriptores
  public subscribe(listener: GameEngineListener): () => void {
    this.listeners.add(listener);
    listener(this.getCommunityState(), this.lastEngineEvent, this.getSlots(), this.lastActiveUser);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.getCommunityState(), this.lastEngineEvent, this.getSlots(), this.lastActiveUser);
      } catch (err) {
        console.error('Error in GameEngine listener:', err);
      }
    });
  }
}
