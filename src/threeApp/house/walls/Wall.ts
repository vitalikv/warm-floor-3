import * as THREE from 'three';

export class Wall extends THREE.Mesh {
  constructor(geometry: THREE.BufferGeometry, material: THREE.Material) {
    super(geometry, material);
  }
}
