import { ContextSingleton } from '@/core/ContextSingleton';
import { HouseLoader } from '@/threeApp/house/HouseLoader';
import { WallsManager } from '@/threeApp/house/walls/WallsManager';
import { CameraManager } from '@/threeApp/scene/CameraManager';
import { WorkerManager } from '@/threeApp/worker/WorkerManager';
import { WallCreationMode } from '@/threeApp/interaction/modes/WallCreationMode';
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

  /** Переключить камеру. Worker-aware: если воркер запущен — шлёт postMessage, иначе прямой вызов */
  public switchCamera(params: SwitchCameraParams): void {
    if (WorkerManager.inst().isRunning()) {
      WorkerManager.inst().send({ type: 'switchCamera', mode: params.mode });
    } else {
      CameraManager.inst().switchCamera(params.mode === '3D');
    }
  }

  /** Сохранить проект. Скачивание файла — ответственность UI */
  public saveProject(_params: SaveProjectParams): void {
    // TODO Stage 2
  }

  /**
   * Активировать режим создания стены
   * Работает только в режиме 2D
   */
  public activateWallCreationMode(): void {
    console.log('[ApiUiToThree] Activating wall creation mode');

    // Проверить, что камера в 2D режиме
    const cameraManager = CameraManager.inst();
    if (cameraManager.isPerspectiveMode) {
      console.warn('[ApiUiToThree] Wall creation mode only works in 2D mode');
      // TODO: показать уведомление пользователю
      return;
    }

    if (WorkerManager.inst().isRunning()) {
      WorkerManager.inst().send({ type: 'activateWallCreationMode' });
    } else {
      WallCreationMode.inst().activate();
    }
  }

  /**
   * Деактивировать режим создания стены
   */
  public deactivateWallCreationMode(): void {
    console.log('[ApiUiToThree] Deactivating wall creation mode');

    if (WorkerManager.inst().isRunning()) {
      // TODO: отправить сообщение в worker
      WorkerManager.inst().send({ type: 'deactivateWallCreationMode' });
    } else {
      WallCreationMode.inst().deactivate();
    }
  }
}
