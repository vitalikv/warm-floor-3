import * as THREE from 'three';
import { ContextSingleton } from '../../core/ContextSingleton';

/**
 * Менеджер рендерера
 */
export class RendererManager extends ContextSingleton<RendererManager> {
  public renderer: THREE.WebGLRenderer;

  public init(): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  public appendToDOM(containerId: string = 'app'): void {
    const app = document.getElementById(containerId);
    if (app) {
      app.appendChild(this.renderer.domElement);
    } else {
      document.body.appendChild(this.renderer.domElement);
    }
  }

  public updateSize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getDomElement(): HTMLElement {
    return this.renderer.domElement;
  }
}

