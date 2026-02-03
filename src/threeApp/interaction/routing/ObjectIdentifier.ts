import * as THREE from 'three';

export type ObjectType = 'point' | 'wall' | 'unknown';

export function identifyObject(obj: THREE.Object3D): ObjectType {
  const type = obj.userData?.type;
  if (type === 'point' || type === 'wall') return type;
  return 'unknown';
}
