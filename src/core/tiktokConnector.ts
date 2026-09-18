/**
 * TikTokConnector - Cliente Frontend para conexión Real y Simulación
 * 
 * NOTA ARQUITECTÓNICA:
 * La conexión real se realiza a través de 'tiktok-live-connector' en el backend Node.js.
 * Esta es una librería comunitaria NO OFICIAL basada en ingeniería inversa del protocolo
 * Webcast de TikTok. No utiliza endpoints oficiales de TikTok ni requiere credenciales privadas.
 */

import { NormalizedLiveEvent, ConnectionStatus, ConnectionMode } from '../types/tiktok';
import { EventProcessor } from './eventProcessor';
import { SimulationEngine, MockGiftPreset } from './simulationEngine';

export type StatusListener = (status: ConnectionStatus) => void;

export class TikTokConnector {
  private eventProcessor: EventProcessor;
  private simulationEngine: SimulationEngine;
  private status: ConnectionStatus = {
    state: 'disconnected',
    mode: 'simulation',
    username: '',
  };
  private statusListeners: Set<StatusListener> = new Set();
  private eventSource: EventSource | null = null;

  constructor(eventProcessor: EventProcessor) {
    this.eventProcessor = eventProcessor;
    this.simulationEngine = new SimulationEngine((event) => {
      this.eventProcessor.processEvent(event);
    });
  }

  public getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  public getSimulationEngine(): SimulationEngine {
    return this.simulationEngine;
  }

  public onStatusChange(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener({ ...this.status });
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private updateStatus(patch: Partial<ConnectionStatus>) {
    this.status = { ...this.status, ...patch };
    this.statusListeners.forEach((listener) => {
      try {
        listener({ ...this.status });
      } catch (err) {
        console.error('Error in status listener:', err);
      }
    });
  }

  /**
   * Conectar en Modo Simulación
   */
  public connectSimulation(simulatedUsername: string = 'mi_stream_simulado') {
    this.disconnect();
    this.updateStatus({
      state: 'connected',
      mode: 'simulation',
      username: simulatedUsername,
      connectedAt: Date.now(),
      errorMessage: undefined,
    });
    this.simulationEngine.start(2000);
  }

  /**
   * Conectar a un stream real de TikTok LIVE vía backend SSE
   */
  public async connectReal(username: string): Promise<boolean> {
    const cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanUsername) {
      this.updateStatus({
        state: 'error',
        errorMessage: 'Debes proporcionar un nombre de usuario de TikTok válido.',
      });
      return false;
    }

    this.disconnect();
    this.updateStatus({
      state: 'connecting',
      mode: 'real',
      username: cleanUsername,
      errorMessage: undefined,
    });

    try {
      // 1. Iniciar conexión en el backend
      const res = await fetch('/api/tiktok/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.technicalError || data.rawError || data.message || 'No se pudo conectar con el directo de TikTok');
      }

      // 2. Establecer Server-Sent Events (SSE)
      this.setupEventSource(cleanUsername, data.roomId);
      return true;
    } catch (err: any) {
      console.error('Error al conectar con TikTok LIVE:', err);
      this.updateStatus({
        state: 'error',
        errorMessage: err.message || 'Error de conexión a TikTok LIVE',
      });
      return false;
    }
  }

  private setupEventSource(username: string, roomId?: string) {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.eventSource = new EventSource('/api/tiktok/stream');

    this.eventSource.onopen = () => {
      this.updateStatus({
        state: 'connected',
        mode: 'real',
        username,
        roomId,
        connectedAt: Date.now(),
        errorMessage: undefined,
      });
    };

    this.eventSource.onmessage = (messageEvent) => {
      try {
        const payload = JSON.parse(messageEvent.data);
        if (payload.type === 'ping') return;

        if (payload.type === 'status') {
          if (payload.state) {
            this.updateStatus({
              state: payload.state,
              errorMessage: payload.errorMessage,
              roomId: payload.roomId || this.status.roomId,
            });
          }
          return;
        }

        // El payload viene normalizado desde el backend o como evento raw
        if (payload.id && payload.type && payload.user) {
          const event = payload as NormalizedLiveEvent;
          if (!event.source) event.source = 'real';
          this.eventProcessor.processEvent(event);
        } else if (payload.rawType && payload.rawData) {
          const source = payload.source || 'real';
          const normalized = this.eventProcessor.normalizeRawEvent(payload.rawType, payload.rawData, source);
          if (normalized) {
            this.eventProcessor.processEvent(normalized);
          }
        }
      } catch (err) {
        console.error('Error al parsear evento SSE:', err);
      }
    };

    this.eventSource.onerror = () => {
      // Si la conexión SSE se interrumpe
      if (this.status.state === 'connected') {
        this.updateStatus({
          state: 'error',
          errorMessage: 'Conexión perdida con el servidor de eventos.',
        });
      }
    };
  }

  /**
   * Desconectar conexión activa (real o simulada)
   */
  public disconnect() {
    this.simulationEngine.stop();

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Notificar al backend si estaba en modo real
    if (this.status.mode === 'real' && this.status.state !== 'disconnected') {
      fetch('/api/tiktok/disconnect', { method: 'POST' }).catch(() => {});
    }

    this.updateStatus({
      state: 'disconnected',
      errorMessage: undefined,
    });
  }

  /**
   * Atajos para disparadores manuales de simulación
   */
  public triggerManualLike(count: number = 10) {
    this.simulationEngine.triggerLike(undefined, count);
  }

  public triggerManualComment(customText?: string) {
    this.simulationEngine.triggerComment(undefined, customText);
  }

  public triggerManualGift(giftPreset?: MockGiftPreset, repeats: number = 1) {
    this.simulationEngine.triggerGift(undefined, giftPreset, repeats);
  }

  public triggerManualFollow() {
    this.simulationEngine.triggerFollow();
  }

  public triggerManualViewers(delta: number = 50) {
    const current = this.eventProcessor.getStats().currentViewers || 100;
    this.simulationEngine.triggerViewerCount(Math.max(1, current + delta));
  }
}
