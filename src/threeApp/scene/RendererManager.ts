import * as THREE from 'three';
import { ContextSingleton } from '../../core/ContextSingleton';
import { SceneManager } from './SceneManager';

export class RendererManager extends ContextSingleton<RendererManager> {
  public renderer!: THREE.WebGLRenderer;

  public init({ canvas, rect }: { canvas: HTMLCanvasElement | OffscreenCanvas; rect: DOMRectReadOnly }) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true });
    this.renderer.setSize(rect.width, rect.height, false);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  public updateSize() {
    const canvas = SceneManager.inst().getCanvas() as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    this.renderer.setSize(rect.width, rect.height, false);
  }

  public getRenderer() {
    return this.renderer;
  }

  public getDomElement(): HTMLElement {
    return this.renderer.domElement;
  }
}
