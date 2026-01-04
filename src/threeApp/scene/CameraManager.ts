import * as THREE from 'three';
import { ContextSingleton } from '../../core/ContextSingleton';

/**
 * Менеджер камер
 */
export class CameraManager extends ContextSingleton<CameraManager> {
  public perspectiveCamera!: THREE.PerspectiveCamera;
  public orthographicCamera!: THREE.OrthographicCamera;
  public currentCamera!: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  public isPerspectiveMode: boolean = false;

  public init(): void {
    this.perspectiveCamera = this.createPerspectiveCamera();
    this.orthographicCamera = this.createOrthographicCamera();
    this.currentCamera = this.orthographicCamera;
  }

  private createPerspectiveCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);
    return camera;
  }

  private createOrthographicCamera(): THREE.OrthographicCamera {
    const aspect = window.innerWidth / window.innerHeight;
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
    return camera;
  }

  public updateOrthographicCameraSize(): void {
    const aspect = window.innerWidth / window.innerHeight;
    const size = 5;

    this.orthographicCamera.left = -size * aspect;
    this.orthographicCamera.right = size * aspect;
    this.orthographicCamera.top = size;
    this.orthographicCamera.bottom = -size;
    this.orthographicCamera.updateProjectionMatrix();
  }

  public updatePerspectiveCameraSize(): void {
    const aspect = window.innerWidth / window.innerHeight;
    this.perspectiveCamera.aspect = aspect;
    this.perspectiveCamera.updateProjectionMatrix();
  }

  public switchCamera(isPerspective: boolean): void {
    this.isPerspectiveMode = isPerspective;

    if (isPerspective) {
      this.currentCamera = this.perspectiveCamera;
    } else {
      this.currentCamera = this.orthographicCamera;
      this.updateOrthographicCameraSize();
    }
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
