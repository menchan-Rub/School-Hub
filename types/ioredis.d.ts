declare module 'ioredis' {
  export default class Redis {
    constructor(options?: {
      port?: number;
      host?: string;
      password?: string;
      db?: number;
    });
    
    connect(): Promise<void>;
    disconnect(): void;
    
    get(key: string): Promise<string | null>;
    set(key: string, value: string | number, mode?: string, duration?: number): Promise<'OK'>;
    del(key: string | string[]): Promise<number>;
    
    // 他の必要なメソッドを追加
  }
} 