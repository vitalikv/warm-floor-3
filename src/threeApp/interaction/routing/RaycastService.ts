import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import { CameraManager } from '@/threeApp/scene/CameraManager';
import { SceneManager } from '@/threeApp/scene/SceneManager';
import { RendererManager } from '@/threeApp/scene/RendererManager';

export class RaycastService extends ContextSingleton<RaycastService> {
  private raycaster = new THREE.Raycaster();
  private floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Плоскость пола (Y=0)

  /**
   * Получить rect (поддержка main thread и worker через DomStub)
   */
  private getRect(): DOMRect {
    const domStub = SceneManager.inst().getDomStub();
    if (domStub) {
      return domStub.getBoundingClientRect();
    }
    return RendererManager.inst().getDomElement().getBoundingClientRect();
  }

  public intersect(clientX: number, clientY: number): THREE.Intersection[] {
    const rect = this.getRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(mouse, CameraManager.inst().getCurrentCamera());
    return this.raycaster.intersectObjects(SceneManager.inst().getScene().children, true);
  }

  /**
   * Raycast на плоскость пола (Y=0)
   * Возвращает позицию пересечения с плоскостью пола
   */
  public raycastFloor(event: PointerEvent | MouseEvent): THREE.Vector3 | null {
    const rect = this.getRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    this.raycaster.setFromCamera(mouse, CameraManager.inst().getCurrentCamera());

    const target = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.floorPlane, target);

    if (!target) {
      return null;
    }

    return target;
  }
}
