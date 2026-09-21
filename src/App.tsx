import { useState, useEffect, useRef } from 'react';
import { VerticalOverlay } from './components/VerticalOverlay';
import { GameLiveOverlay } from './components/GameLiveOverlay';
import { ControlPanel } from './components/ControlPanel';
import { ArchitectureModal } from './components/ArchitectureModal';
import { EventProcessor } from './core/eventProcessor';
import { TikTokConnector } from './core/tiktokConnector';
import { GameEngine } from './core/gameEngine';
import { CumulativeStats, NormalizedLiveEvent, ConnectionStatus } from './types/tiktok';
import { CommunityState, GameSlot, GameUser, GameEngineEvent, ChatCommandResult } from './types/game';
import { Radio, Sliders, Maximize2, Sparkles, BookOpen, Smartphone, Monitor, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function App() {
  // Check URL parameters for OBS / TikTok Studio Browser Source mode
  const urlParams = new URLSearchParams(window.location.search);
  const initialClean = urlParams.get('clean') === '1' || urlParams.get('overlay') === '1';
  const initialBg = (urlParams.get('bg') as 'dark' | 'transparent' | 'greenscreen') || 'dark';
  const initialLayout = (urlParams.get('layout') as 'vertical' | 'horizontal') || 'vertical';

  const [isObsCleanView, setIsObsCleanView] = useState<boolean>(initialClean);
  const [backgroundStyle, setBackgroundStyle] = useState<'dark' | 'transparent' | 'greenscreen'>(initialBg);
  const [overlayLayout, setOverlayLayout] = useState<'vertical' | 'horizontal'>(initialLayout);
  const [overlayStyleMode, setOverlayStyleMode] = useState<'game' | 'classic'>('game');
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);
  const [showSafeZoneGuides, setShowSafeZoneGuides] = useState<boolean>(false);

  // Core singletons
  const eventProcessorRef = useRef<EventProcessor | null>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const connectorRef = useRef<TikTokConnector | null>(null);

  if (!eventProcessorRef.current) {
    eventProcessorRef.current = new EventProcessor();
  }
  if (!gameEngineRef.current) {
    gameEngineRef.current = new GameEngine();
  }
  if (!connectorRef.current) {
    connectorRef.current = new TikTokConnector(eventProcessorRef.current);
  }

  const processor = eventProcessorRef.current;
  const gameEngine = gameEngineRef.current;
  const connector = connectorRef.current;

  // UI Reactive States for TikTok and Events
  const [stats, setStats] = useState<CumulativeStats>(processor.getStats());
  const [lastEvent, setLastEvent] = useState<NormalizedLiveEvent | null>(processor.getLastEvent());
  const [recentEvents, setRecentEvents] = useState<NormalizedLiveEvent[]>(processor.getRecentEvents());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(connector.getStatus());

  // UI Reactive States for Game Engine
  const [communityState, setCommunityState] = useState<CommunityState>(gameEngine.getCommunityState());
  const [gameSlots, setGameSlots] = useState<GameSlot[]>(gameEngine.getSlots());
  const [lastUser, setLastUser] = useState<GameUser | null>(gameEngine.getLastActiveUser());
  const [lastEngineEvent, setLastEngineEvent] = useState<GameEngineEvent | null>(gameEngine.getLastEngineEvent());
  const [recentEngineEvents, setRecentEngineEvents] = useState<GameEngineEvent[]>(gameEngine.getRecentEngineEvents());
  const [lastCommandResult, setLastCommandResult] = useState<ChatCommandResult | null>(gameEngine.getLastCommandResult());

  useEffect(() => {
    // 1. Subscribe to Event Processor events (feed real & simulated events into the Game Engine)
    const unsubscribeEvents = processor.subscribe((event, updatedStats) => {
      setLastEvent(event);
      setStats(updatedStats);
      setRecentEvents(processor.getRecentEvents());

      // Feed event to GameEngine if event exists
      if (event && event.user) {
        gameEngine.processLiveEvent(event);
      }
    });

    // 2. Subscribe to Game Engine changes
    const unsubscribeGame = gameEngine.subscribe((updatedCommunity, engineEvent, updatedSlots, updatedLastUser) => {
      setCommunityState(updatedCommunity);
      setGameSlots(updatedSlots);
      setLastUser(updatedLastUser);
      setLastEngineEvent(engineEvent);
      setRecentEngineEvents(gameEngine.getRecentEngineEvents());
      setLastCommandResult(gameEngine.getLastCommandResult());
    });

    // 3. Subscribe to Connection status changes
    const unsubscribeStatus = connector.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeGame();
      unsubscribeStatus();
    };
  }, []);

  const handleResetStats = () => {
    processor.resetStats();
    gameEngine.resetGameData();
    setStats(processor.getStats());
    setLastEvent(null);
    setRecentEvents([]);
  };

  const handleClearEvents = () => {
    processor.clearHistory();
    processor.resetStats();
    setRecentEvents([]);
    setLastEvent(null);
    setStats(processor.getStats());
  };

  // If in clean TikTok Studio / OBS Browser Source mode, render the chosen overlay
  if (isObsCleanView) {
    const isHorizontal = overlayLayout === 'horizontal';
    return (
      <main className="w-screen h-screen flex items-center justify-center overflow-hidden bg-transparent">
        <div
          className={`relative w-full h-full ${
            isHorizontal ? 'max-w-[1920px] max-h-[1080px]' : 'max-w-[1080px] max-h-[1920px]'
          }`}
        >
          {overlayStyleMode === 'game' ? (
            <GameLiveOverlay
              stats={stats}
              lastEvent={lastEvent}
              recentEvents={recentEvents}
              connectionStatus={connectionStatus}
              backgroundStyle={backgroundStyle}
              layout={overlayLayout}
              communityState={communityState}
              slots={gameSlots}
              lastEngineEvent={lastEngineEvent}
              lastCommandResult={lastCommandResult}
              showSafeZoneGuides={showSafeZoneGuides}
            />
          ) : (
            <VerticalOverlay
              stats={stats}
              lastEvent={lastEvent}
              recentEvents={recentEvents}
              connectionStatus={connectionStatus}
              backgroundStyle={backgroundStyle}
            />
          )}

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
        {/* Left Column: TikTok Studio / OBS Canvas Simulator */}
        <section className="lg:col-span-6 xl:col-span-5 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2.5 px-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Lienzo TikTok Studio</span>
            </div>

            {/* Layout switch controls & Safe Zone Toggle */}
            <div className="flex items-center gap-1.5">
              {overlayLayout === 'vertical' && (
                <button
                  onClick={() => setShowSafeZoneGuides(!showSafeZoneGuides)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold transition border ${
                    showSafeZoneGuides
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="Mostrar u ocultar zonas reservadas de la app nativa de TikTok"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>{showSafeZoneGuides ? 'Ocultar Guías' : 'Ver Zonas TikTok'}</span>
                </button>
              )}

              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setOverlayLayout('vertical')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    overlayLayout === 'vertical'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Formato vertical estándar de TikTok"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>9:16</span>
                </button>

                <button
                  onClick={() => setOverlayLayout('horizontal')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    overlayLayout === 'horizontal'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Formato horizontal / Pantalla completa"
                >
                  <Monitor className="w-3 h-3" />
                  <span>16:9</span>
                </button>
              </div>
            </div>
          </div>

          {/* Framed Container adapting to 9:16 or 16:9 */}
          <div
            className={`relative w-full rounded-[32px] p-2 bg-slate-900 border-2 border-slate-800 shadow-2xl flex flex-col items-center transition-all ${
              overlayLayout === 'horizontal' ? 'max-w-[560px]' : 'max-w-[420px]'
            }`}
          >
            {/* Aspect ratio frame */}
            <div
              className={`w-full rounded-[24px] overflow-hidden shadow-inner border border-slate-800/80 relative bg-black transition-all ${
                overlayLayout === 'horizontal' ? 'aspect-[16/9]' : 'aspect-[9/16]'
              }`}
            >
              <GameLiveOverlay
                stats={stats}
                lastEvent={lastEvent}
                recentEvents={recentEvents}
                connectionStatus={connectionStatus}
                backgroundStyle={backgroundStyle}
                layout={overlayLayout}
                communityState={communityState}
                slots={gameSlots}
                lastEngineEvent={lastEngineEvent}
                lastCommandResult={lastCommandResult}
                showSafeZoneGuides={showSafeZoneGuides}
              />
            </div>

            {/* Dimension Indicator */}
            <div className="w-full mt-2.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{overlayLayout === 'horizontal' ? '1920 × 1080 (16:9 Horizontal)' : '1080 × 1920 (9:16 Vertical)'}</span>
              <span className="text-emerald-400">TikTok Studio Ready</span>
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
            gameEngine={gameEngine}
            communityState={communityState}
            gameSlots={gameSlots}
            lastUser={lastUser}
            lastEngineEvent={lastEngineEvent}
            recentEngineEvents={recentEngineEvents}
          />
        </section>
      </main>

      {/* Architecture & Tech Specs Modal */}
      <ArchitectureModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
}
