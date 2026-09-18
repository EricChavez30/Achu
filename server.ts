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

// Dynamically load TikTokLiveConnection and configure routes to bypass EulerStream paid API requirement
let TikTokLiveClass: any = null;
async function getWebcastClass() {
  if (!TikTokLiveClass) {
    try {
      // @ts-ignore
      const rootMod = await import('tiktok-live-connector');
      TikTokLiveClass = rootMod.TikTokLiveConnection;

      // Disable Euler stream route fallback which requires paid API key and throws 403
      if (rootMod.RoomIdRouteConfig) {
        rootMod.RoomIdRouteConfig.skipFetchRoomIdFromEulerRoute = true;
      }
      if (rootMod.RouteConfig) {
        // Return clean unsigned URL directly so TikTok doesn't redirect to paid EulerStream service
        rootMod.RouteConfig.fetchWebcastSignatureFromProvider = async ({ url, userAgent }: any) => {
          return { response: { signedUrl: url, userAgent } };
        };
      }
    } catch (err) {
      console.error('Error importing tiktok-live-connector:', err);
    }
  }
  return TikTokLiveClass;
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

    // Attach listeners with explicit terminal logging & robust data extraction
    connection.on('chat', (data: any) => {
      const author = data.uniqueId || data.user?.displayId || data.user?.uniqueId || data.user?.nickname || data.nickname || 'anonimo';
      const comment = data.comment || data.content || '';
      const pfp = data.profilePictureUrl || data.user?.avatarThumb?.urlList?.[0] || data.user?.avatarMedium?.urlList?.[0] || '';
      console.log(`[TikTok] CHAT: @${author}: "${comment}"`);
      broadcastEvent('chat', {
        uniqueId: author,
        nickname: data.nickname || data.user?.nickname || author,
        comment: comment,
        profilePictureUrl: pfp,
        user: data.user,
      });
    });

    connection.on('gift', (data: any) => {
      const author = data.uniqueId || data.user?.displayId || data.user?.uniqueId || data.user?.nickname || data.nickname || 'anonimo';
      const giftName = data.giftName || data.giftDetails?.giftName || data.gift?.name || 'Regalo';
      const repeat = Number(data.repeatCount || data.repeatEnd || 1);
      const diamonds = Number(data.diamondCount || data.gift?.diamondCount || 0) * repeat;
      const pfp = data.profilePictureUrl || data.user?.avatarThumb?.urlList?.[0] || '';
      const giftImg = data.giftPictureUrl || data.gift?.image?.urlList?.[0] || '';
      console.log(`[TikTok] GIFT: @${author} sent ${giftName} x${repeat} (💎 ${diamonds} diamonds)`);
      broadcastEvent('gift', {
        uniqueId: author,
        nickname: data.nickname || data.user?.nickname || author,
        giftId: data.giftId || data.gift?.id,
        giftName: giftName,
        diamondCount: data.diamondCount || data.gift?.diamondCount || 0,
        repeatCount: repeat,
        profilePictureUrl: pfp,
        giftPictureUrl: giftImg,
      });
    });

    // Keep track of like debouncing and viewer updates
    let lastViewerCount = 0;
    let lastViewerBroadcastTime = 0;
    // Debounce per user: wait 5.0 seconds after the user's latest like to combine all their rapid likes into a single alert
    const userLikeBuffer = new Map<string, { timer: NodeJS.Timeout; count: number; total: any; nickname: string; pfp: string }>();

    connection.on('like', (data: any) => {
      const author = data.uniqueId || data.user?.displayId || data.user?.uniqueId || data.user?.nickname || data.nickname || 'anonimo';
      const likeCount = Number(data.likeCount || data.count || 1);
      const totalLikes = data.totalLikeCount || data.total || 'N/A';
      const pfp = data.profilePictureUrl || data.user?.avatarThumb?.urlList?.[0] || '';
      const nickname = data.nickname || data.user?.nickname || author;

      // Group rapid likes from the same user within 5 seconds into a single combined event
      const existing = userLikeBuffer.get(author);
      if (existing) {
        clearTimeout(existing.timer);
        existing.count += likeCount;
        existing.total = totalLikes;
        existing.timer = setTimeout(() => {
          userLikeBuffer.delete(author);
          console.log(`[TikTok] LIKE BATCH: @${author} sent total ${existing.count} likes`);
          broadcastEvent('like', {
            uniqueId: author,
            nickname: existing.nickname,
            likeCount: existing.count,
            totalLikeCount: existing.total,
            profilePictureUrl: existing.pfp,
          });
        }, 5000);
      } else {
        const timer = setTimeout(() => {
          userLikeBuffer.delete(author);
          console.log(`[TikTok] LIKE: @${author} sent ${likeCount} likes (Total: ${totalLikes})`);
          broadcastEvent('like', {
            uniqueId: author,
            nickname: nickname,
            likeCount: likeCount,
            totalLikeCount: totalLikes,
            profilePictureUrl: pfp,
          });
        }, 5000);

        userLikeBuffer.set(author, {
          timer,
          count: likeCount,
          total: totalLikes,
          nickname,
          pfp,
        });
      }
    });

    connection.on('follow', (data: any) => {
      const author = data.uniqueId || data.user?.displayId || data.user?.uniqueId || data.user?.nickname || data.nickname || 'anonimo';
      console.log(`[TikTok] FOLLOW: @${author} started following`);
      broadcastEvent('follow', {
        uniqueId: author,
        nickname: data.nickname || data.user?.nickname || author,
        profilePictureUrl: data.profilePictureUrl || data.user?.avatarThumb?.urlList?.[0] || '',
      });
    });

    connection.on('share', (data: any) => {
      const author = data.uniqueId || data.user?.displayId || data.user?.uniqueId || data.user?.nickname || data.nickname || 'anonimo';
      console.log(`[TikTok] SHARE: @${author} shared the stream`);
      broadcastEvent('share', {
        uniqueId: author,
        nickname: data.nickname || data.user?.nickname || author,
      });
    });

    connection.on('roomUser', (data: any) => {
      // In TikTok LIVE protobuf:
      // 'viewerCount' or 'total' represents the current concurrent real-time viewers watching.
      // 'totalUser' is cumulative unique visits since stream began (much larger number).
      const viewers = Number(
        (data.viewerCount !== undefined && data.viewerCount !== null)
          ? data.viewerCount
          : (data.total !== undefined && data.total !== null)
            ? data.total
            : (data.totalUser || 0)
      );

      const now = Date.now();
      // Throttle viewer updates: only broadcast if count actually changed and at least 5s elapsed
      if (viewers >= 0 && (viewers !== lastViewerCount || now - lastViewerBroadcastTime > 8000)) {
        lastViewerCount = viewers;
        lastViewerBroadcastTime = now;
        console.log(`[TikTok] VIEWERS: ${viewers} live viewers (raw total=${data.total}, totalUser=${data.totalUser})`);
        broadcastEvent('roomUser', {
          viewerCount: viewers,
        });
      }
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
      const errMsg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      console.error(`[TikTok] Error: ${errMsg}`);
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

    const friendlyErrorMessage = isOffline
      ? `@${cleanTarget} no se encuentra transmitiendo en vivo en este momento (Offline), o la cuenta no tiene un directo activo.`
      : isIpBlocked
        ? `TikTok bloqueó la solicitud desde los servidores en la nube. Ejecuta la aplicación en tu PC local (iniciar-en-windows.bat) con tu IP residencial.`
        : rawTechnicalError;

    // Pass friendly message for UI and keep technical details
    broadcastStatus('error', friendlyErrorMessage);
    return res.status(200).json({
      success: false,
      technicalError: rawTechnicalError,
      message: friendlyErrorMessage,
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
