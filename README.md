# TikTok LIVE Event Listener & Overlay Prototype

Prototipo experimental para la recepción y visualización de eventos en tiempo real desde **TikTok LIVE** mediante un conector de eventos, orientado a ejecución local en **Windows** y visualización 9:16 en **OBS Studio**.

> ⚠️ **AVISO LEGAL Y ARQUITECTÓNICO IMPORTANTE:**  
> Este prototipo utiliza la librería comunitaria de código abierto **`tiktok-live-connector`**, la cual se basa en **ingeniería inversa (reverse engineering)** del protocolo interno Webcast de TikTok.  
> - **NO** utiliza APIs oficiales ni propietarias de TikTok (TikTok for Developers no ofrece actualmente una API pública gratuita para leer eventos de directos de terceros).
> - **NO** requiere contraseñas, tokens de desarrollador, cookies privadas ni credenciales para conectarse a directos públicos.
> - Solo se necesita el nombre de usuario público del streamer (ej: `@ERIC_ACHU`).

---

## Flujo Completo del Sistema

```
TikTok LIVE (Webcast Protobuf)
       ↓
tiktok-live-connector (WebSockets)
       ↓
Backend Node.js (Express en server.ts)
       ↓
Event Processor (Normalización de Eventos)
       ↓
SSE (Server-Sent Events: /api/tiktok/stream)
       ↓
Frontend React 19 + TypeScript (Vite)
       ↓
Event Debugger (50 eventos) / Overlay Vertical 9:16 para OBS
```

---

## Requisitos de Sistema

- **Sistema Operativo:** Windows 10 / 11 (o macOS / Linux)
- **Node.js:** Versión LTS recomendada: **Node.js v20.x o v22.x** (Mínimo Node.js 18.0.0+)
- **Navegador:** Chrome, Edge, Firefox, Brave
- **Software de Streaming (Opcional):** OBS Studio (para captura Browser Source)

---

## Estructura Completa del Proyecto

```
tiktok-live-overlay-prototype/
│
├── server.ts                     # Backend Node.js (Express + tiktok-live-connector + SSE + Vite)
├── package.json                  # Dependencias y scripts npm (dev, build, start, lint)
├── iniciar-en-windows.bat        # Script de 1 solo clic para Windows (npm install && npm run dev)
├── vite.config.ts                # Configuración de compilación Vite
├── tsconfig.json                 # Configuración del compilador TypeScript
├── index.html                    # Entry point HTML para navegador y OBS
├── README.md                     # Esta documentación técnica completa
│
├── src/
│   ├── main.tsx                  # Punto de entrada de React 19
│   ├── App.tsx                   # Componente principal con tabs y visualizador
│   ├── index.css                 # Estilos globales con Tailwind CSS v4
│   │
│   ├── types/
│   │   └── tiktok.ts             # Tipos TypeScript: NormalizedLiveEvent, LikeEventData, etc.
│   │
│   ├── core/
│   │   ├── tiktokConnector.ts    # Controlador de conexión Frontend (Real vía SSE y Simulación)
│   │   ├── eventProcessor.ts     # Normalizador de eventos, contadores acumulativos e historial
│   │   ├── simulationEngine.ts   # Generador de eventos sintéticos para pruebas sin conexión
│   │   └── gameStateStub.ts      # Stub desacoplado para futura lógica de juego
│   │
│   └── components/
│       ├── ControlPanel.tsx      # Barra de controles, conexión @username, auto-reintento
│       ├── EventDebugger.tsx     # Depurador de los últimos 50 eventos (badge REAL vs SIMULACIÓN)
│       ├── VerticalOverlay.tsx   # Canvas 9:16 para OBS con contadores, regalos y chat en vivo
│       └── ArchitectureModal.tsx # Modal con diagrama de arquitectura técnica
```

---

## Cómo Ejecutar en Windows

### Método A (El más fácil: 1 Clic):
1. Haz doble clic en el archivo **`iniciar-en-windows.bat`**.
2. El script verificará Node.js, instalará dependencias si es la primera vez y arrancará el servidor en `http://localhost:3000`.

### Método B (Línea de comandos):
Abre una terminal (`cmd` o `PowerShell`) en la carpeta del proyecto y ejecuta:

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar el servidor local
npm run dev
```

Ambos comandos inician el servidor full-stack en un solo proceso con recarga automática.

---

## URL Local para Abrir

Una vez iniciado el servidor, abre en tu navegador:
```
http://localhost:3000
```

Para agregarlo a **OBS Studio**:
1. Agrega una fuente tipo **Navegador (Browser Source)**.
2. URL: `http://localhost:3000?clean=1&bg=transparent`
3. Ancho: `1080`
4. Alto: `1920`

---

## Cómo Conectar a la Cuenta de Prueba: @ERIC_ACHU

1. En el campo de texto de la barra superior verás preconfigurado:
   ```
   ERIC_ACHU
   ```
   *(También puedes escribir `@ERIC_ACHU` o pegar la URL completa del directo: `https://www.tiktok.com/@ERIC_ACHU/live`)*.
2. Haz clic en el botón verde **"Conectar a TikTok LIVE"**.
3. El estado cambiará a **CONECTANDO A TIKTOK...**.
4. Si el streamer está en directo, pasará a **CONECTADO (TIKTOK LIVE)** y mostrará el `Room ID` numérico real.

---

## Logs en la Terminal de Node.js

Durante la ejecución verás logs claros y descriptivos en la consola:

```text
[TikTok] Connecting to @ERIC_ACHU...
[TikTok] Connected
[TikTok] Room ID: 7412345678901234567

[TikTok] CHAT: @juan_perez: "¡Hola Eric buena partida!"
[TikTok] LIKE: @maria23 sent 15 likes (Total: 450)
[TikTok] GIFT: @carlos_pro sent Rosa x5 (💎 5 diamonds)
[TikTok] FOLLOW: @nuevo_seguidor started following
[TikTok] VIEWERS: 142 live viewers
```

---

## Cómo Distinguir Eventos REALES vs SIMULACIÓN

En el **Event Debugger**:
- Los eventos de un stream real llevan una insignia roja: **`TIKTOK LIVE REAL`** (con pulso activo).
- Los eventos simulados llevan una insignia ámbar: **`SIMULACIÓN`**.
- Puedes filtrar la lista seleccionando **"TikTok Real"** o **"Simulación"** en la barra de filtros.

---

## Qué Hacer si Aparece un Error

1. **"Failed to retrieve Room ID from all sources" / El streamer no está online:**
   - Significa que `@ERIC_ACHU` **no ha iniciado sesión de transmisión en directo en TikTok en este momento**.
   - TikTok no genera sockets ni eventos para canales fuera de línea.
   - **Solución:** Haz clic en **"Simular En Vivo con @ERIC_ACHU"** para probar la interfaz y el Event Debugger inmediatamente, o activa el interruptor **"Auto-reintentar"** para que se conecte solo en cuanto empiece a emitir.

2. **Bloqueo de IP (429 / Captcha):**
   - Ocurre comúnmente en plataformas cloud (como Google Cloud Run) debido a las defensas de TikTok contra centros de datos.
   - **Solución:** Ejecuta la aplicación localmente en tu computadora con Windows usando tu conexión a internet de casa mediante `iniciar-en-windows.bat`.

3. **Node.js no reconocido:**
   - Instala Node.js v20 LTS o v22 LTS desde [nodejs.org](https://nodejs.org).

---

## Comandos de Chat Disponibles para los Espectadores

El Game Engine detecta automáticamente cuando un espectador escribe un comando en el chat del directo de TikTok (o en el simulador) y genera una respuesta inmediata en el overlay:

| Comando | Aliases alternativos | Descripción y Efecto |
| :--- | :--- | :--- |
| `!slot` | `!slots`, `!lugar` | Muestra el número de slot oficial del usuario si ya es **MEMBER** (ej: `#12`), o indica cuántos XP le faltan para desbloquear su slot. |
| `!nivel` | `!level`, `!rank`, `!xp` | Muestra el nivel actual del espectador, su XP acumulado y su total de interacciones registradas. |
| `!meta` | `!mision`, `!goal` | Muestra el progreso de la misión comunitaria activa (ej: Likes alcanzados) y el tiempo restante o recompensa de la Fiebre XP. |
| `!top` | `!ranking`, `!mejores` | Lista a los miembros con mayor nivel o mayor cantidad de XP en la comunidad. |
| `!comandos` | `!help`, `!ayuda` | Despliega la lista rápida de comandos disponibles en el directo. |

---

## Sistema de Moderación y Filtro de Seguridad Automático

Para garantizar una comunidad limpia y libre de toxicidad, el sistema cuenta con un motor de moderación multicapa (`/src/core/moderation.ts`):

1. **Normalización y Detección de Evasión (Anti-Leetspeak):**
   - Transforma caracteres que buscan burlar filtros (ej: `4` → `a`, `0` → `o`, `3` → `e`, `1` → `i`, `$`, `@`, etc.).
   - Remueve símbolos interpuestos y espacios artificiales antes de verificar coincidencias.

2. **Categorías Bloqueadas:**
   - **Términos de Odio y Racismo:** Bloqueo fulminante.
   - **Contenido Sexual / Acoso:** Prohibido en nombres y mensajes.
   - **Violencia e Insultos Graves:** Rechazo inmediato.

3. **Acciones del Motor:**
   - **Nombres inapropiados:** El usuario no ingresa a la comunidad (`FLAGGED_BLOCKED`), se le deniega ganar XP y no se le asigna ninguna de las 100 slots.
   - **Comentarios ofensivos:** El comentario es ignorado en el Game Engine (no otorga XP ni ejecuta comandos) y queda registrado en el **Registro de Auditoría**.
   - **Aprobación Previa (Opcional):** El streamer puede activar el interruptor `Aprobación previa: ON` en el panel de control para autorizar manualmente a los usuarios antes de que ocupen un slot de Member.
   - **Botón de Expulsión/Liberación:** En el panel se puede expulsar a cualquier usuario con un clic, liberando inmediatamente su slot para otro espectador.

---

## Modo Fiebre (Fever Mode x2 XP)

- **Activación Automática:** Se activa por 5 minutos (300 segundos) de forma 100% automática en el momento exacto en que la comunidad alcanza la meta del directo (ej: 2,500 likes o la meta de comentarios).
- **Activación Manual:** El streamer también cuenta con un botón en el panel de control (`Activar Fiebre x2`) para iniciar o detener la Fiebre en cualquier momento que desee premiar a la audiencia.
- **Alertas Flotantes Automáticas:** El Game Engine dispara alertas visuales que se muestran por sí solas en pantalla cuando un usuario sube de nivel, cuando desbloquea una slot de Member, o cuando se activa la Fiebre.

