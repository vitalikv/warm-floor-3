import { ContextSingleton } from '@/core/ContextSingleton';

/**
 * Левая панель — каталог объектов.
 * Stage 1: placeholder. Stage 2+: каталог мебели и объектов.
 */
export class LeftPanel extends ContextSingleton<LeftPanel> {
  private div!: HTMLDivElement;

  public init(container: HTMLElement): void {
    this.div = this.createDiv();
    container.appendChild(this.div);
    this.stopEvents();
  }

  private createDiv(): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.html();
    return wrapper.children[0] as HTMLDivElement;
  }

  private html(): string {
    const css = `
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 200px;
      background: rgb(241, 241, 241);
      border-right: 1px solid rgb(179, 179, 179);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgb(133, 133, 133);
      font-size: 14px;`;
    return `<div style="${css}">Каталог</div>`;
  }

  /** Блокировка событий мыши — они не должны проходить в Three.js */
  private stopEvents(): void {
    const events = ['mousedown', 'wheel', 'mousemove', 'touchstart', 'touchend', 'touchmove'];
    events.forEach((name) => {
      this.div.addEventListener(name, (e: Event) => e.stopPropagation());
    });
  }
}
