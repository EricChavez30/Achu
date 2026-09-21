import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  Gift,
  MessageSquare,
  UserPlus,
  Users,
  Sparkles,
  Zap,
  Award,
  Flame,
  Radio,
  Terminal,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  NormalizedLiveEvent,
  CumulativeStats,
  ConnectionStatus,
} from '../types/tiktok';
import {
  CommunityState,
  GameSlot,
  GameEngineEvent,
  ChatCommandResult,
} from '../types/game';

interface GameLiveOverlayProps {
  stats: CumulativeStats;
  lastEvent: NormalizedLiveEvent | null;
  recentEvents: NormalizedLiveEvent[];
  connectionStatus: ConnectionStatus;
  backgroundStyle: 'dark' | 'transparent' | 'greenscreen';
  layout?: 'vertical' | 'horizontal';
  communityState: CommunityState;
  slots: GameSlot[];
  lastEngineEvent: GameEngineEvent | null;
  lastCommandResult?: ChatCommandResult | null;
  showSafeZoneGuides?: boolean;
}

export const GameLiveOverlay: React.FC<GameLiveOverlayProps> = ({
  stats,
  lastEvent,
  recentEvents,
  connectionStatus,
  backgroundStyle,
  layout = 'vertical',
  communityState,
  slots,
  lastEngineEvent,
  lastCommandResult,
  showSafeZoneGuides = false,
}) => {
  // Rotación suave entre miembros ocupados
  const occupiedSlots = slots.filter((s) => s.status === 'OCCUPIED');
  const [currentSlotIndex, setCurrentSlotIndex] = useState(0);

  // Control de visibilidad temporal para toasts de comandos y miembros
  const [visibleCommand, setVisibleCommand] = useState<ChatCommandResult | null>(null);
  const [visibleMemberAlert, setVisibleMemberAlert] = useState<GameEngineEvent | null>(null);

  useEffect(() => {
    if (occupiedSlots.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlotIndex((prev) => (prev + 1) % occupiedSlots.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [occupiedSlots.length]);

  // Cuando se ejecuta un comando, mostrarlo durante 6 segundos
  useEffect(() => {
    if (lastCommandResult) {
      setVisibleCommand(lastCommandResult);
      const timer = setTimeout(() => {
        setVisibleCommand(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [lastCommandResult]);

  // Cuando alguien sube a MEMBER, mostrar alerta destacada durante 7 segundos
  useEffect(() => {
    if (lastEngineEvent && lastEngineEvent.type === 'PLAYER_BECAME_MEMBER') {
      setVisibleMemberAlert(lastEngineEvent);
      const timer = setTimeout(() => {
        setVisibleMemberAlert(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [lastEngineEvent]);

  const activeDisplaySlot = occupiedSlots[currentSlotIndex] || null;
  const mission = communityState.activeMission;
  const missionPercent = mission
    ? Math.min(100, Math.round((mission.current / Math.max(1, mission.target)) * 100))
    : 0;

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

  // --------------------------------------------------------------------------
  // LAYOUT HORIZONTAL COMPACTO (16:9 - TikTok Studio para PC / No Invasivo)
  // --------------------------------------------------------------------------
  if (layout === 'horizontal') {
    return (
      <div
        id="tiktok-studio-canvas-16-9"
        className={`relative w-full h-full flex flex-col justify-between overflow-hidden font-sans select-none p-4 ${getBgClass()}`}
        style={{ aspectRatio: '16/9' }}
      >
        {/* 1. TOP BAR COMPACTA (Sleek HUD, altura de solo ~46px) */}
        <div className="flex items-center justify-between z-20 gap-3">
          {/* Stream & World Badge */}
          <div className="flex items-center gap-2.5 backdrop-blur-md bg-slate-950/80 border border-white/10 rounded-xl px-3 py-1.5 shadow-lg">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus.state === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-[11px] font-black tracking-wide text-white uppercase font-mono">
              {connectionStatus.username ? `@${connectionStatus.username}` : 'TIKTOK LIVE'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold border border-emerald-500/30">
              MUNDO LVL {communityState.worldLevel}
            </span>
            {communityState.isFeverModeActive && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-400/40 animate-pulse">
                <Flame className="w-3 h-3 text-amber-400" />
                FIEBRE XP x2 ({communityState.feverTimeRemaining}s)
              </span>
            )}
          </div>

          {/* Misión Comunitaria / Goal Bar Compacto */}
          {mission && (
            <div className="flex-1 max-w-md backdrop-blur-md bg-slate-950/80 border border-emerald-500/30 rounded-xl px-3.5 py-1.5 shadow-lg">
              <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                <span className="text-emerald-300 font-bold truncate">{mission.title}</span>
                <span className="text-amber-300 font-bold font-mono">
                  {mission.current.toLocaleString()} / {mission.target.toLocaleString()} ({missionPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/10">
                <div
                  className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(4, missionPercent)}%` }}
                />
              </div>
            </div>
          )}

          {/* Miembros Ocupados y Viewers */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 backdrop-blur-md bg-slate-950/80 border border-amber-500/30 rounded-xl px-3 py-1.5 shadow-lg text-[11px] font-mono">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-300 font-bold">{occupiedSlots.length}/100</span>
              <span className="text-white/60">Members</span>
            </div>

            <div className="flex items-center gap-1.5 backdrop-blur-md bg-slate-950/80 border border-white/10 rounded-xl px-3 py-1.5 shadow-lg text-[11px] font-mono">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-white font-bold">{stats.currentViewers.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 2. ESPACIO CENTRAL DESPEJADO (Para cámara / juego) con Toasts Flotantes */}
        <div className="relative flex-1 flex flex-col justify-center items-center pointer-events-none z-20">
          {/* Toast de Alerta Nuevo Member */}
          <AnimatePresence>
            {visibleMemberAlert && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className="pointer-events-auto backdrop-blur-xl bg-gradient-to-r from-amber-500/25 via-slate-950/90 to-amber-500/25 border-2 border-amber-400 rounded-2xl px-6 py-3 shadow-2xl text-center max-w-md"
              >
                <div className="text-[11px] font-black text-amber-300 tracking-wider flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  ¡NUEVO MEMBER DESBLOQUEADO!
                </div>
                <div className="text-lg font-black text-white mt-0.5">
                  @{visibleMemberAlert.player.username}
                </div>
                <div className="text-xs text-amber-200 font-mono">
                  Ocupó el Slot #{visibleMemberAlert.player.slotNumber} de la Comunidad
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toast de Comando de Chat (!slot, !nivel, etc.) */}
          <AnimatePresence>
            {visibleCommand && !visibleMemberAlert && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="pointer-events-auto backdrop-blur-xl bg-slate-950/90 border border-cyan-500/50 rounded-2xl px-5 py-3 shadow-2xl text-center max-w-md"
              >
                <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-cyan-300">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Comando de @{visibleCommand.username} ({visibleCommand.command})</span>
                </div>
                <div className="text-sm font-black text-white mt-0.5">{visibleCommand.response}</div>
                {visibleCommand.detail && (
                  <div className="text-[11px] text-slate-300 mt-0.5">{visibleCommand.detail}</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 3. BOTTOM BAR COMPACTA (Ticker de Members discreto, altura ~38px) */}
        <div className="flex items-center justify-between z-20 gap-3">
          {/* Ticker flotante de Members */}
          <div className="backdrop-blur-md bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-1.5 flex items-center gap-2.5 max-w-xl shadow-lg">
            <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1 shrink-0 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Sigan a los Members:</span>
            </span>
            <div className="overflow-hidden">
              <AnimatePresence mode="wait">
                {activeDisplaySlot ? (
                  <motion.div
                    key={activeDisplaySlot.number}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span className="font-mono text-amber-300 font-bold">Slot #{activeDisplaySlot.number}</span>
                    <span className="font-bold text-white">@{activeDisplaySlot.username}</span>
                    <span className="text-[10px] text-emerald-400">★ Miembro Oficial</span>
                  </motion.div>
                ) : (
                  <div className="text-xs text-white/50 italic">
                    ¡Comenta o envía likes para ganar 500 XP y ocupar el Slot #1!
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Última interacción discreta */}
          {lastEvent && (
            <div className="backdrop-blur-md bg-slate-950/80 border border-white/10 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs shadow-lg">
              {lastEvent.type === 'like' && <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />}
              {lastEvent.type === 'gift' && <Gift className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
              {lastEvent.type === 'comment' && <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />}
              {lastEvent.type === 'join' && <UserPlus className="w-3.5 h-3.5 text-teal-300" />}
              {lastEvent.type === 'follow' && <UserPlus className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="text-white font-bold truncate max-w-[120px]">@{lastEvent.user.uniqueId}</span>
              <span className="text-[11px] text-white/70">
                {lastEvent.type === 'like' && `+${(lastEvent.data as any)?.likeCount || 1} Likes`}
                {lastEvent.type === 'gift' && `${(lastEvent.data as any)?.giftName}`}
                {lastEvent.type === 'join' && 'se unió al LIVE'}
                {lastEvent.type === 'comment' && `"${(lastEvent.data as any)?.comment?.slice(0, 20)}"`}
                {lastEvent.type === 'follow' && 'te siguió'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LAYOUT VERTICAL CON ZONAS SEGURAS (9:16 - TikTok LIVE Móvil)
  // Margen superior ~15% (no tapa avatar/nombre de TikTok)
  // Margen inferior ~35% (no tapa chat de comentarios ni botones nativos de TikTok)
  // --------------------------------------------------------------------------
  return (
    <div
      id="tiktok-studio-canvas-9-16"
      className={`relative w-full h-full overflow-hidden font-sans select-none ${getBgClass()}`}
      style={{ aspectRatio: '9/16' }}
    >
      {/* GUÍAS VISUALES DE ZONA SEGURA (Sólo se ven si el streamer activa el toggle para probar) */}
      {showSafeZoneGuides && (
        <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-between">
          {/* Zona Header TikTok (Arriba: 0% a 15%) */}
          <div className="h-[15%] w-full bg-rose-500/20 border-b-2 border-dashed border-rose-400 flex flex-col items-center justify-center p-2 text-center">
            <span className="text-[11px] font-black text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-400/50 shadow">
              ⚠️ ZONA NATIVA TIKTOK: Avatar, Nombre Streamer & Viewers
            </span>
            <span className="text-[9px] text-rose-200/80 mt-0.5">(Despejado por seguridad)</span>
          </div>

          {/* Zona Segura del Overlay (Centro: 15% a 65%) */}
          <div className="flex-1 w-full border-y border-dashed border-emerald-400/40 flex items-center justify-end p-2">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
              ✓ ZONA SEGURA OVERLAY (15% - 65%)
            </span>
          </div>

          {/* Zona Chat & Controles TikTok (Abajo: 65% a 100%) */}
          <div className="h-[35%] w-full bg-cyan-500/20 border-t-2 border-dashed border-cyan-400 flex flex-col items-center justify-center p-2 text-center">
            <span className="text-[11px] font-black text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-400/50 shadow">
              ⚠️ ZONA NATIVA TIKTOK: Chat de Comentarios, Regalos y Likes
            </span>
            <span className="text-[9px] text-cyan-200/80 mt-0.5">(100% libre para no tapar mensajes)</span>
          </div>
        </div>
      )}

      {/* CONTENIDO REAL DEL OVERLAY: Posicionado estrictamente en la Safe Zone (~15% a ~65%) */}
      <div className="absolute top-[15%] bottom-[35%] left-0 right-0 px-3 flex flex-col justify-start gap-2.5 z-10 pointer-events-auto">
        {/* 1. Mini Top HUD: Estado de Comunidad y Nivel */}
        <div className="backdrop-blur-md bg-slate-950/80 border border-white/10 rounded-2xl p-2.5 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  connectionStatus.state === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-[11px] font-black uppercase text-white font-mono">
                MUNDO LVL {communityState.worldLevel}
              </span>
              <span className="text-[10px] font-bold text-amber-300 font-mono bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded">
                {occupiedSlots.length}/100 Slots
              </span>
            </div>

            {communityState.isFeverModeActive ? (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-full animate-pulse">
                <Flame className="w-3 h-3 text-amber-400" />
                x2 XP ({communityState.feverTimeRemaining}s)
              </span>
            ) : (
              <span className="text-[10px] font-mono text-emerald-300 font-bold">
                {communityState.communityEnergy}% ENERGÍA
              </span>
            )}
          </div>

          {/* Mini Barra de Energía Comunitaria */}
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/10 mt-1.5">
            <div
              className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(5, communityState.communityEnergy)}%` }}
            />
          </div>
        </div>

        {/* 2. Misión Comunitaria / Meta del Directo */}
        {mission && (
          <div className="backdrop-blur-md bg-slate-950/80 border border-emerald-500/25 rounded-2xl p-2.5 shadow-lg">
            <div className="flex justify-between items-center text-[10px] font-mono mb-1">
              <span className="text-emerald-300 font-bold truncate flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" />
                {mission.title}
              </span>
              <span className="text-amber-300 font-bold font-mono">
                {missionPercent}% ({mission.current.toLocaleString()}/{mission.target.toLocaleString()})
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.max(4, missionPercent)}%` }}
              />
            </div>
          </div>
        )}

        {/* 3. Ticker Rotativo de Members ("Sigan a nuestros Members") */}
        <div className="backdrop-blur-md bg-slate-950/80 border border-amber-500/30 rounded-2xl p-2.5 shadow-lg">
          <div className="text-[9px] font-black uppercase text-amber-300 tracking-wider mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-400" />
              <span>SIGAN A NUESTRO MEMBER:</span>
            </span>
            <span className="text-[9px] text-white/50 font-mono">
              500 XP = 1 Slot
            </span>
          </div>

          <AnimatePresence mode="wait">
            {activeDisplaySlot ? (
              <motion.div
                key={activeDisplaySlot.number}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center justify-between bg-amber-500/10 border border-amber-500/25 rounded-xl px-2.5 py-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 font-bold">
                    Slot #{activeDisplaySlot.number}
                  </span>
                  <span className="text-xs font-bold text-white">@{activeDisplaySlot.username}</span>
                </div>
                <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  MEMBER
                </span>
              </motion.div>
            ) : (
              <div className="text-[11px] text-white/50 text-center py-1 italic">
                Envía likes y comentarios para reclamar el Slot #1
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Popups Dinámicos Flotantes: Alerta de Member / Respuesta a Comandos */}
        <div className="flex-1 flex flex-col justify-center items-center pointer-events-none">
          <AnimatePresence>
            {visibleMemberAlert && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: -15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -15 }}
                className="pointer-events-auto backdrop-blur-xl bg-gradient-to-b from-amber-500/30 via-slate-950/95 to-slate-950/95 border-2 border-amber-400 rounded-2xl p-4 text-center shadow-2xl w-full max-w-[280px]"
              >
                <div className="text-[10px] font-black text-amber-300 uppercase tracking-wider flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  ¡NUEVO MEMBER OFICIAL!
                </div>
                <div className="text-base font-black text-white mt-0.5 truncate">
                  @{visibleMemberAlert.player.username}
                </div>
                <div className="text-[11px] text-amber-200 font-mono mt-0.5">
                  Desbloqueó el Slot #{visibleMemberAlert.player.slotNumber}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {visibleCommand && !visibleMemberAlert && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                className="pointer-events-auto backdrop-blur-xl bg-slate-950/95 border border-cyan-400/60 rounded-2xl p-3.5 text-center shadow-2xl w-full max-w-[280px]"
              >
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-cyan-300 font-bold mb-1">
                  <Terminal className="w-3 h-3 text-cyan-400" />
                  <span>Comando de @{visibleCommand.username}</span>
                </div>
                <div className="text-xs font-black text-white">{visibleCommand.response}</div>
                {visibleCommand.detail && (
                  <div className="text-[10px] text-slate-300 mt-1">{visibleCommand.detail}</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* EL TERCIO INFERIOR (35%) ESTÁ 100% TRANSPARENTE Y LIBRE DE ELEMENTOS
          PARA QUE EL CHAT DE COMENTARIOS NATIVO DE TIKTOK FLUIDO Y SIN TREGUA */}
    </div>
  );
};
