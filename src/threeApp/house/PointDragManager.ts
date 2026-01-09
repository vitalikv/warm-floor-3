import * as THREE from 'three';
import { ContextSingleton } from '../../core/ContextSingleton';
import { CameraManager } from '../scene/CameraManager';
import { RendererManager } from '../scene/RendererManager';
import { MouseManager } from '../scene/MouseManager';
import { ClickHandlerManager, ObjectPriority } from '../scene/ClickHandlerManager';
import { ControlsManager } from '../scene/ControlsManager';
import { WallBuilder } from './WallBuilder';

// Менеджер для перемещения точек
// Для ортогональной камеры: перемещение начинается сразу при зажатии мыши на точке
// Для перспективной камеры: сначала клик для выбора точки, затем повторное зажатие для перемещения
export class PointDragManager extends ContextSingleton<PointDragManager> {
  private isDragging: boolean = false;
  private selectedPoint: THREE.Mesh | null = null;
  private selectedPointId: number | null = null;
  private dragPlane!: THREE.Plane;

  // Функции для отписки от событий
  private unsubscribeHandlers: (() => void)[] = [];

  public init(): void {
    // Плоскость для перемещения (горизонтальная плоскость XZ на уровне y=0)
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  }

  private onMouseDown(event: MouseEvent, intersects: THREE.Intersection[]): boolean {
    if (event.button !== 0) return false; // Только левая кнопка мыши

    const point = this.findPointInIntersects(intersects);
    const isPerspective = CameraManager.inst().isPerspectiveMode;

    if (!point) {
      // Если кликнули не на точку, сбрасываем выбор для перспективной камеры
      if (isPerspective) {
        this.selectedPoint = null;
        this.selectedPointId = null;
      }
      return false;
    } else {
      console.log(4444, point);
    }

    if (isPerspective) {
      // Для перспективной камеры: проверяем, выбрана ли уже эта точка
      if (this.selectedPointId === point.userData.pointId) {
        // Повторное зажатие на выбранной точке - начинаем перемещение
        this.startDragging(point, event.clientX, event.clientY);
        // Предотвращаем обработку события контролами камеры
        event.stopPropagation();
        event.preventDefault();
        return true; // Событие обработано
      } else {
        // Первый клик - просто выбираем точку (не начинаем перемещение)
        this.selectedPoint = point;
        this.selectedPointId = point.userData.pointId;
        console.log('Точка выбрана:', this.selectedPointId);
        // Не предотвращаем событие, чтобы контролы камеры могли работать
        return false;
      }
    } else {
      // Для ортогональной камеры: сразу начинаем перемещение
      this.startDragging(point, event.clientX, event.clientY);
      // Предотвращаем обработку события контролами камеры
      event.stopPropagation();
      event.preventDefault();
      return true; // Событие обработано
    }
  }

  private onMouseMove(event: MouseEvent, _intersects: THREE.Intersection[]): void {
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

  private onMouseUp(event: MouseEvent, _intersects: THREE.Intersection[]): boolean {
    if (event.button !== 0) return false;

    if (this.isDragging) {
      // Предотвращаем обработку события контролами камеры
      event.stopPropagation();
      event.preventDefault();
      this.stopDragging();
      return true; // Событие обработано
    }

    return false;
  }

  private startDragging(point: THREE.Mesh, _mouseX: number, _mouseY: number): void {
    this.isDragging = true;
    this.selectedPoint = point;
    this.selectedPointId = point.userData.pointId;

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

  // Находим точку в переданных intersects
  private findPointInIntersects(intersects: THREE.Intersection[]): THREE.Mesh | null {
    for (const intersect of intersects) {
      if (intersect.object.userData?.type === 'point' && intersect.object instanceof THREE.Mesh) {
        return intersect.object as THREE.Mesh;
      }
    }
    return null;
  }

  private getPositionOnPlane(mouseX: number, mouseY: number): THREE.Vector3 | null {
    if (!this.selectedPoint) return null;

    // Используем raycaster из MouseManager для консистентности
    const raycaster = MouseManager.inst().getRaycaster();
    const mouse = MouseManager.inst().getMouseVector();
    const camera = CameraManager.inst().getCurrentCamera();

    // Обновляем raycaster с текущими координатами мыши
    // (нормализация координат уже выполнена в MouseManager)
    // Но здесь нам нужно использовать актуальные координаты события
    const domElement = RendererManager.inst().getDomElement();
    const rect = domElement.getBoundingClientRect();

    mouse.x = ((mouseX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((mouseY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Находим пересечение луча с плоскостью
    const intersectionPoint = new THREE.Vector3();
    const ray = raycaster.ray;

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
