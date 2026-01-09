import * as THREE from 'three';
import { ContextSingleton } from '../../../core/ContextSingleton';
import { CameraManager } from '../../scene/CameraManager';
import { MouseManager } from '../../scene/MouseManager';
import { SceneManager } from '../../scene/SceneManager';
import { WallBuilder } from '../WallBuilder';

export class PointMove extends ContextSingleton<PointMove> {
  private isDown = false;
  private isMove = false;
  private isUp = false;
  private offset = new THREE.Vector3();
  private plane!: THREE.Mesh;
  private actObj: THREE.Mesh | null = null;

  constructor() {
    super();
    this.init();
  }

  public init() {
    this.plane = this.createPlane();
  }

  private createPlane() {
    const geometry = new THREE.PlaneGeometry(10000, 10000);
    const material = new THREE.MeshPhongMaterial({ color: 0xffff00, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
    //material.visible = false;
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.set(-Math.PI / 2, 0, 0);
    SceneManager.inst().getScene().add(plane);

    return plane;
  }

  public pointerDown = ({ obj }: { obj: THREE.Mesh }) => {
    this.isDown = false;
    this.isMove = false;

    this.setActObj(obj);

    this.plane.position.set(0, obj.position.y, 0);
    this.plane.rotation.set(-Math.PI / 2, 0, 0);
    this.plane.updateMatrixWorld();

    const intersects = MouseManager.inst().getRaycaster().intersectObjects([this.plane], true);
    if (intersects.length === 0) return;
    this.offset = intersects[0].point;

    this.isDown = true;
  };

  public pointerMove = () => {
    if (!this.isDown) return;
    this.isMove = true;

    const actObj = this.getActObj();
    if (!actObj) return;

    const intersects = MouseManager.inst().getRaycaster().intersectObjects([this.plane], true);
    if (intersects.length === 0) return;

    const offset = new THREE.Vector3().subVectors(intersects[0].point, this.offset);
    this.offset = intersects[0].point;

    offset.y = 0;

    actObj.position.add(offset);

    const pointId = actObj.userData.pointId;
    if (pointId !== undefined) {
      WallBuilder.inst().updatePointPosition(pointId, actObj.position);
    }
  };

  public pointerUp = () => {
    this.isDown = false;
    this.isMove = false;

    this.setActObj(null);
  };

  private setActObj(obj: THREE.Mesh | null) {
    this.actObj = obj;
  }

  private getActObj() {
    return this.actObj;
  }
}
