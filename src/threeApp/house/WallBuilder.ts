import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import { ClickHandlerManager, ObjectPriority } from '@/threeApp/scene/ClickHandlerManager';
import { PointsManager } from '@/threeApp/house/points/PointsManager';

interface Point {
  id: number;
  pos: { x: number; y: number; z: number };
  type: string;
}

interface Wall {
  id: number;
  p: { id: number[] };
  size: { y: number; z: number };
  windows: any[];
  doors: any[];
  material: Array<{ index: number; color: number; img: string }>;
}

export class WallBuilder extends ContextSingleton<WallBuilder> {
  private pointsMap: Map<number, Point> = new Map();
  private wallsMap: Map<number, Wall> = new Map();
  private wallMeshesMap: Map<number, THREE.Mesh> = new Map();
  private pointMeshesMap: Map<number, THREE.Mesh> = new Map();
  private scene!: THREE.Scene;

  public buildWalls(points: Point[], walls: Wall[], scene: THREE.Scene): void {
    this.scene = scene;
    this.pointsMap.clear();
    this.wallsMap.clear();
    this.wallMeshesMap.clear();
    this.pointMeshesMap.clear();

    points.forEach((point) => {
      this.pointsMap.set(point.id, point);
      const pointMesh = PointsManager.inst().createPoint({ pos: new THREE.Vector3(point.pos.x, point.pos.y, point.pos.z), id: point.id });
      if (pointMesh) {
        this.pointMeshesMap.set(point.id, pointMesh);
      }
    });

    walls.forEach((wall) => {
      this.wallsMap.set(wall.id, wall);
      const wallMesh = this.createWall(wall);
      if (wallMesh) {
        scene.add(wallMesh);
        this.wallMeshesMap.set(wall.id, wallMesh);
      }
    });

    this.registerClickHandlers();
  }

  private registerClickHandlers(): void {
    ClickHandlerManager.inst().registerHandler('wall', ObjectPriority.wall, (object, _intersect) => {
      const wallId = object.userData?.wallId;
      if (wallId !== undefined) {
        console.log('Кликнули на стену:', wallId);
        // Здесь можно добавить логику обработки клика на стену
        return true;
      }
      return false;
    });

    ClickHandlerManager.inst().registerHandler('point', ObjectPriority.point, (object, _intersect) => {
      const pointId = object.userData?.pointId;
      if (pointId !== undefined) {
        console.log('Кликнули на точку:', pointId);
        // Здесь можно добавить логику обработки клика на точку
        return true;
      }
      return false;
    });
  }

  private calcNormal2D(p1: THREE.Vector3, p2: THREE.Vector3, reverse = false): THREE.Vector3 {
    let x = p1.z - p2.z;
    let z = p2.x - p1.x;

    if (reverse) {
      x *= -1;
      z *= -1;
    }

    return new THREE.Vector3(x, 0, z).normalize();
  }

  /**
   * Создаёт геометрию для стены на основе данных стены
   */
  private createWallGeometry(wall: Wall): THREE.BufferGeometry | null {
    const pointIds = wall.p.id;

    if (pointIds.length < 2) {
      console.warn(`Стена ${wall.id} имеет недостаточно точек`);
      return null;
    }

    const point1 = this.pointsMap.get(pointIds[0]);
    const point2 = this.pointsMap.get(pointIds[1]);

    if (!point1 || !point2) {
      console.warn(`Не найдены точки для стены ${wall.id}`);
      return null;
    }

    const p1 = new THREE.Vector3(point1.pos.x, point1.pos.y, point1.pos.z);
    const p2 = new THREE.Vector3(point2.pos.x, point2.pos.y, point2.pos.z);

    const height = wall.size.y;
    const width = wall.size.z;

    const dir = this.calcNormal2D(p1, p2, true);
    dir.multiplyScalar(width / 2);

    const offsetL = new THREE.Vector3().sub(dir);
    const offsetR = new THREE.Vector3().add(dir);

    const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const midPointL = midPoint.clone().add(offsetL);
    const midPointR = midPoint.clone().add(offsetR);

    const contour = [p1.clone().add(offsetL), midPointL, p2.clone().add(offsetL), p2.clone().add(offsetR), midPointR, p1.clone().add(offsetR)];

    return this.createExtrudedGeometry(contour, height);
  }

  private createWall(wall: Wall): THREE.Mesh | null {
    const geometry = this.createWallGeometry(wall);
    if (!geometry) {
      return null;
    }

    const material = this.createMaterial(wall.material);
    const mesh = new THREE.Mesh(geometry, material);

    mesh.userData = { wallId: wall.id, type: 'wall' };

    return mesh;
  }

  private createExtrudedGeometry(contour: THREE.Vector3[], height: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    const normals = [];

    // Выдавливание происходит по оси Y (вверх)
    const extrudeDirection = new THREE.Vector3(0, height, 0);

    // Нормали для верхней и нижней граней (вертикальные, так как выдавливание по Y)
    const bottomNormal = new THREE.Vector3(0, -1, 0); // Вниз
    const topNormal = new THREE.Vector3(0, 1, 0); // Вверх

    // Нижняя грань (исходный контур)
    for (let i = 0; i < contour.length; i++) {
      vertices.push(contour[i].x, contour[i].y, contour[i].z);
      normals.push(bottomNormal.x, bottomNormal.y, bottomNormal.z);
    }

    // Верхняя грань (выдавливание по оси Y)
    for (let i = 0; i < contour.length; i++) {
      const extrudedPoint = contour[i].clone().add(extrudeDirection);
      vertices.push(extrudedPoint.x, extrudedPoint.y, extrudedPoint.z);
      normals.push(topNormal.x, topNormal.y, topNormal.z);
    }

    const frontFaceVertexCount = contour.length;
    const backFaceStartIndex = frontFaceVertexCount;

    // Нижняя грань (индексы по часовой стрелке, нормаль вниз)
    for (let i = 1; i < frontFaceVertexCount - 1; i++) {
      indices.push(0, i + 1, i);
    }

    // Верхняя грань (индексы против часовой стрелки, нормаль вверх)
    for (let i = 1; i < frontFaceVertexCount - 1; i++) {
      indices.push(backFaceStartIndex, backFaceStartIndex + i, backFaceStartIndex + i + 1);
    }

    // Боковые грани
    for (let i = 0; i < frontFaceVertexCount; i++) {
      const next = (i + 1) % frontFaceVertexCount;

      const v0 = contour[i];
      const v1 = contour[next];
      const v2 = v1.clone().add(extrudeDirection);
      const v3 = v0.clone().add(extrudeDirection);

      const startIdx = vertices.length / 3;

      vertices.push(v0.x, v0.y, v0.z);
      vertices.push(v1.x, v1.y, v1.z);
      vertices.push(v2.x, v2.y, v2.z);
      vertices.push(v3.x, v3.y, v3.z);

      const edge1 = new THREE.Vector3().subVectors(v1, v0);
      const edge2 = new THREE.Vector3().subVectors(v3, v0);
      const sideNormal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();

      for (let j = 0; j < 4; j++) {
        normals.push(sideNormal.x, sideNormal.y, sideNormal.z);
      }

      indices.push(startIdx, startIdx + 1, startIdx + 2);
      indices.push(startIdx, startIdx + 2, startIdx + 3);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.setIndex(indices);

    return geometry;
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
  private rebuildWall(wallId: number): void {
    const wall = this.wallsMap.get(wallId);
    if (!wall) {
      console.warn(`Стена ${wallId} не найдена`);
      return;
    }

    const existingMesh = this.wallMeshesMap.get(wallId);

    if (existingMesh) {
      // Меш существует - обновляем только геометрию
      const newGeometry = this.createWallGeometry(wall);
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

  private createMaterial(materials: Array<{ index: number; color: number; img: string }>): THREE.Material {
    if (materials && materials.length > 0) {
      const firstMaterial = materials[0];
      const color = new THREE.Color(firstMaterial.color);
      return new THREE.MeshStandardMaterial({ color });
    }

    return new THREE.MeshStandardMaterial({ color: 0xcccccc });
  }
}
