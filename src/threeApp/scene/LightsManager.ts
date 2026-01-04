import * as THREE from 'three';
import { ContextSingleton } from '../../core/ContextSingleton';
import { SceneManager } from './SceneManager';

/**
 * Менеджер освещения
 */
export class LightsManager extends ContextSingleton<LightsManager> {
  public init(): void {
    const scene = SceneManager.inst().getScene();

    // Окружающее освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Направленное освещение
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    scene.add(directionalLight);
  }
}

