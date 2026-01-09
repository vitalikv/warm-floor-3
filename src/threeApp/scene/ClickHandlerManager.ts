import * as THREE from 'three';
import { ContextSingleton } from '../../core/ContextSingleton';
import { CameraManager } from './CameraManager';

// Приоритеты типов объектов (чем выше число, тем выше приоритет)
// Порядок для ортогональной камеры: точки, стены, двери, окна, мебель
export const ObjectPriority = {
  point: 100,
  wall: 80,
  door: 70,
  window: 60,
  furniture: 50,
};

interface ClickHandler {
  priority: number;
  handler: (object: THREE.Object3D, intersect: THREE.Intersection) => boolean | void;
}

// Менеджер обработчиков кликов с поддержкой приоритетов
export class ClickHandlerManager extends ContextSingleton<ClickHandlerManager> {
  private handlers: Map<string, ClickHandler[]> = new Map();

  public registerHandler(type: string, priority: number, handler: (object: THREE.Object3D, intersect: THREE.Intersection) => boolean | void): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }

    const typeHandlers = this.handlers.get(type)!;
    typeHandlers.push({ priority, handler });

    // Сортировка по приоритету (от большего к меньшему)
    typeHandlers.sort((a, b) => b.priority - a.priority);
  }

  public unregisterHandler(type: string, handler: (object: THREE.Object3D, intersect: THREE.Intersection) => boolean | void): void {
    const typeHandlers = this.handlers.get(type);
    if (!typeHandlers) {
      return;
    }

    const index = typeHandlers.findIndex((h) => h.handler === handler);
    if (index !== -1) {
      typeHandlers.splice(index, 1);
    }

    if (typeHandlers.length === 0) {
      this.handlers.delete(type);
    }
  }

  public handleClick(intersects: THREE.Intersection[]): boolean {
    if (intersects.length === 0) {
      return false;
    }

    // Режим перспективной камеры: игнорируем точки, выбираем первое пересечение без приоритетов
    if (CameraManager.inst().isPerspectiveMode) {
      // Находим первое пересечение (ближайшее к камере), которое не является точкой
      for (const intersect of intersects) {
        const objectType = intersect.object.userData?.type;

        // Пропускаем точки
        if (objectType === 'point') {
          continue;
        }

        // Пропускаем объекты без типа
        if (!objectType) {
          continue;
        }

        // Проверяем, есть ли обработчик для этого типа
        const typeHandlers = this.handlers.get(objectType);
        if (!typeHandlers || typeHandlers.length === 0) {
          continue;
        }

        // Вызываем первый обработчик для этого типа (ближайшее пересечение)
        const result = typeHandlers[0].handler(intersect.object, intersect);

        // Обработчик всегда возвращает результат, прекращаем обработку
        return result === true;
      }

      return false;
    }

    // Режим ортогональной камеры: используем систему приоритетов
    // Группировка пересечений по типу объекта
    const intersectsByType = new Map<string, THREE.Intersection[]>();

    for (const intersect of intersects) {
      const objectType = intersect.object.userData?.type;
      if (!objectType) {
        continue;
      }

      if (!intersectsByType.has(objectType)) {
        intersectsByType.set(objectType, []);
      }
      intersectsByType.get(objectType)!.push(intersect);
    }

    // Получение всех типов с обработчиками, отсортированных по приоритету
    const typesWithHandlers: Array<{ type: string; priority: number }> = [];

    for (const [type, handlers] of this.handlers.entries()) {
      if (handlers.length > 0 && intersectsByType.has(type)) {
        const maxPriority = Math.max(...handlers.map((h) => h.priority));
        typesWithHandlers.push({ type, priority: maxPriority });
      }
    }

    // Сортировка типов по приоритету (от большего к меньшему)
    typesWithHandlers.sort((a, b) => b.priority - a.priority);

    // Обработка кликов по приоритету
    for (const { type } of typesWithHandlers) {
      const typeHandlers = this.handlers.get(type)!;
      const typeIntersects = intersectsByType.get(type)!;

      // Берем первое пересечение для данного типа
      const firstIntersect = typeIntersects[0];

      // Вызываем обработчики по приоритету
      for (const { handler } of typeHandlers) {
        const result = handler(firstIntersect.object, firstIntersect);

        // Если обработчик вернул true, прекращаем обработку
        if (result === true) {
          return true;
        }
      }
    }

    return false;
  }

  public clearHandlers(type?: string): void {
    if (type) {
      this.handlers.delete(type);
    } else {
      this.handlers.clear();
    }
  }
}
