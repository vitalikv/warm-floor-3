import * as THREE from 'three';
import { DragBehavior } from '@/threeApp/interaction/behaviors/DragBehavior';
import { CommandManager } from '@/threeApp/interaction/commands/CommandManager';
import { MovePointCommand } from '@/threeApp/interaction/commands/MovePointCommand';
import { MouseManager } from '@/threeApp/scene/MouseManager';
import { ControlsManager } from '@/threeApp/scene/ControlsManager';
import type { RouteData } from '@/threeApp/interaction/routing/ClickRouter';

export class PointDragHandler {
  private dragBehavior = new DragBehavior();
  private activeObject: THREE.Mesh | null = null;
  private startPosition = new THREE.Vector3();

  public handle(data: RouteData): void {
    switch (data.action) {
      case 'down':  this.onDown(data); break;
      case 'move':  this.onMove();     break;
      case 'up':    this.onUp();       break;
    }
  }

  private onDown(data: RouteData): void {
    this.activeObject = data.object as THREE.Mesh;
    this.startPosition = this.activeObject.position.clone();

    ControlsManager.inst().getControls().enabled = false;

    this.dragBehavior.startDrag(this.activeObject, MouseManager.inst().getRaycaster());
  }

  private onMove(): void {
    if (!this.activeObject || !this.dragBehavior.isRunning()) return;

    const delta = this.dragBehavior.updateDrag(MouseManager.inst().getRaycaster());
    if (!delta) return;

    this.activeObject.position.add(delta);

    const pointId = this.activeObject.userData.pointId;
    if (pointId !== undefined) {
      CommandManager.inst().execute(
        new MovePointCommand(pointId, this.startPosition, this.activeObject.position.clone())
      );
    }
  }

  private onUp(): void {
    this.dragBehavior.endDrag();
    ControlsManager.inst().getControls().enabled = true;
    this.activeObject = null;
  }
}
