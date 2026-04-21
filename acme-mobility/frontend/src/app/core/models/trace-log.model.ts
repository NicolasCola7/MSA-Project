export type LogLevel = 'info' | 'ok' | 'warn' | 'error';

export interface TraceLog {
  id: string;
  time: string;
  message: string;
  level: LogLevel;
}

export function createLog(message: string, level: LogLevel = 'info'): TraceLog {
  return {
    id: crypto.randomUUID(),
    time: new Date().toLocaleTimeString('it-IT'),
    message,
    level,
  };
}
