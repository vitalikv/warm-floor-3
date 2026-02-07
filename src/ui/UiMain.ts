import { ContextSingleton } from '@/core/ContextSingleton';
import { UiTopPanel } from './UiTopPanel';
import { RightPanel } from './RightPanel';
import { UiStatsPanel } from './UiStatsPanel';

export class UiMain extends ContextSingleton<UiMain> {
  private threeContainer!: HTMLDivElement;

  public init({ container }: { container: HTMLElement }): HTMLElement {
    UiTopPanel.inst().init(container);
    RightPanel.inst().init(container);

    UiStatsPanel.inst().init(container);

    // Создаем контейнер для 3D сцены под верхней панелью
    this.threeContainer = document.createElement('div');
    this.threeContainer.style.position = 'absolute';
    this.threeContainer.style.top = '41px'; // высота верхней панели
    this.threeContainer.style.left = '0';
    this.threeContainer.style.right = '350px'; // ширина правой панели
    this.threeContainer.style.bottom = '0';
    this.threeContainer.style.overflow = 'hidden';
    this.threeContainer.style.transition = 'right 0.3s ease-in-out';
    container.appendChild(this.threeContainer);

    return this.threeContainer;
  }

  /** Инициализация камеры после загрузки Three.js */
  public initializeCamera(type: '2D' | '3D' = '3D') {
    UiTopPanel.inst().initializeCameraState(type);
  }

  /** Установить правый отступ для 3D контейнера (когда правая панель скрывается/показывается) */
  public setThreeContainerRightOffset(offset: number): void {
    if (this.threeContainer) {
      this.threeContainer.style.right = `${offset}px`;
    }
  }
}
