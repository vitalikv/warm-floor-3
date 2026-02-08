import { ContextSingleton } from '@/core/ContextSingleton';
import { SceneManager } from '@/threeApp/scene/SceneManager';
import { WorkerManager } from '@/threeApp/worker/WorkerManager';

import { LoaderModel } from '@/threeApp/model/LoaderModel';
import { HouseLoader } from '@/threeApp/house/HouseLoader';
import { InteractionOrchestrator } from '@/threeApp/interaction/core/InteractionOrchestrator';
import { PointFeature } from '@/threeApp/interaction/features/points/PointFeature';

export class ThreeMain extends ContextSingleton<ThreeMain> {
  private useWorker = true;
  private canvas: HTMLCanvasElement | null = null;

  public setUseWorker(flag: boolean) {
    this.useWorker = flag;
  }

  public init({ container }: { container: HTMLElement }) {
    // Создаем canvas программно
    this.canvas = document.createElement('canvas');
    this.canvas.style.display = 'block';
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    container.appendChild(this.canvas);

    // Отключаем контекстное меню браузера на canvas
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    if (this.useWorker) {
      WorkerManager.inst().init(this.canvas);
    } else {
      SceneManager.inst().init({ canvas: this.canvas, rect: this.canvas.getBoundingClientRect() });
    }

    this.initResizeObserver(this.canvas);

    if (!this.useWorker) {
      InteractionOrchestrator.inst().init();
      InteractionOrchestrator.inst().registerFeature(new PointFeature());

      LoaderModel.inst().loadJSON();
      HouseLoader.inst().loadHouse();
    }
    // если useWorker — загрузки инициируются из Worker после 'ready'
  }

  private initResizeObserver(canvas: HTMLCanvasElement) {
    const resizeHandler = () => {
      const rect = canvas.getBoundingClientRect();
      if (this.useWorker) {
        WorkerManager.inst().send({ type: 'resize', left: rect.left, top: rect.top, width: rect.width, height: rect.height });
      } else {
        SceneManager.inst().handleResize({ width: rect.width, height: rect.height, left: rect.left, top: rect.top });
      }
    };
    const resizeObserver = new ResizeObserver(resizeHandler);
    resizeObserver.observe(canvas);
  }
}
