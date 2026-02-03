import * as THREE from 'three';
import { WallsManager } from '@/threeApp/house/walls/WallsManager';
import { RendererManager } from '@/threeApp/scene/RendererManager';
import type { Command } from './Command';

export class MovePointCommand implements Command {
  public readonly pointId: number;
  private oldPosition: THREE.Vector3;
  private newPosition: THREE.Vector3;

  constructor(pointId: number, oldPosition: THREE.Vector3, newPosition: THREE.Vector3) {
    this.pointId = pointId;
    this.oldPosition = oldPosition.clone();
    this.newPosition = newPosition.clone();
  }

  public execute(): void {
    WallsManager.inst().updatePointPosition(this.pointId, this.newPosition);
    RendererManager.inst().render();
  }

  public undo(): void {
    WallsManager.inst().updatePointPosition(this.pointId, this.oldPosition);
    RendererManager.inst().render();
  }

  public redo(): void {
    this.execute();
  }

  public canMerge(other: Command): boolean {
    return other instanceof MovePointCommand && other.pointId === this.pointId;
  }

  public merge(other: Command): void {
    this.newPosition = (other as MovePointCommand).newPosition.clone();
  }
}
