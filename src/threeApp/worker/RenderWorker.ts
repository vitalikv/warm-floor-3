import * as THREE from 'three';
import { SceneManager } from '@/threeApp/scene/SceneManager';
import { MouseManager } from '@/threeApp/scene/MouseManager';
import { CameraManager } from '@/threeApp/scene/CameraManager';
import { RendererManager } from '@/threeApp/scene/RendererManager';
import { WallsManager } from '@/threeApp/house/walls/WallsManager';
import { HouseLoader } from '@/threeApp/house/HouseLoader';
import { LoaderModel } from '@/threeApp/model/LoaderModel';
import { InteractionOrchestrator } from '@/threeApp/interaction/core/InteractionOrchestrator';
import { PointFeature } from '@/threeApp/interaction/features/points/PointFeature';
import type { MainToWorkerMsg, WorkerToMainMsg } from './WorkerTypes';

/**
 * Точка входа Web Worker.
 * Stage 2: каждый case — реальный вызов менеджера.
 *
 * Примечание: в Worker нет window/document. window.devicePixelRatio
 * и window.innerWidth используются в CameraManager/RendererManager,
 * но вызываются только после init, когда размеры переданы явно.
 */

function sendToMain(msg: WorkerToMainMsg): void {
  self.postMessage(msg);
}

self.onmessage = (event: MessageEvent<MainToWorkerMsg>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'init': {
      const rect = new DOMRect(msg.left, msg.top, msg.width, msg.height);
      SceneManager.inst().init({ canvas: msg.canvas, rect });
      InteractionOrchestrator.inst().init();
      InteractionOrchestrator.inst().registerFeature(new PointFeature());
      sendToMain({ type: 'ready' });
      break;
    }
    case 'resize':
      SceneManager.inst().handleResize({ width: msg.width, height: msg.height, left: msg.left, top: msg.top });
      break;
    case 'pointerdown':
    case 'pointermove':
    case 'pointerup':
      MouseManager.inst().dispatchPointer(msg.type, msg.clientX, msg.clientY);
      SceneManager.inst().getDomStub()?.emitPointer(msg.type, msg.clientX, msg.clientY, msg.button, msg.buttons, msg.pointerId);
      break;
    case 'switchCamera':
      CameraManager.inst().switchCamera(msg.mode === '3D');
      break;
    case 'loadHouse':
      HouseLoader.inst().loadHouse();
      LoaderModel.inst().loadJSON();
      break;
    case 'wheel':
      SceneManager.inst().getDomStub()?.emitWheel(msg.deltaY, msg.clientX, msg.clientY);
      break;
    case 'movePoint':
      WallsManager.inst().updatePointPosition(msg.pointId, new THREE.Vector3(msg.x, msg.y, msg.z));
      RendererManager.inst().render();
      break;
  }
};
