import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import { RaycastService } from '@/threeApp/interaction/routing/RaycastService';
import { PointsManager } from '@/threeApp/house/points/PointsManager';
import { WallsManager } from '@/threeApp/house/walls/WallsManager';
import { RendererManager } from '@/threeApp/scene/RendererManager';
import { ControlsManager } from '@/threeApp/scene/ControlsManager';
import { SceneManager } from '@/threeApp/scene/SceneManager';
import * as EventBus from '@/threeApp/interaction/core/EventBus';
import { PointWall } from '@/threeApp/house/points/PointWall';
import { WallGeometry } from '@/threeApp/house/walls/WallGeometry';
import type { Point, Wall as WallData } from '@/threeApp/house/walls/types';

/**
 * Режим создания стены - Continuous Drawing Mode.
 * Работает только в режиме 2D.
 *
 * Workflow:
 * 1. Клик на кнопку "стена" → создается точка, привязанная к курсору
 * 2. Клик на сцену → фиксирует точку, создает стену, новая точка привязывается к курсору
 * 3. Можно продолжать кликать → каждый клик создает новую стену
 * 4. Правый клик или ESC → завершает режим
 */
export class WallCreationMode extends ContextSingleton<WallCreationMode> {
  private isActive = false;
  private cursorPoint: PointWall | null = null; // Точка, привязанная к курсору
  private lastFixedPoint: PointWall | null = null; // Последняя зафиксированная точка
  private previewWall: THREE.Mesh | null = null; // Preview стены
  private fixedPoints: PointWall[] = []; // Все зафиксированные точки в этой сессии

  // Настройки
  private readonly minWallLength = 0.5;
  private readonly defaultWallHeight = 2.5;
  private readonly defaultWallWidth = 0.2;

  /**
   * Активировать режим создания стены
   */
  public activate(): void {
    if (this.isActive) return;

    console.log('[WallCreationMode] Activating continuous wall creation mode');

    this.isActive = true;

    // Отключить OrbitControls (чтобы клик не двигал камеру)
    ControlsManager.inst().setEnabled(false);

    // Изменить курсор
    this.setCursor('crosshair');

    // Создать первую точку, привязанную к курсору (в начале координат)
    this.createCursorPoint(new THREE.Vector3(0, 0, 0));

    // Подписаться на события
    this.subscribeToEvents();

    EventBus.emit('wall:creation:started', {});
  }

  /**
   * Деактивировать режим
   */
  public deactivate(): void {
    if (!this.isActive) return;

    console.log('[WallCreationMode] Deactivating wall creation mode');

    this.isActive = false;

    // Очистить временные объекты
    this.cleanup();

    // Восстановить OrbitControls
    ControlsManager.inst().setEnabled(true);

    // Вернуть курсор
    this.setCursor('default');

    // Отписаться от событий
    this.unsubscribeFromEvents();

    EventBus.emit('wall:creation:cancelled', {});
  }

  /**
   * Проверка, активен ли режим
   */
  public getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Обработка клика мыши
   */
  private handlePointerDown = (event: Event): void => {
    const pointerEvent = event as PointerEvent;
    if (!this.isActive) return;

    // Правая кнопка - отмена
    if (pointerEvent.button === 2) {
      this.deactivate();
      return;
    }

    // Игнорируем все кроме левой кнопки
    if (pointerEvent.button !== 0) return;

    const raycastService = RaycastService.inst();
    const position = raycastService.raycastFloor(pointerEvent);

    if (!position) {
      console.warn('[WallCreationMode] No floor intersection');
      return;
    }

    // Левый клик - зафиксировать точку и создать стену
    this.fixPoint(position);
  };

  /**
   * Обработка движения мыши
   */
  private handlePointerMove = (event: Event): void => {
    const pointerEvent = event as PointerEvent;
    if (!this.isActive || !this.cursorPoint) return;

    const raycastService = RaycastService.inst();
    const position = raycastService.raycastFloor(pointerEvent);

    if (!position) return;

    // Переместить cursorPoint к позиции курсора
    this.cursorPoint.position.copy(position);

    // Обновить preview стены если есть lastFixedPoint
    if (this.lastFixedPoint) {
      this.updatePreview(position);
    }

    RendererManager.inst().render();
  };

  /**
   * Обработка нажатия клавиш
   */
  private handleKeyDown = (event: Event): void => {
    if (!this.isActive) return;

    // ESC - отмена (поддержка и KeyboardEvent, и синтетического Event в worker)
    const key = (event as KeyboardEvent).key;
    if (key === 'Escape') {
      this.deactivate();
    }
  };

  /**
   * Создать точку, привязанную к курсору
   */
  private createCursorPoint(position: THREE.Vector3): void {
    console.log('[WallCreationMode] Creating cursor point at', position);

    // Создать временную точку
    this.cursorPoint = PointsManager.inst().createPoint(position.x, position.y, position.z);

    // Пометить как точку курсора
    this.cursorPoint.userData.isCursorPoint = true;
    this.cursorPoint.userData.type = 'wall_creation_cursor';

    // Изменить цвет для визуального отличия (голубой)
    const material = this.cursorPoint.material as THREE.MeshStandardMaterial;
    material.color.set(0x4488ff);

    RendererManager.inst().render();
  }

  /**
   * Зафиксировать точку и создать стену
   */
  private fixPoint(position: THREE.Vector3): void {
    if (!this.cursorPoint) return;

    console.log('[WallCreationMode] Fixing point at', position);

    // Установить позицию cursorPoint в место клика
    this.cursorPoint.position.copy(position);

    // Превратить cursorPoint в постоянную точку
    this.cursorPoint.userData.isCursorPoint = false;
    delete this.cursorPoint.userData.type;

    // Вернуть стандартный красный цвет
    const material = this.cursorPoint.material as THREE.MeshStandardMaterial;
    material.color.set(0xff0000);

    // Если есть предыдущая точка - создать стену
    if (this.lastFixedPoint) {
      this.createWall(this.lastFixedPoint, this.cursorPoint);
    }

    // Сохранить эту точку как lastFixedPoint
    this.fixedPoints.push(this.cursorPoint);
    this.lastFixedPoint = this.cursorPoint;

    // Создать новую точку для курсора
    this.createCursorPoint(position.clone());

    RendererManager.inst().render();
  }

  /**
   * Обновить preview стены
   */
  private updatePreview(endPosition: THREE.Vector3): void {
    if (!this.lastFixedPoint) return;

    const startPos = this.lastFixedPoint.position;

    // Вычислить параметры стены
    const dx = endPosition.x - startPos.x;
    const dz = endPosition.z - startPos.z;
    const length = Math.sqrt(dx * dx + dz * dz);

    // Проверка минимальной длины
    if (length < this.minWallLength) {
      // Скрыть preview если стена слишком короткая
      if (this.previewWall) {
        this.previewWall.visible = false;
      }
      return;
    }

    // Удалить старый preview если есть
    if (this.previewWall) {
      this.previewWall.geometry.dispose();
      if (this.previewWall.parent) {
        this.previewWall.parent.remove(this.previewWall);
      }
    }

    // Создать preview стены
    this.previewWall = this.createPreviewWallMesh(startPos, endPosition);
    this.previewWall.visible = true;

    EventBus.emit('wall:creation:preview-updated', {
      wall: this.previewWall,
      length,
    });
  }

  /**
   * Создать mesh для preview стены
   * Использует ту же геометрию, что и настоящая стена
   */
  private createPreviewWallMesh(start: THREE.Vector3, end: THREE.Vector3): THREE.Mesh {
    // Создать временные Point объекты для WallGeometry
    const point1: Point = {
      id: -1,
      pos: { x: start.x, y: start.y, z: start.z },
      type: 'wall',
    };

    const point2: Point = {
      id: -2,
      pos: { x: end.x, y: end.y, z: end.z },
      type: 'wall',
    };

    const pointsMap = new Map<number, Point>();
    pointsMap.set(-1, point1);
    pointsMap.set(-2, point2);

    // Создать временные WallData для WallGeometry
    const wallData: WallData = {
      id: -1,
      p: { id: [-1, -2] },
      size: {
        y: this.defaultWallHeight,
        z: this.defaultWallWidth,
      },
      windows: [],
      doors: [],
      material: [],
    };

    // Использовать ту же геометрию, что и настоящая стена
    const geometry = WallGeometry.createWallGeometry(wallData, pointsMap);

    if (!geometry) {
      // Fallback на BoxGeometry если что-то пошло не так
      const dx = end.x - start.x;
      const dz = end.z - start.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);

      const fallbackGeometry = new THREE.BoxGeometry(
        length,
        this.defaultWallHeight,
        this.defaultWallWidth
      );
      const material = new THREE.MeshStandardMaterial({
        color: 0x44ff88,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(fallbackGeometry, material);
      mesh.position.set((start.x + end.x) / 2, this.defaultWallHeight / 2, (start.z + end.z) / 2);
      mesh.rotation.y = angle;
      WallsManager.inst().addToScene(mesh);
      return mesh;
    }

    // Материал с полупрозрачностью (зеленый)
    const material = new THREE.MeshStandardMaterial({
      color: 0x44ff88,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);

    // Добавить в сцену
    WallsManager.inst().addToScene(mesh);

    return mesh;
  }

  /**
   * Создать стену между двумя точками
   */
  private createWall(point1: PointWall, point2: PointWall): void {
    const startPos = point1.position;
    const endPos = point2.position;

    // Вычислить длину
    const dx = endPos.x - startPos.x;
    const dz = endPos.z - startPos.z;
    const length = Math.sqrt(dx * dx + dz * dz);

    // Проверка минимальной длины
    if (length < this.minWallLength) {
      console.warn('[WallCreationMode] Wall too short:', length);
      EventBus.emit('wall:creation:error', {
        code: 'TOO_SHORT',
        message: `Стена слишком короткая (мин. ${this.minWallLength} м)`,
      });
      return;
    }

    console.log('[WallCreationMode] Creating wall with length:', length);

    // Создать стену через WallsManager
    const wall = WallsManager.inst().createWallBetweenPoints(point1, point2);

    if (wall) {
      console.log('[WallCreationMode] Wall created successfully');

      EventBus.emit('wall:creation:completed', { wall });

      // Очистить preview стены
      this.clearPreview();

      RendererManager.inst().render();
    } else {
      console.error('[WallCreationMode] Failed to create wall');
      EventBus.emit('wall:creation:error', {
        code: 'CREATION_FAILED',
        message: 'Не удалось создать стену',
      });
    }
  }

  /**
   * Очистить preview стены
   */
  private clearPreview(): void {
    if (this.previewWall) {
      this.previewWall.geometry.dispose();
      if (this.previewWall.material instanceof THREE.Material) {
        this.previewWall.material.dispose();
      }
      if (this.previewWall.parent) {
        this.previewWall.parent.remove(this.previewWall);
      }
      this.previewWall = null;
    }
  }

  /**
   * Очистить все временные объекты
   */
  private cleanup(): void {
    // Удалить preview стены
    this.clearPreview();

    // Удалить точку курсора
    if (this.cursorPoint) {
      PointsManager.inst().deletePoint(this.cursorPoint);
      this.cursorPoint = null;
    }

    // Удалить все зафиксированные точки-сироты (без стен)
    for (const point of this.fixedPoints) {
      const pointId = point.userData.pointId as number;
      if (!WallsManager.inst().hasWalls(pointId)) {
        PointsManager.inst().deletePoint(point);
      }
    }
    this.fixedPoints = [];
    this.lastFixedPoint = null;

    RendererManager.inst().render();
  }

  /**
   * Подписаться на события.
   * Main thread: подписка на canvas + window.
   * Worker: подписка на DomStub (pointerdown) + DomStub.ownerDocument (pointermove, keydown).
   */
  private subscribeToEvents(): void {
    const domStub = SceneManager.inst().getDomStub();

    if (domStub) {
      // Worker: DomStub для pointerdown, ownerDocument для pointermove и keydown
      domStub.addEventListener('pointerdown', this.handlePointerDown);
      domStub.ownerDocument.addEventListener('pointermove', this.handlePointerMove);
      domStub.ownerDocument.addEventListener('keydown', this.handleKeyDown as EventListener);
    } else {
      // Main thread: подписка на canvas + window
      const canvas = RendererManager.inst().getCanvas();
      if (canvas) {
        canvas.addEventListener('pointerdown', this.handlePointerDown);
        canvas.addEventListener('pointermove', this.handlePointerMove);
        canvas.addEventListener('contextmenu', this.handleContextMenu);
      }
      window.addEventListener('keydown', this.handleKeyDown);
    }
  }

  /**
   * Отписаться от событий
   */
  private unsubscribeFromEvents(): void {
    const domStub = SceneManager.inst().getDomStub();

    if (domStub) {
      domStub.removeEventListener('pointerdown', this.handlePointerDown);
      domStub.removeEventListener('pointermove', this.handlePointerMove);
      domStub.ownerDocument.removeEventListener('keydown', this.handleKeyDown as EventListener);
    } else {
      const canvas = RendererManager.inst().getCanvas();
      if (canvas) {
        canvas.removeEventListener('pointerdown', this.handlePointerDown);
        canvas.removeEventListener('pointermove', this.handlePointerMove);
        canvas.removeEventListener('contextmenu', this.handleContextMenu);
      }
      window.removeEventListener('keydown', this.handleKeyDown);
    }
  }

  /**
   * Блокировать контекстное меню
   */
  private handleContextMenu = (event: Event): void => {
    event.preventDefault();
  };

  /**
   * Установить курсор
   */
  private setCursor(cursor: string): void {
    const canvas = RendererManager.inst().getCanvas();
    if (canvas && 'style' in canvas) {
      canvas.style.cursor = cursor;
    }
  }
}
