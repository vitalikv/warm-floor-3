import { ContextSingleton } from '../core/ContextSingleton';

export class UiCameraToggle extends ContextSingleton<UiCameraToggle> {
  private container: HTMLElement | null = null;
  private button: HTMLButtonElement | null = null;
  private isPerspective: boolean = true;
  private onToggleCallback: ((isPerspective: boolean) => void) | null = null;

  public init(container: HTMLElement, onToggle: (isPerspective: boolean) => void) {
    this.container = container;
    this.onToggleCallback = onToggle;
    const div = this.createDiv();
    if (this.container) {
      this.container.appendChild(div);
    }

    this.button = div.querySelector('button') as HTMLButtonElement;
    if (!this.button) {
      console.error('Button not found in uiCameraToggle');
      return;
    }
    this.button.addEventListener('click', () => this.toggle());

    this.updateText();
    this.eventStop(div);
  }

  private createDiv(): HTMLDivElement {
    const div = document.createElement('div');
    div.innerHTML = this.getHtml();
    return div;
  }

  private getHtml(): string {
    const css = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.9);
      padding: 10px 15px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
      transition: background 0.3s;
    `;

    return `<button style="${css}">Перспективная</button>`;
  }

  private eventStop(div: HTMLElement) {
    const events = ['mousedown', 'wheel', 'mousewheel', 'mousemove', 'touchstart', 'touchend', 'touchmove'];

    events.forEach((eventName) => {
      div.addEventListener(eventName, (e) => {
        e.stopPropagation();
      });
    });
  }

  private toggle() {
    this.isPerspective = !this.isPerspective;
    this.updateText();
    if (this.onToggleCallback) {
      this.onToggleCallback(this.isPerspective);
    }
  }

  private updateText() {
    if (this.button) {
      this.button.textContent = this.isPerspective ? 'Перспективная' : 'Ортогональная';
    }
  }

  public setCameraType(isPerspective: boolean) {
    this.isPerspective = isPerspective;
    this.updateText();
  }
}
