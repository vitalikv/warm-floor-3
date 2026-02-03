import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ContextSingleton } from '@/core/ContextSingleton';
import { CameraManager } from '@/threeApp/scene/CameraManager';
import { RendererManager } from '@/threeApp/scene/RendererManager';

// Менеджер контролов камеры
export class ControlsManager extends ContextSingleton<ControlsManager> {
  public controls!: OrbitControls;

  public init(domElement?: EventTarget) {
    const cameraManager = CameraManager.inst();
    const rendererManager = RendererManager.inst();

    const element = (domElement ?? rendererManager.getDomElement()) as unknown as HTMLElement;
    this.controls = new OrbitControls(cameraManager.currentCamera, element);

    this.controls.enableDamping = false;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 0, 0);

    this.controls.addEventListener('start', () => RendererManager.inst().render());
    this.controls.addEventListener('change', () => RendererManager.inst().render());
    this.controls.addEventListener('end', () => RendererManager.inst().render());

    // По умолчанию ортогональная камера - отключаем вращение
    this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
  }

  public setCamera(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera) {
    this.controls.object = camera;
    this.controls.update();
  }

  public enableRotate() {
    this.controls.enableRotate = true;
    this.controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    this.controls.update();
  }

  public disenableRotate() {
    this.controls.enableRotate = false;
    this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    this.controls.update();
  }

  private saveCameraState(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera) {
    camera.userData.state = {
      position: camera.position.clone(),
      rotation: camera.rotation.clone(),
      target: this.controls.target.clone(),
    };
  }

  private restoreCameraState(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera) {
    const state = camera.userData.state;

    if (state) {
      camera.position.copy(state.position);
      camera.rotation.copy(state.rotation);
      this.controls.target.copy(state.target);
      this.controls.update();
    }
  }

  public switchControls(isPerspective: boolean) {
    const cameraManager = CameraManager.inst();

    // Сохраняем состояние текущей камеры
    this.saveCameraState(cameraManager.currentCamera);

    if (isPerspective) {
      cameraManager.currentCamera = cameraManager.perspectiveCamera;
      cameraManager.updatePerspectiveCameraSize();
      this.enableRotate();
    } else {
      cameraManager.currentCamera = cameraManager.orthographicCamera;
      cameraManager.updateOrthographicCameraSize();
      this.disenableRotate();
    }

    this.setCamera(cameraManager.currentCamera);

    // Восстанавливаем состояние новой камеры
    this.restoreCameraState(cameraManager.currentCamera);
  }

  public getControls() {
    return this.controls;
  }

  public update() {
    this.controls.update();
  }
}
