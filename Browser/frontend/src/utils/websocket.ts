version https://git-lfs.github.com/spec/v1
oid sha256:09381b2eed73943c75f12ab43bbe68d579ad1a5c0e3a1d24f1f3702b036f3b86
size 2461

import { EventEmitter } from 'events';

type MessageHandler = (data: any) => void;
type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private connectionState: ConnectionState = 'disconnected';
  private pingInterval: NodeJS.Timeout | null = null;
  private pongTimeout: NodeJS.Timeout | null = null;
  private messageQueue: { type: string; data: any }[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private batchSize = 10;
  private batchDelay = 16; // 約1フレーム

  constructor(url: string) {
    super();
    this.url = url;
  }

  get state(): ConnectionState {
    return this.connectionState;
  }

  connect() {
    if (this.connectionState === 'connecting' || this.connectionState === 'connected') {
      return;
    }

    this.connectionState = 'connecting';
    this.emit('stateChange', this.connectionState);

    try {
      this.ws = new WebSocket(this.url);
      this.ws.binaryType = 'arraybuffer'; // バイナリデータの高速化

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.handleError(error);
    }
  }

  private handleOpen() {
    this.connectionState = 'connected';
    this.emit('stateChange', this.connectionState);
    this.reconnectAttempts = 0;
    this.startPingPong();
    this.flushMessageQueue();
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      if (data.type === 'PONG') {
        this.handlePong();
      } else {
        this.dispatchMessage(data);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleClose() {
    this.cleanup();
    this.handleDisconnect();
  }

  private handleError(error: any) {
    console.error('WebSocket error:', error);
    this.connectionState = 'error';
    this.emit('stateChange', this.connectionState);
    this.handleDisconnect();
  }

  private cleanup() {
    this.stopPingPong();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }

  private handleDisconnect() {
    this.cleanup();
    this.connectionState = 'disconnected';
    this.emit('stateChange', this.connectionState);
    this.reconnect();
  }

  private startPingPong() {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
        this.pongTimeout = setTimeout(() => {
          console.warn('Pong timeout, reconnecting...');
          this.ws?.close();
        }, 5000);
      }
    }, 30000);
  }

  private stopPingPong() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  private handlePong() {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const timeout = this.reconnectTimeout * Math.pow(2, this.reconnectAttempts - 1);
    setTimeout(() => this.connect(), timeout);
  }

  subscribe(type: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)?.add(handler);
  }

  unsubscribe(type: string, handler: MessageHandler) {
    this.messageHandlers.get(type)?.delete(handler);
  }

  private dispatchMessage(data: any) {
    const { type, ...payload } = data;
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    }
  }

  private flushMessageQueue() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const messages = this.messageQueue.splice(0, this.batchSize);
      if (messages.length > 0) {
        const batch = JSON.stringify(messages);
        this.ws.send(batch);
      }
    }
    
    if (this.messageQueue.length > 0) {
      this.scheduleBatch();
    }
  }

  private scheduleBatch() {
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.batchTimeout = null;
        this.flushMessageQueue();
      }, this.batchDelay);
    }
  }

  send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.messageQueue.push({ type, ...data });
      this.scheduleBatch();
    } else {
      console.warn('WebSocket is not connected');
      throw new Error('WebSocket is not connected');
    }
  }

  close() {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connectionState = 'disconnected';
    this.emit('stateChange', this.connectionState);
  }
}

export const webSocket = new WebSocketClient('ws://localhost:3000/ws');
