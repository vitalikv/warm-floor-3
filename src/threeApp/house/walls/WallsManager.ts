import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import { PointsManager } from '@/threeApp/house/points/PointsManager';
import { Wall } from './Wall';
import { WallGeometry } from './WallGeometry';
import { WallMaterial } from './WallMaterial';
import type { Point, Wall as WallData } from './types';

export class WallsManager extends ContextSingleton<WallsManager> {
  private pointsMap: Map<number, Point> = new Map();
  private wallsMap: Map<number, WallData> = new Map();
  private wallMeshesMap: Map<number, THREE.Mesh> = new Map();
  private pointMeshesMap: Map<number, THREE.Mesh> = new Map();
  private scene!: THREE.Scene;

  /**
   * Строит стены и точки на сцене
   */
  public buildWalls(points: Point[], walls: WallData[], scene: THREE.Scene): void {
    this.scene = scene;
    this.pointsMap.clear();
    this.wallsMap.clear();
    this.wallMeshesMap.clear();
    this.pointMeshesMap.clear();

    // Создаем точки
    points.forEach((point) => {
      this.pointsMap.set(point.id, point);
      const pointMesh = PointsManager.inst().createPoint({ pos: new THREE.Vector3(point.pos.x, point.pos.y, point.pos.z), id: point.id });
      if (pointMesh) {
        this.pointMeshesMap.set(point.id, pointMesh);
      }
    });

    // Создаем стены
    walls.forEach((wall) => {
      this.wallsMap.set(wall.id, wall);
      const wallMesh = this.createWall(wall);
      if (wallMesh) {
        scene.add(wallMesh);
        this.wallMeshesMap.set(wall.id, wallMesh);
      }
    });
  }

  /**
   * Создает меш стены
   */
  private createWall(wall: WallData): THREE.Mesh | null {
    const geometry = WallGeometry.createWallGeometry(wall, this.pointsMap);
    if (!geometry) {
      return null;
    }

    const material = WallMaterial.createMaterial(wall.material);
    const mesh = new Wall(geometry, material);

    mesh.userData = { wallId: wall.id, type: 'wall' };

    return mesh;
  }

  /**
   * Обновляет позицию точки и перестраивает связанные стены
   */
  public updatePointPosition(pointId: number, newPosition: THREE.Vector3): void {
    const point = this.pointsMap.get(pointId);
    if (!point) {
      console.warn(`Точка ${pointId} не найдена`);
      return;
    }

    // Обновляем данные точки
    point.pos.x = newPosition.x;
    point.pos.y = newPosition.y;
    point.pos.z = newPosition.z;

    // Обновляем визуализацию точки
    const pointMesh = this.pointMeshesMap.get(pointId);
    if (pointMesh) {
      pointMesh.position.copy(newPosition);
    }

    // Находим все стены, связанные с этой точкой, и перестраиваем их
    const wallsToRebuild: number[] = [];
    for (const [wallId, wall] of this.wallsMap.entries()) {
      if (wall.p.id.includes(pointId)) {
        wallsToRebuild.push(wallId);
      }
    }

    // Перестраиваем стены
    wallsToRebuild.forEach((wallId) => {
      this.rebuildWall(wallId);
    });
  }

  /**
   * Перестраивает стену по её ID
   * Оптимизированная версия: обновляет только геометрию существующего меша
   */
  public getPoints(): Point[] {
    return Array.from(this.pointsMap.values());
  }

  public getWalls(): WallData[] {
    return Array.from(this.wallsMap.values());
  }

  private rebuildWall(wallId: number): void {
    const wall = this.wallsMap.get(wallId);
    if (!wall) {
      console.warn(`Стена ${wallId} не найдена`);
      return;
    }

    const existingMesh = this.wallMeshesMap.get(wallId);

    if (existingMesh) {
      // Меш существует - обновляем только геометрию
      const newGeometry = WallGeometry.createWallGeometry(wall, this.pointsMap);
      if (newGeometry) {
        // Освобождаем старую геометрию
        existingMesh.geometry.dispose();
        // Заменяем геометрию
        existingMesh.geometry = newGeometry;
      }
    } else {
      // Меш не существует (первое создание) - создаём новый меш
      const newWallMesh = this.createWall(wall);
      if (newWallMesh) {
        this.scene.add(newWallMesh);
        this.wallMeshesMap.set(wallId, newWallMesh);
      }
    }
  }

  /**
   * Создать стену между двумя точками (для интерактивного создания)
   */
  public createWallBetweenPoints(point1: THREE.Mesh, point2: THREE.Mesh): THREE.Mesh | null {
    const point1Id = point1.userData.pointId;
    const point2Id = point2.userData.pointId;

    if (point1Id === undefined || point2Id === undefined) {
      console.error('[WallsManager] Points must have pointId in userData');
      return null;
    }

    // Генерируем новый ID для стены
    const wallId = this.generateWallId();

    // Создаем данные стены
    const wallData: WallData = {
      id: wallId,
      p: {
        id: [point1Id, point2Id],
      },
      size: {
        y: 2.5, // Высота по умолчанию
        z: 0.2, // Толщина стены
      },
      windows: [],
      doors: [],
      material: [
        {
          index: 0,
          color: 0xcccccc,
          img: '',
        },
      ],
    };

    // Добавляем точки в pointsMap если их там нет
    if (!this.pointsMap.has(point1Id)) {
      this.pointsMap.set(point1Id, {
        id: point1Id,
        pos: {
          x: point1.position.x,
          y: point1.position.y,
          z: point1.position.z,
        },
        type: 'wall',
      });
      this.pointMeshesMap.set(point1Id, point1);
    }

    if (!this.pointsMap.has(point2Id)) {
      this.pointsMap.set(point2Id, {
        id: point2Id,
        pos: {
          x: point2.position.x,
          y: point2.position.y,
          z: point2.position.z,
        },
        type: 'wall',
      });
      this.pointMeshesMap.set(point2Id, point2);
    }

    // Добавляем стену в wallsMap
    this.wallsMap.set(wallId, wallData);

    // Создаем меш стены
    const wallMesh = this.createWall(wallData);
    if (wallMesh) {
      this.scene.add(wallMesh);
      this.wallMeshesMap.set(wallId, wallMesh);
      return wallMesh;
    }

    return null;
  }

  /**
   * Добавить объект в сцену (для preview объектов)
   */
  public addToScene(object: THREE.Object3D): void {
    if (this.scene) {
      this.scene.add(object);
    }
  }

  /**
   * Генерировать новый ID для стены
   */
  private generateWallId(): number {
    const existingIds = Array.from(this.wallsMap.keys());
    return existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  }

  /**
   * Проверить, имеет ли точка хотя бы одну стену
   */
  public hasWalls(pointId: number): boolean {
    for (const wall of this.wallsMap.values()) {
      if (wall.p.id.includes(pointId)) {
        return true;
      }
    }
    return false;
  }
}
