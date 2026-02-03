import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';

export class InteractionContext extends ContextSingleton<InteractionContext> {
  private selectedObject: THREE.Object3D | null = null;

  public setSelected(obj: THREE.Object3D | null): void {
    this.selectedObject = obj;
  }

  public getSelected(): THREE.Object3D | null {
    return this.selectedObject;
  }
}
