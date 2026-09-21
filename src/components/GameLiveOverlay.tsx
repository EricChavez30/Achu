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
  OverlayBackgroundStyle,
} from '../types/tiktok';
import {
  CommunityState,
  GameSlot,
  GameEngineEvent,
  ChatCommandResult,
} from '../types/game';
import bgMysticImage from '../assets/images/bg_mystic_fantasy_1790020264709.jpg';

interface GameLiveOverlayProps {
  stats: CumulativeStats;
  lastEvent: NormalizedLiveEvent | null;
  recentEvents: NormalizedLiveEvent[];
  connectionStatus: ConnectionStatus;
  backgroundStyle: OverlayBackgroundStyle;
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
  // Separar slots ocupados y vacantes
  const occupiedSlots = slots.filter((s) => s.status === 'OCCUPIED');
  const emptySlots = slots.filter((s) => s.status === 'EMPTY');

  // Rotación de miembros (mostrando de 3 miembros por tanda si hay varios)
  const [memberPage, setMemberPage] = useState(0);
  const membersPerPage = 3;
  const totalMemberPages = Math.max(1, Math.ceil(occupiedSlots.length / membersPerPage));

  // Rotación del ticker de casillas vacantes
  const [vacantSlotIndex, setVacantSlotIndex] = useState(0);

  // Control de visibilidad temporal para toasts de comandos y miembros
  const [visibleCommand, setVisibleCommand] = useState<ChatCommandResult | null>(null);
  const [visibleMemberAlert, setVisibleMemberAlert] = useState<GameEngineEvent | null>(null);

  // Rotar periódicamente la tanda de miembros cada 5.5 segundos
  useEffect(() => {
    if (totalMemberPages <= 1) return;
    const interval = setInterval(() => {
      setMemberPage((prev) => (prev + 1) % totalMemberPages);
    }, 5500);
    return () => clearInterval(interval);
  }, [totalMemberPages]);

  // Rotar ticker de casillas vacantes cada 3.5 segundos
  useEffect(() => {
    if (emptySlots.length <= 1) return;
    const interval = setInterval(() => {
      setVacantSlotIndex((prev) => (prev + 1) % Math.min(emptySlots.length, 15));
    }, 3500);
    return () => clearInterval(interval);
  }, [emptySlots.length]);

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

  // Miembros visibles en la tanda activa
  const visibleMembers = occupiedSlots.slice(
    memberPage * membersPerPage,
    memberPage * membersPerPage + membersPerPage
  );

  // Próximas casillas vacantes a listar
  const currentVacantSlot = emptySlots[vacantSlotIndex] || emptySlots[0];
  const nextVacantSlotNumbers = emptySlots.slice(0, 4).map((s) => `#${s.number}`).join(', ');
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
      case 'mystic':
        return 'bg-slate-950 text-white';
      case 'minimalist':
        return 'bg-[#05070D] text-white';
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

        {/* 3. BOTTOM BAR COMPACTA (Ticker de Members y Casillas Vacantes) */}
        <div className="flex items-center justify-between z-20 gap-3">
          {/* Ticker rotativo de Members */}
          <div className="backdrop-blur-md bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-1.5 flex items-center gap-2.5 max-w-2xl shadow-lg">
            <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1 shrink-0 uppercase tracking-wider">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Sigan a nuestros miembros:</span>
            </span>
            <div className="overflow-hidden">
              <AnimatePresence mode="wait">
                {visibleMembers.length > 0 ? (
                  <motion.div
                    key={`page_${memberPage}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-3 text-xs"
                  >
                    {visibleMembers.map((slot) => (
                      <div key={slot.number} className="flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-lg">
                        <span className="font-mono text-amber-300 font-bold">#{slot.number}</span>
                        <span className="font-bold text-white truncate max-w-[100px]">@{slot.username}</span>
                      </div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-xs text-white/50 italic">
                    ¡Comenta o envía likes para ganar 500 XP y ocupar el Slot #1!
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Casillas Vacantes y Ticker Discreto */}
          <div className="backdrop-blur-md bg-slate-950/80 border border-cyan-500/20 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs shadow-lg font-mono">
            <span className="text-cyan-400 font-bold">✨ Casillas Libres:</span>
            <span className="text-white font-bold">{emptySlots.length} disponibles</span>
            {currentVacantSlot && (
              <span className="text-[10px] bg-cyan-950/80 border border-cyan-400/40 text-cyan-200 px-1.5 py-0.5 rounded font-mono">
                Próxima: #{currentVacantSlot.number}
              </span>
            )}
          </div>
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
      className={`relative w-full h-full overflow-hidden font-sans select-none flex flex-col ${getBgClass()}`}
    >
      {/* FONDO MÍSTICO / MINIMALISTA / OSCURO */}
      {backgroundStyle === 'mystic' && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <img
            src={bgMysticImage}
            alt="Mystic Background"
            className="w-full h-full object-cover object-center opacity-90 scale-105 filter brightness-95 contrast-110"
          />
          {/* Capas de gradiente sutil para integración oscura y misteriosa */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/30 to-slate-950/90" />
          <div className="absolute inset-0 bg-indigo-950/20 mix-blend-overlay" />
        </div>
      )}

      {backgroundStyle === 'minimalist' && (
        <div className="absolute inset-0 pointer-events-none z-0 bg-[#05070D]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/60 via-[#05070D] to-[#020306]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-cyan-950/20 rounded-full blur-3xl pointer-events-none" />
        </div>
      )}

      {backgroundStyle === 'dark' && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-10 -left-16 w-72 h-72 bg-indigo-950/50 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -right-16 w-72 h-72 bg-cyan-950/50 rounded-full blur-3xl" />
        </div>
      )}

      {/* GUÍAS VISUALES DE ZONA SEGURA (Sólo se ven si el streamer activa el toggle para probar) */}
      {showSafeZoneGuides && (
        <div className="absolute inset-0 pointer-events-none z-50 flex flex-col justify-between">
          {/* Zona Header TikTok (Arriba: 0% a 12%) */}
          <div className="h-[12%] w-full bg-rose-500/20 border-b-2 border-dashed border-rose-400 flex flex-col items-center justify-center p-2 text-center">
            <span className="text-xs font-black text-rose-300 bg-rose-950/90 px-3 py-1 rounded-full border border-rose-400/60 shadow">
              ⚠️ ZONA NATIVA TIKTOK: Avatar & Info Streamer
            </span>
          </div>

          {/* Zona Segura del Overlay */}
          <div className="flex-1 w-full border-y border-dashed border-emerald-400/40 flex items-center justify-end p-2">
            <span className="text-xs font-mono text-emerald-300 bg-emerald-950/90 px-3 py-1 rounded border border-emerald-500/50">
              ✓ ZONA VISIBLE OVERLAY
            </span>
          </div>

          {/* Zona Chat & Controles TikTok (Abajo: 68% a 100%) */}
          <div className="h-[32%] w-full bg-cyan-500/20 border-t-2 border-dashed border-cyan-400 flex flex-col items-center justify-center p-2 text-center">
            <span className="text-xs font-black text-cyan-300 bg-cyan-950/90 px-3 py-1 rounded-full border border-cyan-400/60 shadow">
              ⚠️ ZONA CHAT TIKTOK: Comentarios y Regalos
            </span>
          </div>
        </div>
      )}

      {/* CONTENIDO REAL DEL OVERLAY: Réplica exacta del diseño de referencia, ubicado estrictamente dentro de la ZONA SEGURA (de 13% a 65% de la pantalla) */}
      <div className="relative z-10 w-full px-4 pt-16 pb-2 flex flex-col gap-2.5 pointer-events-auto">
        {/* 1. Card 1: MUNDO LVL 1 / SLOTS / % ENERGÍA */}
        <div className="bg-[#040814]/95 border-2 border-[#00f2fe]/90 rounded-[18px] p-3 shadow-[0_0_18px_rgba(0,242,254,0.3)] backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#f59e0b] shadow-[0_0_10px_#f59e0b]" />
              <span className="text-xs sm:text-sm font-black uppercase text-white font-mono tracking-wider">
                MUNDO LVL {communityState.worldLevel}
              </span>
              <span className="text-[11px] font-black text-[#fbbf24] font-mono bg-[#f59e0b]/15 border-2 border-[#f59e0b]/80 px-2 py-0.5 rounded-md shadow-sm">
                {occupiedSlots.length}/100 Slots
              </span>
            </div>

            {communityState.isFeverModeActive ? (
              <span className="flex items-center gap-1.5 text-xs font-black text-[#fbbf24] bg-[#f59e0b]/25 border-2 border-[#f59e0b] px-2 py-0.5 rounded-full animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.6)]">
                <Flame className="w-3.5 h-3.5 text-[#f59e0b]" />
                x2 XP ({communityState.feverTimeRemaining}s)
              </span>
            ) : (
              <span className="text-[11px] font-mono text-[#00f2fe] font-black bg-[#00f2fe]/15 border-2 border-[#00f2fe]/80 px-2 py-0.5 rounded-md tracking-wide">
                {communityState.communityEnergy}% ENERGÍA
              </span>
            )}
          </div>

          {/* Barra de progreso con cian brillante */}
          <div className="w-full bg-[#0a1128] rounded-full h-2.5 overflow-hidden border border-[#00f2fe]/30 mt-2 p-[1px]">
            <div
              className="bg-gradient-to-r from-[#00f2fe] via-[#4facfe] to-[#f59e0b] h-full rounded-full transition-all duration-300 shadow-[0_0_10px_#00f2fe]"
              style={{ width: `${Math.max(5, communityState.communityEnergy)}%` }}
            />
          </div>
        </div>

        {/* 2. Card 2: Meta del Directo (Bordes cian / dorado con badges exactos) */}
        {mission && (
          <div className="bg-[#040814]/95 border-2 border-[#00f2fe]/90 rounded-[18px] p-3 shadow-[0_0_18px_rgba(0,242,254,0.3)] backdrop-blur-md">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[#00f2fe] font-black flex items-center gap-1.5 text-xs sm:text-sm tracking-wide truncate">
                <Zap className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b] shrink-0" />
                <span className="truncate">{mission.title}</span>
              </span>
              <div className="flex items-center gap-1.5 bg-[#f59e0b]/15 border-2 border-[#f59e0b]/80 px-2 py-0.5 rounded-md text-right shrink-0">
                <span className="text-[#fbbf24] font-black font-mono text-[11px] leading-tight">
                  {missionPercent}%
                </span>
                <span className="text-[#fbbf24] font-bold font-mono text-[10px] leading-tight">
                  ({mission.current.toLocaleString()}/{mission.target.toLocaleString()})
                </span>
              </div>
            </div>
            <div className="w-full bg-[#0a1128] rounded-full h-2.5 overflow-hidden border border-[#00f2fe]/30 p-[1px]">
              <div
                className="bg-gradient-to-r from-[#00f2fe] via-[#38ef7d] to-[#f59e0b] h-full rounded-full transition-all duration-300 shadow-[0_0_10px_#00f2fe]"
                style={{ width: `${Math.max(4, missionPercent)}%` }}
              />
            </div>
          </div>
        )}

        {/* 3. Card 3: SIGAN A NUESTROS MIEMBROS (Borde dorado brillante como la foto) */}
        <div className="bg-[#040814]/95 border-2 border-[#f59e0b] rounded-[18px] p-3 shadow-[0_0_18px_rgba(245,158,11,0.3)] backdrop-blur-md">
          <div className="text-xs font-black uppercase text-[#fbbf24] tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-[#f59e0b] fill-[#f59e0b]/20" />
              <span className="text-[#fbbf24] font-black tracking-wide">SIGAN A NUESTROS MIEMBROS:</span>
            </span>
            <span className="text-[11px] text-[#fbbf24] font-mono bg-[#f59e0b]/20 px-2 py-0.5 rounded-md border-2 border-[#f59e0b]/80 font-black">
              {occupiedSlots.length} ACTIVOS
            </span>
          </div>

          <AnimatePresence mode="wait">
            {visibleMembers.length > 0 ? (
              <motion.div
                key={`page_${memberPage}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-3 gap-2"
              >
                {visibleMembers.map((member) => (
                  <div
                    key={member.number}
                    className="flex flex-col items-center justify-center p-2 rounded-xl bg-gradient-to-b from-[#f59e0b]/20 via-[#040814] to-[#040814] border-2 border-[#f59e0b] text-center shadow-lg relative overflow-hidden"
                  >
                    <div className="relative mb-1">
                      <img
                        src={
                          member.avatarUrl ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(member.username || 'user')}`
                        }
                        alt={member.username || 'Member'}
                        className="w-10 h-10 rounded-full border-2 border-[#f59e0b] object-cover shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                        crossOrigin="anonymous"
                      />
                      <span className="absolute -bottom-1 -right-1 bg-[#f59e0b] text-slate-950 text-[9px] font-black px-1.5 rounded-full font-mono shadow">
                        #{member.number}
                      </span>
                    </div>
                    <span className="text-xs font-black text-white truncate max-w-[85px] leading-tight drop-shadow">
                      @{member.username}
                    </span>
                    <span className="text-[9px] text-[#34d399] font-black flex items-center gap-1 mt-1 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-[#34d399]/60">
                      <CheckCircle2 className="w-2.5 h-2.5 text-[#34d399]" />
                      MIEMBRO
                    </span>
                  </div>
                ))}
              </motion.div>
            ) : (
              <div className="text-xs text-[#fbbf24] text-center py-3 px-2 font-bold italic bg-[#f59e0b]/10 rounded-xl border-2 border-dashed border-[#f59e0b]/60 leading-relaxed">
                ⭐ ¡Sé el primer Miembro! Envía comentarios o regalos para ocupar el Slot #1.
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* 4. Card 4: CASILLAS DISPONIBLES (Borde cian con subcaja de vacantes exactas) */}
        <div className="bg-[#040814]/95 border-2 border-[#00f2fe]/90 rounded-[18px] p-3 shadow-[0_0_18px_rgba(0,242,254,0.3)] backdrop-blur-md">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-[#00f2fe] font-black flex items-center gap-1.5 tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#00f2fe] animate-spin" style={{ animationDuration: '8s' }} />
              <span>CASILLAS DISPONIBLES:</span>
            </span>
            <span className="text-[11px] text-[#00f2fe] font-black bg-[#00f2fe]/15 border-2 border-[#00f2fe]/80 px-2 py-0.5 rounded-md">
              {emptySlots.length} Libres
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={vacantSlotIndex}
              initial={{ opacity: 0, x: 6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-between bg-[#081226]/90 border-2 border-[#00f2fe]/60 rounded-xl px-3 py-2 text-xs font-mono shadow-inner"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="text-white font-black text-xs sm:text-sm">Vacantes:</span>
                <span className="text-[#00f2fe] font-black truncate text-xs sm:text-sm tracking-wider">{nextVacantSlotNumbers}</span>
              </div>
              <span className="text-xs text-[#fbbf24] font-black bg-[#f59e0b]/20 px-2.5 py-0.5 rounded-md shrink-0 border-2 border-[#f59e0b]/80 shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                500 XP
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 5. Card 5: Barra de Comandos interactiva (Exacta a la imagen) */}
        <div className="bg-[#040814]/95 border-2 border-[#00f2fe]/90 rounded-[16px] px-3.5 py-2 flex items-center justify-between text-xs font-mono text-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.25)]">
          <div className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-3 bg-[#00f2fe] rounded-sm shadow-[0_0_6px_#00f2fe]" />
            <span className="text-white font-black">COMANDOS:</span>
            <span className="font-black text-[#00f2fe]">!slot</span>
            <span className="text-white/40">•</span>
            <span className="font-black text-[#00f2fe]">!nivel</span>
            <span className="text-white/40">•</span>
            <span className="font-black text-[#00f2fe]">!meta</span>
          </div>
          <span className="text-[#fbbf24] font-black truncate pl-2 flex items-center gap-1 shrink-0 text-[11px]">
            <Zap className="w-3 h-3 text-[#f59e0b] fill-[#f59e0b]" /> +XP con Likes
          </span>
        </div>

        {/* 6. Popups Dinámicos Flotantes: Alerta de Member / Respuesta a Comandos */}
        <div className="flex flex-col justify-center items-center pointer-events-none">
          <AnimatePresence>
            {visibleMemberAlert && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className="pointer-events-auto backdrop-blur-xl bg-[#040814]/98 border-2 border-[#f59e0b] rounded-2xl p-3.5 text-center shadow-2xl w-full max-w-[300px]"
              >
                <div className="text-xs font-black text-[#fbbf24] uppercase tracking-wider flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#f59e0b] animate-spin" />
                  ¡NUEVO MEMBER OFICIAL!
                </div>
                <div className="text-base font-black text-white mt-1 truncate">
                  @{visibleMemberAlert.player.username}
                </div>
                <div className="text-xs text-[#fbbf24] font-mono mt-0.5 font-bold">
                  Desbloqueó el Slot #{visibleMemberAlert.player.slotNumber}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {visibleCommand && !visibleMemberAlert && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                className="pointer-events-auto backdrop-blur-xl bg-[#040814]/98 border-2 border-[#00f2fe] rounded-2xl p-3.5 text-center shadow-2xl w-full max-w-[300px]"
              >
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#00f2fe] font-bold mb-1">
                  <Terminal className="w-3.5 h-3.5 text-[#00f2fe]" />
                  <span>Comando de @{visibleCommand.username}</span>
                </div>
                <div className="text-sm font-black text-white">{visibleCommand.response}</div>
                {visibleCommand.detail && (
                  <div className="text-xs text-slate-300 mt-1 font-mono">{visibleCommand.detail}</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
