import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ContextSingleton } from '../../core/ContextSingleton';
import { CameraManager } from './CameraManager';
import { RendererManager } from './RendererManager';

/**
 * Менеджер контролов камеры
 */
export class ControlsManager extends ContextSingleton<ControlsManager> {
  public perspectiveControls: OrbitControls;
  public orthographicControls: OrbitControls;
  public currentControls: OrbitControls;

  public init(): void {
    const cameraManager = CameraManager.inst();
    const rendererManager = RendererManager.inst();

    this.perspectiveControls = this.createPerspectiveControls(
      cameraManager.perspectiveCamera,
      rendererManager.getDomElement()
    );

    this.orthographicControls = this.createOrthographicControls(
      cameraManager.orthographicCamera,
      rendererManager.getDomElement()
    );

    this.currentControls = this.perspectiveControls;
  }

  private createPerspectiveControls(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement
  ): OrbitControls {
    const controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    return controls;
  }

  private createOrthographicControls(
    camera: THREE.OrthographicCamera,
    domElement: HTMLElement
  ): OrbitControls {
    const controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    return controls;
  }

  public switchControls(isPerspective: boolean): void {
    const cameraManager = CameraManager.inst();

    if (isPerspective) {
      // Сохраняем позицию и target ортогональной камеры
      const orthoPos = cameraManager.orthographicCamera.position.clone();
      const orthoTarget = this.orthographicControls.target.clone();

      // Переключаемся на перспективную камеру
      cameraManager.currentCamera = cameraManager.perspectiveCamera;
      this.currentControls = this.perspectiveControls;

      // Восстанавливаем позицию и target
      cameraManager.perspectiveCamera.position.copy(orthoPos);
      this.perspectiveControls.target.copy(orthoTarget);
      cameraManager.perspectiveCamera.lookAt(orthoTarget);
    } else {
      // Сохраняем позицию и target перспективной камеры
      const perspPos = cameraManager.perspectiveCamera.position.clone();
      const perspTarget = this.perspectiveControls.target.clone();

      // Переключаемся на ортогональную камеру
      cameraManager.currentCamera = cameraManager.orthographicCamera;
      this.currentControls = this.orthographicControls;

      // Восстанавливаем позицию и target
      cameraManager.orthographicCamera.position.copy(perspPos);
      this.orthographicControls.target.copy(perspTarget);
      cameraManager.orthographicCamera.lookAt(perspTarget);

      // Обновляем размеры ортогональной камеры
      cameraManager.updateOrthographicCameraSize();
    }

    this.currentControls.update();
  }

  public getCurrentControls(): OrbitControls {
    return this.currentControls;
  }

  public update(): void {
    this.currentControls.update();
  }
}

