import * as THREE from 'three';
import { ContextSingleton } from '../../core/ContextSingleton';

/**
 * Менеджер сцены
 */
export class SceneManager extends ContextSingleton<SceneManager> {
  public scene!: THREE.Scene;

  public init(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);
  }

  public getScene(): THREE.Scene {
    return this.scene;
  }
}
