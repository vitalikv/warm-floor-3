import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import { CameraManager } from '@/threeApp/scene/CameraManager';
import { SceneManager } from '@/threeApp/scene/SceneManager';
import { ControlsManager } from './ControlsManager';

export class RendererManager extends ContextSingleton<RendererManager> {
  public renderer!: THREE.WebGLRenderer;

  public init({ canvas, rect }: { canvas: HTMLCanvasElement | OffscreenCanvas; rect: DOMRectReadOnly }) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true });
    this.updateSize({ width: rect.width, height: rect.height });
    this.renderer.setPixelRatio(window.devicePixelRatio);
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

    console.log('render');

    //ControlsManager.inst().update();
    const camera = CameraManager.inst().getCurrentCamera();
    this.renderer.render(SceneManager.inst().getScene(), camera);

    //if (this.stats) this.stats.end();
  }
}
