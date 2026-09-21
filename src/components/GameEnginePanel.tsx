import React, { useState } from 'react';
import {
  GameEngine,
} from '../core/gameEngine';
import {
  CommunityState,
  GameSlot,
  GameUser,
  GameEngineEvent,
} from '../types/game';
import {
  Users,
  Shield,
  Zap,
  Award,
  Sparkles,
  Flame,
  MessageSquare,
  Heart,
  Gift,
  UserPlus,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Save,
  Download,
  Check,
  Terminal,
  Target,
  ShieldAlert,
  Ban,
  UserCheck,
  Filter,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface GameEnginePanelProps {
  gameEngine: GameEngine;
  communityState: CommunityState;
  slots: GameSlot[];
  lastUser: GameUser | null;
  lastEngineEvent: GameEngineEvent | null;
  recentEvents: GameEngineEvent[];
}

export const GameEnginePanel: React.FC<GameEnginePanelProps> = ({
  gameEngine,
  communityState,
  slots,
  lastUser,
  lastEngineEvent,
  recentEvents,
}) => {
  const [testUsername, setTestUsername] = useState('testuser');
  const [testComment, setTestComment] = useState('¡Hola comunidad!');
  const [customCommandInput, setCustomCommandInput] = useState('!slot');
  const [filterSlots, setFilterSlots] = useState<'all' | 'occupied' | 'empty'>('all');
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activeMission = communityState.activeMission;
  const lastCommand = gameEngine.getLastCommandResult();

  const handleExecuteCommand = (cmd: string) => {
    gameEngine.executeChatCommand(testUsername, cmd);
  };

  const handleAddMissionProgress = (amount: number) => {
    if (!activeMission) return;
    const cleanUser = testUsername.trim().replace(/^@/, '');
    const user = gameEngine.getUser(cleanUser.toLowerCase()) || gameEngine.getOrCreateUser(cleanUser.toLowerCase(), cleanUser).user;
    gameEngine.simulateAction(cleanUser, activeMission.type === 'likes' ? 'like' : activeMission.type === 'comments' ? 'comment' : 'gift', {
      count: amount,
      comment: '¡Aportando a la misión comunitaria!',
      diamonds: amount,
    });
  };

  const handleToggleFeverMode = () => {
    if (communityState.isFeverModeActive) {
      gameEngine.stopFeverMode();
    } else {
      gameEngine.triggerFeverMode(300); // 5 min
    }
  };

  const handleManualSaveToFile = async () => {
    setIsSavingFile(true);
    const success = await gameEngine.saveToFileDatabase();
    setIsSavingFile(false);
    if (success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const occupiedSlotsCount = slots.filter((s) => s.status === 'OCCUPIED').length;
  const filteredSlots = slots.filter((s) => {
    if (filterSlots === 'occupied') return s.status === 'OCCUPIED';
    if (filterSlots === 'empty') return s.status === 'EMPTY';
    return true;
  });

  const handleSimulateAction = (
    action: 'join' | 'comment' | 'like' | 'follow' | 'gift',
    payload?: any
  ) => {
    gameEngine.simulateAction(testUsername, action, payload);
  };

  return (
    <div id="game-engine-panel" className="space-y-6">
      {/* 1. ESTADO DE LA COMUNIDAD */}
      <div id="ge-community-card" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Estado Global de la Comunidad
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  Mundo Nivel {communityState.worldLevel}
                </span>
              </h3>
              <p className="text-xs text-slate-400">{communityState.currentEvent}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSaveToFile}
              disabled={isSavingFile}
              className={`flex items-center gap-1.5 text-xs transition-colors px-2.5 py-1.5 rounded-lg border ${
                savedSuccess
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700 hover:border-slate-600'
              }`}
              title="Guardar base de datos en data/game_database.json"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>¡Guardado en Archivo!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{isSavingFile ? 'Guardando...' : 'Guardar en Archivo'}</span>
                </>
              )}
            </button>

            <a
              href="/api/game/download-backup"
              download
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600"
              title="Descargar copia de seguridad JSON a tu PC"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>Descargar JSON</span>
            </a>

            <button
              onClick={() => {
                if (confirm('¿Deseas reiniciar los datos del juego (slots y usuarios guardados)?')) {
                  gameEngine.resetGameData();
                }
              }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-rose-900/50"
              title="Reiniciar progreso"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar
            </button>
          </div>
        </div>

        {/* Barra de Progreso / Energía */}
        <div className="space-y-1.5 mb-5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Energía Comunitaria
            </span>
            <span className="text-emerald-400 font-bold">{communityState.communityEnergy}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${Math.max(4, communityState.communityEnergy)}%` }}
            />
          </div>
        </div>

        {/* Métricas Principales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">XP Comunitaria</div>
            <div className="text-xl font-bold font-mono text-cyan-300">
              {communityState.communityXP.toLocaleString()}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Slots Ocupadas</div>
            <div className="text-xl font-bold font-mono text-amber-300">
              {occupiedSlotsCount} <span className="text-xs text-slate-500 font-normal">/ 100</span>
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Miembros (Members)</div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {communityState.totalMembers}
            </div>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Visitantes (Visitors)</div>
            <div className="text-xl font-bold font-mono text-indigo-300">
              {communityState.totalVisitors}
            </div>
          </div>
        </div>
      </div>

      {/* 2. MISIÓN COMUNITARIA & MODO FIEBRE (FEVER x2 XP) */}
      <div id="ge-community-mission" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Misión Comunitaria Activa
                {communityState.isFeverModeActive ? (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-400/50 flex items-center gap-1 animate-pulse">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    FIEBRE XP x2 ACTIVA ({communityState.feverTimeRemaining}s)
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    En curso
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {activeMission ? activeMission.description : 'Progreso colectivo de todos los espectadores'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleFeverMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                communityState.isFeverModeActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-lg'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{communityState.isFeverModeActive ? 'Desactivar Fiebre' : 'Activar Fiebre x2 (5m)'}</span>
            </button>
          </div>
        </div>

        {activeMission && (
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                {activeMission.title}
              </span>
              <span className="font-mono text-amber-300 font-bold text-xs">
                {activeMission.current.toLocaleString()} / {activeMission.target.toLocaleString()}{' '}
                ({Math.min(100, Math.round((activeMission.current / activeMission.target) * 100))}%)
              </span>
            </div>

            <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(3, (activeMission.current / activeMission.target) * 100))}%`,
                }}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1">
              <span className="text-slate-400">
                🎁 Recompensa: <strong className="text-slate-200">{activeMission.rewardText}</strong>
              </span>

              {/* Botones de incremento rápido de la meta */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleAddMissionProgress(100)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs border border-slate-700 font-mono transition"
                >
                  +100 Likes
                </button>
                <button
                  onClick={() => handleAddMissionProgress(500)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs border border-slate-700 font-mono transition"
                >
                  +500 Likes
                </button>
                <button
                  onClick={() => handleAddMissionProgress(2500)}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs border border-amber-500/40 font-semibold transition"
                >
                  Completar Meta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. COMANDOS DE CHAT (!slot, !nivel, !meta, !top, !comandos) */}
      <div id="ge-chat-commands" className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Comandos de Chat Interactivose
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                !slot • !nivel • !meta • !top
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Los espectadores pueden consultar su estado o la meta escribiendo comandos en el chat de TikTok
            </p>
          </div>
        </div>

        {/* Botones de Disparo Rápido de Comandos */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
          <button
            onClick={() => handleExecuteCommand('!slot')}
            className="flex flex-col items-center justify-center p-2.5 bg-slate-950/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition text-center group"
          >
            <span className="font-mono font-bold text-xs text-cyan-300 group-hover:text-cyan-200">!slot</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Ver mi Slot</span>
          </button>

          <button
            onClick={() => handleExecuteCommand('!nivel')}
            className="flex flex-col items-center justify-center p-2.5 bg-slate-950/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition text-center group"
          >
            <span className="font-mono font-bold text-xs text-cyan-300 group-hover:text-cyan-200">!nivel</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Nivel & XP</span>
          </button>

          <button
            onClick={() => handleExecuteCommand('!meta')}
            className="flex flex-col items-center justify-center p-2.5 bg-slate-950/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition text-center group"
          >
            <span className="font-mono font-bold text-xs text-cyan-300 group-hover:text-cyan-200">!meta</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Meta Comunitaria</span>
          </button>

          <button
            onClick={() => handleExecuteCommand('!top')}
            className="flex flex-col items-center justify-center p-2.5 bg-slate-950/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition text-center group"
          >
            <span className="font-mono font-bold text-xs text-cyan-300 group-hover:text-cyan-200">!top</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Top Members</span>
          </button>

          <button
            onClick={() => handleExecuteCommand('!comandos')}
            className="flex flex-col items-center justify-center p-2.5 bg-slate-950/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 rounded-xl transition text-center group"
          >
            <span className="font-mono font-bold text-xs text-cyan-300 group-hover:text-cyan-200">!comandos</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Lista de Ayuda</span>
          </button>
        </div>

        {/* Input para simular cualquier comando con el usuario actual */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={customCommandInput}
              onChange={(e) => setCustomCommandInput(e.target.value)}
              placeholder="Escribe un comando (!slot, !nivel...)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <button
            onClick={() => handleExecuteCommand(customCommandInput)}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition"
          >
            Ejecutar en Vivo
          </button>
        </div>

        {/* Respuesta del último comando ejecutado */}
        {lastCommand && (
          <div className="bg-slate-950/90 border border-cyan-500/30 rounded-xl p-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 font-mono text-xs font-bold">
                !
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-cyan-300 font-mono">{lastCommand.command}</span>
                  <span className="text-[11px] text-slate-400">por @{lastCommand.username}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                    {lastCommand.badge}
                  </span>
                </div>
                <div className="text-xs font-bold text-white mt-0.5">{lastCommand.response}</div>
                {lastCommand.detail && (
                  <div className="text-[11px] text-slate-400 mt-0.5">{lastCommand.detail}</div>
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-500 font-mono shrink-0">
              {new Date(lastCommand.timestamp).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
      <div id="ge-player-inspector" className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          Inspector de Jugador (Última Actividad)
        </h3>

        {lastUser ? (
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 flex-shrink-0">
                {lastUser.avatarUrl ? (
                  <img
                    src={lastUser.avatarUrl}
                    alt={lastUser.username}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                    {lastUser.username.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-100 text-sm">@{lastUser.username}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      lastUser.status === 'MEMBER'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {lastUser.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                  <span>
                    Slot: <strong className="text-slate-200">{lastUser.slotNumber ? `#${lastUser.slotNumber}` : 'Ninguna (Visitor)'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Nivel: <strong className="text-emerald-400">{lastUser.level}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    XP: <strong className="text-cyan-300 font-mono">{lastUser.xp}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Progreso hacia MEMBER / Siguiente Nivel */}
            <div className="w-full md:w-64 bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs">
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">
                  {lastUser.status === 'MEMBER'
                    ? `Nivel ${lastUser.level} (${lastUser.xp} XP acumulados)`
                    : `Meta Member (500 XP)`}
                </span>
                <span className="font-mono text-slate-200 font-bold">
                  {lastUser.status === 'MEMBER'
                    ? '★ MEMBER ACTIVO'
                    : `${Math.min(100, Math.round((lastUser.xp / 500) * 100))}%`}
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    lastUser.status === 'MEMBER' ? 'bg-gradient-to-r from-amber-400 to-emerald-400' : 'bg-amber-400'
                  }`}
                  style={{
                    width: `${
                      lastUser.status === 'MEMBER'
                        ? 100
                        : Math.min(100, (lastUser.xp / 500) * 100)
                    }%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                <span>💬 {lastUser.totalComments} com.</span>
                <span>❤️ {lastUser.totalLikes} likes</span>
                <span>🎁 {lastUser.totalGifts} gifts</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-800 rounded-lg">
            Esperando primera interacción (comenta, envía un like o usa los botones de simulación abajo).
          </div>
        )}
      </div>

      {/* 3. SIMULACIÓN CON NOMBRE DE USUARIO PERSONALIZADO */}
      <div id="ge-simulation-card" className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400" />
            Consola de Simulación Unificada
          </h3>
          <span className="text-[11px] text-slate-400">
            Pasa exactamente por el mismo Game Engine que un LIVE real
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Usuario de prueba:</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">@</span>
              <input
                type="text"
                value={testUsername}
                onChange={(e) => setTestUsername(e.target.value)}
                placeholder="ej: juan123"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Texto del comentario:</label>
            <input
              type="text"
              value={testComment}
              onChange={(e) => setTestComment(e.target.value)}
              placeholder="Escribe algo..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Botones de Acción de Simulación */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            onClick={() => handleSimulateAction('join')}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 px-3 rounded-lg border border-slate-700 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-blue-400" />
            Simulate Join (+5 XP)
          </button>

          <button
            onClick={() => handleSimulateAction('comment', { comment: testComment })}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 px-3 rounded-lg border border-slate-700 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            Comment (+10 XP)
          </button>

          <button
            onClick={() => handleSimulateAction('like', { count: 10 })}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 px-3 rounded-lg border border-slate-700 transition-colors"
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            Send 10 Likes (+10 XP)
          </button>

          <button
            onClick={() => handleSimulateAction('follow')}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 px-3 rounded-lg border border-slate-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            Follow (+25 XP)
          </button>

          <button
            onClick={() =>
              handleSimulateAction('gift', { giftName: 'Rosa de TikTok', diamonds: 10 })
            }
            className="flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs py-2 px-3 rounded-lg border border-amber-500/30 transition-colors font-medium col-span-2 sm:col-span-1"
          >
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            Send Gift (+200 XP)
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mt-3">
          💡 <strong>Tip de prueba:</strong> Envía varios regalos o comentarios con el mismo usuario hasta alcanzar <strong>500 XP</strong> para ver cómo se convierte automáticamente en <strong>MEMBER</strong> y ocupa una slot libre.
        </p>
      </div>

      {/* 4.5. SISTEMA DE MODERACIÓN Y SEGURIDAD */}
      <div id="ge-moderation-card" className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                Escudo de Moderación y Filtro Automático
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                  Anti-Troll Activo
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Detecta y bloquea racismo, odio, palabras sexuales, violencia y bypass en leetspeak (4=a, 0=o)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = !gameEngine.getRequireApprovalForMembers();
                gameEngine.setRequireApprovalForMembers(next);
              }}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                gameEngine.getRequireApprovalForMembers()
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title="Requiere que el moderador apruebe a cada usuario antes de otorgarle una slot de MEMBER"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Aprobación previa: {gameEngine.getRequireApprovalForMembers() ? 'ON' : 'OFF'}</span>
            </button>

            {gameEngine.getModerationLogs().length > 0 && (
              <button
                onClick={() => gameEngine.clearModerationLogs()}
                className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-rose-400 flex items-center gap-1"
                title="Limpiar registro de auditoría"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Acciones de Moderación Rápida sobre el Usuario de Prueba / Inspector */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Acciones sobre:</span>
            <span className="text-xs font-mono font-bold text-cyan-300">@{testUsername}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const banned = gameEngine.banUser(testUsername, 'Bloqueo manual por moderador');
                if (banned) {
                  alert(`@${testUsername} ha sido bloqueado y su slot liberada.`);
                }
              }}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-colors font-medium"
            >
              <Ban className="w-3.5 h-3.5" />
              Bloquear / Expulsar Slot
            </button>

            <button
              onClick={() => {
                const approved = gameEngine.approveUser(testUsername);
                if (approved) {
                  alert(`@${testUsername} ha sido aprobado.`);
                }
              }}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-colors font-medium"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Aprobar Usuario
            </button>
          </div>
        </div>

        {/* Registro de Auditoría de Moderación */}
        <div>
          <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Registro de Auditoría de Seguridad ({gameEngine.getModerationLogs().length})
          </h4>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {gameEngine.getModerationLogs().length === 0 ? (
              <div className="text-center py-3 text-xs text-emerald-400/80 bg-emerald-950/20 border border-emerald-900/30 rounded-lg">
                ✓ No se han detectado intentos de contenido inapropiado o nombres ofensivos. Comunidad limpia.
              </div>
            ) : (
              gameEngine.getModerationLogs().map((log) => (
                <div
                  key={log.id}
                  className="bg-rose-950/20 border border-rose-900/30 rounded-lg p-2 text-xs flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      {log.actionTaken}
                    </span>
                    <span className="font-semibold text-slate-200">@{log.username}</span>
                    <span className="text-slate-400 truncate">«{log.detectedText}»</span>
                    <span className="text-rose-400 text-[11px]">({log.reason})</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. HISTORIAL DE EVENTOS INTERNOS DEL GAME ENGINE */}
      <div id="ge-events-history" className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            Eventos Internos Recientes ({recentEvents.length})
          </span>
          <span className="text-xs text-slate-400 font-normal">
            PLAYER_JOINED • PLAYER_LEVEL_UP • PLAYER_BECAME_MEMBER
          </span>
        </h3>

        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {recentEvents.length === 0 ? (
            <div className="text-center py-4 text-xs text-slate-400">
              No hay eventos internos generados todavía.
            </div>
          ) : (
            recentEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2.5 text-xs flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-wider flex-shrink-0 ${
                      evt.type === 'PLAYER_BECAME_MEMBER'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : evt.type === 'PLAYER_LEVEL_UP'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : evt.type === 'GIFT_EVENT'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {evt.type}
                  </span>
                  <span className="text-slate-200 truncate">{evt.data.message || `@${evt.player.username} interactuó`}</span>
                </div>
                <div className="text-right flex-shrink-0 text-slate-400 text-[10px] font-mono">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. VISOR DE 100 SLOTS */}
      <div id="ge-slots-grid" className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Slots de la Comunidad (100 Slots)
            </h3>
            <p className="text-xs text-slate-400">
              {occupiedSlotsCount} ocupadas • {100 - occupiedSlotsCount} disponibles
            </p>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-1.5 text-xs bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setFilterSlots('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterSlots === 'all' ? 'bg-slate-800 text-slate-100 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Todas (100)
            </button>
            <button
              onClick={() => setFilterSlots('occupied')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterSlots === 'occupied' ? 'bg-amber-500/20 text-amber-300 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ocupadas ({occupiedSlotsCount})
            </button>
            <button
              onClick={() => setFilterSlots('empty')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterSlots === 'empty' ? 'bg-slate-800 text-slate-100 font-medium' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vacías ({100 - occupiedSlotsCount})
            </button>
          </div>
        </div>

        {/* Grilla compacta de slots */}
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-10 gap-2 max-h-72 overflow-y-auto pr-1">
          {filteredSlots.map((slot) => {
            const isOccupied = slot.status === 'OCCUPIED';
            return (
              <div
                key={slot.number}
                className={`p-2 rounded-lg border text-center transition-all ${
                  isOccupied
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-200 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                }`}
              >
                <div className="text-[10px] font-mono font-bold">#{slot.number}</div>
                <div className="text-[11px] font-semibold truncate mt-0.5">
                  {isOccupied ? `@${slot.username}` : 'EMPTY'}
                </div>
                <div className="text-[9px] mt-0.5">
                  {isOccupied ? (
                    <span className="text-emerald-400 font-medium">MEMBER</span>
                  ) : (
                    <span className="text-slate-400">Libre</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
