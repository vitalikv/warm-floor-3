import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import { SceneManager } from '@/threeApp/scene/SceneManager';
import { CameraManager } from '@/threeApp/scene/CameraManager';
import { RendererManager } from '@/threeApp/scene/RendererManager';
import { ClickRouter } from '@/threeApp/interaction/routing/ClickRouter';
import { identifyObject } from '@/threeApp/interaction/routing/ObjectIdentifier';

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

  private actObj: THREE.Object3D | null = null;

  // Колбэки для разных событий (с приоритетами)
  private mouseDownHandlers: MouseHandler<MouseEventCallback>[] = [];

  public init(opts?: { skipDomListeners?: boolean }): void {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    if (!opts?.skipDomListeners) {
      this.setupEventListeners();
    }
  }

  private setupEventListeners(): void {
    const domElement = RendererManager.inst().getDomElement();

    domElement.addEventListener('pointerdown', this.pointerDown);
    domElement.addEventListener('pointermove', this.pointerMove);
    domElement.addEventListener('pointerup', this.pointerUp);
  }

  // Находим любой интерактивный объект в intersects
  private findInteractiveObject(intersects: THREE.Intersection[]): THREE.Object3D | null {
    for (const intersect of intersects) {
      const type = intersect.object.userData?.type;
      if (type === 'point' || type === 'wall') {
        return intersect.object;
      }
    }
    return null;
  }

  private pointerDown = (event: MouseEvent) => {
    this.updateRaycast(event.clientX, event.clientY);
    const intersects = this.raycaster.intersectObjects(SceneManager.inst().getScene().children, true);
    const target = this.findInteractiveObject(intersects);

    if (target) {
      this.actObj = target;
      ClickRouter.inst().route({
        objectType: identifyObject(target),
        object: target,
        action: 'down',
        clientX: event.clientX,
        clientY: event.clientY,
      });
    }
  };

  private pointerMove = (event: MouseEvent) => {
    this.updateRaycast(event.clientX, event.clientY);

    if (this.actObj) {
      ClickRouter.inst().route({
        objectType: identifyObject(this.actObj),
        object: this.actObj,
        action: 'move',
        clientX: event.clientX,
        clientY: event.clientY,
      });
      RendererManager.inst().render();
    }
  };

  private pointerUp = (event: MouseEvent) => {
    this.updateRaycast(event.clientX, event.clientY);

    if (this.actObj) {
      ClickRouter.inst().route({
        objectType: identifyObject(this.actObj),
        object: this.actObj,
        action: 'up',
        clientX: event.clientX,
        clientY: event.clientY,
      });
      this.actObj = null;
    }
  };

  /** Вызов из Worker-контекста: создаёт синтетическое событие и делегирует в существующие обработчики */
  public dispatchPointer(type: 'pointerdown' | 'pointermove' | 'pointerup', clientX: number, clientY: number): void {
    const syntheticEvent = { clientX, clientY } as unknown as MouseEvent;
    switch (type) {
      case 'pointerdown':  this.pointerDown(syntheticEvent);  break;
      case 'pointermove':  this.pointerMove(syntheticEvent);  break;
      case 'pointerup':    this.pointerUp(syntheticEvent);    break;
    }
  }

  private updateRaycast(mouseX: number, mouseY: number) {
    this.updateMousePosition(mouseX, mouseY);

    const camera = CameraManager.inst().getCurrentCamera();
    this.raycaster.setFromCamera(this.mouse, camera);
  }

  /** В Worker canvas — OffscreenCanvas без getBoundingClientRect; берём rect из WorkerDomStub */
  private getCanvasRect(): { left: number; top: number; width: number; height: number } {
    const canvas = SceneManager.inst().getCanvas();
    if (canvas instanceof OffscreenCanvas) {
      return SceneManager.inst().getDomStub()?.getBoundingClientRect()
        ?? { left: 0, top: 0, width: canvas.width, height: canvas.height };
    }
    return canvas.getBoundingClientRect();
  }

  private updateMousePosition(mouseX: number, mouseY: number) {
    const rect = this.getCanvasRect();
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
