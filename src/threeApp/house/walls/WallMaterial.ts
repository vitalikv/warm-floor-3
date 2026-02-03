import * as THREE from 'three';

export class WallMaterial {
  /**
   * Создает материал для стены на основе данных о материалах
   */
  public static createMaterial(materials: Array<{ index: number; color: number; img: string }>): THREE.Material {
    if (materials && materials.length > 0) {
      const firstMaterial = materials[0];
      const color = new THREE.Color(firstMaterial.color);
      return new THREE.MeshStandardMaterial({ color });
    }

    return new THREE.MeshStandardMaterial({ color: 0xcccccc });
  }
}
