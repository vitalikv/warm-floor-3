# Stage 2 — План развития

> Базируется на результатах Stage 1 и контракте из `INTERACTION_ARCHITECTURE.md`.
> Проверка после каждого раздела: `npm run build` должен быть зелёный.

---

## Что делает Stage 2

Три вещи, и только три:

1. **Подключяет Worker** — `ThreeMain` получает флаг `useWorker`. При `true` сцена полностью живёт в Worker через OffscreenCanvas; при `false` (default Stage 2) — Main thread, поведение как сейчас. `RenderWorker` и `WorkerManager` получают реальную логику вместо TODO-заглушек. `ApiUiToThree` / `ApiThreeToUi` становятся worker-aware: если Worker запущен — команда уходит через `postMessage`, иначе — прямой вызов.

2. **Создаёт ядро interaction** — 6 файлов в `src/threeApp/interaction/`: `EventBus`, `InteractionContext`, `InteractionOrchestrator`, `RaycastService`, `ObjectIdentifier`, `ClickRouter`. Они образуют минимальную цепочку: событие → raycast → определение типа объекта → маршрутизация → обработчик. Ничего ещё не подключается к приложению — на этом этапе это каркас для Раздела C.

3. **Мигрирует point-drag в interaction** — текущие `MouseManager` + `PointMove` заменяются на `PointFeature` + `PointDragHandler` + `DragBehavior`. Добавляются `Command` / `CommandManager` / `MovePointCommand` — это фундамент Undo/Redo (сама кнопки — Stage 3). `PointMove` помечается deprecated и удалится в Stage 3.

---

## Уже готово (Stage 1) — не трогаем

| Файл | Что сделано в Stage 1 |
|------|----------------------|
| `src/api/apiLocal/ApiLocalTypes.ts` | Типы `SaveProjectParams`, `SwitchCameraParams`, `HouseDataSnapshot` |
| `src/api/apiLocal/ApiUiToThree.ts` | `getHouseSnapshot()` работает. `switchCamera` / `saveProject` — заглушки |
| `src/api/apiLocal/ApiThreeToUi.ts` | Заглушки `onObjectSelected` / `onPropertiesUpdated` |
| `src/threeApp/worker/WorkerTypes.ts` | Union-типы `MainToWorkerMsg` / `WorkerToMainMsg` — полный контракт |
| `src/threeApp/worker/WorkerManager.ts` | Скелет: спавн воркера, send, handleMessage с TODO |
| `src/threeApp/worker/RenderWorker.ts` | Скелет: self.onmessage со switch, все case — TODO |
| `src/ui/LeftPanel.ts` | Placeholder «Каталог» |
| `vite.worker.config.ts` | Конфиг для worker-бандла |
| `src/ui/UiTopPanel.ts` | Через `ApiUiToThree.getHouseSnapshot()`, без прямых импортов threeApp |

---

## Вне скопа Stage 2

| Тема | Почему не сейчас |
|------|------------------|
| Wall features (drag, resize, split) | Stage 3. Фундамент (PointDrag) должен быть стабилен сначала |
| Capabilities (Draggable, Selectable и т.д.) | Stage 3. Пока один тип объекта для drag — capabilities избыточны |
| Policies + Modes (Camera2DPolicy и т.д.) | Stage 3. Пока один режим, все действия разрешены |
| Blocking system | Stage 3. Нужен когда появляются конкурирующие drag-операции |
| Tools (Measure, SelectionBox, Transform) | Stage 4+ |
| RightPanel, LevelPanel, PropertiesPanel | Stage 3 (зависят от selection → ApiThreeToUi push) |
| Toolbar | Stage 3 (зависит от tool-система) |
| Кнопки Undo / Redo в UI | Stage 3. `CommandManager` появляется тут, кнопки — потом |
| `src/api/apiGlobal/` | Нет бэкенда |
| Levels, rooms, doors/windows, objects, roofs, stairs | Stage 3+ |
| `build:worker` скрипт в `package.json` | Добавляется тут же с Worker, но отдельно от основного `npm run build` |

---

## Раздел A: Worker подключение

Цель: двойной путь инициализации сцены. `useWorker: false` (default) — полная обратная совместимость. `useWorker: true` — сцена в Worker.

### A1. `package.json` — скрипт для worker-бандла

```json
"scripts": {
  "build:worker": "vite build --config vite.worker.config.ts"
}
```

Добавляется рядом с существующим `build`. Не входит в основной `npm run build`.

### A2. ThreeMain — флаг и разветвление

Файл: `src/threeApp/ThreeMain.ts`

```typescript
export class ThreeMain extends ContextSingleton<ThreeMain> {
  private useWorker = false;   // Stage 2 default: false

  public setUseWorker(flag: boolean) { this.useWorker = flag; }

  public init({ canvas }: { canvas: HTMLCanvasElement }) {
    if (this.useWorker) {
      WorkerManager.inst().init(canvas);   // передаёт OffscreenCanvas в Worker
    } else {
      // текущий путь: Main thread
      SceneManager.inst().init({ canvas, rect: canvas.getBoundingClientRect() });
    }

    this.initResizeObserver(canvas);

    if (!this.useWorker) {
      LoaderModel.inst().loadJSON();
      HouseLoader.inst().loadHouse();
    }
    // если useWorker — загрузки инициируются из Worker после 'ready'
  }

  private initResizeObserver(canvas: HTMLCanvasElement) {
    const resizeHandler = () => {
      const rect = canvas.getBoundingClientRect();
      if (this.useWorker) {
        WorkerManager.inst().send({ type: 'resize', width: rect.width, height: rect.height });
      } else {
        SceneManager.inst().handleResize({ width: rect.width, height: rect.height, left: rect.left, top: rect.top });
      }
    };
    const resizeObserver = new ResizeObserver(resizeHandler);
    resizeObserver.observe(canvas);
  }
}
```

### A3. WorkerManager — pointer forwarding + handleMessage

Файл: `src/threeApp/worker/WorkerManager.ts`

В `init()` после спавна воркера добавить listener-обёртки на `canvas`:

```typescript
private setupPointerForwarding(canvas: HTMLCanvasElement): void {
  canvas.addEventListener('pointerdown', (e) => this.send({ type: 'pointerdown', clientX: e.clientX, clientY: e.clientY }));
  canvas.addEventListener('pointermove', (e) => this.send({ type: 'pointermove', clientX: e.clientX, clientY: e.clientY }));
  canvas.addEventListener('pointerup',   (e) => this.send({ type: 'pointerup',   clientX: e.clientX, clientY: e.clientY }));
}
```

`handleMessage` — заполнить TODO:
- `'ready'` → вызвать загрузки (`LoaderModel`, `HouseLoader`) из Main thread? Нет — загрузки должны идти из Worker. Значит после `'ready'` отправить `WorkerMsgLoadHouse` с URL
- `'objectSelected'` → `ApiThreeToUi.inst().onObjectSelected(msg.objectId)`
- `'houseLoaded'` → (опционально) уведомление UI через ApiThreeToUi

### A4. RenderWorker — реальная логика

Файл: `src/threeApp/worker/RenderWorker.ts`

Каждый case заполняется:

```typescript
case 'init':
  // OffscreenCanvas не имеет getBoundingClientRect — используем переданные width/height
  const rect = new DOMRect(0, 0, msg.width, msg.height);
  SceneManager.inst().init({ canvas: msg.canvas, rect });
  sendToMain({ type: 'ready' });
  break;

case 'resize':
  SceneManager.inst().handleResize({ width: msg.width, height: msg.height, left: 0, top: 0 });
  break;

case 'pointerdown':
case 'pointermove':
case 'pointerup':
  // MouseManager ожидает нормализованные координаты — нужно передать clientX/clientY
  // В Worker нет DOM-rect canvas, поэтому MouseManager должен принимать абсолютные координаты
  // и иметь знание о размере сцены (хранится в RendererManager)
  MouseManager.inst().dispatchPointer(msg.type, msg.clientX, msg.clientY);
  break;

case 'switchCamera':
  CameraManager.inst().switchCamera(msg.mode === '3D');
  break;

case 'loadHouse':
  // fetch из Worker работает
  // HouseLoader.inst().loadHouse() — но URL может быть другим
  break;

case 'movePoint':
  WallsManager.inst().updatePointPosition(msg.pointId, new THREE.Vector3(msg.x, msg.y, msg.z));
  RendererManager.inst().render();
  break;
```

**Важно:** в Worker нет `window` и `document`. Любое использование этих глобалов в менеджерах сцены (например, `window.devicePixelRatio`, `window.innerWidth` в `CameraManager`) должно быть обёрнуто в guard или параметризовано. Это требует мелких изменений в `RendererManager.init()` и `CameraManager.init()`.

### A5. MouseManager — метод dispatchPointer

Файл: `src/threeApp/scene/MouseManager.ts`

Добавить публичный метод для вызова из Worker-контекста (когда нет DOM-событий):

```typescript
public dispatchPointer(type: 'pointerdown' | 'pointermove' | 'pointerup', clientX: number, clientY: number): void {
  // пересчитывает координаты через размеры renderer, вызывает существующие pointerDown/Move/Up
}
```

В Main-thread режиме этот метод не вызывается — события идут через DOM listeners как прежде.

---

## Раздел B: interaction core

Все файлы создаются как самодостаточные модули. До Раздела C они не импортируются из существующего кода. Компилируются потому, что лежат в `src/`.

### B1. `src/threeApp/interaction/core/EventBus.ts`

Простейший pub/sub. Не ContextSingleton — статичный модуль (singleton по природе ES-модуля).

```typescript
type Listener = (...args: any[]) => void;

const listeners = new Map<string, Set<Listener>>();

export function on(event: string, fn: Listener): void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(fn);
}

export function off(event: string, fn: Listener): void {
  listeners.get(event)?.delete(fn);
}

export function emit(event: string, ...args: any[]): void {
  listeners.get(event)?.forEach((fn) => fn(...args));
}
```

### B2. `src/threeApp/interaction/core/InteractionContext.ts`

Глобальное состояние взаимодействий. ContextSingleton.

```typescript
import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';

export class InteractionContext extends ContextSingleton<InteractionContext> {
  private selectedObject: THREE.Object3D | null = null;

  public setSelected(obj: THREE.Object3D | null): void {
    this.selectedObject = obj;
  }

  public getSelected(): THREE.Object3D | null {
    return this.selectedObject;
  }
}
```

### B3. `src/threeApp/interaction/routing/RaycastService.ts`

Обёртка над raycasting. Работает с текущей камерой из CameraManager.

```typescript
import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import { CameraManager } from '@/threeApp/scene/CameraManager';
import { SceneManager } from '@/threeApp/scene/SceneManager';
import { RendererManager } from '@/threeApp/scene/RendererManager';

export class RaycastService extends ContextSingleton<RaycastService> {
  private raycaster = new THREE.Raycaster();

  public intersect(clientX: number, clientY: number): THREE.Intersection[] {
    const rect = RendererManager.inst().getDomElement().getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.raycaster.setFromCamera(mouse, CameraManager.inst().getCurrentCamera());
    return this.raycaster.intersectObjects(SceneManager.inst().getScene().children, true);
  }
}
```

### B4. `src/threeApp/interaction/routing/ObjectIdentifier.ts`

Определяет тип объекта по `userData.type` (уже используется: `'point'`, `'wall'`).

```typescript
export type ObjectType = 'point' | 'wall' | 'unknown';

export function identifyObject(obj: THREE.Object3D): ObjectType {
  const type = obj.userData?.type;
  if (type === 'point' || type === 'wall') return type;
  return 'unknown';
}
```

### B5. `src/threeApp/interaction/routing/ClickRouter.ts`

Маршрутизатор: принимает событие, вызывает подписчиков.

```typescript
import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import type { ObjectType } from './ObjectIdentifier';

export interface RouteData {
  objectType: ObjectType;
  object: THREE.Object3D;
  action: 'down' | 'move' | 'up';
  clientX: number;
  clientY: number;
}

export class ClickRouter extends ContextSingleton<ClickRouter> {
  private handler: ((data: RouteData) => void) | null = null;

  public onRouted(fn: (data: RouteData) => void): void {
    this.handler = fn;
  }

  public route(data: RouteData): void {
    this.handler?.(data);
  }
}
```

### B6. `src/threeApp/interaction/core/InteractionOrchestrator.ts`

Связывает routing → feature. Stage 2: без policy-check, без capability-check — это Stage 3.

```typescript
import { ContextSingleton } from '@/core/ContextSingleton';
import { ClickRouter } from '@/threeApp/interaction/routing/ClickRouter';
import type { RouteData } from '@/threeApp/interaction/routing/ClickRouter';

export interface Feature {
  name: string;
  handle(data: RouteData): void;
}

export class InteractionOrchestrator extends ContextSingleton<InteractionOrchestrator> {
  private features = new Map<string, Feature>();

  public init(): void {
    ClickRouter.inst().onRouted((data) => this.handleInteraction(data));
  }

  public registerFeature(feature: Feature): void {
    this.features.set(feature.name, feature);
  }

  private handleInteraction(data: RouteData): void {
    if (data.objectType === 'unknown') return;
    const feature = this.features.get(data.objectType);
    feature?.handle(data);
  }
}
```

---

## Раздел C: PointDrag миграция

### C1. `src/threeApp/interaction/behaviors/DragBehavior.ts`

Извлекаем из `PointMove` логику плоскости + offset. Не привязано к конкретному объекту — это поведение, которое будет использовать любой drag-handler.

```typescript
import * as THREE from 'three';
import { SceneManager } from '@/threeApp/scene/SceneManager';

export class DragBehavior {
  private plane!: THREE.Mesh;
  private offset = new THREE.Vector3();
  private isActive = false;

  constructor() {
    const geometry = new THREE.PlaneGeometry(10000, 10000);
    const material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide });
    material.visible = false;
    this.plane = new THREE.Mesh(geometry, material);
    this.plane.rotation.set(-Math.PI / 2, 0, 0);
    SceneManager.inst().getScene().add(this.plane);
  }

  /** Начать drag: позиционировать плоскость на Y объекта, записать offset */
  public startDrag(object: THREE.Object3D, raycaster: THREE.Raycaster): void {
    this.plane.position.set(0, object.position.y, 0);
    this.plane.updateMatrixWorld();

    const intersects = raycaster.intersectObjects([this.plane], true);
    if (intersects.length === 0) return;
    this.offset = intersects[0].point.clone();
    this.isActive = true;
  }

  /** Вычислить смещение за кадр. Возвращает null если плоскость не пересечена */
  public updateDrag(raycaster: THREE.Raycaster): THREE.Vector3 | null {
    if (!this.isActive) return null;
    const intersects = raycaster.intersectObjects([this.plane], true);
    if (intersects.length === 0) return null;

    const delta = new THREE.Vector3().subVectors(intersects[0].point, this.offset);
    this.offset = intersects[0].point.clone();
    delta.y = 0;
    return delta;
  }

  public endDrag(): void {
    this.isActive = false;
  }

  public isRunning(): boolean {
    return this.isActive;
  }
}
```

### C2. Command + CommandManager

**`src/threeApp/interaction/commands/Command.ts`** — базовый интерфейс:

```typescript
export interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
  canMerge?(other: Command): boolean;
  merge?(other: Command): void;
}
```

**`src/threeApp/interaction/commands/CommandManager.ts`** — ContextSingleton, стек истории:

```typescript
import { ContextSingleton } from '@/core/ContextSingleton';
import { emit } from '@/threeApp/interaction/core/EventBus';
import type { Command } from './Command';

export class CommandManager extends ContextSingleton<CommandManager> {
  private history: Command[] = [];
  private currentIndex = -1;
  private readonly maxSize = 100;

  public execute(command: Command): void {
    // Отрезаем «будущее» если undo был сделан
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Попытка merge с последней командой
    const last = this.history[this.currentIndex];
    if (last?.canMerge?.(command)) {
      last.merge!(command);
      command.execute();
    } else {
      command.execute();
      this.history.push(command);
      this.currentIndex++;
    }

    if (this.history.length > this.maxSize) {
      this.history.shift();
      this.currentIndex--;
    }

    emit('history:changed', { canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  public undo(): void {
    if (!this.canUndo()) return;
    this.history[this.currentIndex].undo();
    this.currentIndex--;
    emit('history:changed', { canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  public redo(): void {
    if (!this.canRedo()) return;
    this.currentIndex++;
    this.history[this.currentIndex].redo();
    emit('history:changed', { canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  public canUndo(): boolean { return this.currentIndex >= 0; }
  public canRedo(): boolean { return this.currentIndex < this.history.length - 1; }
}
```

### C3. `src/threeApp/interaction/commands/MovePointCommand.ts`

```typescript
import * as THREE from 'three';
import { WallsManager } from '@/threeApp/house/walls/WallsManager';
import { RendererManager } from '@/threeApp/scene/RendererManager';
import type { Command } from './Command';

export class MovePointCommand implements Command {
  public readonly pointId: number;
  private oldPosition: THREE.Vector3;
  private newPosition: THREE.Vector3;

  constructor(pointId: number, oldPosition: THREE.Vector3, newPosition: THREE.Vector3) {
    this.pointId = pointId;
    this.oldPosition = oldPosition.clone();
    this.newPosition = newPosition.clone();
  }

  public execute(): void {
    WallsManager.inst().updatePointPosition(this.pointId, this.newPosition);
    RendererManager.inst().render();
  }

  public undo(): void {
    WallsManager.inst().updatePointPosition(this.pointId, this.oldPosition);
    RendererManager.inst().render();
  }

  public redo(): void {
    this.execute();
  }

  public canMerge(other: Command): boolean {
    return other instanceof MovePointCommand && other.pointId === this.pointId;
  }

  public merge(other: Command): void {
    this.newPosition = (other as MovePointCommand).newPosition.clone();
  }
}
```

**Логика merge при drag:** на каждом `pointermove` создаётся новый `MovePointCommand(id, startPos, currentPos)`. `CommandManager.execute()` видит, что предыдущая команда — тот же pointId, и вместо добавления в стек просто обновляет `newPosition`. В итоге в истории — одна запись на весь drag.

### C4. PointFeature + PointDragHandler

**`src/threeApp/interaction/features/points/PointFeature.ts`**:

```typescript
import { PointDragHandler } from './PointDragHandler';
import type { Feature } from '@/threeApp/interaction/core/InteractionOrchestrator';
import type { RouteData } from '@/threeApp/interaction/routing/ClickRouter';

export class PointFeature implements Feature {
  public readonly name = 'point';
  private dragHandler = new PointDragHandler();

  public handle(data: RouteData): void {
    this.dragHandler.handle(data);
  }
}
```

**`src/threeApp/interaction/features/points/PointDragHandler.ts`**:

```typescript
import * as THREE from 'three';
import { DragBehavior } from '@/threeApp/interaction/behaviors/DragBehavior';
import { CommandManager } from '@/threeApp/interaction/commands/CommandManager';
import { MovePointCommand } from '@/threeApp/interaction/commands/MovePointCommand';
import { MouseManager } from '@/threeApp/scene/MouseManager';
import { ControlsManager } from '@/threeApp/scene/ControlsManager';
import type { RouteData } from '@/threeApp/interaction/routing/ClickRouter';

export class PointDragHandler {
  private dragBehavior = new DragBehavior();
  private activeObject: THREE.Mesh | null = null;
  private startPosition = new THREE.Vector3();

  public handle(data: RouteData): void {
    switch (data.action) {
      case 'down':  this.onDown(data); break;
      case 'move':  this.onMove();     break;
      case 'up':    this.onUp();       break;
    }
  }

  private onDown(data: RouteData): void {
    this.activeObject = data.object as THREE.Mesh;
    this.startPosition = this.activeObject.position.clone();

    // Блокируем OrbitControls — как сейчас в MouseManager
    (ControlsManager.inst().getControls() as any).enabled = false;

    this.dragBehavior.startDrag(this.activeObject, MouseManager.inst().getRaycaster());
  }

  private onMove(): void {
    if (!this.activeObject || !this.dragBehavior.isRunning()) return;

    const delta = this.dragBehavior.updateDrag(MouseManager.inst().getRaycaster());
    if (!delta) return;

    this.activeObject.position.add(delta);

    const pointId = this.activeObject.userData.pointId;
    if (pointId !== undefined) {
      CommandManager.inst().execute(
        new MovePointCommand(pointId, this.startPosition, this.activeObject.position.clone())
      );
    }
  }

  private onUp(): void {
    this.dragBehavior.endDrag();
    (ControlsManager.inst().getControls() as any).enabled = true;
    this.activeObject = null;
  }
}
```

### C5. MouseManager — делегирование в ClickRouter

Файл: `src/threeApp/scene/MouseManager.ts`

Заменяем прямые вызовы `PointMove` на цепочку через новую архитектуру:

```typescript
// БЫЛО:
private pointerDown = (event: MouseEvent) => {
  ...
  const point = this.findPointInIntersects(intersects);
  if (point) {
    PointMove.inst().pointerDown({ obj: point });
    ...
  }
};

// СТАНЕТ:
private pointerDown = (event: MouseEvent) => {
  this.updateRaycast(event.clientX, event.clientY);
  const intersects = this.raycaster.intersectObjects(SceneManager.inst().getScene().children, true);
  const target = this.findInteractiveObject(intersects);   // возвращает любой interactive объект, не только point

  if (target) {
    this.actObj = target;
    ClickRouter.inst().route({
      objectType: identifyObject(target),
      object: target,
      action: 'down',
      clientX: event.clientX,
      clientY: event.clientY,
    });
  }
};

// Аналогично для pointermove и pointerup:
// move: если actObj !== null — route({ action: 'move', ... }) + render()
// up: если actObj !== null — route({ action: 'up', ... }), actObj = null
```

Импорт `PointMove` удаляется. `PointMove` остаётся в файловой системе как deprecated — удалится в Stage 3.

### C6. Подключение Orchestrator

Файл: `src/threeApp/ThreeMain.ts` (или `SceneManager.ts`)

После инициализации сцены:

```typescript
InteractionOrchestrator.inst().init();
InteractionOrchestrator.inst().registerFeature(new PointFeature());
```

---

## Проверочный чек-лист

После реализации всех разделов — по порядку:

- [ ] `npm run build` — без ошибок (`tsc` + `vite`)
- [ ] `npm run dev` — приложение запускается
- [ ] `useWorker: false` (default) — всё работает как после Stage 1 без регрессий
- [ ] Перетаскивание точек — работает через новый interaction flow (ClickRouter → PointFeature → PointDragHandler)
- [ ] Стены обновляются при drag точки — как прежде
- [ ] После drag `CommandManager.inst().canUndo()` === `true`
- [ ] 2D/3D toggle — работает как прежде
- [ ] Кнопка «Сохранить» — скачивает корректный JSON
- [ ] В `src/ui/` по-прежнему нет прямых импортов из `src/threeApp/`
- [ ] Файлы `src/threeApp/interaction/**/*.ts` существуют и компилируются
- [ ] `useWorker: true` (manual toggle в ThreeMain) — сцена рендерится, drag работает через postMessage
- [ ] `npm run build:worker` — worker-бандл собирается без ошибок

---

## Структура файлов после Stage 2

```
src/
├── main.ts
├── core/
│   └── ContextSingleton.ts
│
├── api/
│   └── apiLocal/
│       ├── ApiLocalTypes.ts
│       ├── ApiUiToThree.ts           # A4: worker-aware routing
│       └── ApiThreeToUi.ts
│
├── threeApp/
│   ├── ThreeMain.ts                  # A2: useWorker flag + разветвление
│   ├── scene/
│   │   ├── SceneManager.ts
│   │   ├── RendererManager.ts
│   │   ├── CameraManager.ts
│   │   ├── ControlsManager.ts
│   │   ├── LightsManager.ts
│   │   ├── MouseManager.ts           # C5: делегирует в ClickRouter
│   │   └── ObjectsManager.ts
│   ├── house/
│   │   ├── HouseLoader.ts
│   │   ├── walls/
│   │   └── points/
│   │       ├── PointMove.ts          # DEPRECATED — удалится Stage 3
│   │       ├── PointWall.ts
│   │       └── PointsManager.ts
│   ├── model/
│   │   ├── LoaderModel.ts
│   │   └── GridProcessor.ts
│   ├── interaction/                  # NEW — ядро
│   │   ├── core/
│   │   │   ├── EventBus.ts           # B1
│   │   │   ├── InteractionContext.ts  # B2
│   │   │   └── InteractionOrchestrator.ts  # B6
│   │   ├── routing/
│   │   │   ├── RaycastService.ts     # B3
│   │   │   ├── ObjectIdentifier.ts   # B4
│   │   │   └── ClickRouter.ts        # B5
│   │   ├── features/
│   │   │   └── points/
│   │   │       ├── PointFeature.ts        # C4
│   │   │       └── PointDragHandler.ts    # C4
│   │   ├── behaviors/
│   │   │   └── DragBehavior.ts       # C1
│   │   └── commands/
│   │       ├── Command.ts            # C2
│   │       ├── CommandManager.ts     # C2
│   │       └── MovePointCommand.ts   # C3
│   └── worker/
│       ├── WorkerTypes.ts
│       ├── WorkerManager.ts          # A3: pointer forwarding + handleMessage
│       └── RenderWorker.ts           # A4: полная логика all cases
│
├── ui/
│   ├── UiMain.ts
│   ├── UiTopPanel.ts
│   ├── UiCameraToggle.ts
│   └── LeftPanel.ts
│
vite.config.ts
vite.worker.config.ts                 # существует с Stage 1
```
