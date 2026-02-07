import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import { CameraManager } from '@/threeApp/scene/CameraManager';
import { RendererManager } from '@/threeApp/scene/RendererManager';
import { LightsManager } from '@/threeApp/scene/LightsManager';
import { ObjectsManager } from '@/threeApp/scene/ObjectsManager';
import { ControlsManager } from '@/threeApp/scene/ControlsManager';
import { MouseManager } from '@/threeApp/scene/MouseManager';
import { EffectsManager } from '@/threeApp/scene/EffectsManager';
import { WorkerDomStub } from '@/threeApp/worker/WorkerDomStub';

export class SceneManager extends ContextSingleton<SceneManager> {
  private canvas!: HTMLCanvasElement | OffscreenCanvas;
  public scene!: THREE.Scene;
  private domStub: WorkerDomStub | null = null;

  public init({ canvas, rect, pixelRatio }: { canvas: HTMLCanvasElement | OffscreenCanvas; rect: DOMRectReadOnly; pixelRatio?: number }) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // В Worker canvas — OffscreenCanvas: создаём стаб для OrbitControls
    const isOffscreen = canvas instanceof OffscreenCanvas;
    if (isOffscreen) {
      this.domStub = new WorkerDomStub(rect.x, rect.y, rect.width, rect.height);
    }

    RendererManager.inst().init({ canvas, rect, pixelRatio });
    LightsManager.inst().init();
    CameraManager.inst().init({ width: rect.width, height: rect.height });
    ObjectsManager.inst().init();
    ControlsManager.inst().init(this.domStub ?? undefined);
    MouseManager.inst().init({ skipDomListeners: isOffscreen });

    EffectsManager.inst().init({
      renderer: RendererManager.inst().getRenderer(),
      width:    rect.width,
      height:   rect.height,
    });

    RendererManager.inst().render();
  }

  public handleResize({ width, height, left, top }: { width: number; height: number; left: number; top: number }) {
    RendererManager.inst().updateSize({ width, height });
    CameraManager.inst().updateViewportSize(width, height);
    CameraManager.inst().resize();
    if (this.domStub) {
      this.domStub.updateRect(left, top, width, height);
    }
    if (EffectsManager.inst().enabled) {
      EffectsManager.inst().setSize(width, height);
    }

    RendererManager.inst().render();
  }

  /** Возвращает стаб DOM-элемента (только в Worker-контексте) */
  public getDomStub(): WorkerDomStub | null {
    return this.domStub;
  }

  public getScene() {
    return this.scene;
  }

  public getCanvas() {
    return this.canvas;
  }
}
