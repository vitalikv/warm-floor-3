import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import { CameraManager } from '@/threeApp/scene/CameraManager';
import { RendererManager } from '@/threeApp/scene/RendererManager';
import { LightsManager } from '@/threeApp/scene/LightsManager';
import { ObjectsManager } from '@/threeApp/scene/ObjectsManager';
import { ControlsManager } from '@/threeApp/scene/ControlsManager';
import { MouseManager } from '@/threeApp/scene/MouseManager';
import { ClickHandlerManager } from '@/threeApp/scene/ClickHandlerManager';

export class SceneManager extends ContextSingleton<SceneManager> {
  private canvas!: HTMLCanvasElement | OffscreenCanvas;
  public scene!: THREE.Scene;

  public init({ canvas, rect }: { canvas: HTMLCanvasElement | OffscreenCanvas; rect: DOMRectReadOnly }) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    RendererManager.inst().init({ canvas, rect });
    LightsManager.inst().init();
    CameraManager.inst().init();
    ObjectsManager.inst().init();
    ControlsManager.inst().init();
    MouseManager.inst().init();
    ClickHandlerManager.inst();
  }

  public handleResize({ width, height, left, top }: { width: number; height: number; left: number; top: number }) {
    console.log('handleResize', width, height, left, top);

    CameraManager.inst().resize();
    RendererManager.inst().updateSize();
    // важно чтобы не было мерцания
    RendererManager.inst().getRenderer().render(this.scene, CameraManager.inst().getCurrentCamera());
  }

  public getScene() {
    return this.scene;
  }

  public getCanvas() {
    return this.canvas;
  }
}
