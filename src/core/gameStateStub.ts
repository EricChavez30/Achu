import { NormalizedLiveEvent, PlayerProfile } from '../types/tiktok';

/**
 * GameStateStub
 * 
 * Capa de Lógica de Juego desacoplada de la conexión y de la interfaz visual.
 * Diseñada para que en la siguiente fase se puedan conectar mecánicas de
 * jugadores, experiencia (XP), niveles, casillas de tablero y eventos de juego
 * sin tocar el conector ni la UI base.
 */
export class GameStateStub {
  // Mapa de jugadores registrados en memoria durante la sesión
  private players: Map<string, PlayerProfile> = new Map();

  /**
   * Registra o actualiza la actividad de un jugador cuando envía un evento
   */
  public registerPlayerInteraction(event: NormalizedLiveEvent): PlayerProfile {
    const userId = event.user.uniqueId;
    let player = this.players.get(userId);

    if (!player) {
      player = {
        id: userId,
        username: event.user.uniqueId,
        nickname: event.user.nickname,
        avatarUrl: event.user.profilePictureUrl,
        xp: 0,
        level: 1,
        currentTile: 0,
        lastInteractionAt: event.timestamp,
        interactionsCount: {
          likes: 0,
          gifts: 0,
          comments: 0,
        },
      };
      this.players.set(userId, player);
    }

    player.lastInteractionAt = event.timestamp;
    if (event.user.nickname) player.nickname = event.user.nickname;
    if (event.user.profilePictureUrl) player.avatarUrl = event.user.profilePictureUrl;

    // Actualiza contadores de actividad por jugador
    if (event.type === 'like') {
      player.interactionsCount.likes += 1;
    } else if (event.type === 'gift') {
      player.interactionsCount.gifts += 1;
    } else if (event.type === 'comment') {
      player.interactionsCount.comments += 1;
    }

    return player;
  }

  /**
   * Hook preparado para otorgar XP en futuras fases
   */
  public awardXp(userId: string, amount: number): void {
    const player = this.players.get(userId);
    if (!player) return;
    player.xp += amount;
    // Fórmula de nivel preparada: cada 100 XP sube de nivel
    player.level = Math.floor(player.xp / 100) + 1;
  }

  /**
   * Hook preparado para mover al jugador por casillas en futuras fases
   */
  public movePlayerTile(userId: string, tiles: number, maxTiles: number = 50): number {
    const player = this.players.get(userId);
    if (!player) return 0;
    player.currentTile = (player.currentTile + tiles) % maxTiles;
    return player.currentTile;
  }

  public getPlayer(userId: string): PlayerProfile | undefined {
    return this.players.get(userId);
  }

  public getAllPlayers(): PlayerProfile[] {
    return Array.from(this.players.values());
  }

  public getTopActivePlayers(limit: number = 5): PlayerProfile[] {
    return Array.from(this.players.values())
      .sort((a, b) => {
        const totalA = a.interactionsCount.likes + a.interactionsCount.gifts * 5 + a.interactionsCount.comments;
        const totalB = b.interactionsCount.likes + b.interactionsCount.gifts * 5 + b.interactionsCount.comments;
        return totalB - totalA;
      })
      .slice(0, limit);
  }

  public resetGame(): void {
    this.players.clear();
  }
}
