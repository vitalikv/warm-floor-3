import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import { SceneManager } from '@/threeApp/scene/SceneManager';
import { CameraManager } from '@/threeApp/scene/CameraManager';
import { RendererManager } from '@/threeApp/scene/RendererManager';
import { PointMove } from '@/threeApp/house/points/PointMove';
import { ControlsManager } from '@/threeApp/scene/ControlsManager';

// Типы колбэков для разных событий мыши
// Возвращают true, если событие обработано и не нужно продолжать цепочку
type MouseEventCallback = (event: MouseEvent, intersects: THREE.Intersection[]) => boolean | void;
type MouseMoveCallback = (event: MouseEvent, intersects: THREE.Intersection[]) => void;

interface MouseHandler<T = MouseEventCallback | MouseMoveCallback> {
  priority: number;
  callback: T;
}

// Централизованный менеджер для всех событий мыши
export class MouseManager extends ContextSingleton<MouseManager> {
  private raycaster!: THREE.Raycaster;
  private mouse!: THREE.Vector2;

  private actObj: THREE.Mesh | null = null;

  // Колбэки для разных событий (с приоритетами)
  private mouseDownHandlers: MouseHandler<MouseEventCallback>[] = [];

  public init(): void {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const domElement = RendererManager.inst().getDomElement();

    domElement.addEventListener('pointerdown', this.pointerDown);
    domElement.addEventListener('pointermove', this.pointerMove);
    domElement.addEventListener('pointerup', this.pointerUp);
  }

  // Находим точку в переданных intersects
  private findPointInIntersects(intersects: THREE.Intersection[]): THREE.Mesh | null {
    for (const intersect of intersects) {
      if (intersect.object.userData?.type === 'point' && intersect.object instanceof THREE.Mesh) {
        return intersect.object as THREE.Mesh;
      }
    }
    return null;
  }

  private pointerDown = (event: MouseEvent) => {
    this.updateRaycast(event.clientX, event.clientY);
    const intersects = this.raycaster.intersectObjects(SceneManager.inst().getScene().children, true);
    const point = this.findPointInIntersects(intersects);

    if (point) {
      PointMove.inst().pointerDown({ obj: point });
      // Отключаем контролы камеры во время перетаскивания
      const controls = ControlsManager.inst().getControls();
      if ('enabled' in controls) {
        (controls as any).enabled = false;
      }

      this.actObj = point;
    }
  };

  private pointerMove = (event: MouseEvent) => {
    this.updateRaycast(event.clientX, event.clientY);

    if (this.actObj) {
      PointMove.inst().pointerMove();
    }

    const controls = ControlsManager.inst().getControls();
    if (!controls.enabled) {
      RendererManager.inst().render();
    }
  };

  private pointerUp = (event: MouseEvent) => {
    this.updateRaycast(event.clientX, event.clientY);

    if (this.actObj) {
      PointMove.inst().pointerUp();

      // Включаем контролы камеры обратно
      const controls = ControlsManager.inst().getControls();
      if ('enabled' in controls) {
        (controls as any).enabled = true;
      }
      this.actObj = null;
    }
  };

  private updateRaycast(mouseX: number, mouseY: number) {
    this.updateMousePosition(mouseX, mouseY);

    const camera = CameraManager.inst().getCurrentCamera();
    this.raycaster.setFromCamera(this.mouse, camera);
  }

  private updateMousePosition(mouseX: number, mouseY: number) {
    const domElement = RendererManager.inst().getDomElement();
    const rect = domElement.getBoundingClientRect();
    this.mouse.x = ((mouseX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((mouseY - rect.top) / rect.height) * 2 + 1;
  }

  // Методы для регистрации обработчиков событий
  public registerMouseDown(callback: MouseEventCallback, priority: number = 0) {
    this.mouseDownHandlers.push({ priority, callback });
    this.mouseDownHandlers.sort((a, b) => b.priority - a.priority);
  }

  // Утилитарные методы
  public getRaycaster(): THREE.Raycaster {
    return this.raycaster;
  }

  public getMouseVector(): THREE.Vector2 {
    return this.mouse;
  }
}
