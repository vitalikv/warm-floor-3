import * as THREE from 'three';
import { ContextSingleton } from '../../core/ContextSingleton';
import { SceneManager } from './SceneManager';

/**
 * Менеджер объектов сцены
 */
export class ObjectsManager extends ContextSingleton<ObjectsManager> {
  public init(): void {
    const scene = SceneManager.inst().getScene();

    // Создание сетки
    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
    scene.add(gridHelper);
  }
}

