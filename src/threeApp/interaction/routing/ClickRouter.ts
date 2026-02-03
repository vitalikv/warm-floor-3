import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import type { ObjectType } from './ObjectIdentifier';

export interface RouteData {
  objectType: ObjectType;
  object: THREE.Object3D;
  action: 'down' | 'move' | 'up';
  clientX: number;
  clientY: number;
}

export class ClickRouter extends ContextSingleton<ClickRouter> {
  private handler: ((data: RouteData) => void) | null = null;

  public onRouted(fn: (data: RouteData) => void): void {
    this.handler = fn;
  }

  public route(data: RouteData): void {
    this.handler?.(data);
  }
}
