import * as THREE from 'three';
import { ContextSingleton } from '../../core/ContextSingleton';
import { SceneManager } from './SceneManager';

/**
 * Менеджер объектов сцены
 */
export class ObjectsManager extends ContextSingleton<ObjectsManager> {
  public init(): void {
    const scene = SceneManager.inst().getScene();

    // Создание куба
    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(0, 0.5, 0);
    scene.add(cube);

    // Создание сетки
    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444);
    scene.add(gridHelper);
  }
}

