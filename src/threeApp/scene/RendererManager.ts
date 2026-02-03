import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import { CameraManager } from '@/threeApp/scene/CameraManager';
import { SceneManager } from '@/threeApp/scene/SceneManager';


export class RendererManager extends ContextSingleton<RendererManager> {
  public renderer!: THREE.WebGLRenderer;

  public init({ canvas, rect }: { canvas: HTMLCanvasElement | OffscreenCanvas; rect: DOMRectReadOnly }) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true });
    this.updateSize({ width: rect.width, height: rect.height });
    this.renderer.setPixelRatio(typeof window !== 'undefined' ? window.devicePixelRatio : 1);
  }

  public updateSize({ width, height }: { width: number; height: number }) {
    this.renderer.setSize(width, height, false);
  }

  public getRenderer() {
    return this.renderer;
  }

  public getDomElement(): HTMLElement {
    return this.renderer.domElement;
  }

  public render() {
    if (!this.renderer) return;
    //if (this.stats) this.stats.begin();

    //ControlsManager.inst().update();
    const camera = CameraManager.inst().getCurrentCamera();
    this.renderer.render(SceneManager.inst().getScene(), camera);

    //if (this.stats) this.stats.end();
  }
}
