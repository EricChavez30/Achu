# 🚀 Guía Definitiva Paso a Paso: TikTok LIVE Overlay & Game Engine

Esta guía está redactada en estricto orden cronológico para cualquier persona que abra el proyecto por primera vez en su ordenador y quiera poner a funcionar el servidor, el overlay y la transmisión en **OBS Studio** y **TikTok LIVE Studio**.

---

## 📋 Índice Cronológico

1. [Paso 1: Requisitos Previos (Antes de empezar)](#paso-1-requisitos-previos)
2. [Paso 2: Instalación de Dependencias](#paso-2-instalación-de-dependencias)
3. [Paso 3: Ejecución del Servidor Local](#paso-3-ejecución-del-servidor-local)
4. [Paso 4: Direcciones URL y Acceso en el Navegador](#paso-4-direcciones-url-y-acceso-en-el-navegador)
5. [Paso 5: Configuración Paso a Paso en OBS Studio](#paso-5-configuración-paso-a-paso-en-obs-studio)
6. [Paso 6: Vinculación con TikTok LIVE Studio (Cámara Virtual)](#paso-6-vinculación-con-tiktok-live-studio)
7. [Paso 7: Conexión al Directo Real y Pruebas](#paso-7-conexión-al-directo-real-y-pruebas)
8. [Solución de Problemas Frecuentes (FAQ)](#solución-de-problemas-frecuentes-faq)

---

## 🛠️ Paso 1: Requisitos Previos

Antes de ejecutar los comandos, asegúrate de tener instalado en tu computadora:

1. **Node.js (Versión 18, 20 o 22 recomendada)**:
   - Descárgalo gratis desde [https://nodejs.org](https://nodejs.org) (Versión LTS).
   - Durante la instalación, marca la opción por defecto para que agregue Node a tu `PATH`.
2. **OBS Studio**:
   - Descárgalo desde [https://obsproject.com](https://obsproject.com).
3. **TikTok LIVE Studio** (o tu cuenta de TikTok con acceso a directos en PC).

---

## 📦 Paso 2: Instalación de Dependencias

Abre una ventana de consola (`PowerShell` o `Símbolo del sistema / CMD`) dentro de la carpeta del proyecto.

> 💡 **Truco rápido en Windows:** Entra en la carpeta del proyecto, haz clic en la barra de direcciones superior de la carpeta, escribe `cmd` y presiona **Enter**.

Ejecuta el siguiente comando para descargar e instalar todas las librerías:

```bash
npm install
```

*(Este paso se realiza una sola vez. Tardará entre 10 y 30 segundos).*

---

## ⚡ Paso 3: Ejecución del Servidor Local

Una vez finalizada la instalación, ejecuta el servidor con el siguiente comando:

```bash
npm run dev
```

Verás un mensaje en la consola que indica:
```text
Servidor TikTok LIVE Webcast corriendo en http://localhost:3000
```

> ⚠️ **IMPORTANTE:** Mantén esta ventana de consola **abierta** mientras estés usando la aplicación o transmitiendo. Si cierras la consola, el servidor se apagará.

*(En Windows también puedes simplemente hacer doble clic en el archivo `iniciar-en-windows.bat` y este ejecutará la instalación y el arranque automáticamente).*

---

## 🌐 Paso 4: Direcciones URL y Acceso en el Navegador

Abre tu navegador (Google Chrome, Microsoft Edge o Brave) y utiliza las siguientes direcciones según lo que necesites:

| Propósito | Dirección URL | Descripción |
| :--- | :--- | :--- |
| **Panel de Control Completo** | `http://localhost:3000/` | Panel interactivo donde colocas tu `@usuario` de TikTok, ves los logs, activas simulaciones y controlas el juego. |
| **Overlay Limpio (Vertical 9:16)** | `http://localhost:3000/?clean=1&layout=vertical&bg=mystic` | **Esta es la URL principal para OBS**. Carga únicamente la pantalla vertical con el fondo místico y las tarjetas nítidas sin botones del panel. |
| **Overlay Fondo Transparente** | `http://localhost:3000/?clean=1&layout=vertical&bg=transparent` | Ideal si quieres poner el juego o tu cámara real detrás del overlay en OBS. |
| **Overlay Horizontal (16:9)** | `http://localhost:3000/?clean=1&layout=horizontal&bg=mystic` | Versión para pantallas panorámicas 1920×1080. |

---

## 🎬 Paso 5: Configuración Paso a Paso en OBS Studio

Para que el overlay se vea a resolución completa (1080×1920) y con la máxima nitidez:

1. **Abre OBS Studio**.
2. **Configura el lienzo en formato vertical**:
   - Ve a **Ajustes** (esquina inferior derecha) > **Video**.
   - **Resolución de la base (Lienzo):** Escribe `1080x1920`.
   - **Resolución de salida (Escalada):** Escribe `1080x1920`.
   - Haz clic en **Aceptar**.
3. **Añade la fuente del Overlay**:
   - En el panel inferior **Fuentes**, haz clic en el botón `+` y selecciona **Navegador (Browser Source)**.
   - Nómbralo como quieras (ejemplo: `Overlay TikTok`).
   - En la ventana que aparece, configura exactamente esto:
     - **URL:** `http://localhost:3000/?clean=1&layout=vertical&bg=mystic`
     - **Ancho (Width):** `1080`
     - **Alto (Height):** `1920`
     - **Controlar audio vía OBS:** Desmarcado (opcional).
   - Haz clic en **Aceptar**.
4. **Ajuste automático**:
   - Haz clic derecho sobre el recuadro rojo en el lienzo de OBS > **Transformar** > **Ajustar a la pantalla** (o presiona `Ctrl + F`).
5. **Silenciar audio en OBS (Recomendado)**:
   - En el panel **Mezclador de audio** de OBS, silencia *"Audio del escritorio"* y *"Mic/Aux"* para evitar que el sonido se duplique al pasar a TikTok Studio.

---

## 📡 Paso 6: Vinculación con TikTok LIVE Studio

Para pasar la imagen perfecta de OBS a TikTok Studio sin lidiar con enlaces bloqueados:

1. **En OBS Studio**:
   - En el panel de **Controles** (abajo a la derecha), haz clic en **"Iniciar Cámara Virtual"** (Start Virtual Camera).
2. **En TikTok LIVE Studio**:
   - Ve a tu escena vertical.
   - Haz clic en **Añadir fuente (`+`)** > **Cámara**.
   - En los ajustes de la cámara:
     - **Cámara:** Selecciona **OBS Virtual Camera**.
     - **Resolución:** Selecciona **1080×1920** (o 1080p).
     - **Pestaña "Fondo":** Asegúrate de que el fondo virtual esté en **"Ninguno"** (desactivado).
     - **Pestaña "Aspecto / General":** Si las letras salen espejadas, pulsa el botón **"Girar / Despejar"** para que el texto se lea al derecho.
   - Haz clic en **Aplicar**.

¡Listo! El overlay de OBS aparecerá en TikTok Studio a pantalla completa, con los bordes de neón cian/dorados y nitidez total.

---

## 🎮 Paso 7: Conexión al Directo Real y Pruebas

1. Abre en tu navegador el **Panel de Control**: `http://localhost:3000/`.
2. En la barra superior, escribe tu nombre de usuario de TikTok (ejemplo: `@mi_usuario`) y haz clic en **"Conectar"**.
3. **Comandos en vivo que tu audiencia puede usar**:
   - `!slot`: Reclama automáticamente una de las 100 casillas del mundo y muestra su foto de perfil en vivo.
   - `!nivel`: Muestra el nivel actual del mundo y la energía acumulada.
   - `!meta`: Informa el porcentaje restante para cumplir el objetivo de Likes/Regalos.
4. **Eventos automáticos**:
   - Cada **Like** suma puntos de experiencia (XP) y llena la barra de energía.
   - Cada **Regalo (Gift)** activa animaciones especiales y añade tiempo de *Fiebre x2 XP*.
   - Los **Nuevos Seguidores (Follows)** y comentarios se registran en tiempo real.

---

## ❓ Solución de Problemas Frecuentes (FAQ)

### 1. ¿Por qué TikTok LIVE Studio me pide iniciar sesión de Google al poner un enlace?
TikTok LIVE Studio bloquea direcciones locales `localhost` y los enlaces web de desarrollo tienen protección de cuenta. Por este motivo, el método oficial y estándar utilizado por los streamers es **Cámara Virtual de OBS** (Paso 6).

### 2. ¿Cómo pruebo las animaciones y alertas si todavía no estoy en directo?
En el **Panel de Control** (`http://localhost:3000/`), en la pestaña **"Simulador de Eventos"**, haz clic en:
- `+100 Likes`
- `Simular Regalo (Rosa / Corazón)`
- `Simular Follow`
- `Llenar Casillas Automático`

Verás cómo el overlay en OBS y TikTok Studio reacciona inmediatamente en tiempo real.

### 3. ¿Cómo reinicio las estadísticas de la partida o del día?
En el Panel de Control, ve a la pestaña **"OBS & Integración"** y presiona el botón **"Reiniciar Estadísticas y Contadores"** para volver el mundo a Nivel 1 y vaciar los 100 slots.
