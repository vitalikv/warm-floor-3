import { ContextSingleton } from '@/core/ContextSingleton';
import { HouseLoader } from '@/threeApp/house/HouseLoader';
import { WallsManager } from '@/threeApp/house/walls/WallsManager';
import type { HouseDataSnapshot, SaveProjectParams, SwitchCameraParams } from './ApiLocalTypes';

/**
 * UI → Three.js.
 * Stage 1: прямые вызовы менеджеров.
 * Stage 2: если useWorker — тело каждого метода заменяется на postMessage через WorkerManager.
 */
export class ApiUiToThree extends ContextSingleton<ApiUiToThree> {

  /**
   * Снимок состояния дома для сохранения.
   * Вызывается из UiTopPanel при нажатии «Сохранить».
   */
  public getHouseSnapshot(): HouseDataSnapshot {
    const raw = HouseLoader.inst().getHouseData();
    if (raw) {
      (raw as any).level[0].points = WallsManager.inst().getPoints();
      (raw as any).level[0].walls = WallsManager.inst().getWalls();
    }
    return {
      points: WallsManager.inst().getPoints(),
      walls: WallsManager.inst().getWalls(),
      raw,
    };
  }

  /** Переключить камеру */
  public switchCamera(_params: SwitchCameraParams): void {
    // TODO Stage 2
  }

  /** Сохранить проект. Скачивание файла — ответственность UI */
  public saveProject(_params: SaveProjectParams): void {
    // TODO Stage 2
  }
}
