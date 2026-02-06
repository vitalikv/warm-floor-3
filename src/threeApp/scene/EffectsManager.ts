import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass }      from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass }     from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { OutputPass }      from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass }      from 'three/examples/jsm/postprocessing/ShaderPass.js';

import { CameraManager } from '@/threeApp/scene/CameraManager';
import { SceneManager }  from '@/threeApp/scene/SceneManager';

export class EffectsManager extends ContextSingleton<EffectsManager> {
  public composer!: EffectComposer;

  /**
   * Паблик — подключается в Stage 4 с selection:
   *   EffectsManager.inst().outlinePass.selectedObjects = [ mesh ];
   */
  public outlinePass!: OutlinePass;

  private renderPass!: RenderPass;
  private linePass!: ShaderPass;
  public enabled = false;

  private renderer!: THREE.WebGLRenderer;

  public init({ renderer, width, height }: {
    renderer: THREE.WebGLRenderer;
    width: number;
    height: number;
  }) {
    if (this.enabled) return;
    this.enabled = true;
    this.renderer = renderer;

    const scene  = SceneManager.inst().getScene();
    const camera = CameraManager.inst().getCurrentCamera();

    this.initComposer(     { width, height }, scene, camera);
    this.initOutlineEffect({ width, height }, scene, camera);
    this.initLineEffect(   { width, height });
  }

  // ── composer ──────────────────────────────────────────────────
  private initComposer(
    rect:   { width: number; height: number },
    scene:  THREE.Scene,
    camera: THREE.Camera,
  ) {
    const renderTarget = new THREE.WebGLRenderTarget(rect.width, rect.height, { samples: 4 });

    this.composer = new EffectComposer(this.renderer, renderTarget);
    this.composer.setPixelRatio(this.renderer.getPixelRatio());

    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);

    const outputPass = new OutputPass();
    this.composer.addPass(outputPass);
    outputPass.renderToScreen = true;
  }

  // ── outline ───────────────────────────────────────────────────
  private initOutlineEffect(
    rect:   { width: number; height: number },
    scene:  THREE.Scene,
    camera: THREE.Camera,
  ) {
    const resolution = new THREE.Vector2(rect.width, rect.height);

    this.outlinePass = new OutlinePass(resolution, scene, camera);

    this.outlinePass.edgeStrength  = 1.0;
    this.outlinePass.edgeGlow      = 0;
    this.outlinePass.edgeThickness = 0.0;
    this.outlinePass.pulsePeriod   = 0;

    this.outlinePass.visibleEdgeColor.setHex(0x00ff00);
    this.outlinePass.hiddenEdgeColor.setHex(0x00ff00);
    this.outlinePass.overlayMaterial.blending = THREE.CustomBlending;

    this.outlinePass.selectedObjects = [];   // подключается в Stage 4

    this.composer.addPass(this.outlinePass);
  }

  // ── line shader ───────────────────────────────────────────────
  private initLineEffect(rect: { width: number; height: number }) {
    const lineShader = {
      uniforms: {
        tDiffuse:      { value: null },
        maskTexture:   { value: null },
        lineColor:     { value: new THREE.Color(0x00ff00) },
        lineThickness: { value: 1 },
        resolution:    { value: new THREE.Vector2(rect.width, rect.height) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D maskTexture;
        uniform vec3  lineColor;
        uniform float lineThickness;
        uniform vec2  resolution;
        varying vec2  vUv;

        void main() {
          vec4  sceneColor  = texture2D(tDiffuse, vUv);
          float centerMask  = texture2D(maskTexture, vUv).r;

          vec2 gradient = vec2(
            texture2D(maskTexture, vUv + vec2(1.0/resolution.x, 0.0)).r -
            texture2D(maskTexture, vUv - vec2(1.0/resolution.x, 0.0)).r,
            texture2D(maskTexture, vUv + vec2(0.0, 1.0/resolution.y)).r -
            texture2D(maskTexture, vUv - vec2(0.0, 1.0/resolution.y)).r
          );

          float edgeStrength = length(gradient);
          float line = smoothstep(0.5 - lineThickness * 0.01, 0.5 + lineThickness * 0.01, edgeStrength);
          line *= centerMask;

          gl_FragColor = mix(sceneColor, vec4(lineColor, 1.0), line);
        }
      `,
    };

    this.linePass = new ShaderPass(lineShader);
    this.linePass.renderToScreen  = true;
    this.linePass.material.depthTest  = false;
    this.linePass.material.depthWrite = false;
    this.linePass.material.transparent = true;

    // маска из OutlinePass → uniforms ShaderPass
    this.linePass.uniforms.maskTexture.value = this.outlinePass.renderTargetMaskBuffer.texture;

    this.composer.addPass(this.linePass);
  }

  // ── resize ────────────────────────────────────────────────────
  /**
   * Обновить размеры при resize.
   *
   * Примечание: OutlinePass внутренние render-targets создаются в конструкторе
   * и не ресайзятся. Артефакты возможны только при наличии selectedObjects —
   * фиксируется в Stage 4 вместе с подключением selection.
   */
  public setSize(width: number, height: number) {
    this.composer.setSize(width, height);

    if (this.linePass) {
      this.linePass.uniforms.resolution.value.set(width, height);
    }
  }

  // ── render ────────────────────────────────────────────────────
  /**
   * Рендер через composer.
   * Синхронизирует камеру перед кадром (поддержка 2D/3D toggle).
   * Возвращает суммарные draw calls за кадр.
   */
  public render(): number {
    const camera = CameraManager.inst().getCurrentCamera();
    this.renderPass.camera = camera;
    (this.outlinePass as any).camera = camera;   // OutlinePass.camera не в public-типах three.js

    // autoReset по умолчанию true в r182: каждый renderer.render() (RenderPass + FullScreenQuad в ShaderPass)
    // сбрасывает info перед gl.draw. Отключаем, чтобы аккумулировать суммарные draw calls за кадр.
    const prevAutoReset = this.renderer.info.autoReset;
    this.renderer.info.autoReset = false;
    this.renderer.info.reset();
    this.composer.render();
    this.renderer.info.autoReset = prevAutoReset;
    return this.renderer.info.render.calls;
  }

  public dispose() {
    this.composer.dispose();
    this.renderPass.dispose();
    this.outlinePass.dispose();
  }
}
