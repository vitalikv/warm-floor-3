import * as THREE from 'three';
import { ContextSingleton } from '../../core/ContextSingleton';
import { CameraManager } from '../scene/CameraManager';
import { SceneManager } from '../scene/SceneManager';
import { RendererManager } from '../scene/RendererManager';
import { MouseManager } from '../scene/MouseManager';
import { ClickHandlerManager, ObjectPriority } from '../scene/ClickHandlerManager';
import { ControlsManager } from '../scene/ControlsManager';
import { WallBuilder } from './WallBuilder';

/**
 * Менеджер для перемещения точек
 * Для ортогональной камеры: перемещение начинается сразу при зажатии мыши на точке
 * Для перспективной камеры: сначала клик для выбора точки, затем повторное зажатие для перемещения
 */
export class PointDragManager extends ContextSingleton<PointDragManager> {
  private isDragging: boolean = false;
  private selectedPoint: THREE.Mesh | null = null;
  private selectedPointId: number | null = null;
  private dragPlane: THREE.Plane;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private mouseDownPosition: { x: number; y: number } | null = null;

  public init(): void {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    // Плоскость для перемещения (горизонтальная плоскость XZ на уровне y=0)
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.setupEventListeners();
    this.registerClickHandler();
  }

  private registerClickHandler(): void {
    // Регистрируем обработчик кликов для перспективной камеры (для обратной совместимости)
    // Основная логика выбора точки теперь в onMouseDown
    ClickHandlerManager.inst().registerHandler('point', ObjectPriority.point, (object, _intersect) => {
      const pointId = object.userData?.pointId;
      if (pointId !== undefined && object instanceof THREE.Mesh) {
        // Для перспективной камеры просто возвращаем true, чтобы показать, что точка обработана
        if (CameraManager.inst().isPerspectiveMode) {
          return true;
        }
      }
      return false;
    });
  }

  private setupEventListeners(): void {
    const domElement = RendererManager.inst().getDomElement();

    domElement.addEventListener('mousedown', (event) => this.onMouseDown(event));
    domElement.addEventListener('mousemove', (event) => this.onMouseMove(event));
    domElement.addEventListener('mouseup', (event) => this.onMouseUp(event));
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return; // Только левая кнопка мыши

    const point = this.getPointUnderCursor(event.clientX, event.clientY);
    const isPerspective = CameraManager.inst().isPerspectiveMode;

    if (!point) {
      // Если кликнули не на точку, сбрасываем выбор для перспективной камеры
      if (isPerspective) {
        this.selectedPoint = null;
        this.selectedPointId = null;
      }
      return;
    }

    if (isPerspective) {
      // Для перспективной камеры: проверяем, выбрана ли уже эта точка
      if (this.selectedPointId === point.userData.pointId) {
        // Повторное зажатие на выбранной точке - начинаем перемещение
        this.startDragging(point, event.clientX, event.clientY);
        // Предотвращаем обработку события контролами камеры
        event.stopPropagation();
        event.preventDefault();
      } else {
        // Первый клик - просто выбираем точку (не начинаем перемещение)
        this.selectedPoint = point;
        this.selectedPointId = point.userData.pointId;
        console.log('Точка выбрана:', this.selectedPointId);
        // Не предотвращаем событие, чтобы контролы камеры могли работать
      }
    } else {
      // Для ортогональной камеры: сразу начинаем перемещение
      this.startDragging(point, event.clientX, event.clientY);
      // Предотвращаем обработку события контролами камеры
      event.stopPropagation();
      event.preventDefault();
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.isDragging || !this.selectedPoint) return;

    // Предотвращаем обработку события контролами камеры во время перетаскивания
    event.stopPropagation();
    event.preventDefault();

    // Обновляем позицию точки при перемещении мыши
    const newPosition = this.getPositionOnPlane(event.clientX, event.clientY);
    if (newPosition) {
      this.updatePointPosition(this.selectedPoint, newPosition);
    }
  }

  private onMouseUp(event: MouseEvent): void {
    if (event.button !== 0) return;

    if (this.isDragging) {
      // Предотвращаем обработку события контролами камеры
      event.stopPropagation();
      event.preventDefault();
      this.stopDragging();
    }
  }

  private startDragging(point: THREE.Mesh, mouseX: number, mouseY: number): void {
    this.isDragging = true;
    this.selectedPoint = point;
    this.selectedPointId = point.userData.pointId;
    this.mouseDownPosition = { x: mouseX, y: mouseY };

    // Обновляем плоскость перемещения на уровень текущей точки
    const pointY = point.position.y;
    this.dragPlane.constant = -pointY;

    // Отключаем контролы камеры во время перетаскивания
    const controls = ControlsManager.inst().getCurrentControls();
    if ('enabled' in controls) {
      (controls as any).enabled = false;
    }

    console.log('Начато перемещение точки:', this.selectedPointId);
  }

  private stopDragging(): void {
    this.isDragging = false;
    console.log('Завершено перемещение точки:', this.selectedPointId);

    // Включаем контролы камеры обратно
    const controls = ControlsManager.inst().getCurrentControls();
    if ('enabled' in controls) {
      (controls as any).enabled = true;
    }

    // Для перспективной камеры сохраняем выбор точки
    // Для ортогональной камеры сбрасываем выбор
    if (!CameraManager.inst().isPerspectiveMode) {
      this.selectedPoint = null;
      this.selectedPointId = null;
    }
  }

  private getPointUnderCursor(mouseX: number, mouseY: number): THREE.Mesh | null {
    const domElement = RendererManager.inst().getDomElement();
    const rect = domElement.getBoundingClientRect();

    // Нормализация координат мыши от -1 до 1
    this.mouse.x = ((mouseX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((mouseY - rect.top) / rect.height) * 2 + 1;

    // Обновление рейкастера
    const camera = CameraManager.inst().getCurrentCamera();
    this.raycaster.setFromCamera(this.mouse, camera);

    // Поиск пересечений
    const scene = SceneManager.inst().getScene();
    const intersects = this.raycaster.intersectObjects(scene.children, true);

    // Ищем первую точку в пересечениях
    for (const intersect of intersects) {
      if (intersect.object.userData?.type === 'point' && intersect.object instanceof THREE.Mesh) {
        return intersect.object as THREE.Mesh;
      }
    }

    return null;
  }

  private getPositionOnPlane(mouseX: number, mouseY: number): THREE.Vector3 | null {
    if (!this.selectedPoint) return null;

    const domElement = RendererManager.inst().getDomElement();
    const rect = domElement.getBoundingClientRect();

    // Нормализация координат мыши
    this.mouse.x = ((mouseX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((mouseY - rect.top) / rect.height) * 2 + 1;

    // Обновление рейкастера
    const camera = CameraManager.inst().getCurrentCamera();
    this.raycaster.setFromCamera(this.mouse, camera);

    // Находим пересечение луча с плоскостью
    const intersectionPoint = new THREE.Vector3();
    const ray = this.raycaster.ray;

    if (ray.intersectPlane(this.dragPlane, intersectionPoint)) {
      return intersectionPoint;
    }

    return null;
  }

  private updatePointPosition(pointMesh: THREE.Mesh, newPosition: THREE.Vector3): void {
    // Обновляем данные точки в WallBuilder
    const pointId = pointMesh.userData.pointId;
    if (pointId !== undefined) {
      WallBuilder.inst().updatePointPosition(pointId, newPosition);
    }
  }

  public getSelectedPointId(): number | null {
    return this.selectedPointId;
  }

  public isPointSelected(): boolean {
    return this.selectedPointId !== null;
  }
}
