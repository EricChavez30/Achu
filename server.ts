/**
 * TikTok LIVE Prototype - Node.js Backend Server
 * 
 * AVISO IMPORTANTE DE ARQUITECTURA:
 * Este backend utiliza 'tiktok-live-connector', una librería comunitaria NO OFICIAL
 * de código abierto basada en ingeniería inversa (reverse engineering) del protocolo
 * Webcast interno de TikTok. NO utiliza APIs propietarias ni oficiales de TikTok.
 * NO requiere credenciales, contraseñas, tokens de desarrollador ni cookies para leer
 * streams públicos.
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// List of connected SSE clients
interface SSEClient {
  id: number;
  res: express.Response;
}
let sseClients: SSEClient[] = [];
let nextClientId = 1;

// TikTok Connection State
let activeTiktokConnection: any = null;
let activeUsername: string = '';
let connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';
let lastError: string | null = null;
let currentRoomId: string | null = null;

// Dynamically load WebcastPushConnection to prevent build failures if package has native issues
let WebcastPushConnectionClass: any = null;
async function getWebcastClass() {
  if (!WebcastPushConnectionClass) {
    try {
      // @ts-ignore
      const mod = await import('tiktok-live-connector/legacy');
      WebcastPushConnectionClass = mod.WebcastPushConnection;

      // Disable Euler route fallback which requires paid API key and throws 403
      // @ts-ignore
      const rootMod = await import('tiktok-live-connector');
      if (rootMod?.RoomIdRouteConfig) {
        rootMod.RoomIdRouteConfig.skipFetchRoomIdFromEulerRoute = true;
      }
    } catch (err) {
      console.error('Error importing tiktok-live-connector:', err);
    }
  }
  return WebcastPushConnectionClass;
}

function broadcastSSE(data: any) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch (e) {
      // ignore
    }
  });
}

function broadcastEvent(rawType: string, rawData: any) {
  const eventPayload = {
    rawType,
    rawData,
    source: 'real',
    timestamp: Date.now(),
    roomId: currentRoomId,
  };
  broadcastSSE(eventPayload);
}

function broadcastStatus(status: 'disconnected' | 'connecting' | 'connected' | 'error', errorMessage?: string) {
  connectionStatus = status;
  if (errorMessage !== undefined) lastError = errorMessage;
  broadcastSSE({
    type: 'status',
    state: status,
    errorMessage: lastError,
    username: activeUsername,
    roomId: currentRoomId,
    timestamp: Date.now(),
  });
}

// 1. SSE Stream Endpoint
app.get('/api/tiktok/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = nextClientId++;
  sseClients.push({ id: clientId, res });

  // Send initial handshake and state
  res.write(
    `data: ${JSON.stringify({
      type: 'status',
      state: connectionStatus,
      username: activeUsername,
      roomId: currentRoomId,
      errorMessage: lastError,
      timestamp: Date.now(),
    })}\n\n`
  );

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// 2. Status Endpoint
app.get('/api/tiktok/status', (req, res) => {
  res.json({
    status: connectionStatus,
    username: activeUsername,
    roomId: currentRoomId,
    errorMessage: lastError,
    sseClientsCount: sseClients.length,
  });
});

// 3. Connect to TikTok LIVE
app.post('/api/tiktok/connect', async (req, res) => {
  const { username, roomId: explicitRoomId } = req.body;
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ success: false, message: 'Usuario de TikTok no especificado' });
  }

  // Support full URLs like https://www.tiktok.com/@ERIC_ACHU/live
  let rawTarget = username.trim();
  const urlMatch = rawTarget.match(/tiktok\.com\/@([^/?#]+)/i);
  if (urlMatch) {
    rawTarget = urlMatch[1];
  }
  const cleanTarget = rawTarget.replace(/^@/, '');
  const isNumericRoom = /^\d{15,25}$/.test(cleanTarget);

  // Cleanup existing connection
  if (activeTiktokConnection) {
    try {
      activeTiktokConnection.disconnect();
    } catch (e) {}
    activeTiktokConnection = null;
  }

  activeUsername = isNumericRoom ? `room_${cleanTarget}` : cleanTarget;
  broadcastStatus('connecting');
  console.log(`\n[TikTok] Connecting to @${cleanTarget}...`);

  try {
    const PushClass = await getWebcastClass();
    if (!PushClass) {
      throw new Error('tiktok-live-connector no está disponible en este entorno.');
    }

    const connection = new PushClass(cleanTarget, {
      processInitialData: false,
      enableExtendedGiftInfo: true,
      enableWebsocketUpgrade: true,
      requestPollingIntervalMs: 1500,
      clientParams: {},
    });

    activeTiktokConnection = connection;

    // Attach listeners with explicit terminal logging
    connection.on('chat', (data: any) => {
      const author = data.uniqueId || data.nickname || 'anonimo';
      console.log(`[TikTok] CHAT: @${author}: "${data.comment}"`);
      broadcastEvent('chat', {
        uniqueId: data.uniqueId,
        nickname: data.nickname,
        comment: data.comment,
        profilePictureUrl: data.profilePictureUrl,
        user: data.user,
      });
    });

    connection.on('gift', (data: any) => {
      const author = data.uniqueId || data.nickname || 'anonimo';
      const repeat = data.repeatCount || 1;
      const diamonds = (data.diamondCount || 0) * repeat;
      console.log(`[TikTok] GIFT: @${author} sent ${data.giftName} x${repeat} (💎 ${diamonds} diamonds)`);
      broadcastEvent('gift', {
        uniqueId: data.uniqueId,
        nickname: data.nickname,
        giftId: data.giftId,
        giftName: data.giftName,
        diamondCount: data.diamondCount,
        repeatCount: data.repeatCount,
        profilePictureUrl: data.profilePictureUrl,
        giftPictureUrl: data.giftPictureUrl,
      });
    });

    connection.on('like', (data: any) => {
      const author = data.uniqueId || data.nickname || 'anonimo';
      console.log(`[TikTok] LIKE: @${author} sent ${data.likeCount || 1} likes (Total: ${data.totalLikeCount || 'N/A'})`);
      broadcastEvent('like', {
        uniqueId: data.uniqueId,
        nickname: data.nickname,
        likeCount: data.likeCount,
        totalLikeCount: data.totalLikeCount,
        profilePictureUrl: data.profilePictureUrl,
      });
    });

    connection.on('follow', (data: any) => {
      const author = data.uniqueId || data.nickname || 'anonimo';
      console.log(`[TikTok] FOLLOW: @${author} started following`);
      broadcastEvent('follow', {
        uniqueId: data.uniqueId,
        nickname: data.nickname,
        profilePictureUrl: data.profilePictureUrl,
      });
    });

    connection.on('share', (data: any) => {
      const author = data.uniqueId || data.nickname || 'anonimo';
      console.log(`[TikTok] SHARE: @${author} shared the stream`);
      broadcastEvent('share', {
        uniqueId: data.uniqueId,
        nickname: data.nickname,
      });
    });

    connection.on('roomUser', (data: any) => {
      console.log(`[TikTok] VIEWERS: ${data.viewerCount} live viewers`);
      broadcastEvent('roomUser', {
        viewerCount: data.viewerCount,
      });
    });

    connection.on('streamEnd', () => {
      console.log(`[TikTok] Stream ended on TikTok LIVE`);
      broadcastStatus('disconnected', 'La transmisión en vivo ha finalizado en TikTok');
    });

    connection.on('disconnected', () => {
      console.log(`[TikTok] Disconnected from stream`);
      if (connectionStatus === 'connected') {
        broadcastStatus('disconnected', 'Conexión cerrada por TikTok');
      }
    });

    connection.on('error', (err: any) => {
      console.error(`[TikTok] Error: ${err?.message || err}`);
    });

    // Initiate connection (with optional direct numeric room ID)
    const targetRoomId = explicitRoomId || (isNumericRoom ? cleanTarget : undefined);
    const state = await connection.connect(targetRoomId);
    currentRoomId = state?.roomId || targetRoomId || 'live';
    broadcastStatus('connected');

    console.log(`[TikTok] Connected`);
    console.log(`[TikTok] Room ID: ${currentRoomId}\n`);

    return res.json({
      success: true,
      roomId: currentRoomId,
      username: cleanTarget,
      message: `Conectado exitosamente al directo de @${cleanTarget}`,
    });
  } catch (err: any) {
    const rawTechnicalError = err?.message || String(err);
    console.error(`[TikTok] Error: ${rawTechnicalError}\n`);

    let isOffline = false;
    let isIpBlocked = false;

    const rawMsg = rawTechnicalError.toLowerCase();
    const configErrs = (err?.config?.requestErrs || []).map((e: any) => (e?.message || '').toLowerCase()).join(' ');
    const combined = `${rawMsg} ${configErrs}`;

    if (
      combined.includes('not online') ||
      combined.includes('user_not_found') ||
      combined.includes('failed to extract the liveroom') ||
      combined.includes('failed to retrieve room id')
    ) {
      isOffline = true;
    } else if (
      combined.includes('blocked') ||
      combined.includes('captcha') ||
      combined.includes('rate limit') ||
      combined.includes('ip') ||
      combined.includes('429')
    ) {
      isIpBlocked = true;
    }

    // Pass the real technical error directly so it's not hidden
    broadcastStatus('error', rawTechnicalError);
    return res.status(200).json({
      success: false,
      technicalError: rawTechnicalError,
      message: rawTechnicalError,
      isOffline,
      isIpBlocked,
      rawError: rawTechnicalError,
      hint: isOffline
        ? `Asegúrate de que @${cleanTarget} haya iniciado su directo (LIVE) en TikTok. Si aún no ha iniciado, puedes activar el Modo Simulación para probar de inmediato.`
        : 'Para conexiones sin limitaciones de IP en la nube, ejecuta la aplicación localmente en Windows con tu IP residencial ("npm run dev").',
    });
  }
});

// 4. Disconnect from TikTok LIVE
app.post('/api/tiktok/disconnect', (req, res) => {
  if (activeTiktokConnection) {
    try {
      activeTiktokConnection.disconnect();
    } catch (e) {}
    activeTiktokConnection = null;
  }
  activeUsername = '';
  currentRoomId = null;
  broadcastStatus('disconnected');
  res.json({ success: true, message: 'Desconectado' });
});

// 5. Keepalive ping every 15s to maintain SSE connection
setInterval(() => {
  if (sseClients.length > 0) {
    broadcastSSE({ type: 'ping', timestamp: Date.now() });
  }
}, 15000);

async function startServer() {
  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TikTok LIVE Overlay Server running on port ${PORT}`);
  });
}

startServer();
