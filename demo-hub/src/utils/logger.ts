class Logger {
  private isDevelopment = import.meta.env.DEV;
  private isDebugEnabled = this.isDevelopment && (typeof window !== 'undefined' && window.localStorage?.getItem('debug-enabled') === 'true');

  info(message: string, ...args: any[]) {
    if (this.isDevelopment) console.log(`[INFO] ${message}`, ...args);
  }

  warn(message: string, ...args: any[]) {
    if (this.isDevelopment) console.warn(`[WARN] ${message}`, ...args);
  }

  error(message: string, ...args: any[]) {
    console.error(`[ERROR] ${message}`, ...args);
  }

  debug(message: string, ...args: any[]) {
    if (this.isDebugEnabled) console.log(`[DEBUG] ${message}`, ...args);
  }

  webrtc(message: string, ...args: any[]) {
    if (this.isDebugEnabled) console.log(`[WebRTC] ${message}`, ...args);
  }

  sip(message: string, ...args: any[]) {
    if (this.isDebugEnabled) console.log(`[SIP] ${message}`, ...args);
  }

  widget(message: string, ...args: any[]) {
    if (this.isDebugEnabled) console.log(`[Widget] ${message}`, ...args);
  }

  enableDebug() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('debug-enabled', 'true');
      this.isDebugEnabled = true;
    }
  }

  disableDebug() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('debug-enabled', 'false');
      this.isDebugEnabled = false;
    }
  }

  isDebug() { return this.isDebugEnabled; }

  perf(label: string, fn: () => any) {
    if (this.isDebugEnabled) {
      const start = window.performance.now();
      const result = fn();
      const end = window.performance.now();
      console.log(`[PERF] ${label}: ${(end - start).toFixed(2)}ms`);
      return result;
    }
    return fn();
  }

  async perfAsync(label: string, fn: () => Promise<any>) {
    if (this.isDebugEnabled) {
      const start = window.performance.now();
      const result = await fn();
      const end = window.performance.now();
      console.log(`[PERF] ${label}: ${(end - start).toFixed(2)}ms`);
      return result;
    }
    return fn();
  }
}

export const logger = new Logger();

export const flowLogger = {
  init: (_message: string, ..._args: any[]) => {},
  success: (_message: string, ..._args: any[]) => {},
  error: (message: string, ...args: any[]) => console.error(`❌ [FLOW-ERROR] ${message}`, ...args),
  update: (_message: string, ..._args: any[]) => {},
  route: (_message: string, ..._args: any[]) => {},
  access: (_message: string, ..._args: any[]) => {},
  search: (_message: string, ..._args: any[]) => {},
  coming: (_message: string, ..._args: any[]) => {},
  lazy: (_message: string, ..._args: any[]) => {},
  cache: (_message: string, ..._args: any[]) => {},
  warn: (message: string, ...args: any[]) => console.warn(`⚠️ [FLOW-WARN] ${message}`, ...args),
};

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  logger.enableDebug();
  (window as any).__enableDebugLogging = () => logger.enableDebug();
  (window as any).__disableDebugLogging = () => logger.disableDebug();
}
