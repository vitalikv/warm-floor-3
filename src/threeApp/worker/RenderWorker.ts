import type { MainToWorkerMsg, WorkerToMainMsg } from './WorkerTypes';

/**
 * Точка входа Web Worker.
 * Stage 1: скелет. Сцена не инициализируется.
 * Stage 2: каждый case — реальный вызов менеджера.
 */

function sendToMain(msg: WorkerToMainMsg): void {
  self.postMessage(msg);
}

self.onmessage = (event: MessageEvent<MainToWorkerMsg>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'init':
      // TODO Stage 2: SceneManager.inst().init({ canvas: msg.canvas, ... })
      sendToMain({ type: 'ready' });
      break;
    case 'resize':
      // TODO Stage 2: SceneManager.inst().handleResize(...)
      break;
    case 'pointerdown':
      // TODO Stage 2: MouseManager forwarding
      break;
    case 'pointermove':
      // TODO Stage 2: MouseManager forwarding
      break;
    case 'pointerup':
      // TODO Stage 2: MouseManager forwarding
      break;
    case 'switchCamera':
      // TODO Stage 2: CameraManager.inst().switchCamera(...)
      break;
    case 'loadHouse':
      // TODO Stage 2: fetch + WallsManager.buildWalls
      break;
    case 'movePoint':
      // TODO Stage 2: WallsManager.inst().updatePointPosition(...)
      break;
  }
};
