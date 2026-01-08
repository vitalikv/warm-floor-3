import { UiCameraToggle } from './ui/UiCameraToggle';
import { SceneManager } from './threeApp/scene/SceneManager';
import { CameraManager } from './threeApp/scene/CameraManager';
import { RendererManager } from './threeApp/scene/RendererManager';
import { LightsManager } from './threeApp/scene/LightsManager';
import { ObjectsManager } from './threeApp/scene/ObjectsManager';
import { ControlsManager } from './threeApp/scene/ControlsManager';
import { MouseManager } from './threeApp/scene/MouseManager';

import { LoaderModel } from './threeApp/model/LoaderModel';
import { HouseLoader } from './threeApp/house/HouseLoader';

// Инициализация менеджеров
SceneManager.inst().init();
CameraManager.inst().init();
RendererManager.inst().init();
RendererManager.inst().appendToDOM();
LightsManager.inst().init();
ObjectsManager.inst().init();
ControlsManager.inst().init();
MouseManager.inst().init();
MouseManager.inst().setClickCallback((intersects) => {
  if (intersects.length > 0) {
    const clickedObject = intersects[0].object;
    console.log('Кликнули на объект:', clickedObject);
  }
});

const sceneManager = SceneManager.inst();
const cameraManager = CameraManager.inst();
const rendererManager = RendererManager.inst();
const controlsManager = ControlsManager.inst();

console.log(sceneManager.getScene());

LoaderModel.inst().loadJSON();

HouseLoader.inst().loadHouse();

// Функция переключения камеры
function switchCamera(isPerspective: boolean) {
  cameraManager.switchCamera(isPerspective);
  controlsManager.switchControls(isPerspective);
}

// Обработка изменения размера окна
window.addEventListener('resize', () => {
  cameraManager.resize();
  rendererManager.updateSize();
});

// Инициализация UI кнопки переключения камеры
const app = document.getElementById('app');
if (app) {
  UiCameraToggle.inst().init(app, switchCamera);
  // Синхронизируем UI с ортогональной камерой по умолчанию
  UiCameraToggle.inst().setCameraType(false);
}

// Функция анимации
function animate() {
  requestAnimationFrame(animate);
  controlsManager.update();
  rendererManager.getRenderer().render(sceneManager.getScene(), cameraManager.getCurrentCamera());
}

animate();
