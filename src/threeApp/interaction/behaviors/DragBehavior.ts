import * as THREE from 'three';
import { SceneManager } from '@/threeApp/scene/SceneManager';

export class DragBehavior {
  private plane!: THREE.Mesh;
  private offset = new THREE.Vector3();
  private isActive = false;

  constructor() {
    const geometry = new THREE.PlaneGeometry(10000, 10000);
    const material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide });
    material.visible = false;
    this.plane = new THREE.Mesh(geometry, material);
    this.plane.rotation.set(-Math.PI / 2, 0, 0);
    SceneManager.inst().getScene().add(this.plane);
  }

  /** Начать drag: позиционировать плоскость на Y объекта, записать offset */
  public startDrag(object: THREE.Object3D, raycaster: THREE.Raycaster): void {
    this.plane.position.set(0, object.position.y, 0);
    this.plane.updateMatrixWorld();

    const intersects = raycaster.intersectObjects([this.plane], true);
    if (intersects.length === 0) return;
    this.offset = intersects[0].point.clone();
    this.isActive = true;
  }

  /** Вычислить смещение за кадр. Возвращает null если плоскость не пересечена */
  public updateDrag(raycaster: THREE.Raycaster): THREE.Vector3 | null {
    if (!this.isActive) return null;
    const intersects = raycaster.intersectObjects([this.plane], true);
    if (intersects.length === 0) return null;

    const delta = new THREE.Vector3().subVectors(intersects[0].point, this.offset);
    this.offset = intersects[0].point.clone();
    delta.y = 0;
    return delta;
  }

  public endDrag(): void {
    this.isActive = false;
  }

  public isRunning(): boolean {
    return this.isActive;
  }
}
