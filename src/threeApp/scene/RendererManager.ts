import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import { CameraManager } from '@/threeApp/scene/CameraManager';
import { SceneManager } from '@/threeApp/scene/SceneManager';
import { EffectsManager }    from '@/threeApp/scene/EffectsManager';
import { PerformanceMonitor } from '@/utils/helpers/PerformanceMonitor';


export class RendererManager extends ContextSingleton<RendererManager> {
  public renderer!: THREE.WebGLRenderer;

  public init({ canvas, rect, pixelRatio }: { canvas: HTMLCanvasElement | OffscreenCanvas; rect: DOMRectReadOnly; pixelRatio?: number }) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, stencil: true });
    this.updateSize({ width: rect.width, height: rect.height });
    this.renderer.setPixelRatio(pixelRatio ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1));
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

  /**
   * Получить canvas (может быть HTMLCanvasElement или OffscreenCanvas)
   */
  public getCanvas(): HTMLCanvasElement | OffscreenCanvas {
    return this.renderer.domElement as HTMLCanvasElement | OffscreenCanvas;
  }

  public render() {
    if (!this.renderer) return;

    let drawCalls: number;

    if (EffectsManager.inst().enabled) {
      drawCalls = EffectsManager.inst().render();
    } else {
      this.renderer.info.reset();
      const camera = CameraManager.inst().getCurrentCamera();
      this.renderer.render(SceneManager.inst().getScene(), camera);
      drawCalls = this.renderer.info.render.calls;
    }

    PerformanceMonitor.inst().onFrameRendered(drawCalls);
  }
}
