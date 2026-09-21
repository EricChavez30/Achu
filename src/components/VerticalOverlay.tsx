import React from 'react';
import { Heart, Gift, MessageSquare, UserPlus, Users, Radio, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NormalizedLiveEvent, CumulativeStats, ConnectionStatus, GiftEventData, LikeEventData, CommentEventData } from '../types/tiktok';

interface VerticalOverlayProps {
  stats: CumulativeStats;
  lastEvent: NormalizedLiveEvent | null;
  recentEvents: NormalizedLiveEvent[];
  connectionStatus: ConnectionStatus;
  backgroundStyle: 'dark' | 'transparent' | 'greenscreen';
  compactMode?: boolean;
}

export const VerticalOverlay: React.FC<VerticalOverlayProps> = ({
  stats,
  lastEvent,
  recentEvents,
  connectionStatus,
  backgroundStyle,
}) => {
  const getBgClass = () => {
    switch (backgroundStyle) {
      case 'transparent':
        return 'bg-transparent text-white';
      case 'greenscreen':
        return 'bg-[#00FF00] text-black';
      case 'dark':
      default:
        return 'bg-gradient-to-b from-[#0B0F19] via-[#0D1322] to-[#080B12] text-white';
    }
  };

  return (
    <div
      id="obs-canvas-9-16"
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden font-sans select-none ${getBgClass()}`}
      style={{
        aspectRatio: '9/16',
      }}
    >
      {/* Subtle overlay ambient gradients if dark mode */}
      {backgroundStyle === 'dark' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 left-1/4 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>
      )}

      {/* 1. HEADER HUD: Stream status & Live viewers */}
      <div id="overlay-header-hud" className="relative z-10 px-5 pt-5 pb-3">
        <div className="flex items-center justify-between backdrop-blur-md bg-black/40 border border-white/10 rounded-2xl p-3 shadow-xl">
          {/* Status Badge */}
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span
                className={`w-3 h-3 rounded-full ${
                  connectionStatus.state === 'connected'
                    ? connectionStatus.mode === 'simulation'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-emerald-500 animate-pulse'
                    : connectionStatus.state === 'connecting'
                    ? 'bg-cyan-400 animate-ping'
                    : 'bg-rose-500'
                }`}
              />
              <span
                className={`absolute w-5 h-5 rounded-full opacity-30 ${
                  connectionStatus.state === 'connected'
                    ? connectionStatus.mode === 'simulation'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-emerald-500 animate-ping'
                    : 'bg-transparent'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wider uppercase">
                  {connectionStatus.state === 'connected'
                    ? connectionStatus.mode === 'simulation'
                      ? 'SIMULACIÓN'
                      : 'TIKTOK LIVE'
                    : connectionStatus.state === 'connecting'
                    ? 'CONECTANDO...'
                    : 'DESCONECTADO'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/70 font-mono">9:16</span>
                {connectionStatus.roomId && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                    Room: {connectionStatus.roomId}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/70 truncate max-w-[150px]">
                {connectionStatus.username ? `@${connectionStatus.username}` : 'Sin streamer asignado'}
              </p>
            </div>
          </div>

          {/* Viewers Pill */}
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
            <Users className="w-4 h-4 text-cyan-400" />
            <div className="text-right">
              <span className="text-xs font-black text-white font-mono">
                {stats.currentViewers.toLocaleString()}
              </span>
              <span className="block text-[9px] uppercase tracking-wider text-white/60">Espectadores</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. ULTIMO EVENTO RECIBIDO (Spotlight Banner) */}
      <div id="overlay-last-event-spotlight" className="relative z-10 px-5 py-2">
        <div className="text-[11px] font-black uppercase tracking-wider text-white/60 mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Último Evento Recibido</span>
        </div>

        <AnimatePresence mode="wait">
          {lastEvent ? (
            <motion.div
              key={lastEvent.id}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden backdrop-blur-md bg-gradient-to-r from-white/15 via-white/10 to-white/5 border border-white/20 rounded-2xl p-3.5 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                {/* User Avatar */}
                <div className="relative">
                  <img
                    src={
                      lastEvent.user.profilePictureUrl ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(lastEvent.user.uniqueId)}`
                    }
                    alt={lastEvent.user.nickname}
                    className="w-12 h-12 rounded-xl object-cover border border-white/30 shadow"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-black/80 border border-white/20 shadow">
                    {lastEvent.type === 'like' && <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />}
                    {lastEvent.type === 'gift' && <Gift className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    {lastEvent.type === 'comment' && <MessageSquare className="w-3 h-3 text-cyan-400" />}
                    {lastEvent.type === 'follow' && <UserPlus className="w-3 h-3 text-emerald-400" />}
                    {lastEvent.type === 'join' && <UserPlus className="w-3 h-3 text-teal-300" />}
                    {lastEvent.type === 'viewer_count' && <Users className="w-3 h-3 text-blue-400" />}
                  </div>
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white truncate max-w-[130px]">
                      {lastEvent.user.nickname || lastEvent.user.uniqueId}
                    </span>
                    <span className="text-[10px] text-white/50 truncate font-mono">
                      @{lastEvent.user.uniqueId}
                    </span>
                  </div>

                  <div className="mt-0.5">
                    {lastEvent.type === 'like' && (
                      <p className="text-xs font-semibold text-rose-300">
                        ¡Envió +{(lastEvent.data as LikeEventData).likeCount || 1} Likes! ❤️
                      </p>
                    )}
                    {lastEvent.type === 'gift' && (
                      <p className="text-xs font-bold text-amber-300 flex items-center gap-1">
                        <span>
                          {(lastEvent.data as GiftEventData).giftName} x{(lastEvent.data as GiftEventData).repeatCount}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 border border-amber-400/30">
                          💎 {(lastEvent.data as GiftEventData).diamondCount * ((lastEvent.data as GiftEventData).repeatCount || 1)}
                        </span>
                      </p>
                    )}
                    {lastEvent.type === 'comment' && (
                      <p className="text-xs text-white/90 italic truncate">
                        "{(lastEvent.data as CommentEventData).comment}"
                      </p>
                    )}
                    {lastEvent.type === 'follow' && (
                      <p className="text-xs font-semibold text-emerald-300">
                        ¡Ahora está siguiendo la transmisión! 🎉
                      </p>
                    )}
                    {lastEvent.type === 'join' && (
                      <p className="text-xs font-semibold text-cyan-300 flex items-center gap-1">
                        <span>¡Se ha unido al directo! ✨</span>
                      </p>
                    )}
                    {lastEvent.type === 'viewer_count' && (
                      <p className="text-xs text-blue-300">
                        Actualización de espectadores en vivo
                      </p>
                    )}
                  </div>
                </div>

                {/* Timestamp & Origin */}
                <div className="text-right flex flex-col items-end gap-1">
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                      lastEvent.source === 'real'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {lastEvent.source === 'real' ? '● REAL' : 'SIM'}
                  </span>
                  <div className="text-[10px] font-mono text-white/50">
                    {new Date(lastEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="backdrop-blur-md bg-white/5 border border-dashed border-white/15 rounded-2xl p-4 text-center">
              <p className="text-xs text-white/50">Esperando primer evento en vivo...</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. CUMULATIVE COUNTERS GRID (4 Stats Cards) */}
      <div id="overlay-cumulative-counters" className="relative z-10 px-5 py-2">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Likes */}
          <div className="backdrop-blur-md bg-black/40 border border-rose-500/20 rounded-2xl p-3 flex items-center gap-2.5 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30 text-rose-400">
              <Heart className="w-5 h-5 fill-rose-500" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-rose-300/80">Likes</span>
              <span className="text-base font-black font-mono tracking-tight text-white">
                {stats.totalLikes.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Regalos & Diamantes */}
          <div className="backdrop-blur-md bg-black/40 border border-amber-500/20 rounded-2xl p-3 flex items-center gap-2.5 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30 text-amber-400">
              <Gift className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-amber-300/80">Regalos (💎)</span>
              <span className="text-base font-black font-mono tracking-tight text-white">
                {stats.totalGifts.toLocaleString()}{' '}
                <span className="text-xs font-normal text-amber-400">({stats.totalDiamonds}💎)</span>
              </span>
            </div>
          </div>

          {/* Comentarios */}
          <div className="backdrop-blur-md bg-black/40 border border-cyan-500/20 rounded-2xl p-3 flex items-center gap-2.5 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30 text-cyan-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-cyan-300/80">Comentarios</span>
              <span className="text-base font-black font-mono tracking-tight text-white">
                {stats.totalComments.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Follows */}
          <div className="backdrop-blur-md bg-black/40 border border-emerald-500/20 rounded-2xl p-3 flex items-center gap-2.5 shadow-lg">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-emerald-300/80">Follows</span>
              <span className="text-base font-black font-mono tracking-tight text-white">
                {stats.totalFollowers.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. REAL-TIME EVENT WATERFALL FEED */}
      <div id="overlay-live-event-feed" className="relative z-10 flex-1 px-5 py-2 min-h-0 flex flex-col justify-end">
        <div className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
            <span>Registro de Eventos en Vivo</span>
          </span>
          <span className="font-mono text-white/40 text-[9px]">Últimos {recentEvents.length} eventos</span>
        </div>

        <div className="space-y-2 overflow-hidden flex flex-col-reverse max-h-[360px]">
          <AnimatePresence initial={false}>
            {recentEvents.slice(0, 7).map((ev) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
                className="backdrop-blur-md bg-black/50 border border-white/10 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={
                      ev.user.profilePictureUrl ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(ev.user.uniqueId)}`
                    }
                    alt={ev.user.nickname}
                    className="w-7 h-7 rounded-lg object-cover border border-white/20 shrink-0"
                    crossOrigin="anonymous"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate max-w-[120px]">
                        {ev.user.nickname || ev.user.uniqueId}
                      </span>
                      <span className="text-[10px] text-white/40 font-mono truncate">
                        @{ev.user.uniqueId}
                      </span>
                    </div>

                    <div className="text-[11px] truncate">
                      {ev.type === 'like' && (
                        <span className="text-rose-400 font-medium flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-rose-500 inline" /> dió {(ev.data as LikeEventData).likeCount || 1} likes
                        </span>
                      )}
                      {ev.type === 'gift' && (
                        <span className="text-amber-300 font-semibold flex items-center gap-1">
                          <Gift className="w-3 h-3 fill-amber-400 inline" /> {(ev.data as GiftEventData).giftName} x{(ev.data as GiftEventData).repeatCount} (💎{(ev.data as GiftEventData).diamondCount * ((ev.data as GiftEventData).repeatCount || 1)})
                        </span>
                      )}
                      {ev.type === 'comment' && (
                        <span className="text-white/80">
                          "{(ev.data as CommentEventData).comment}"
                        </span>
                      )}
                      {ev.type === 'follow' && (
                        <span className="text-emerald-400 font-medium">
                          ¡Comenzó a seguirte!
                        </span>
                      )}
                      {ev.type === 'join' && (
                        <span className="text-teal-300 font-medium">
                          ¡Se unió al directo! ✨
                        </span>
                      )}
                      {ev.type === 'viewer_count' && (
                        <span className="text-blue-400">
                          Espectadores actualizados
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[8px] font-mono px-1 py-0.5 rounded font-bold uppercase ${
                      ev.source === 'real'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {ev.source === 'real' ? 'REAL' : 'SIM'}
                  </span>
                  <span className="text-[9px] font-mono text-white/40">
                    {new Date(ev.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {recentEvents.length === 0 && (
            <div className="text-center py-6 text-white/30 text-xs italic">
              Conecta un directo o inicia la simulación para visualizar eventos aquí.
            </div>
          )}
        </div>
      </div>

      {/* 5. FOOTER OBS WATERMARK / BRANDING */}
      <div className="relative z-10 px-5 pb-4 pt-2">
        <div className="flex items-center justify-between text-[10px] text-white/40 border-t border-white/10 pt-2 font-mono">
          <span>TIKTOK LIVE OBS CONNECTOR</span>
          <span>1080 × 1920 (9:16)</span>
        </div>
      </div>
    </div>
  );
};
