# Stage 1 — План развития

> Базируется на `docs/file-structure.md`.
> Проверка после каждого раздела: `npm run build` должен быть зелёный.

---

## Что делает Stage 1

Четыре вещи, и только четыре:

1. **Убирает debug-артефакты** — 10 `console.log`, зелёный куб, видимая плоскость drag.
2. **Создаёт слой `apiLocal`** — единый коридор между UI и Three.js. На этом этапе — прямые вызовы, без воркера. Первый реальный поток: кнопка «Сохранить» в `UiTopPanel`.
3. **Создаёт скелет Worker** — файлы с типами и class-обёрткой, плюс `vite.worker.config.ts`. Ничего не подключается к приложению. Цель — зафиксировать контракт сообщений для Stage 2.
4. **Добавляет `LeftPanel`** — пустая панель с placeholder. Заложить позицию в layout и убедиться, что новый UI-компонент подключается по той же схеме.

---

## Уже готово — не трогаем

| Файл | Что делает |
|------|------------|
| `src/core/ContextSingleton.ts` | Базовый синглтон. Все менеджеры через `.inst()` |
| `src/main.ts` | Точка входа |
| `src/threeApp/ThreeMain.ts` | Инит сцены, ResizeObserver, загрузки |
| `src/threeApp/scene/SceneManager.ts` | THREE.Scene, цепочка инициализации |
| `src/threeApp/scene/RendererManager.ts` | WebGLRenderer, event-driven render |
| `src/threeApp/scene/CameraManager.ts` | Ortho + perspective, 2D/3D switch |
| `src/threeApp/scene/ControlsManager.ts` | OrbitControls, save/restore state |
| `src/threeApp/scene/LightsManager.ts` | Ambient + directional |
| `src/threeApp/scene/MouseManager.ts` | Pointer events, raycast, делегация в PointMove |
| `src/threeApp/scene/ObjectsManager.ts` | GridHelper (оставляем), куб (удаляем в A2) |
| `src/threeApp/house/HouseLoader.ts` | Загрузка `1.json` → `WallsManager.buildWalls` |
| `src/threeApp/house/walls/*` | WallsManager, WallGeometry, WallMaterial, Wall, types |
| `src/threeApp/house/points/*` | PointsManager, PointMove, PointWall |
| `src/threeApp/model/*` | LoaderModel, GridProcessor |
| `src/ui/UiMain.ts` | Инит UI компонентов |
| `src/ui/UiTopPanel.ts` | «Сохранить» — меняется в B4 |
| `src/ui/UiCameraToggle.ts` | Кнопка 2D/3D |

---

## Вне скопа Stage 1

| Тема | Почему не сейчас |
|------|------------------|
| `src/threeApp/interaction/` | Огромный модуль. Контракт в `INTERACTION_ARCHITECTURE.md`. Начинается Stage 2 после фиксации apiLocal |
| Подключение Worker к приложению | Stage 1 — только скелет + типы. OffscreenCanvas + postMessage flow — Stage 2 |
| `src/api/apiGlobal/` | Нет бэкенда |
| RightPanel, LevelPanel, PropertiesPanel | Зависят от interaction layer |
| Toolbar | Зависит от tool-система из interaction |
| Undo/Redo | Зависит от CommandManager |
| Уровни, комнаты, двери/окна, мебель, крыши, лестницы | Stage 3+. Сейчас работает только `level[0]` |

---

## Раздел A: Уборка сцены

### A1. Удаление console.log

Удаляем только `console.log` (debug-шум). Все `console.warn` и `console.error` — это обработка ошибок, они остаются.

| Файл | Строка | Что удалить |
|------|--------|-------------|
| `src/threeApp/scene/RendererManager.ts` | 32 | `console.log('render');` |
| `src/threeApp/scene/SceneManager.ts` | 30 | `console.log('handleResize', width, height, left, top);` |
| `src/threeApp/scene/MouseManager.ts` | 57 | `console.log(3333, point);` |
| `src/threeApp/scene/CameraManager.ts` | 72 | `console.log(3333, isPerspective);` |
| `src/threeApp/house/HouseLoader.ts` | 38 | `console.log('Загруженный JSON дома:', jsonData);` |
| `src/threeApp/house/HouseLoader.ts` | 61 | `` console.log(`Построено ${firstLevel.walls.length} стен`); `` |
| `src/threeApp/model/LoaderModel.ts` | 10 | `console.log('Загруженный JSON:', jsonData);` |
| `src/threeApp/model/GridProcessor.ts` | 37 | `console.log('Нет сеток для обработки');` |
| `src/threeApp/model/GridProcessor.ts` | 48 | `` console.log(`Обработано ${jsonData.grids.length} сеток`); `` |
| `src/ui/UiCameraToggle.ts` | 70 | `console.log(4444, type, this.isPerspective);` |

### A2. Зелёный куб — удаление из ObjectsManager

Файл: `src/threeApp/scene/ObjectsManager.ts`

Удаляем блок создания куба (5 строк). GridHelper остаётся:

```typescript
// БЫЛО:
public init(): void {
    const scene = SceneManager.inst().getScene();

    const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);      // удалить
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // удалить
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);   // удалить
    cube.position.set(0, 0.5, 0);                              // удалить
    scene.add(cube);                                            // удалить

    const gridHelper = new THREE.GridHelper(10, 10, 0x888888, 0x444444); // оставить
    scene.add(gridHelper);                                      // оставить
}
```

### A3. Drag-плоскость — сделать невидимой

Файл: `src/threeApp/house/points/PointMove.ts`, метод `createPlane()`

```typescript
// БЫЛО:
const material = new THREE.MeshPhongMaterial({ color: 0xffff00, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
//material.visible = false;

// СТАНЕТ:
const material = new THREE.MeshPhongMaterial({ color: 0xffff00, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
material.visible = false;
```

Плоскость существует в сцене и работает для raycast — видимость материала на это не влияет.

### A4. Inline-стили в main.ts

Файл: `src/main.ts`, строки 7–13. Удаляем все 7 строк присвоения `container.style.*`. Если 100px-отступ от edge нужен — он должен быть в CSS в `index.html`, а не в JS.

---

## Раздел B: Слой apiLocal

Цель: все вызовы UI → Three.js через `ApiUiToThree`, все события Three.js → UI через `ApiThreeToUi`. Прямых импортов менеджеров Three.js из `src/ui/` быть не должно.

На Stage 1 реализуем один реальный поток: **сохранение проекта**. Остальные сигнатуры — заглушки.

### B1. `src/api/apiLocal/ApiLocalTypes.ts`

```typescript
import type { Point, Wall } from '@/threeApp/house/walls/types';

// ── UI → Three.js: параметры команд ────────────────────────

export interface SaveProjectParams {
  /** Имя файла для скачивания. Default: 'house.json' */
  filename?: string;
}

export interface SwitchCameraParams {
  mode: '2D' | '3D';
}

// ── Three.js → UI: параметры событий ───────────────────────

export interface HouseDataSnapshot {
  points: Point[];
  walls: Wall[];
  /** Полный объект HouseData для сериализации. null если не загружен */
  raw: unknown;
}
```

### B2. `src/api/apiLocal/ApiUiToThree.ts`

```typescript
import { ContextSingleton } from '@/core/ContextSingleton';
import { HouseLoader } from '@/threeApp/house/HouseLoader';
import { WallsManager } from '@/threeApp/house/walls/WallsManager';
import type { HouseDataSnapshot, SaveProjectParams, SwitchCameraParams } from './ApiLocalTypes';

/**
 * UI → Three.js.
 * Stage 1: прямые вызовы менеджеров.
 * Stage 2: если useWorker — тело каждого метода заменяется на postMessage через WorkerManager.
 */
export class ApiUiToThree extends ContextSingleton<ApiUiToThree> {

  /**
   * Снимок состояния дома для сохранения.
   * Вызывается из UiTopPanel при нажатии «Сохранить».
   */
  public getHouseSnapshot(): HouseDataSnapshot {
    const raw = HouseLoader.inst().getHouseData();
    if (raw) {
      (raw as any).level[0].points = WallsManager.inst().getPoints();
      (raw as any).level[0].walls = WallsManager.inst().getWalls();
    }
    return {
      points: WallsManager.inst().getPoints(),
      walls: WallsManager.inst().getWalls(),
      raw,
    };
  }

  /** Переключить камеру */
  public switchCamera(_params: SwitchCameraParams): void {
    // TODO Stage 2
  }

  /** Сохранить проект. Скачивание файла — ответственность UI */
  public saveProject(_params: SaveProjectParams): void {
    // TODO Stage 2
  }
}
```

### B3. `src/api/apiLocal/ApiThreeToUi.ts`

```typescript
import { ContextSingleton } from '@/core/ContextSingleton';

/**
 * Three.js → UI.
 * Stage 1: все заглушки. Stage 2: push-события (выделение, свойства).
 */
export class ApiThreeToUi extends ContextSingleton<ApiThreeToUi> {

  public onObjectSelected(_objectId: number): void {
    // TODO Stage 2
  }

  public onPropertiesUpdated(_objectId: number, _properties: Record<string, unknown>): void {
    // TODO Stage 2
  }
}
```

### B4. Подключение UiTopPanel

Файл: `src/ui/UiTopPanel.ts`

```typescript
// БЫЛО:
import { HouseLoader } from '@/threeApp/house/HouseLoader';
import { WallsManager } from '@/threeApp/house/walls/WallsManager';
// ...
private saveProject(): void {
    const houseData = HouseLoader.inst().getHouseData();
    if (!houseData) {
      console.warn('Данные дома не загружены');
      return;
    }
    houseData.level[0].points = WallsManager.inst().getPoints();
    houseData.level[0].walls = WallsManager.inst().getWalls();
    this.downloadJson(houseData, 'house.json');
}

// СТАНЕТ:
import { ApiUiToThree } from '@/api/apiLocal/ApiUiToThree';
// ...
private saveProject(): void {
    const snapshot = ApiUiToThree.inst().getHouseSnapshot();
    if (!snapshot.raw) {
      console.warn('Данные дома не загружены');
      return;
    }
    this.downloadJson(snapshot.raw, 'house.json');
}
```

Импорты `HouseLoader` и `WallsManager` удаляются полностью. `downloadJson` не меняется.

---

## Раздел C: Скелет Worker

Файлы создаются как самодостаточные модули. Ни один из них не импортируется из существующего кода приложения. Они компилируются потому, что лежат в `src/` и подпадают под `tsconfig.json`.

### C1. `src/threeApp/worker/WorkerTypes.ts`

```typescript
// ── Main → Worker ──────────────────────────────────────────

export interface WorkerMsgInit {
  type: 'init';
  canvas: OffscreenCanvas;
  width: number;
  height: number;
}

export interface WorkerMsgResize {
  type: 'resize';
  width: number;
  height: number;
}

export interface WorkerMsgPointerDown {
  type: 'pointerdown';
  clientX: number;
  clientY: number;
}

export interface WorkerMsgPointerMove {
  type: 'pointermove';
  clientX: number;
  clientY: number;
}

export interface WorkerMsgPointerUp {
  type: 'pointerup';
  clientX: number;
  clientY: number;
}

export interface WorkerMsgSwitchCamera {
  type: 'switchCamera';
  mode: '2D' | '3D';
}

export interface WorkerMsgLoadHouse {
  type: 'loadHouse';
  url: string;
}

export interface WorkerMsgMovePoint {
  type: 'movePoint';
  pointId: number;
  x: number;
  y: number;
  z: number;
}

export type MainToWorkerMsg =
  | WorkerMsgInit
  | WorkerMsgResize
  | WorkerMsgPointerDown
  | WorkerMsgPointerMove
  | WorkerMsgPointerUp
  | WorkerMsgSwitchCamera
  | WorkerMsgLoadHouse
  | WorkerMsgMovePoint;

// ── Worker → Main ──────────────────────────────────────────

export interface WorkerMsgReady {
  type: 'ready';
}

export interface WorkerMsgObjectSelected {
  type: 'objectSelected';
  objectId: number;
  objectType: 'point' | 'wall';
}

export interface WorkerMsgHouseLoaded {
  type: 'houseLoaded';
  wallCount: number;
  pointCount: number;
}

export type WorkerToMainMsg =
  | WorkerMsgReady
  | WorkerMsgObjectSelected
  | WorkerMsgHouseLoaded;
```

### C2. `src/threeApp/worker/WorkerManager.ts`

```typescript
import { ContextSingleton } from '@/core/ContextSingleton';
import type { MainToWorkerMsg, WorkerToMainMsg } from './WorkerTypes';

/**
 * Main-thread сторона воркера.
 * Stage 1: скелет, не подключён к приложению.
 * Stage 2: вызывается из ThreeMain при useWorker === true.
 */
export class WorkerManager extends ContextSingleton<WorkerManager> {
  private worker: Worker | null = null;

  public init(canvas: HTMLCanvasElement): void {
    const offscreen = canvas.transferControlToOffscreen();

    this.worker = new Worker(new URL('./RenderWorker.ts', import.meta.url), { type: 'module' });

    this.worker.onmessage = (event: MessageEvent<WorkerToMainMsg>) => {
      this.handleMessage(event.data);
    };

    this.send({
      type: 'init',
      canvas: offscreen,
      width: canvas.getBoundingClientRect().width,
      height: canvas.getBoundingClientRect().height,
    });
  }

  public send(msg: MainToWorkerMsg): void {
    if (!this.worker) return;
    if (msg.type === 'init') {
      this.worker.postMessage(msg, [msg.canvas]);
    } else {
      this.worker.postMessage(msg);
    }
  }

  private handleMessage(msg: WorkerToMainMsg): void {
    switch (msg.type) {
      case 'ready':
        // TODO Stage 2
        break;
      case 'objectSelected':
        // TODO Stage 2: ApiThreeToUi.inst().onObjectSelected(msg.objectId)
        break;
      case 'houseLoaded':
        // TODO Stage 2
        break;
    }
  }

  public isRunning(): boolean {
    return this.worker !== null;
  }
}
```

### C3. `src/threeApp/worker/RenderWorker.ts`

```typescript
import type { MainToWorkerMsg, WorkerToMainMsg } from './WorkerTypes';

/**
 * Точка входа Web Worker.
 * Stage 1: скелет. Сцена не инициализируется.
 * Stage 2: каждый case — реальный вызов менеджера.
 */

function sendToMain(msg: WorkerToMainMsg): void {
  self.postMessage(msg);
}

self.onmessage = (event: MessageEvent<MainToWorkerMsg>) => {
  const msg = event.data;

  switch (msg.type) {
    case 'init':
      // TODO Stage 2: SceneManager.inst().init({ canvas: msg.canvas, ... })
      sendToMain({ type: 'ready' });
      break;
    case 'resize':
      // TODO Stage 2: SceneManager.inst().handleResize(...)
      break;
    case 'pointerdown':
      // TODO Stage 2: MouseManager forwarding
      break;
    case 'pointermove':
      // TODO Stage 2: MouseManager forwarding
      break;
    case 'pointerup':
      // TODO Stage 2: MouseManager forwarding
      break;
    case 'switchCamera':
      // TODO Stage 2: CameraManager.inst().switchCamera(...)
      break;
    case 'loadHouse':
      // TODO Stage 2: fetch + WallsManager.buildWalls
      break;
    case 'movePoint':
      // TODO Stage 2: WallsManager.inst().updatePointPosition(...)
      break;
  }
};
```

### C4. `vite.worker.config.ts`

Отдельная конфигурация Vite для worker-бандла. Не входит в основной `npm run build`.

```typescript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      input: 'src/threeApp/worker/RenderWorker.ts',
      output: {
        dir: 'dist',
        entryFileNames: 'worker.js',
      },
    },
  },
});
```

Stage 2 добавит скрипт в `package.json`: `"build:worker": "vite build --config vite.worker.config.ts"`.

---

## Раздел D: LeftPanel

### D1. `src/ui/LeftPanel.ts`

```typescript
import { ContextSingleton } from '@/core/ContextSingleton';

/**
 * Левая панель — каталог объектов.
 * Stage 1: placeholder. Stage 2+: каталог мебели и объектов.
 */
export class LeftPanel extends ContextSingleton<LeftPanel> {
  private div!: HTMLDivElement;

  public init(container: HTMLElement): void {
    this.div = this.createDiv();
    container.appendChild(this.div);
    this.stopEvents();
  }

  private createDiv(): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.html();
    return wrapper.children[0] as HTMLDivElement;
  }

  private html(): string {
    const css = `
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 200px;
      background: rgb(241, 241, 241);
      border-right: 1px solid rgb(179, 179, 179);
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgb(133, 133, 133);
      font-size: 14px;`;
    return `<div style="${css}">Каталог</div>`;
  }

  /** Блокировка событий мыши — они не должны проходить в Three.js */
  private stopEvents(): void {
    const events = ['mousedown', 'wheel', 'mousemove', 'touchstart', 'touchend', 'touchmove'];
    events.forEach((name) => {
      this.div.addEventListener(name, (e: Event) => e.stopPropagation());
    });
  }
}
```

### D2. Подключение в UiMain

Файл: `src/ui/UiMain.ts`

```typescript
// добавить импорт:
import { LeftPanel } from './LeftPanel';

// добавить вызов после UiTopPanel:
LeftPanel.inst().init(container);
```

---

## Проверочный чек-лист

После реализации всех разделов — по порядку:

- [ ] `npm run build` — без ошибок (`tsc` + `vite`)
- [ ] `npm run dev` — приложение запускается
- [ ] DevTools → Console: **ноль** `console.log` при загрузке и при перемещении точки
- [ ] Зелёный куб в центре сцены — **исчез**
- [ ] При перетаскивании точки жёлтая плоскость — **не видна**
- [ ] Кнопка «Сохранить» скачивает `house.json` с актуальными координатами
- [ ] В `src/ui/` нет прямых импортов из `src/threeApp/` (только через `ApiUiToThree`)
- [ ] Левая панель видна слева: текст «Каталог»
- [ ] Файлы `src/api/apiLocal/*.ts` существуют и компилируются
- [ ] Файлы `src/threeApp/worker/*.ts` существуют и компилируются
- [ ] `vite.worker.config.ts` существует в корне
- [ ] Перетаскивание точек + обновление стен — работает как прежде
- [ ] Переключение 2D/3D — работает как прежде

---

## Структура файлов после Stage 1

```
src/
├── main.ts                            # A4: убраны inline-стили
├── core/
│   └── ContextSingleton.ts
│
├── api/                               # NEW
│   └── apiLocal/
│       ├── ApiLocalTypes.ts           # B1
│       ├── ApiUiToThree.ts            # B2
│       └── ApiThreeToUi.ts            # B3
│
├── threeApp/
│   ├── ThreeMain.ts
│   ├── scene/
│   │   ├── SceneManager.ts            # A1
│   │   ├── RendererManager.ts         # A1
│   │   ├── CameraManager.ts           # A1
│   │   ├── ControlsManager.ts
│   │   ├── LightsManager.ts
│   │   ├── MouseManager.ts            # A1
│   │   └── ObjectsManager.ts          # A2
│   ├── house/
│   │   ├── HouseLoader.ts             # A1
│   │   ├── walls/
│   │   └── points/
│   │       └── PointMove.ts           # A3
│   ├── model/
│   │   ├── LoaderModel.ts             # A1
│   │   └── GridProcessor.ts           # A1
│   └── worker/                        # NEW
│       ├── WorkerTypes.ts             # C1
│       ├── WorkerManager.ts           # C2
│       └── RenderWorker.ts            # C3
│
├── ui/
│   ├── UiMain.ts                      # D2: добавлен LeftPanel
│   ├── UiTopPanel.ts                  # B4: через ApiUiToThree
│   ├── UiCameraToggle.ts              # A1
│   └── LeftPanel.ts                   # D1: NEW
│
vite.config.ts                         # не меняется
vite.worker.config.ts                  # C4: NEW
```
