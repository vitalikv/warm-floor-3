import * as THREE from 'three';
import { ContextSingleton } from '../../../core/ContextSingleton';
import { SceneManager } from '../../scene/SceneManager';
import { PointWall } from './PointWall';

export class PointsManager extends ContextSingleton<PointsManager> {
  private id = 0;
  private geometry = new THREE.SphereGeometry(0.1, 16, 16);
  private material = new THREE.MeshStandardMaterial({ color: 0xff0000 });

  public createPoint({ pos = new THREE.Vector3(), id = undefined }: { pos: THREE.Vector3; id: number | undefined }) {
    const point = new PointWall(this.geometry, this.material);
    point.position.set(pos.x, pos.y, pos.z);
    point.userData = { type: 'point' };

    if (!id) {
      point.userData.pointId = this.newId();
    } else {
      point.userData.pointId = id;
    }

    const scene = SceneManager.inst().getScene();
    scene.add(point);

    return point;
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
