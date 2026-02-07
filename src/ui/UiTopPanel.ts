import { ContextSingleton } from '@/core/ContextSingleton';
import { UiStyles } from '@/ui/styles/UiStyles';
import { UiCameraToggle } from '@/ui/UiCameraToggle';

export class UiTopPanel extends ContextSingleton<UiTopPanel> {
  private divMenu!: HTMLDivElement;

  public init(container: HTMLElement) {
    this.divMenu = this.crDiv();
    container.append(this.divMenu);

    this.eventStop({ div: this.divMenu });

    this.initCameraButtons();
    this.initHoverEffects();
  }

  /** Установить правый отступ для верхней панели (когда правая панель видна) */
  public setRightOffset(offset: number): void {
    this.divMenu.style.width = offset > 0 ? `calc(100% - ${offset}px)` : '100%';
  }

  private initCameraButtons() {
    const div2D = this.divMenu.querySelector('[nameid="butt_camera_2D"]') as HTMLElement;
    const div3D = this.divMenu.querySelector('[nameid="butt_camera_3D"]') as HTMLElement;
    const btn2D = div2D?.querySelector('button') as HTMLButtonElement;
    const btn3D = div3D?.querySelector('button') as HTMLButtonElement;
    
    if (btn2D) {
      btn2D.addEventListener('click', () => {
        UiCameraToggle.inst().setCameraType({ type: '2D' });
        this.updateCameraButtons('2D');
      });
    }
    
    if (btn3D) {
      btn3D.addEventListener('click', () => {
        UiCameraToggle.inst().setCameraType({ type: '3D' });
        this.updateCameraButtons('3D');
      });
    }

    // Инициализация камеры будет выполнена после загрузки Three.js
    // this.updateCameraButtons('3D');
  }

  /** Установить начальное состояние кнопок камеры (вызывается после инициализации Three.js) */
  public initializeCameraState(type: '2D' | '3D' = '3D') {
    UiCameraToggle.inst().setCameraType({ type });
    this.updateCameraButtons(type);
  }

  private updateCameraButtons(activeType: '2D' | '3D') {
    const div2D = this.divMenu.querySelector('[nameid="butt_camera_2D"]') as HTMLElement;
    const div3D = this.divMenu.querySelector('[nameid="butt_camera_3D"]') as HTMLElement;

    // Если камера в режиме 2D, показываем кнопку 3D (для переключения на 3D)
    // Если камера в режиме 3D, показываем кнопку 2D (для переключения на 2D)
    if (activeType === '2D') {
      if (div2D) div2D.style.display = 'none';
      if (div3D) div3D.style.display = '';
    } else {
      if (div2D) div2D.style.display = '';
      if (div3D) div3D.style.display = 'none';
    }
  }


  private initHoverEffects() {
    const styles = UiStyles.inst();
    const buttons = this.divMenu.querySelectorAll('button');
    
    buttons.forEach((btn) => {
      const baseStyle = btn.style.cssText;
      btn.addEventListener('mouseenter', () => {
        btn.style.cssText += styles.getButtonGradientHover();
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.cssText = baseStyle;
      });
    });
  }

  private crDiv() {
    let div = document.createElement('div');
    div.innerHTML = this.html();
    div = div.children[0] as HTMLDivElement;

    return div;
  }

  private html() {
    const styles = UiStyles.inst();
    
    const panelCss = `
      position: absolute;
      width: 100%;
      height: 41px;
      margin: 0;
      ${styles.getPanelStyle()}
      display: flex;
      align-items: center;
      z-index: 2;
      transition: width 0.3s ease-in-out;
    `;

    const menuBtnCss = `
      ${styles.getButtonBaseStyle()}
      ${styles.getButtonGradient()}
      padding: 7px;
      font-weight: normal;
    `;

    const toolbarCss = `
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    `;

    const titleCss = `
      font: 18px Arial, Helvetica, sans-serif;
      color: #737373;
      margin: 0;
    `;

    const screenshotBtnCss = `
      ${styles.getButtonBaseStyle()}
      ${styles.getButtonGradient()}
      padding: 7px;
      font-weight: normal;
      width: auto;
      height: auto;
    `;

    const rightSectionCss = `
      display: flex;
      margin-right: 15px;
    `;

    const cameraBtnCss = `
      ${styles.getButtonBaseStyle()}
      ${styles.getButtonGradient()}
      width: 39px;
      padding: 7px;
      font-weight: normal;
      min-width: 39px;
      text-align: center;
      position: relative;
      z-index: 10;
    `;

    return `
      <div style="${panelCss}">
        <div class="button1-wrap-1" style="margin-left: 15px;">
          <button class="button1 button_gradient_1" style="${menuBtnCss}">меню</button>
        </div>
        
        <div class="toolbar" style="${toolbarCss}">
          <div style="color: #737373; align-items: center; padding: 0 10px;">
            <h1 style="${titleCss}">Конструктор дома</h1>
          </div>
          <div class="button1-wrap-1">
            <button class="button1 button_gradient_1" style="${screenshotBtnCss}" title="Скриншот">
              📷
            </button>
          </div>
        </div>
        
        <div class="tp_right_1" style="${rightSectionCss}">
          <div class="button1-wrap-1" nameid="butt_camera_2D" style="display: none;">
            <button class="button1 button_gradient_1" style="${cameraBtnCss}">2D</button>
          </div>
          <div class="button1-wrap-1" nameid="butt_camera_3D">
            <button class="button1 button_gradient_1" style="${cameraBtnCss}">3D</button>
          </div>
        </div>
      </div>
    `;
  }

  private eventStop({ div }: { div: HTMLDivElement }) {
    const arrEvent = ['onmousedown', 'onwheel', 'onmousewheel', 'onmousemove', 'ontouchstart', 'ontouchend', 'ontouchmove'];

    arrEvent.forEach((events) => {
      (div as any)[events] = (e: Event) => {
        e.stopPropagation();
      };
    });
  }
}
