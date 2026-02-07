import { ContextSingleton } from '@/core/ContextSingleton';
import { ApiUiToThree } from '@/api/apiLocal/ApiUiToThree';
import { UiStyles } from '@/ui/styles/UiStyles';

export class UiCameraToggle extends ContextSingleton<UiCameraToggle> {
  private container: HTMLElement | null = null;
  private button: HTMLButtonElement | null = null;
  private isPerspective: boolean = false;
  private baseButtonStyle: string = '';

  public init(container: HTMLElement) {
    this.container = container;
    const div = this.createDiv();
    this.container.appendChild(div);

    this.button = div.querySelector('button') as HTMLButtonElement;
    this.button.addEventListener('click', () => this.toggle());

    // сохраняем базовый стиль для восстановления после hover
    const styles = UiStyles.inst();
    this.baseButtonStyle = this.button.style.cssText;

    // hover-эффект
    this.button.addEventListener('mouseenter', () => {
      this.button!.style.cssText += styles.getButtonGradientHover();
    });
    this.button.addEventListener('mouseleave', () => {
      this.button!.style.cssText = this.baseButtonStyle;
    });

    this.updateText();
    this.eventStop(div);
  }

  private createDiv(): HTMLDivElement {
    const div = document.createElement('div');
    div.innerHTML = this.getHtml();
    return div;
  }

  private getHtml(): string {
    const styles = UiStyles.inst();
    
    const btnCss = `
      position: absolute;
      top: 20px;
      right: 20px;
      ${styles.getButtonBaseStyle()}
      ${styles.getButtonGradient()}
      font-weight: bold;
      z-index: 10;
    `;

    return `<button style="${btnCss}">3D</button>`;
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
    this.switchCameraType(this.isPerspective);
  }

  private updateText() {
    if (this.button) {
      this.button.textContent = this.isPerspective ? '2D' : '3D';
    }
  }

  public setCameraType({ type }: { type: '3D' | '2D' }) {
    this.isPerspective = type === '3D';
    this.updateText();
    this.switchCameraType(this.isPerspective);
  }

  private switchCameraType(isPerspective: boolean) {
    ApiUiToThree.inst().switchCamera({ mode: isPerspective ? '3D' : '2D' });
  }
}
