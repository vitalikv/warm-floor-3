import * as THREE from 'three';
import { ContextSingleton } from '../../core/ContextSingleton';
import { ControlsManager } from './ControlsManager';
import { RendererManager } from './RendererManager';

/**
 * Менеджер камер
 */
export class CameraManager extends ContextSingleton<CameraManager> {
  public perspectiveCamera!: THREE.PerspectiveCamera;
  public orthographicCamera!: THREE.OrthographicCamera;
  public currentCamera!: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  public isPerspectiveMode: boolean = false;

  /** Аспект вьюпорта. В Worker window не существует — берём из renderer */
  private getAspect(): number {
    if (typeof window !== 'undefined') {
      return window.innerWidth / window.innerHeight;
    }
    const el = RendererManager.inst().getRenderer().domElement;
    return el.width / el.height;
  }

  public init(): void {
    this.perspectiveCamera = this.createPerspectiveCamera();
    this.orthographicCamera = this.createOrthographicCamera();
    this.currentCamera = this.orthographicCamera;
  }

  private createPerspectiveCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(75, this.getAspect(), 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    camera.userData.state = {
      position: camera.position.clone(),
      rotation: camera.rotation.clone(),
      target: new THREE.Vector3(0, 0, 0),
    };
    return camera;
  }

  private createOrthographicCamera(): THREE.OrthographicCamera {
    const aspect = this.getAspect();
    const size = 5;
    const camera = new THREE.OrthographicCamera(
      -size * aspect,
      size * aspect, // left, right
      size,
      -size, // top, bottom
      0.1,
      1000 // near, far
    );
    camera.position.set(0, 10, 0);
    camera.lookAt(0, 0, 0);
    camera.userData.state = {
      position: camera.position.clone(),
      rotation: camera.rotation.clone(),
      target: new THREE.Vector3(0, 0, 0),
    };
    return camera;
  }

  public updateOrthographicCameraSize(): void {
    const aspect = this.getAspect();
    const size = 5;

    this.orthographicCamera.left = -size * aspect;
    this.orthographicCamera.right = size * aspect;
    this.orthographicCamera.top = size;
    this.orthographicCamera.bottom = -size;
    this.orthographicCamera.updateProjectionMatrix();
  }

  public updatePerspectiveCameraSize(): void {
    const aspect = this.getAspect();
    this.perspectiveCamera.aspect = aspect;
    this.perspectiveCamera.updateProjectionMatrix();
  }

  public switchCamera(isPerspective: boolean): void {
    this.isPerspectiveMode = isPerspective;
    // if (isPerspective) {
    //   this.currentCamera = this.perspectiveCamera;
    // } else {
    //   this.currentCamera = this.orthographicCamera;
    //   this.updateOrthographicCameraSize();
    // }

    ControlsManager.inst().switchControls(isPerspective);
  }

  public getCurrentCamera(): THREE.PerspectiveCamera | THREE.OrthographicCamera {
    return this.currentCamera;
  }

  public resize(): void {
    if (this.isPerspectiveMode) {
      this.updatePerspectiveCameraSize();
    } else {
      this.updateOrthographicCameraSize();
    }
  }
}
