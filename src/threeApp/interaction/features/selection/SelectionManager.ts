import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import { EffectsManager }   from '@/threeApp/scene/EffectsManager';
import { RendererManager }  from '@/threeApp/scene/RendererManager';
import * as EventBus        from '@/threeApp/interaction/core/EventBus';

export class SelectionManager extends ContextSingleton<SelectionManager> {
  private selected: THREE.Object3D | null = null;

  /**
   * Выделить объект. Если тот же — ничего не делает.
   * Если другой — снимает старое, ставит новое.
   */
  public select(obj: THREE.Object3D): void {
    if (this.selected === obj) return;

    this.selected = obj;
    EffectsManager.inst().outlinePass.selectedObjects = [obj];

    RendererManager.inst().render();
    EventBus.emit('selection:changed', obj);
  }

  /**
   * Снять выделение. Если ничего не выделено — ничего не делает.
   */
  public deselect(): void {
    if (!this.selected) return;

    this.selected = null;
    EffectsManager.inst().clearOutlineMask();

    RendererManager.inst().render();
    EventBus.emit('selection:changed', null);
  }

  public getSelected(): THREE.Object3D | null {
    return this.selected;
  }
}
