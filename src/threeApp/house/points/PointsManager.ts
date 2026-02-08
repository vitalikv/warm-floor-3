import * as THREE from 'three';
import { ContextSingleton } from '../../../core/ContextSingleton';
import { SceneManager } from '../../scene/SceneManager';
import { PointWall } from './PointWall';

export class PointsManager extends ContextSingleton<PointsManager> {
  private id = 0;
  private geometry = new THREE.SphereGeometry(0.1, 16, 16);
  private material = new THREE.MeshStandardMaterial({ color: 0xff0000 });

  public createPoint(x: number | { pos: THREE.Vector3; id: number | undefined }, y?: number, z?: number) {
    let pos: THREE.Vector3;
    let id: number | undefined;

    // Поддержка обоих синтаксисов: createPoint(x, y, z) и createPoint({ pos, id })
    if (typeof x === 'object') {
      pos = x.pos;
      id = x.id;
    } else {
      pos = new THREE.Vector3(x, y ?? 0, z ?? 0);
      id = undefined;
    }

    const point = new PointWall(this.geometry, this.material);
    point.position.set(pos.x, pos.y, pos.z);
    point.userData = { type: 'point' };

    if (!id) {
      point.userData.pointId = this.newId();
    } else {
      point.userData.pointId = id;
      // Обновить счетчик ID, чтобы новые точки не конфликтовали
      this.updateId(id);
    }

    const scene = SceneManager.inst().getScene();
    scene.add(point);

    return point;
  }

  /**
   * Удалить точку из сцены
   */
  public deletePoint(point: PointWall): void {
    const scene = SceneManager.inst().getScene();
    scene.remove(point);

    // Освобождение ресурсов не требуется, так как геометрия и материал общие
  }

  /**
   * Добавить объект в сцену (для preview объектов)
   */
  public addToScene(object: THREE.Object3D): void {
    const scene = SceneManager.inst().getScene();
    scene.add(object);
  }

  private newId() {
    const newId = this.id;
    this.updateId();
    return newId;
  }

  private updateId(id: number | undefined = undefined) {
    if (id && id > this.id) {
      this.id = id;
    }

    this.id = this.id + 1;
  }
}
