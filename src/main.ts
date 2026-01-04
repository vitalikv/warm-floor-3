import { UiCameraToggle } from './ui/uiCameraToggle';
import { SceneManager } from './threeApp/scene/SceneManager';
import { CameraManager } from './threeApp/scene/CameraManager';
import { RendererManager } from './threeApp/scene/RendererManager';
import { LightsManager } from './threeApp/scene/LightsManager';
import { ObjectsManager } from './threeApp/scene/ObjectsManager';
import { ControlsManager } from './threeApp/scene/ControlsManager';

// Инициализация менеджеров
SceneManager.inst().init();
CameraManager.inst().init();
RendererManager.inst().init();
RendererManager.inst().appendToDOM();
LightsManager.inst().init();
ObjectsManager.inst().init();
ControlsManager.inst().init();

const sceneManager = SceneManager.inst();
const cameraManager = CameraManager.inst();
const rendererManager = RendererManager.inst();
const controlsManager = ControlsManager.inst();

console.log(sceneManager.getScene());

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
  const cameraToggle = new UiCameraToggle(app, switchCamera);
  cameraToggle.init();
}

// Функция анимации
function animate() {
  requestAnimationFrame(animate);
  controlsManager.update();
  rendererManager.getRenderer().render(sceneManager.getScene(), cameraManager.getCurrentCamera());
}

animate();
