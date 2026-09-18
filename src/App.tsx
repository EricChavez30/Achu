import { useState, useEffect, useRef } from 'react';
import { VerticalOverlay } from './components/VerticalOverlay';
import { ControlPanel } from './components/ControlPanel';
import { ArchitectureModal } from './components/ArchitectureModal';
import { EventProcessor } from './core/eventProcessor';
import { TikTokConnector } from './core/tiktokConnector';
import { GameStateStub } from './core/gameStateStub';
import { CumulativeStats, NormalizedLiveEvent, ConnectionStatus } from './types/tiktok';
import { Radio, Sliders, Maximize2, Minimize2, Sparkles, BookOpen } from 'lucide-react';

export default function App() {
  // Check URL parameters for OBS Browser Source mode
  const urlParams = new URLSearchParams(window.location.search);
  const initialClean = urlParams.get('clean') === '1' || urlParams.get('overlay') === '1';
  const initialBg = (urlParams.get('bg') as 'dark' | 'transparent' | 'greenscreen') || 'dark';

  const [isObsCleanView, setIsObsCleanView] = useState<boolean>(initialClean);
  const [backgroundStyle, setBackgroundStyle] = useState<'dark' | 'transparent' | 'greenscreen'>(initialBg);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);

  // Core singletons
  const eventProcessorRef = useRef<EventProcessor | null>(null);
  const gameStateRef = useRef<GameStateStub | null>(null);
  const connectorRef = useRef<TikTokConnector | null>(null);

  if (!eventProcessorRef.current) {
    eventProcessorRef.current = new EventProcessor();
  }
  if (!gameStateRef.current) {
    gameStateRef.current = new GameStateStub();
  }
  if (!connectorRef.current) {
    connectorRef.current = new TikTokConnector(eventProcessorRef.current);
  }

  const processor = eventProcessorRef.current;
  const gameState = gameStateRef.current;
  const connector = connectorRef.current;

  // UI Reactive States
  const [stats, setStats] = useState<CumulativeStats>(processor.getStats());
  const [lastEvent, setLastEvent] = useState<NormalizedLiveEvent | null>(processor.getLastEvent());
  const [recentEvents, setRecentEvents] = useState<NormalizedLiveEvent[]>(processor.getRecentEvents());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(connector.getStatus());

  useEffect(() => {
    // 1. Subscribe to Event Processor events
    const unsubscribeEvents = processor.subscribe((event, updatedStats) => {
      setLastEvent(event);
      setStats(updatedStats);
      setRecentEvents(processor.getRecentEvents());

      // Update Game state stub without coupling to UI (only if there is a valid event)
      if (event && event.user) {
        gameState.registerPlayerInteraction(event);
      }
    });

    // 2. Subscribe to Connection status changes
    const unsubscribeStatus = connector.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeStatus();
    };
  }, []);

  const handleResetStats = () => {
    processor.resetStats();
    gameState.resetGame();
    setStats(processor.getStats());
    setLastEvent(null);
    setRecentEvents([]);
  };

  const handleClearEvents = () => {
    processor.clearHistory();
    processor.resetStats();
    gameState.resetGame();
    setRecentEvents([]);
    setLastEvent(null);
    setStats(processor.getStats());
  };

  // If in clean OBS Browser Source mode, render just the 9:16 overlay
  if (isObsCleanView) {
    return (
      <main className="w-screen h-screen flex items-center justify-center overflow-hidden bg-transparent">
        <div className="relative w-full h-full max-w-[1080px] max-h-[1920px]">
          <VerticalOverlay
            stats={stats}
            lastEvent={lastEvent}
            recentEvents={recentEvents}
            connectionStatus={connectionStatus}
            backgroundStyle={backgroundStyle}
          />

          {/* Discreet hover exit button for regular browser testing */}
          <button
            onClick={() => setIsObsCleanView(false)}
            className="fixed bottom-3 right-3 p-2 rounded-full bg-black/60 text-white/40 hover:text-white hover:bg-black/90 transition text-xs opacity-20 hover:opacity-100 z-50 flex items-center gap-1 backdrop-blur"
            title="Mostrar panel de control"
          >
            <Sliders className="w-4 h-4" />
            <span>Panel</span>
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-black text-white tracking-wide">
                TikTok LIVE Event Overlay
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono border border-rose-500/30">
                PROTOTIPO 9:16
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Receptor de eventos en tiempo real con simulación y salida para OBS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDocsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 transition"
          >
            <BookOpen className="w-4 h-4" />
            <span>Arquitectura Técnica (A-E)</span>
          </button>

          <button
            onClick={() => setIsObsCleanView(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Vista Limpia OBS (9:16)</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Vertical 9:16 OBS Canvas Simulator */}
        <section className="lg:col-span-6 xl:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2.5 px-1">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span>Lienzo OBS 9:16 (1080×1920)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Fondo: {backgroundStyle.toUpperCase()}
            </span>
          </div>

          {/* 9:16 Framed Container */}
          <div className="relative w-full max-w-[430px] rounded-[32px] p-2 bg-slate-900 border-2 border-slate-800 shadow-2xl flex flex-col items-center">
            {/* Aspect ratio frame 9:16 */}
            <div className="w-full rounded-[24px] overflow-hidden shadow-inner border border-slate-800/80 aspect-[9/16] relative bg-black">
              <VerticalOverlay
                stats={stats}
                lastEvent={lastEvent}
                recentEvents={recentEvents}
                connectionStatus={connectionStatus}
                backgroundStyle={backgroundStyle}
              />
            </div>

            {/* OBS Dimension Indicator */}
            <div className="w-full mt-2.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Resolución nativa: 1080 × 1920</span>
              <span className="text-emerald-400">Escala responsiva activa</span>
            </div>
          </div>
        </section>

        {/* Right Column: Streamer Control Panel & Testing Deck */}
        <section className="lg:col-span-6 xl:col-span-7 h-full">
          <ControlPanel
            connector={connector}
            connectionStatus={connectionStatus}
            backgroundStyle={backgroundStyle}
            onChangeBackground={setBackgroundStyle}
            onResetStats={handleResetStats}
            onOpenDocs={() => setIsDocsOpen(true)}
            isObsCleanView={isObsCleanView}
            onToggleObsCleanView={() => setIsObsCleanView(!isObsCleanView)}
            events={recentEvents}
            stats={stats}
            onClearEvents={handleClearEvents}
          />
        </section>
      </main>

      {/* Architecture & Tech Specs Modal */}
      <ArchitectureModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
}
