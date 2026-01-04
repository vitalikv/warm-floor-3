import * as THREE from 'three';
import { ContextSingleton } from '../../core/ContextSingleton';
import { SceneManager } from '../scene/SceneManager';

interface GridPoint {
  x: number;
  y: number;
  z: number;
}

interface GridData {
  pos: GridPoint[];
  sizeCell: number;
  offset: { x: number; y: number };
  modeLink: boolean;
}

interface JsonData {
  grids?: GridData[];
  gridGlobal?: {
    pos: GridPoint;
    count: number;
    size: number;
    visible: boolean;
  };
}

/**
 * Процессор для обработки и построения сеток из JSON данных
 */
export class GridProcessor extends ContextSingleton<GridProcessor> {
  /**
   * Обрабатывает JSON данные и строит сетки в сцене
   */
  public processGrids(jsonData: JsonData): void {
    if (!jsonData.grids || jsonData.grids.length === 0) {
      console.log('Нет сеток для обработки');
      return;
    }

    const scene = SceneManager.inst().getScene();

    // Обрабатываем каждую сетку
    jsonData.grids.forEach((grid, index) => {
      this.createGrid(grid, scene, index);
    });

    console.log(`Обработано ${jsonData.grids.length} сеток`);
  }

  /**
   * Создает визуализацию одной сетки
   */
  private createGrid(grid: GridData, scene: THREE.Scene, index: number): void {
    if (!grid.pos || grid.pos.length < 3) {
      console.warn(`Сетка ${index} имеет недостаточно точек`);
      return;
    }

    // Создаем контур полигона
    const outline = this.createGridOutline(grid.pos);
    if (outline) {
      scene.add(outline);
    }

    // Опционально: создаем внутреннюю сетку на основе sizeCell
    // Это упрощенная версия - можно расширить в будущем
    if (grid.sizeCell && grid.sizeCell > 0) {
      const gridLines = this.createGridLines(grid);
      gridLines.forEach((line) => {
        scene.add(line);
      });
    }
  }

  /**
   * Создает контур полигона сетки
   */
  private createGridOutline(points: GridPoint[]): THREE.Line | null {
    if (points.length < 2) return null;

    // Создаем массив вершин для контура
    const vertices: THREE.Vector3[] = points.map(
      (p) => new THREE.Vector3(p.x, p.y, p.z)
    );

    // Замыкаем контур (добавляем первую точку в конец)
    vertices.push(vertices[0].clone());

    // Создаем геометрию для линии
    const geometry = new THREE.BufferGeometry().setFromPoints(vertices);

    // Создаем материал для контура
    const material = new THREE.LineBasicMaterial({
      color: 0x888888,
      linewidth: 1,
    });

    // Создаем линию
    const line = new THREE.Line(geometry, material);
    line.userData = { type: 'gridOutline' };

    return line;
  }

  /**
   * Создает внутреннюю сетку на основе sizeCell с обрезкой по контуру полигона
   */
  private createGridLines(grid: GridData): THREE.Line[] {
    const lines: THREE.Line[] = [];
    const points = grid.pos;

    if (points.length < 3 || !grid.sizeCell || grid.sizeCell <= 0) {
      return lines;
    }

    // Преобразуем точки в Vector3
    const polygonVertices = points.map((p) => new THREE.Vector3(p.x, p.y, p.z));

    // Вычисляем границы полигона
    const bounds = this.calculateBounds(points);
    const { minX, maxX, minZ, maxZ, y } = bounds;

    // Создаем линии сетки по оси X (вертикальные линии)
    const countX = Math.floor((maxX - minX) / grid.sizeCell);
    for (let i = 0; i <= countX; i++) {
      const x = minX + i * grid.sizeCell;
      // Расширяем линию немного за пределы для корректного расчета пересечений
      const lineStart = new THREE.Vector3(x, y, minZ - 1);
      const lineEnd = new THREE.Vector3(x, y, maxZ + 1);
      const gridLineSegments = this.calculateGridLineSegments(
        lineStart,
        lineEnd,
        polygonVertices,
        'z'
      );
      lines.push(...gridLineSegments);
    }

    // Создаем линии сетки по оси Z (горизонтальные линии)
    const countZ = Math.floor((maxZ - minZ) / grid.sizeCell);
    for (let i = 0; i <= countZ; i++) {
      const z = minZ + i * grid.sizeCell;
      // Расширяем линию немного за пределы для корректного расчета пересечений
      const lineStart = new THREE.Vector3(minX - 1, y, z);
      const lineEnd = new THREE.Vector3(maxX + 1, y, z);
      const gridLineSegments = this.calculateGridLineSegments(
        lineStart,
        lineEnd,
        polygonVertices,
        'x'
      );
      lines.push(...gridLineSegments);
    }

    return lines;
  }

  /**
   * Вычисляет границы полигона
   */
  private calculateBounds(points: GridPoint[]): {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    y: number;
  } {
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;
    const y = points[0]?.y || 0; // Используем Y из первой точки (все точки сетки на одной высоте)

    points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    });

    return { minX, maxX, minZ, maxZ, y };
  }

  /**
   * Вычисляет сегменты линии сетки, которые находятся внутри полигона
   */
  private calculateGridLineSegments(
    lineStart: THREE.Vector3,
    lineEnd: THREE.Vector3,
    polygonVertices: THREE.Vector3[],
    sortAxis: 'x' | 'z'
  ): THREE.Line[] {
    const segments: THREE.Line[] = [];
    const intersectionPoints: THREE.Vector3[] = [];

    // Находим все точки пересечения линии с контуром полигона
    for (let i = 0; i < polygonVertices.length; i++) {
      const p1 = polygonVertices[i];
      const p2 = polygonVertices[(i + 1) % polygonVertices.length];

      if (this.checkCrossLine(lineStart, lineEnd, p1, p2)) {
        const intersection = this.intersectionTwoLines(lineStart, lineEnd, p1, p2);
        if (intersection) {
          intersectionPoints.push(intersection);
        }
      }
    }

    // Если нет пересечений, проверяем, находится ли вся линия внутри
    if (intersectionPoints.length === 0) {
      const center = new THREE.Vector3()
        .addVectors(lineStart, lineEnd)
        .multiplyScalar(0.5);
      if (this.checkPointInsideForm(center, polygonVertices)) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          lineStart,
          lineEnd,
        ]);
        const material = new THREE.LineBasicMaterial({
          color: 0xcccccc,
          linewidth: 1,
          opacity: 0.5,
          transparent: true,
        });
        const line = new THREE.Line(geometry, material);
        line.userData = { type: 'gridLine' };
        segments.push(line);
      }
      return segments;
    }

    // Сортируем точки пересечения
    if (sortAxis === 'x') {
      intersectionPoints.sort((a, b) => a.x - b.x);
    } else {
      intersectionPoints.sort((a, b) => a.z - b.z);
    }

    // Удаляем дубликаты (точки, которые очень близко друг к другу)
    const uniquePoints: THREE.Vector3[] = [];
    for (let i = 0; i < intersectionPoints.length; i++) {
      let isDuplicate = false;
      for (let j = 0; j < uniquePoints.length; j++) {
        if (intersectionPoints[i].distanceTo(uniquePoints[j]) < 0.001) {
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) {
        uniquePoints.push(intersectionPoints[i]);
      }
    }

    // Создаем сегменты между парами точек пересечения
    for (let i = 0; i < uniquePoints.length - 1; i++) {
      const segmentStart = uniquePoints[i];
      const segmentEnd = uniquePoints[i + 1];
      const center = new THREE.Vector3()
        .addVectors(segmentStart, segmentEnd)
        .multiplyScalar(0.5);

      // Проверяем, находится ли центр сегмента внутри полигона
      if (this.checkPointInsideForm(center, polygonVertices)) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          segmentStart,
          segmentEnd,
        ]);
        const material = new THREE.LineBasicMaterial({
          color: 0xcccccc,
          linewidth: 1,
          opacity: 0.5,
          transparent: true,
        });
        const line = new THREE.Line(geometry, material);
        line.userData = { type: 'gridLine' };
        segments.push(line);
      }
    }

    return segments;
  }

  /**
   * Проверяет пересечение двух отрезков (2D, в плоскости XZ)
   */
  private checkCrossLine(
    a: THREE.Vector3,
    b: THREE.Vector3,
    c: THREE.Vector3,
    d: THREE.Vector3
  ): boolean {
    const intersect = (a: number, b: number, c: number, d: number): boolean => {
      if (a > b) {
        const temp = a;
        a = b;
        b = temp;
      }
      if (c > d) {
        const temp = c;
        c = d;
        d = temp;
      }
      return Math.max(a, c) <= Math.min(b, d);
    };

    const area = (
      a: THREE.Vector3,
      b: THREE.Vector3,
      c: THREE.Vector3
    ): number => {
      return (b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x);
    };

    return (
      intersect(a.x, b.x, c.x, d.x) &&
      intersect(a.z, b.z, c.z, d.z) &&
      area(a, b, c) * area(a, b, d) <= 0 &&
      area(c, d, a) * area(c, d, b) <= 0
    );
  }

  /**
   * Находит точку пересечения двух прямых (2D, в плоскости XZ)
   */
  private intersectionTwoLines(
    a1: THREE.Vector3,
    a2: THREE.Vector3,
    b1: THREE.Vector3,
    b2: THREE.Vector3
  ): THREE.Vector3 | null {
    const denominator =
      (b2.z - b1.z) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.z - a1.z);

    // Параллельны
    if (Math.abs(denominator) < 0.0001) {
      return null;
    }

    const a =
      ((b2.x - b1.x) * (a1.z - b1.z) - (b2.z - b1.z) * (a1.x - b1.x)) /
      denominator;

    const x = a1.x + a * (a2.x - a1.x);
    const z = a1.z + a * (a2.z - a1.z);

    return new THREE.Vector3(x, a1.y, z);
  }

  /**
   * Проверяет, находится ли точка внутри многоугольника (2D, в плоскости XZ)
   */
  private checkPointInsideForm(
    point: THREE.Vector3,
    arrP: THREE.Vector3[]
  ): boolean {
    let result = false;
    let j = arrP.length - 1;

    for (let i = 0; i < arrP.length; i++) {
      const calc1 =
        (arrP[i].z < point.z && arrP[j].z >= point.z) ||
        (arrP[j].z < point.z && arrP[i].z >= point.z);
      const calc2 =
        arrP[i].x +
          ((point.z - arrP[i].z) / (arrP[j].z - arrP[i].z)) *
            (arrP[j].x - arrP[i].x) <
        point.x;

      if (calc1 && calc2) {
        result = !result;
      }

      j = i;
    }

    return result;
  }
}

