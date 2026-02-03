import * as THREE from 'three';
import type { Point, Wall } from './types';

export class WallGeometry {
  /**
   * Вычисляет 2D нормаль между двумя точками
   */
  private static calcNormal2D(p1: THREE.Vector3, p2: THREE.Vector3, reverse = false): THREE.Vector3 {
    let x = p1.z - p2.z;
    let z = p2.x - p1.x;

    if (reverse) {
      x *= -1;
      z *= -1;
    }

    return new THREE.Vector3(x, 0, z).normalize();
  }

  /**
   * Создает выдавленную геометрию из контура
   */
  private static createExtrudedGeometry(contour: THREE.Vector3[], height: number): THREE.BufferGeometry {
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
   * Создает геометрию для стены на основе данных стены и карты точек
   */
  public static createWallGeometry(wall: Wall, pointsMap: Map<number, Point>): THREE.BufferGeometry | null {
    const pointIds = wall.p.id;

    if (pointIds.length < 2) {
      console.warn(`Стена ${wall.id} имеет недостаточно точек`);
      return null;
    }

    const point1 = pointsMap.get(pointIds[0]);
    const point2 = pointsMap.get(pointIds[1]);

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
}
