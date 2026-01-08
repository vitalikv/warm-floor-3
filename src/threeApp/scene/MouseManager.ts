import * as THREE from 'three';
import { ContextSingleton } from '../../core/ContextSingleton';
import { SceneManager } from './SceneManager';
import { CameraManager } from './CameraManager';
import { RendererManager } from './RendererManager';

// Менеджер мыши для определения кликов на объекты
export class MouseManager extends ContextSingleton<MouseManager> {
  private raycaster!: THREE.Raycaster;
  private mouse!: THREE.Vector2;
  private clickCallback?: (intersects: THREE.Intersection[]) => void;

  public init(): void {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const domElement = RendererManager.inst().getDomElement();

    domElement.addEventListener('click', (event) => {
      this.onMouseClick(event);
    });
  }

  private onMouseClick(event: MouseEvent): void {
    const domElement = RendererManager.inst().getDomElement();
    const rect = domElement.getBoundingClientRect();

    // Нормализация координат мыши от -1 до 1
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Обновление рейкастера
    const camera = CameraManager.inst().getCurrentCamera();
    this.raycaster.setFromCamera(this.mouse, camera);

    // Поиск пересечений
    const scene = SceneManager.inst().getScene();
    const intersects = this.raycaster.intersectObjects(scene.children, true);

    if (this.clickCallback) {
      this.clickCallback(intersects);
    }
  }

  public setClickCallback(callback: (intersects: THREE.Intersection[]) => void): void {
    this.clickCallback = callback;
  }

  public getIntersects(mouseX: number, mouseY: number): THREE.Intersection[] {
    const domElement = RendererManager.inst().getDomElement();
    const rect = domElement.getBoundingClientRect();

    this.mouse.x = ((mouseX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((mouseY - rect.top) / rect.height) * 2 + 1;

    const camera = CameraManager.inst().getCurrentCamera();
    this.raycaster.setFromCamera(this.mouse, camera);

    const scene = SceneManager.inst().getScene();
    return this.raycaster.intersectObjects(scene.children, true);
  }

  public getFirstIntersect(mouseX: number, mouseY: number): THREE.Intersection | null {
    const intersects = this.getIntersects(mouseX, mouseY);
    return intersects.length > 0 ? intersects[0] : null;
  }
}
