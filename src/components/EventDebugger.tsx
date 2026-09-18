import React, { useState } from 'react';
import {
  NormalizedLiveEvent,
  EventTypeCounts,
  LiveEventType,
  EventSourceOrigin,
  LikeEventData,
  GiftEventData,
  CommentEventData,
  ViewerCountData,
} from '../types/tiktok';
import {
  Bug,
  Heart,
  Gift,
  MessageSquare,
  UserPlus,
  Users,
  Radio,
  Sparkles,
  Trash2,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Filter,
  Layers,
  Code2,
} from 'lucide-react';

interface EventDebuggerProps {
  events: NormalizedLiveEvent[];
  eventCounts: EventTypeCounts;
  onClear: () => void;
  roomId?: string | null;
  connectionState: 'disconnected' | 'connecting' | 'connected' | 'error';
  connectionMode: 'real' | 'simulation';
  username?: string;
}

export const EventDebugger: React.FC<EventDebuggerProps> = ({
  events,
  eventCounts,
  onClear,
  roomId,
  connectionState,
  connectionMode,
  username,
}) => {
  const [filterType, setFilterType] = useState<LiveEventType | 'all'>('all');
  const [filterSource, setFilterSource] = useState<EventSourceOrigin | 'all'>('all');
  const [expandedPayloadIds, setExpandedPayloadIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedPayloadIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyJson = (event: NormalizedLiveEvent) => {
    navigator.clipboard.writeText(JSON.stringify(event, null, 2));
    setCopiedId(event.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEvents = events.filter((ev) => {
    if (filterType !== 'all' && ev.type !== filterType) return false;
    if (filterSource !== 'all' && ev.source !== filterSource) return false;
    return true;
  });

  const getEventIcon = (type: LiveEventType) => {
    switch (type) {
      case 'like':
        return <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />;
      case 'gift':
        return <Gift className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />;
      case 'comment':
        return <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />;
      case 'follow':
        return <UserPlus className="w-3.5 h-3.5 text-emerald-400" />;
      case 'viewer_count':
        return <Users className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Radio className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const getEventBadgeColor = (type: LiveEventType) => {
    switch (type) {
      case 'like':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'gift':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'comment':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'follow':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'viewer_count':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const renderSpecificData = (ev: NormalizedLiveEvent) => {
    switch (ev.type) {
      case 'like': {
        const d = ev.data as LikeEventData;
        return (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-rose-300">+{d.likeCount} Likes</span>
            {d.totalLikes !== undefined && (
              <span className="text-[11px] text-slate-400 font-mono">
                (Total reportado: {d.totalLikes.toLocaleString()})
              </span>
            )}
          </div>
        );
      }
      case 'gift': {
        const d = ev.data as GiftEventData;
        return (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-amber-300">{d.giftName}</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30 font-mono text-[11px]">
              x{d.repeatCount}
            </span>
            <span className="text-[11px] text-amber-400/90 font-mono font-semibold">
              💎 {d.diamondCount * (d.repeatCount || 1)} diamantes
            </span>
          </div>
        );
      }
      case 'comment': {
        const d = ev.data as CommentEventData;
        return (
          <div className="text-xs text-slate-200 italic bg-slate-900/60 px-2.5 py-1 rounded-lg border border-slate-800">
            "{d.comment}"
          </div>
        );
      }
      case 'follow': {
        return (
          <div className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
            <span>¡Nuevo Seguidor de la transmisión!</span>
          </div>
        );
      }
      case 'viewer_count': {
        const d = ev.data as ViewerCountData;
        return (
          <div className="text-xs text-blue-300 font-mono font-semibold">
            Espectadores activos: {d.viewerCount.toLocaleString()}
          </div>
        );
      }
      default:
        return <span className="text-xs text-slate-400">Evento registrado</span>;
    }
  };

  return (
    <div id="event-debugger" className="bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 text-slate-100 shadow-2xl">
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow">
            <Bug className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Event Debugger
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Últimos 50 eventos
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Inspección en tiempo real de payloads normalizados y datos específicos
            </p>
          </div>
        </div>

        {/* Room ID and Status Pill */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Room ID:</span>
            <span className="text-xs font-mono font-bold text-cyan-300">
              {roomId || (connectionState === 'connected' ? 'En vivo' : 'No disponible')}
            </span>
          </div>

          <button
            onClick={onClear}
            disabled={events.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/60 text-slate-400 hover:text-rose-300 text-xs font-semibold transition disabled:opacity-40"
            title="Limpiar lista de eventos"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>
      </div>

      {/* 2. Counters by Event Type */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="block text-[9px] uppercase font-bold text-slate-400">Total</span>
            <span className="text-sm font-black font-mono text-white">{eventCounts.total}</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-rose-900/30 rounded-xl p-2.5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 fill-rose-500" />
          </div>
          <div>
            <span className="block text-[9px] uppercase font-bold text-rose-300">Likes</span>
            <span className="text-sm font-black font-mono text-white">{eventCounts.likes}</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-cyan-900/30 rounded-xl p-2.5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="block text-[9px] uppercase font-bold text-cyan-300">Chat</span>
            <span className="text-sm font-black font-mono text-white">{eventCounts.comments}</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-amber-900/30 rounded-xl p-2.5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Gift className="w-3.5 h-3.5 fill-amber-400" />
          </div>
          <div>
            <span className="block text-[9px] uppercase font-bold text-amber-300">Regalos</span>
            <span className="text-sm font-black font-mono text-white">{eventCounts.gifts}</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-900/30 rounded-xl p-2.5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <UserPlus className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="block text-[9px] uppercase font-bold text-emerald-300">Follows</span>
            <span className="text-sm font-black font-mono text-white">{eventCounts.follows}</span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-blue-900/30 rounded-xl p-2.5 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="block text-[9px] uppercase font-bold text-blue-300">Paquetes Viewers</span>
            <span className="text-sm font-black font-mono text-white">{eventCounts.viewers}</span>
          </div>
        </div>
      </div>

      {/* 3. Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/70 border border-slate-800/80 rounded-2xl p-2.5 text-xs">
        {/* Source Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-400" /> Origen:
          </span>
          <button
            onClick={() => setFilterSource('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              filterSource === 'all'
                ? 'bg-slate-800 text-white font-bold border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({events.length})
          </button>
          <button
            onClick={() => setFilterSource('real')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
              filterSource === 'real'
                ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>TikTok Real</span>
          </button>
          <button
            onClick={() => setFilterSource('simulation')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1 ${
              filterSource === 'simulation'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Simulación</span>
          </button>
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1 flex-wrap">
          {(['all', 'like', 'comment', 'gift', 'follow', 'viewer_count'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition uppercase ${
                filterType === t
                  ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'all' ? 'Todos' : t}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Event Stream List */}
      <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((ev) => {
            const isExpanded = !!expandedPayloadIds[ev.id];
            const isReal = ev.source === 'real';

            return (
              <div
                key={ev.id}
                className={`border rounded-2xl p-3 transition shadow-sm ${
                  isReal
                    ? 'bg-slate-900/90 border-rose-900/40 hover:border-rose-700/60'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Event Row Top */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Source Badge */}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1 border shrink-0 ${
                        isReal
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isReal ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'
                        }`}
                      />
                      {isReal ? 'TIKTOK LIVE REAL' : 'SIMULACIÓN'}
                    </span>

                    {/* Type Badge */}
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 shrink-0 ${getEventBadgeColor(
                        ev.type
                      )}`}
                    >
                      {getEventIcon(ev.type)}
                      <span>{ev.type}</span>
                    </span>

                    {/* User Info */}
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={
                          ev.user.profilePictureUrl ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(ev.user.uniqueId)}`
                        }
                        alt={ev.user.nickname}
                        className="w-6 h-6 rounded-lg object-cover border border-slate-700 shrink-0"
                        crossOrigin="anonymous"
                      />
                      <span className="text-xs font-bold text-white truncate max-w-[130px]">
                        {ev.user.nickname || ev.user.uniqueId}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono truncate max-w-[110px]">
                        @{ev.user.uniqueId}
                      </span>
                    </div>
                  </div>

                  {/* Timestamp & Expand Button */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400">
                      {new Date(ev.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>

                    <button
                      onClick={() => toggleExpand(ev.id)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title={isExpanded ? 'Ocultar JSON' : 'Ver Payload Normalizado'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Specific Event Data */}
                <div className="mt-2 pl-1 flex items-center justify-between">
                  <div className="min-w-0">{renderSpecificData(ev)}</div>

                  <button
                    onClick={() => toggleExpand(ev.id)}
                    className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition ml-2"
                  >
                    <Code2 className="w-3 h-3" />
                    <span>{isExpanded ? 'Ocultar Payload' : 'Ver Payload JSON'}</span>
                  </button>
                </div>

                {/* Collapsible JSON Viewer */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Payload Normalizado (NormalizedLiveEvent)
                      </span>
                      <button
                        onClick={() => handleCopyJson(ev)}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition"
                      >
                        {copiedId === ev.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300">¡Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-cyan-400" />
                            <span>Copiar JSON</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono text-cyan-200 overflow-x-auto leading-relaxed max-h-48">
                      {JSON.stringify(
                        {
                          id: ev.id,
                          type: ev.type,
                          source: ev.source,
                          timestamp: ev.timestamp,
                          user: ev.user,
                          data: ev.data,
                          rawPayload: ev.rawPayload,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6 text-slate-400">
            <Bug className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-xs font-semibold text-slate-300">
              No hay eventos en el buffer para los filtros seleccionados
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Conecta a un directo real de TikTok LIVE o usa los disparadores de simulación para recibir datos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
