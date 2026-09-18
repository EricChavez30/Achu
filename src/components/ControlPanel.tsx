import React, { useState, useEffect } from 'react';
import {
  Radio,
  Play,
  Square,
  Sparkles,
  Heart,
  MessageSquare,
  Gift,
  UserPlus,
  Users,
  RotateCcw,
  Sliders,
  BookOpen,
  Copy,
  Check,
  Eye,
  Bug,
  AlertTriangle,
  Info,
  Laptop,
  RefreshCw,
  Download,
} from 'lucide-react';
import { ConnectionStatus, NormalizedLiveEvent, CumulativeStats } from '../types/tiktok';
import { TikTokConnector } from '../core/tiktokConnector';
import { MOCK_GIFTS } from '../core/simulationEngine';
import { EventDebugger } from './EventDebugger';

interface ControlPanelProps {
  connector: TikTokConnector;
  connectionStatus: ConnectionStatus;
  backgroundStyle: 'dark' | 'transparent' | 'greenscreen';
  onChangeBackground: (bg: 'dark' | 'transparent' | 'greenscreen') => void;
  onResetStats: () => void;
  onOpenDocs: () => void;
  isObsCleanView: boolean;
  onToggleObsCleanView: () => void;
  events: NormalizedLiveEvent[];
  stats: CumulativeStats;
  onClearEvents: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  connector,
  connectionStatus,
  backgroundStyle,
  onChangeBackground,
  onResetStats,
  onOpenDocs,
  isObsCleanView,
  onToggleObsCleanView,
  events,
  stats,
  onClearEvents,
}) => {
  // Pre-fill with requested test account: @ERIC_ACHU
  const [usernameInput, setUsernameInput] = useState('ERIC_ACHU');
  const [customComment, setCustomComment] = useState('');
  const [autoSimInterval, setAutoSimInterval] = useState(2000);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'debugger' | 'simulation' | 'obs'>('debugger');
  const [autoRetry, setAutoRetry] = useState(false);
  const [retryTimer, setRetryTimer] = useState(15);
  const [showWindowsGuide, setShowWindowsGuide] = useState(false);

  // Auto-retry polling effect when streamer is offline
  useEffect(() => {
    let interval: any = null;
    if (autoRetry && connectionStatus.state === 'error') {
      interval = setInterval(() => {
        setRetryTimer((prev) => {
          if (prev <= 1) {
            if (usernameInput.trim()) {
              connector.connectReal(usernameInput);
            }
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setRetryTimer(15);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRetry, connectionStatus.state, usernameInput, connector]);

  const handleConnectReal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (usernameInput.trim()) {
      connector.connectReal(usernameInput);
    }
  };

  const handleConnectSim = (customName?: string) => {
    setAutoRetry(false);
    connector.connectSimulation(customName || usernameInput.trim() || 'ERIC_ACHU');
  };

  const handleDisconnect = () => {
    connector.disconnect();
  };

  const handleCopyObsUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('clean', '1');
    url.searchParams.set('bg', backgroundStyle);
    navigator.clipboard.writeText(url.toString());
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // State badge formatting
  const renderStateBadge = () => {
    switch (connectionStatus.state) {
      case 'connected':
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {connectionStatus.mode === 'real' ? 'CONECTADO (TIKTOK LIVE)' : 'CONECTADO (SIMULACIÓN)'}
          </span>
        );
      case 'connecting':
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 animate-pulse shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            CONECTANDO A TIKTOK...
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            ERROR DE CONEXIÓN
          </span>
        );
      case 'disconnected':
      default:
        return (
          <span className="flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            DESCONECTADO
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-slate-100 flex flex-col gap-4 shadow-2xl h-full overflow-y-auto">
      {/* 1. Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
        <div>
          <h2 className="text-base font-black text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-rose-500" />
            <span>Validador de Conexión TikTok LIVE</span>
          </h2>
          <p className="text-xs text-slate-400">
            Prueba de conectividad real con puente Node.js, Event Debugger y Simulación
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenDocs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 transition"
            title="Ver Arquitectura Técnica y Docs"
          >
            <BookOpen className="w-4 h-4" />
            <span>Docs API</span>
          </button>

          <button
            onClick={onToggleObsCleanView}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white shadow-lg transition"
            title="Modo pantalla limpia para capturar con OBS"
          >
            <Eye className="w-4 h-4" />
            <span>{isObsCleanView ? 'Salir de OBS' : 'Modo OBS'}</span>
          </button>
        </div>
      </div>

      {/* 2. TikTok LIVE Real Connection Box */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3.5 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Conexión TikTok LIVE
            </span>
          </div>
          {renderStateBadge()}
        </div>

        {/* Form to connect to TikTok live */}
        <form onSubmit={handleConnectReal} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-xs text-rose-400 font-bold font-mono">@</span>
            <input
              type="text"
              placeholder="nombre_usuario (ej: ERIC_ACHU)"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 focus:border-rose-500 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none font-mono font-semibold"
            />
          </div>

          <div className="flex items-center gap-2">
            {connectionStatus.state === 'connected' ? (
              <button
                type="button"
                onClick={handleDisconnect}
                className="w-full sm:w-auto px-4 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5" />
                Desconectar
              </button>
            ) : (
              <button
                type="submit"
                disabled={connectionStatus.state === 'connecting'}
                className="w-full sm:w-auto px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{connectionStatus.state === 'connecting' ? 'Conectando...' : 'Conectar a TikTok LIVE'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setUsernameInput('ERIC_ACHU')}
              className="px-2.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-mono text-slate-300 rounded-xl transition"
              title="Restablecer cuenta de prueba @ERIC_ACHU"
            >
              @ERIC_ACHU
            </button>
          </div>
        </form>

        {/* Quick Testing Tip */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              <strong>¿Cómo probar?</strong> El streamer debe estar <em>transmitiendo en vivo ahora mismo</em> en TikTok. Si no hay ningún directo activo, puedes:
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleConnectSim(usernameInput || 'ERIC_ACHU')}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Activar Simulación Inmediata</span>
          </button>
        </div>

        {/* Room ID and Streamer details bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Streamer:</span>
            <span className="text-white font-bold">
              {connectionStatus.username ? `@${connectionStatus.username}` : '@ERIC_ACHU'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:justify-end">
            <span className="text-slate-400">Room ID:</span>
            <span
              className={`font-bold ${
                connectionStatus.roomId ? 'text-cyan-300' : 'text-slate-500'
              }`}
            >
              {connectionStatus.roomId || (connectionStatus.state === 'connected' ? 'En Vivo' : 'No disponible (Desconectado)')}
            </span>
          </div>
        </div>

        {/* Error notification banner with direct solutions for both issues */}
        {connectionStatus.state === 'error' && (
          <div className="p-3.5 bg-rose-950/60 border border-rose-800/70 rounded-xl text-xs text-rose-200 flex flex-col gap-2.5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Diagnóstico y Solución de Conexión:</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-900/60 text-rose-200 border border-rose-700/50">
                2 Causas Detectadas
              </span>
            </div>

            <p className="text-[11px] text-rose-100 font-medium pl-6">
              {connectionStatus.errorMessage || 'No se pudo contactar con el directo de TikTok.'}
            </p>

            {/* Direct 1-click Actions to solve the issues immediately */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => handleConnectSim(usernameInput || 'ERIC_ACHU')}
                className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Simular En Vivo con @{usernameInput || 'ERIC_ACHU'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAutoRetry(!autoRetry)}
                className={`w-full py-2 px-3 border rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm ${
                  autoRetry
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${autoRetry ? 'animate-spin text-cyan-300' : 'text-slate-400'}`} />
                <span>
                  {autoRetry
                    ? `Auto-reintentando en ${retryTimer}s...`
                    : 'Auto-reintentar cuando inicie LIVE'}
                </span>
              </button>
            </div>

            {/* Detailed solution cards for the 2 errors */}
            <div className="mt-1 pt-2 border-t border-rose-800/50 flex flex-col gap-2">
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-200 text-[11px]">
                  <span className="w-4 h-4 rounded-full bg-rose-500/30 text-rose-300 flex items-center justify-center text-[10px]">1</span>
                  <span>Error 1: Streamer fuera de línea (Offline en TikTok)</span>
                </div>
                <p className="text-[10px] text-slate-400 pl-5 leading-relaxed">
                  TikTok no genera eventos cuando el usuario no está en transmisión activa.
                  <strong className="text-emerald-300"> Solución: </strong>
                  Haz clic arriba en <em>"Simular En Vivo"</em> para activar el overlay de inmediato con el nombre <span className="text-cyan-300 font-mono">@{usernameInput || 'ERIC_ACHU'}</span>, o pulsa <em>"Auto-reintentar"</em> para que se conecte solo cuando empiece a emitir.
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-200 text-[11px]">
                  <span className="w-4 h-4 rounded-full bg-rose-500/30 text-rose-300 flex items-center justify-center text-[10px]">2</span>
                  <span>Error 2: Bloqueo de IP en servidores de la nube</span>
                </div>
                <p className="text-[10px] text-slate-400 pl-5 leading-relaxed">
                  TikTok bloquea consultas de scraping desde IPs de centros de datos de Google Cloud.
                  <strong className="text-emerald-300"> Solución: </strong>
                  Hemos incluido el archivo <code className="text-cyan-300 font-mono">iniciar-en-windows.bat</code> para que ejecutes la app localmente en tu PC con 1 solo clic usando tu IP residencial, o bien ingresa el Room ID numérico de 19 dígitos directamente en el buscador.
                </p>
                <div className="pl-5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowWindowsGuide(!showWindowsGuide)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold underline flex items-center gap-1"
                  >
                    <Laptop className="w-3 h-3" />
                    {showWindowsGuide ? 'Ocultar guía de Windows' : 'Ver cómo ejecutar iniciar-en-windows.bat en tu PC'}
                  </button>
                </div>
              </div>
            </div>

            {/* Windows 1-click execution guide */}
            {showWindowsGuide && (
              <div className="bg-cyan-950/40 border border-cyan-800/50 rounded-lg p-2.5 text-[10px] text-cyan-200 flex flex-col gap-1 animate-fadeIn">
                <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Pasos para ejecutar en tu PC Windows sin límites de IP:</span>
                </div>
                <ol className="list-decimal pl-5 space-y-1 text-slate-300">
                  <li>Descarga o clona este repositorio en tu computadora con Windows.</li>
                  <li>Haz doble clic en el archivo <code className="text-white font-mono bg-black/40 px-1 py-0.5 rounded">iniciar-en-windows.bat</code>.</li>
                  <li>El script instalará las dependencias y levantará el servidor en <code className="text-cyan-300 font-mono">http://localhost:3000</code>.</li>
                  <li>¡Listo! Tu IP residencial de casa se conectará directamente a TikTok LIVE sin bloqueos de nube.</li>
                </ol>
              </div>
            )}
          </div>
        )}

        {/* Quick Local Execution Banner */}
        <div className="p-2.5 bg-cyan-950/30 border border-cyan-900/40 rounded-xl text-[11px] text-cyan-200/90 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Ejecución local en Windows con IP residencial: <code className="text-cyan-300 font-mono font-bold">iniciar-en-windows.bat</code></span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-mono">
            Anti-Bloqueos
          </span>
        </div>
      </div>

      {/* 3. Navigation Tabs: Event Debugger / Simulación / OBS */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('debugger')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'debugger'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Bug className="w-3.5 h-3.5" />
          <span>Event Debugger ({events.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('simulation')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'simulation'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Modo Simulación & Disparadores</span>
        </button>

        <button
          onClick={() => setActiveTab('obs')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'obs'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Ajustes OBS</span>
        </button>
      </div>

      {/* 4. Tab Contents */}
      {activeTab === 'debugger' && (
        <EventDebugger
          events={events}
          eventCounts={stats.eventCounts}
          onClear={onClearEvents}
          roomId={connectionStatus.roomId}
          connectionState={connectionStatus.state}
          connectionMode={connectionStatus.mode}
          username={connectionStatus.username}
        />
      )}

      {activeTab === 'simulation' && (
        <div className="flex flex-col gap-4">
          {/* Continuous Bot Controller */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Bot de Eventos Continuos
                </span>
              </div>

              <button
                onClick={
                  connectionStatus.mode === 'simulation' && connectionStatus.state === 'connected'
                    ? handleDisconnect
                    : () => handleConnectSim()
                }
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                  connectionStatus.mode === 'simulation' && connectionStatus.state === 'connected'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                }`}
              >
                {connectionStatus.mode === 'simulation' && connectionStatus.state === 'connected' ? (
                  <>
                    <Square className="w-3 h-3" />
                    Detener Simulación
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-slate-950" />
                    Iniciar Simulación Continua
                  </>
                )}
              </button>
            </div>

            {/* Speed Slider */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Frecuencia de generación:</span>
              <span className="font-mono text-amber-400 font-bold">
                {(autoSimInterval / 1000).toFixed(1)} segundos
              </span>
            </div>
            <input
              type="range"
              min="600"
              max="4000"
              step="200"
              value={autoSimInterval}
              onChange={(e) => {
                const val = Number(e.target.value);
                setAutoSimInterval(val);
                if (connectionStatus.mode === 'simulation' && connectionStatus.state === 'connected') {
                  connector.getSimulationEngine().stop();
                  connector.getSimulationEngine().start(val);
                }
              }}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Instant Manual Event Triggers */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              Disparadores Instantáneos de Prueba
            </span>

            {/* Likes & Comments */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => connector.triggerManualLike(25)}
                className="p-2.5 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/40 rounded-xl text-left flex items-center gap-2 transition"
              >
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-rose-200">+25 Likes</span>
                  <span className="text-[10px] text-slate-400">Ráfaga de likes</span>
                </div>
              </button>

              <button
                onClick={() => connector.triggerManualFollow()}
                className="p-2.5 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/40 rounded-xl text-left flex items-center gap-2 transition"
              >
                <UserPlus className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="block text-xs font-bold text-emerald-200">+1 Seguidor</span>
                  <span className="text-[10px] text-slate-400">Nuevo follow</span>
                </div>
              </button>
            </div>

            {/* Custom Comment */}
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Escribir comentario simulado..."
                value={customComment}
                onChange={(e) => setCustomComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customComment.trim()) {
                    connector.triggerManualComment(customComment);
                    setCustomComment('');
                  }
                }}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
              <button
                onClick={() => {
                  connector.triggerManualComment(customComment || undefined);
                  setCustomComment('');
                }}
                className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Comentar
              </button>
            </div>

            {/* Quick Gifts */}
            <div>
              <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Enviar Regalo:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {MOCK_GIFTS.slice(0, 4).map((gift) => (
                  <button
                    key={gift.giftId}
                    onClick={() => connector.triggerManualGift(gift, 1)}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-xl text-center flex flex-col items-center justify-center transition"
                  >
                    <span className="text-lg">{gift.emoji}</span>
                    <span className="text-[10px] font-bold text-slate-200 mt-0.5 truncate w-full">
                      {gift.giftName}
                    </span>
                    <span className="text-[9px] text-amber-400 font-mono">
                      {gift.diamondCount}💎
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                {MOCK_GIFTS.slice(4, 8).map((gift) => (
                  <button
                    key={gift.giftId}
                    onClick={() => connector.triggerManualGift(gift, 1)}
                    className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-xl text-center flex flex-col items-center justify-center transition"
                  >
                    <span className="text-lg">{gift.emoji}</span>
                    <span className="text-[10px] font-bold text-slate-200 mt-0.5 truncate w-full">
                      {gift.giftName}
                    </span>
                    <span className="text-[9px] text-amber-400 font-mono">
                      {gift.diamondCount}💎
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Viewers Trigger */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                Ajustar Espectadores:
              </span>
              <div className="flex gap-1.5">
                <button
                  onClick={() => connector.triggerManualViewers(-25)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] rounded-lg text-slate-300 font-mono"
                >
                  -25
                </button>
                <button
                  onClick={() => connector.triggerManualViewers(50)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] rounded-lg text-slate-300 font-mono"
                >
                  +50
                </button>
                <button
                  onClick={() => connector.triggerManualViewers(200)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] rounded-lg text-slate-300 font-mono"
                >
                  +200
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'obs' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Ajustes de Fondo y Salida para OBS Studio
          </span>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onChangeBackground('dark')}
              className={`p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                backgroundStyle === 'dark'
                  ? 'bg-slate-800 border-2 border-rose-500 text-white shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-700" />
              <span>Fondo Oscuro</span>
            </button>

            <button
              onClick={() => onChangeBackground('transparent')}
              className={`p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                backgroundStyle === 'transparent'
                  ? 'bg-slate-800 border-2 border-rose-500 text-white shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}
            >
              <div className="w-6 h-6 rounded-lg border border-dashed border-slate-500 bg-black/20" />
              <span>Transparente</span>
            </button>

            <button
              onClick={() => onChangeBackground('greenscreen')}
              className={`p-2.5 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                backgroundStyle === 'greenscreen'
                  ? 'bg-slate-800 border-2 border-rose-500 text-white shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-400'
              }`}
            >
              <div className="w-6 h-6 rounded-lg bg-[#00FF00] border border-black/30" />
              <span>Chroma Verde</span>
            </button>
          </div>

          {/* Copy OBS Browser Source URL */}
          <button
            onClick={handleCopyObsUrl}
            className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition"
          >
            {copiedUrl ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-bold">¡URL copiada para Browser Source!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-cyan-400" />
                <span>Copiar URL para OBS Browser Source (1080×1920)</span>
              </>
            )}
          </button>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-400 leading-relaxed">
            <p className="font-semibold text-slate-200 mb-1">Configuración en OBS Studio:</p>
            <ol className="list-decimal pl-4 space-y-0.5 text-[10px]">
              <li>Agrega una nueva fuente <strong>Navegador (Browser Source)</strong>.</li>
              <li>Pega la URL copiada arriba.</li>
              <li>Establece Ancho: <strong>1080</strong> y Alto: <strong>1920</strong>.</li>
              <li>Marca la casilla <em>"Apagar la fuente cuando no sea visible"</em> si lo deseas.</li>
            </ol>
          </div>

          {/* Reset counters */}
          <button
            onClick={onResetStats}
            className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar Estadísticas y Contadores
          </button>
        </div>
      )}
    </div>
  );
};
