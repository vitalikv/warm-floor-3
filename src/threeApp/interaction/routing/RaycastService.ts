import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import { CameraManager } from '@/threeApp/scene/CameraManager';
import { SceneManager } from '@/threeApp/scene/SceneManager';
import { RendererManager } from '@/threeApp/scene/RendererManager';

export class RaycastService extends ContextSingleton<RaycastService> {
  private raycaster = new THREE.Raycaster();

  public intersect(clientX: number, clientY: number): THREE.Intersection[] {
    const rect = RendererManager.inst().getDomElement().getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(mouse, CameraManager.inst().getCurrentCamera());
    return this.raycaster.intersectObjects(SceneManager.inst().getScene().children, true);
  }
}
