import { ContextSingleton } from '@/core/ContextSingleton';

/**
 * Кустомный счётчик FPS + draw calls. Без сторонних библиотек.
 *
 * FPS — кольцевой буфер из последних N timestamp-ов (performance.now()).
 *   getFps() = (count - 1) / (newest - oldest) × 1000.
 *   Если последний рендер > 1000 ms назад — возвращает 0 (сцена idle).
 *
 * Draw calls — последнее значение, переданное из RendererManager.render().
 */
export class PerformanceMonitor extends ContextSingleton<PerformanceMonitor> {
  /** Кольцевой буфер timestamp-ов render-вызовов (используется в non-worker режиме) */
  private timestamps: number[] = [];

  /** Максимальный размер буфера */
  private readonly bufferSize = 60;

  /** Draw calls последнего кадра (non-worker) */
  private drawCalls = 0;

  /** Количество геометрий в GPU-памяти (non-worker) */
  private geometries = 0;

  /**
   * Опциональный callback — вызывается после каждого кадра.
   * Воркер подключает его для отправки stats на main thread.
   */
  public onUpdate: ((fps: number, drawCalls: number, geometries: number) => void) | null = null;

  // ── remote (worker → main) ────────────────────────────────────
  /** true когда main thread получает stats из воркера */
  private isRemote = false;
  private remoteFps = 0;
  private remoteDrawCalls = 0;
  private remoteGeometries = 0;
  /** timestamp последнего pushStats — для idle-детекции на main thread */
  private lastPushTime = 0;

  /**
   * Вызывается из RendererManager.render() после каждого кадра.
   * @param calls — draw calls за этот кадр
   * @param geoCount — количество геометрий в GPU-памяти
   */
  public onFrameRendered(calls: number, geoCount: number): void {
    this.timestamps.push(performance.now());
    if (this.timestamps.length > this.bufferSize) {
      this.timestamps.shift();
    }
    this.drawCalls = calls;
    this.geometries = geoCount;

    if (this.onUpdate) {
      this.onUpdate(this.getFps(), this.drawCalls, this.geometries);
    }
  }

  /**
   * Подкачка stats из воркера. Вызывается на main thread при получении postMessage.
   */
  public pushStats(fps: number, drawCalls: number, geometries: number): void {
    this.isRemote = true;
    this.remoteFps = fps;
    this.remoteDrawCalls = drawCalls;
    this.remoteGeometries = geometries;
    this.lastPushTime = performance.now();
  }

  /**
   * Текущий FPS (среднее по буферу).
   * Возвращает 0 если рендеров не было или последний > 1 s назад (idle).
   */
  public getFps(): number {
    if (this.isRemote) {
      return (performance.now() - this.lastPushTime > 1000) ? 0 : this.remoteFps;
    }

    if (this.timestamps.length < 2) return 0;

    const newest = this.timestamps[this.timestamps.length - 1];
    if (performance.now() - newest > 1000) return 0;   // idle

    const oldest  = this.timestamps[0];
    const elapsed = newest - oldest;
    if (elapsed === 0) return 0;

    return ((this.timestamps.length - 1) / elapsed) * 1000;
  }

  /** Draw calls последнего кадра */
  public getDrawCalls(): number {
    return this.isRemote ? this.remoteDrawCalls : this.drawCalls;
  }

  /** Количество геометрий в GPU-памяти */
  public getGeometries(): number {
    return this.isRemote ? this.remoteGeometries : this.geometries;
  }
}
