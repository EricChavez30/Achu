import React from 'react';
import { X, ShieldAlert, Cpu, Layers, Terminal, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-3xl p-6 text-slate-200 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              Arquitectura Técnica y Análisis del Prototipo
            </h2>
            <p className="text-xs text-slate-400">
              Respuestas a los puntos A, B, C, D y E para transmisión TikTok LIVE en OBS
            </p>
          </div>
        </div>

        <div className="space-y-6 text-xs leading-relaxed">
          {/* A) Componentes */}
          <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-cyan-400 mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              A) Componentes del Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="font-bold text-white block mb-1">1. Conector TikTok (Connector)</span>
                <p className="text-slate-400">
                  Módulo de enlace que conecta con el stream real (Webcast Push) o con el motor de simulación local.
                </p>
              </div>
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="font-bold text-white block mb-1">2. Procesador de Eventos (EventProcessor)</span>
                <p className="text-slate-400">
                  Normaliza payloads crudos, actualiza contadores acumulativos (likes, diamantes, regalos, chat), guarda el último evento y despacha a escuchadores.
                </p>
              </div>
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="font-bold text-white block mb-1">3. Capa de Lógica de Juego (GameStateStub)</span>
                <p className="text-slate-400">
                  Totalmente desacoplada. Mantiene estado de jugadores, XP, casillas y acciones futuras sin ensuciar la conexión ni la vista.
                </p>
              </div>
              <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800">
                <span className="font-bold text-white block mb-1">4. Interfaz Visual OBS (VerticalOverlay)</span>
                <p className="text-slate-400">
                  Lienzo 9:16 (1080x1920) optimizado para Browser Source en OBS, con soporte de fondo transparente y HUD minimalista.
                </p>
              </div>
            </div>
          </section>

          {/* B) Recepción de Eventos */}
          <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-emerald-400 mb-2 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              B) Cómo Recibiremos los Eventos en Tiempo Real
            </h3>
            <ol className="list-decimal pl-5 space-y-2 text-slate-300">
              <li>
                <strong>Fase 1 (Resolución de RoomId):</strong> El servidor Node.js toma el <code className="text-rose-300">@username</code> del streamer y consulta la página pública de TikTok LIVE para extraer el identificador numérico interno de sala (<code className="text-amber-300">roomId</code>).
              </li>
              <li>
                <strong>Fase 2 (Webcast WebSocket Protobuf):</strong> Se establece una conexión bidireccional segura con el servidor WebSocket Webcast de TikTok (<code className="text-cyan-300">webcast.tiktok.com</code>). Los mensajes viajan serializados en formato binario Protocol Buffers (Protobuf).
              </li>
              <li>
                <strong>Fase 3 (Decodificación y Puente SSE):</strong> La librería Node.js decodifica los paquetes binarios y nuestro backend Express los retransmite a la interfaz web mediante <strong>Server-Sent Events (SSE)</strong> en <code className="text-emerald-300">/api/tiktok/stream</code>.
              </li>
              <li>
                <strong>Fase 4 (Modo Simulación):</strong> Si no hay conexión o no hay directo activo, el motor de simulación interno (<code className="text-amber-300">SimulationEngine</code>) emite eventos sintéticos con idéntica estructura tipada sin requerir red.
              </li>
            </ol>
          </section>

          {/* C) Oficial vs Terceros */}
          <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-amber-400 mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              C) Qué Parte es Oficial de TikTok y Qué Parte es de Terceros
            </h3>
            <div className="space-y-2.5 text-slate-300">
              <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl">
                <span className="font-bold text-rose-300 block mb-1">⚠️ Situación con la API Oficial de TikTok:</span>
                <p>
                  TikTok <strong>NO ofrece una API pública ni gratuita</strong> para que creadores generales escuchen eventos de chat, likes o regalos de sus propios directos. El portal oficial para desarrolladores ("TikTok for Developers") solo cubre Login Kit, Share to TikTok y Display API. El acceso al "TikTok LIVE Developer Program" oficial es restringido por invitación empresarial y agencias autorizadas.
                </p>
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl">
                <span className="font-bold text-emerald-300 block mb-1">✅ Parte de Terceros (Comunidad):</span>
                <p>
                  Se utiliza la librería de ingeniería inversa comunitaria <code className="text-cyan-300 font-mono">tiktok-live-connector</code> (la misma tecnología que utilizan herramientas de streaming como TikFinity). Esta emula la sesión de un espectador web en tiktok.com para capturar el feed Webcast sin requerir credenciales ni contraseñas.
                </p>
              </div>
            </div>
          </section>

          {/* D) Riesgos Técnicos */}
          <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-rose-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              D) Riesgos Técnicos Existentes
            </h3>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>
                  <strong>Bloqueos de IP por Datacenter (Cloud vs Local):</strong> TikTok suele bloquear o solicitar captcha a direcciones IP de centros de datos (como Cloud Run, AWS o GCP). <strong>Por esta razón es fundamental ejecutarlo localmente en Windows</strong> con tu IP residencial de hogar.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>
                  <strong>Cambios de Protocolo Protobuf:</strong> TikTok actualiza periódicamente la estructura de sus mensajes binarios y firmas criptográficas. Cuando esto ocurre, la comunidad debe actualizar el paquete <code className="font-mono text-cyan-300">tiktok-live-connector</code>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">•</span>
                <span>
                  <strong>Latencia de Eventos Masivos (Throttling):</strong> En directos con miles de espectadores, los likes llegan en ráfagas agrupadas. El procesador de eventos implementa acumulación para no saturar el DOM ni ralentizar OBS.
                </span>
              </li>
            </ul>
          </section>

          {/* E) Archivos Creados */}
          <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-sm font-bold text-purple-400 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              E) Archivos Creados y Organización
            </h3>
            <ul className="space-y-1.5 font-mono text-[11px] text-slate-300">
              <li>• <span className="text-cyan-300">/src/types/tiktok.ts</span>: Modelos TypeScript (eventos unificados, usuarios, estadísticas, estado).</li>
              <li>• <span className="text-cyan-300">/src/core/eventProcessor.ts</span>: Lógica de normalización, acumulación de likes/regalos/chat e historial.</li>
              <li>• <span className="text-cyan-300">/src/core/simulationEngine.ts</span>: Generador sintético de likes, comentarios y regalos para pruebas.</li>
              <li>• <span className="text-cyan-300">/src/core/gameStateStub.ts</span>: Hook desacoplado listo para agregar XP, niveles y casillas más adelante.</li>
              <li>• <span className="text-cyan-300">/src/core/tiktokConnector.ts</span>: Puente de conexión bidireccional (Server-Sent Events y Simulación).</li>
              <li>• <span className="text-cyan-300">/server.ts</span>: Servidor Express + Vite que gestiona la conexión Webcast con TikTok y expone el stream SSE.</li>
              <li>• <span className="text-cyan-300">/src/components/VerticalOverlay.tsx</span>: Lienzo visual 9:16 (1080x1920) para Browser Source de OBS.</li>
              <li>• <span className="text-cyan-300">/src/components/ControlPanel.tsx</span>: Panel de control de streamer y disparadores manuales.</li>
            </ul>
          </section>

          {/* Guía OBS */}
          <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-xl text-blue-200">
            <p className="font-bold text-white mb-1">🎥 Cómo agregarlo en OBS Studio:</p>
            <p>
              1. En OBS, agrega una fuente de tipo <strong>"Navegador" (Browser Source)</strong>.
              <br />
              2. URL: <code className="text-amber-300 font-mono">http://localhost:3000/?clean=1&bg=transparent</code>
              <br />
              3. Ancho: <strong>1080</strong> | Alto: <strong>1920</strong> | FPS: <strong>60</strong>
              <br />
              4. Marca la casilla "Actualizar el navegador cuando la escena se active".
            </p>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs transition"
          >
            Entendido, volver a la aplicación
          </button>
        </div>
      </div>
    </div>
  );
};
