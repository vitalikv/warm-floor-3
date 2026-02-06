# Stage 3 — План развития

> Базируется на результатах Stage 1 и Stage 2.
> Проверка после каждого раздела: `npm run build` должен быть зелёный.

---

## Что делает Stage 3

Три вещи, и только три:

1. **EffectsManager** — постобработка через `EffectComposer`: `RenderPass` + `OutlinePass` (фундамент для подсветки выделенных объектов в Stage 4) + custom `ShaderPass` для чёткой линии по контуру выделения. Рендер через composer заменяет прямой `renderer.render()`. Скопирован из `tp-viewer3D/EffectsManager`, адаптирован под двойную камеру (2D/3D).

2. **PerformanceMonitor + draw calls** — кустомный счётчик без сторонних библиотек. FPS считается по кольцевому буферу timestamp-ов каждого `render()` вызова; при idle (последний рендер > 1 s назад) возвращает 0. Draw calls снимаются с `renderer.info.render.calls` после каждого кадра — когда EffectsManager активен, `info` аккумулирует вызовы со всех pass-ов composer-а между `reset()` и чтением.

3. **UiStatsPanel** — оверлей `FPS / Draw calls` внизу справа. Обновляется каждые 500 ms через `setInterval` (polling, а не push — чтобы не нагружать DOM обновлением каждый кадр). Читает `PerformanceMonitor` напрямую: он живёт в `src/utils/`, не в `src/threeApp/`, поэтому правило «UI не импортирует threeApp» не нарушается.

Плюс: удаляем deprecated `PointMove.ts` (обещано в Stage 2).

---

## Уже готово (Stage 1 + 2) — не трогаем

| Файл | Что сделано |
|------|-------------|
| `src/api/apiLocal/*` | ApiLocalTypes, ApiUiToThree, ApiThreeToUi — контракт UI ↔ Three.js |
| `src/threeApp/worker/*` | WorkerManager, RenderWorker, WorkerTypes, WorkerDomStub — Worker-поток |
| `src/threeApp/interaction/core/*` | EventBus, InteractionContext, InteractionOrchestrator |
| `src/threeApp/interaction/routing/*` | RaycastService, ObjectIdentifier, ClickRouter |
| `src/threeApp/interaction/behaviors/DragBehavior.ts` | Общая drag-логика (плоскость + offset) |
| `src/threeApp/interaction/commands/*` | Command, CommandManager, MovePointCommand — фундамент Undo/Redo |
| `src/threeApp/interaction/features/points/*` | PointFeature, PointDragHandler — drag через interaction |
| `src/threeApp/scene/MouseManager.ts` | Делегирует в ClickRouter, `dispatchPointer` для Worker |
| `src/ui/LeftPanel.ts` | Placeholder «Каталог» |
| `src/ui/UiTopPanel.ts` | Сохранить через ApiUiToThree |

---

## Вне скопа Stage 3

| Тема | Почему не сейчас |
|------|------------------|
| Подключение OutlinePass к selection | Stage 4. EffectsManager — фундамент; `outlinePass.selectedObjects` подключается когда появляется selection-feature |
| Кнопки Undo / Redo в UI | Stage 4. CommandManager готов, кнопки — после того как паттерн оверлеев (StatsPanel) отработан |
| Wall features (drag, resize, split) | Stage 4. PointDrag должен быть полностью стабилен |
| Capabilities, Policies, Modes | Stage 4+ |
| RightPanel, PropertiesPanel, LevelPanel | Stage 4+ (зависят от selection) |
| Stats в Worker-режиме | PerformanceMonitor живёт там, где рендер. При `useWorker: true` нужен `postMessage` для stats — добавляется когда Worker становится default |
| `src/api/apiGlobal/` | Нет бэкенда |

---

## Раздел A: EffectsManager

### A1. `src/threeApp/scene/EffectsManager.ts`

Базируется на `EffectsManager` из `tp-viewer3D`. Отличия от оригинала:

- Убрана SMAA (в `tp-viewer3D` тоже не используется — есть MSAA через `renderTarget samples: 4`).
- `init()` принимает `renderer` + размеры явно — не читает canvas из SceneManager.
- `setSize(width, height)` — вызвано из `SceneManager.handleResize()`.
- `render()` — **без monkey-patch** `renderer.render`. Вместо этого: `renderer.info.reset()` перед `composer.render()`, затем `renderer.info.render.calls` даёт суммарные draw calls со всех pass-ов. Аккумуляция работает потому, что `info.render.calls` растёт между вызовами `renderer.render()` и `renderBufferDirect()` (ShaderPass использует FullScreenQuad), и не сбрасывается автоматически.
- `renderPass.camera` обновляется перед каждым кадром — поддержка 2D/3D toggle без внешних хуков. `outlinePass.camera` обновляется аналогично, но эффект видимый только при наличии `selectedObjects` (Stage 4).

```typescript
import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass }      from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass }     from 'three/examples/jsm/postprocessing/OutlinePass';
import { OutputPass }      from 'three/examples/jsm/postprocessing/OutputPass';
import { ShaderPass }      from 'three/examples/jsm/postprocessing/ShaderPass';

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

    this.renderer.info.reset();
    this.composer.render();
    return this.renderer.info.render.calls;
  }

  public dispose() {
    this.composer.dispose();
    this.renderPass.dispose();
    this.outlinePass.dispose();
  }
}
```

### A2. RendererManager — делегирование в EffectsManager + PerformanceMonitor

Файл: `src/threeApp/scene/RendererManager.ts`

Добавляем два импорта и меняем тело `render()`. Оба пути (с и без EffectsManager) снимают draw calls и передают в PerformanceMonitor — счётчики работают одинаково.

```typescript
// добавить импорты:
import { EffectsManager }    from '@/threeApp/scene/EffectsManager';
import { PerformanceMonitor } from '@/utils/helpers/PerformanceMonitor';

// БЫЛО:
public render() {
  if (!this.renderer) return;
  const camera = CameraManager.inst().getCurrentCamera();
  this.renderer.render(SceneManager.inst().getScene(), camera);
}

// СТАНЕТ:
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
```

### A3. SceneManager — инициализация EffectsManager

Файл: `src/threeApp/scene/SceneManager.ts`, метод `init()`

```typescript
// добавить импорт:
import { EffectsManager } from '@/threeApp/scene/EffectsManager';

// добавить после MouseManager.inst().init(...) и перед финальным render():
EffectsManager.inst().init({
  renderer: RendererManager.inst().getRenderer(),
  width:    rect.width,
  height:   rect.height,
});

// итог init():
public init({ canvas, rect }: { canvas: HTMLCanvasElement | OffscreenCanvas; rect: DOMRectReadOnly }) {
  this.canvas = canvas;
  this.scene  = new THREE.Scene();
  this.scene.background = new THREE.Color(0xffffff);

  const isOffscreen = canvas instanceof OffscreenCanvas;
  if (isOffscreen) {
    this.domStub = new WorkerDomStub(rect.x, rect.y, rect.width, rect.height);
  }

  RendererManager.inst().init({ canvas, rect });
  LightsManager.inst().init();
  CameraManager.inst().init();
  ObjectsManager.inst().init();
  ControlsManager.inst().init(this.domStub ?? undefined);
  MouseManager.inst().init({ skipDomListeners: isOffscreen });

  EffectsManager.inst().init({                             // NEW
    renderer: RendererManager.inst().getRenderer(),        // NEW
    width:    rect.width,                                  // NEW
    height:   rect.height,                                 // NEW
  });                                                      // NEW

  RendererManager.inst().render();
}
```

### A4. SceneManager — resize

Файл: `src/threeApp/scene/SceneManager.ts`, метод `handleResize()`

Два изменения:
- добавляем `EffectsManager.setSize()` при resize;
- прямой `renderer.render(...)` заменяется на `RendererManager.inst().render()` — кадр проходит через Effects + PerformanceMonitor как и обычно. Anti-flicker сохраняется: рендер всё ещё синхронный и немедленный.

```typescript
// БЫЛО:
public handleResize({ width, height, left, top }: { width: number; height: number; left: number; top: number }) {
  RendererManager.inst().updateSize({ width, height });
  CameraManager.inst().resize();
  if (this.domStub) {
    this.domStub.updateRect(left, top, width, height);
  }
  RendererManager.inst().getRenderer().render(this.scene, CameraManager.inst().getCurrentCamera());
}

// СТАНЕТ:
public handleResize({ width, height, left, top }: { width: number; height: number; left: number; top: number }) {
  RendererManager.inst().updateSize({ width, height });
  CameraManager.inst().resize();
  if (this.domStub) {
    this.domStub.updateRect(left, top, width, height);
  }

  if (EffectsManager.inst().enabled) {
    EffectsManager.inst().setSize(width, height);
  }

  RendererManager.inst().render();   // через RendererManager, а не прямой renderer.render()
}
```

---

## Раздел B: PerformanceMonitor

### B1. `src/utils/helpers/PerformanceMonitor.ts`

Кольцевой буфер из последних 60 timestamp-ов. Формула FPS:

```
FPS = (bufferSize - 1) / (newest - oldest) × 1000
```

Если newest старше 1 s — сцена idle, возвращаем 0 (а не заморозенное значение из прошлого).

```typescript
import { ContextSingleton } from '@/core/ContextSingleton';

/**
 * Кустомный счётчик FPS + draw calls. Без сторонних библиотек.
 *
 * FPS — кольцевой буфер из последних N timestamp-ов (performance.now()).
 *   getFps() = (count - 1) / (newest - oldest) × 1000.
 *   Если последний рендер > 1000 ms назад — возвращает 0 (сцена idle).
 *
 * Draw calls — последнее значение, переданное из RendererManager.render().
 */
export class PerformanceMonitor extends ContextSingleton<PerformanceMonitor> {
  /** Кольцевой буфер timestamp-ов render-вызовов */
  private timestamps: number[] = [];

  /** Максимальный размер буфера */
  private readonly bufferSize = 60;

  /** Draw calls последнего кадра */
  private drawCalls = 0;

  /**
   * Вызывается из RendererManager.render() после каждого кадра.
   * @param calls — draw calls за этот кадр
   */
  public onFrameRendered(calls: number): void {
    this.timestamps.push(performance.now());
    if (this.timestamps.length > this.bufferSize) {
      this.timestamps.shift();
    }
    this.drawCalls = calls;
  }

  /**
   * Текущий FPS (среднее по буферу).
   * Возвращает 0 если рендеров не было или последний > 1 s назад.
   */
  public getFps(): number {
    if (this.timestamps.length < 2) return 0;

    const newest = this.timestamps[this.timestamps.length - 1];
    if (performance.now() - newest > 1000) return 0;   // idle

    const oldest  = this.timestamps[0];
    const elapsed = newest - oldest;
    if (elapsed === 0) return 0;

    return ((this.timestamps.length - 1) / elapsed) * 1000;
  }

  /** Draw calls последнего кадра */
  public getDrawCalls(): number {
    return this.drawCalls;
  }
}
```

### B2. Интеграция

Интеграция описана в **A2** — `PerformanceMonitor.inst().onFrameRendered(drawCalls)` вызывается в конце `RendererManager.render()`. Отдельных изменений не требуется.

---

## Раздел C: UiStatsPanel

### C1. `src/ui/UiStatsPanel.ts`

```typescript
import { ContextSingleton }  from '@/core/ContextSingleton';
import { PerformanceMonitor } from '@/utils/helpers/PerformanceMonitor';

/**
 * Оверлей FPS + draw calls. Позиция: bottom-right.
 *
 * Обновление — polling через setInterval(500 ms).
 * pointer-events: none — оверлей не перехватывает ввод.
 *
 * Ограничение: при useWorker = true PerformanceMonitor живёт в Worker,
 * а этот компонент — на main thread. Нужен postMessage со статами — Stage 4+.
 */
export class UiStatsPanel extends ContextSingleton<UiStatsPanel> {
  private fpsEl!:       HTMLSpanElement;
  private drawCallsEl!: HTMLSpanElement;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  public init(container: HTMLElement): void {
    const div = this.createDiv();
    container.appendChild(div);

    this.fpsEl       = div.querySelector('#stats-fps') as HTMLSpanElement;
    this.drawCallsEl = div.querySelector('#stats-dc')  as HTMLSpanElement;

    this.intervalId = setInterval(() => this.update(), 500);
  }

  private createDiv(): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.html();
    return wrapper.children[0] as HTMLDivElement;
  }

  private html(): string {
    const css = `
      position: absolute;
      bottom: 20px;
      right: 20px;
      background: rgba(20, 20, 20, 0.75);
      color: #888;
      padding: 8px 12px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 13px;
      line-height: 1.7;
      pointer-events: none;
      user-select: none;`;

    return `<div style="${css}">
      <div>FPS:  <span id="stats-fps"  style="color:#ddd">0</span></div>
      <div>Draw: <span id="stats-dc"   style="color:#ddd">0</span></div>
    </div>`;
  }

  private update(): void {
    this.fpsEl.textContent       = String(Math.round(PerformanceMonitor.inst().getFps()));
    this.drawCallsEl.textContent = String(PerformanceMonitor.inst().getDrawCalls());
  }

  public dispose(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
```

### C2. UiMain — подключение

Файл: `src/ui/UiMain.ts`

```typescript
// добавить импорт:
import { UiStatsPanel } from './UiStatsPanel';

// добавить в init() в конце:
UiStatsPanel.inst().init(container);
```

---

## Раздел D: Уборка

### D1. Удаление `PointMove.ts`

Файл: `src/threeApp/house/points/PointMove.ts` — удалить полностью.

В Stage 2 он помечен deprecated. `MouseManager` уже не импортирует его — делегирует в ClickRouter. Перед удалением убедиться:

```bash
grep -r "PointMove" src/
```

Если результат пустой — безопасно удалять.

---

## Проверочный чек-лист

После реализации всех разделов — по порядку:

- [ ] `npm run build` — без ошибок (`tsc` + `vite`)
- [ ] `npm run dev` — приложение запускается
- [ ] Оверлей FPS + Draw виден внизу справа
- [ ] При idle (ничего не делаем) — FPS показывает `0`
- [ ] При drag точки — FPS и Draw обновляются (с задержкой до 500 ms — нормально)
- [ ] Resize окна: рендер без мерцания, оверлей не сбивается
- [ ] 2D/3D toggle работает без артефактов (камера синхронизируется через `renderPass.camera`)
- [ ] Кнопка «Сохранить» скачивает корректный JSON как прежде
- [ ] Drag точек → стены обновляются как прежде
- [ ] `PointMove.ts` удалён, `grep -r "PointMove" src/` — пустой результат
- [ ] `src/ui/` не импортирует из `src/threeApp/` (PerformanceMonitor — из `src/utils/`)
- [ ] `src/threeApp/scene/EffectsManager.ts` существует и компилируется
- [ ] `src/utils/helpers/PerformanceMonitor.ts` существует и компилируется
- [ ] `src/ui/UiStatsPanel.ts` существует и компилируется

---

## Структура файлов после Stage 3

```
src/
├── main.ts
├── core/
│   └── ContextSingleton.ts
│
├── api/
│   └── apiLocal/
│       ├── ApiLocalTypes.ts
│       ├── ApiUiToThree.ts
│       └── ApiThreeToUi.ts
│
├── threeApp/
│   ├── ThreeMain.ts
│   ├── scene/
│   │   ├── SceneManager.ts           # A3, A4: init EffectsManager, resize через RendererManager.render()
│   │   ├── RendererManager.ts        # A2: делегирует в EffectsManager + PerformanceMonitor
│   │   ├── CameraManager.ts
│   │   ├── ControlsManager.ts
│   │   ├── LightsManager.ts
│   │   ├── MouseManager.ts
│   │   ├── ObjectsManager.ts
│   │   └── EffectsManager.ts         # A1: NEW — EffectComposer pipeline
│   │
│   ├── house/
│   │   ├── HouseLoader.ts
│   │   ├── walls/
│   │   └── points/
│   │       ├── PointWall.ts
│   │       └── PointsManager.ts
│   │       # PointMove.ts — УДАЛЁН (D1)
│   │
│   ├── model/
│   │   ├── LoaderModel.ts
│   │   └── GridProcessor.ts
│   │
│   ├── interaction/
│   │   ├── core/
│   │   │   ├── EventBus.ts
│   │   │   ├── InteractionContext.ts
│   │   │   └── InteractionOrchestrator.ts
│   │   ├── routing/
│   │   │   ├── RaycastService.ts
│   │   │   ├── ObjectIdentifier.ts
│   │   │   └── ClickRouter.ts
│   │   ├── features/points/
│   │   │   ├── PointFeature.ts
│   │   │   └── PointDragHandler.ts
│   │   ├── behaviors/
│   │   │   └── DragBehavior.ts
│   │   └── commands/
│   │       ├── Command.ts
│   │       ├── CommandManager.ts
│   │       └── MovePointCommand.ts
│   │
│   └── worker/
│       ├── WorkerTypes.ts
│       ├── WorkerManager.ts
│       ├── RenderWorker.ts
│       └── WorkerDomStub.ts
│
├── ui/
│   ├── UiMain.ts                     # C2: добавлен UiStatsPanel
│   ├── UiTopPanel.ts
│   ├── UiCameraToggle.ts
│   ├── LeftPanel.ts
│   └── UiStatsPanel.ts               # C1: NEW — FPS + draw calls оверлей
│
├── utils/
│   └── helpers/
│       └── PerformanceMonitor.ts     # B1: NEW — кустомный счётчик
│
vite.config.ts
vite.worker.config.ts
```
