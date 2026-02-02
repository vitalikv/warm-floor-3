import { ContextSingleton } from '@/core/ContextSingleton';
import { SceneManager } from '@/threeApp/scene/SceneManager';

import { LoaderModel } from '@/threeApp/model/LoaderModel';
import { HouseLoader } from '@/threeApp/house/HouseLoader';

export class ThreeMain extends ContextSingleton<ThreeMain> {
  public init({ canvas }: { canvas: HTMLCanvasElement }) {
    SceneManager.inst().init({ canvas, rect: canvas.getBoundingClientRect() });

    this.initResizeObserver(canvas);

    LoaderModel.inst().loadJSON();

    HouseLoader.inst().loadHouse();
  }

  private initResizeObserver(canvas: HTMLCanvasElement) {
    const resizeHandler = () => {
      const rect = canvas.getBoundingClientRect();
      SceneManager.inst().handleResize({ width: rect.width, height: rect.height, left: rect.left, top: rect.top });
    };
    const resizeObserver = new ResizeObserver(resizeHandler);
    resizeObserver.observe(canvas);
  }
}
