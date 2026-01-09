import { UiMain } from '@/ui/UiMain';
import { SceneManager } from '@//threeApp/scene/SceneManager';
import { CameraManager } from '@/threeApp/scene/CameraManager';
import { RendererManager } from '@/threeApp/scene/RendererManager';
import { ControlsManager } from '@/threeApp/scene/ControlsManager';

import { LoaderModel } from '@/threeApp/model/LoaderModel';
import { HouseLoader } from '@/threeApp/house/HouseLoader';
import { PointDragManager } from '@/threeApp/house/PointDragManager';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const container = document.body.querySelector('#container') as HTMLDivElement;
SceneManager.inst().init({ canvas, rect: canvas.getBoundingClientRect() });

initResizeObserver(canvas);

const sceneManager = SceneManager.inst();
const cameraManager = CameraManager.inst();
const rendererManager = RendererManager.inst();
const controlsManager = ControlsManager.inst();

LoaderModel.inst().loadJSON();

HouseLoader.inst()
  .loadHouse()
  .then(() => {
    // Инициализируем PointDragManager после загрузки дома
    PointDragManager.inst().init();
  });

function initResizeObserver(canvas: HTMLCanvasElement) {
  const resizeHandler = () => {
    const rect = canvas.getBoundingClientRect();
    SceneManager.inst().handleResize({ width: rect.width, height: rect.height, left: rect.left, top: rect.top });
  };
  const resizeObserver = new ResizeObserver(resizeHandler);
  resizeObserver.observe(canvas);
}

UiMain.inst().init({ container });

// Функция анимации
function animate() {
  requestAnimationFrame(animate);
  controlsManager.update();
  rendererManager.getRenderer().render(sceneManager.getScene(), cameraManager.getCurrentCamera());
}

animate();
