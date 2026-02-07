import { ContextSingleton }  from '@/core/ContextSingleton';
import { PerformanceMonitor } from '@/utils/helpers/PerformanceMonitor';
import { UiStyles } from '@/ui/styles/UiStyles';

/**
 * Оверлей FPS + draw calls. Позиция: bottom-right.
 *
 * Обновление — polling через setInterval(500 ms).
 * pointer-events: none — оверлей не перехватывает ввод.
 *
 * Ограничение: при useWorker = true PerformanceMonitor живёт в Worker,
 * а этот компонент — на main thread. Нужен postMessage со статами — Stage 4+.
 */
export class UiStatsPanel extends ContextSingleton<UiStatsPanel> {
  private fpsEl!:       HTMLSpanElement;
  private drawCallsEl!: HTMLSpanElement;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  public init(container: HTMLElement): void {
    const div = this.createDiv();
    container.appendChild(div);

    this.fpsEl       = div.querySelector('#stats-fps') as HTMLSpanElement;
    this.drawCallsEl = div.querySelector('#stats-dc')  as HTMLSpanElement;

    this.intervalId = setInterval(() => this.update(), 500);
  }

  private createDiv(): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.html();
    return wrapper.children[0] as HTMLDivElement;
  }

  private html(): string {
    const styles = UiStyles.inst();
    
    const panelCss = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.9);
      ${styles.getShadow('light')}
      padding: 10px 15px;
      font-family: monospace;
      font-size: 13px;
      line-height: 1.7;
      pointer-events: none;
      user-select: none;
      z-index: 10;
    `;

    const valueCss = `
      color: #333;
      font-weight: bold;
    `;

    return `
      <div style="${panelCss}">
        <div>FPS:  <span id="stats-fps" style="${valueCss}">0</span></div>
        <div>Draw: <span id="stats-dc" style="${valueCss}">0</span></div>
      </div>
    `;
  }

  private update(): void {
    this.fpsEl.textContent       = String(Math.round(PerformanceMonitor.inst().getFps()));
    this.drawCallsEl.textContent = String(PerformanceMonitor.inst().getDrawCalls());
  }

  public dispose(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
