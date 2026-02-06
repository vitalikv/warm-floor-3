# Stage 4 — Outline-выделение при клике

> Базируется на результатах Stage 1–3.
> Проверка после каждого раздела: `npm run build` должен быть зелёный.

---

## Что делает Stage 4

Две вещи, и только две:

1. **SelectionManager** — синглтон, управляющий состоянием выделения. При клике на стену или точку записывает объект в `selectedObjects` у `OutlinePass` (уже готов в `EffectsManager`), вызывает `render()`. При клике в пустоту — очищает. Эмитит `selection:changed` через `EventBus` (фундамент для будущих PropertiesPanel / RightPanel).

2. **Интеграция с MouseManager + InteractionOrchestrator** — `MouseManager` начинает маршрутизировать клики в пустоту (сейчас игнорирует). `InteractionOrchestrator` вызывает `SelectionManager` на каждый `'down'` до делегации в feature-handler. Пустой клик → `deselect()`.

Плюс: фикс resize `OutlinePass` внутренних render-target-ов в `EffectsManager.setSize()`.

---

## Уже готово (Stage 1–3) — не трогаем

| Компонент | Статус |
|-----------|--------|
| `EffectsManager` — `OutlinePass` + line shader | Готов, `selectedObjects = []` ждёт подключения |
| `InteractionContext` — `setSelected` / `getSelected` | Готов, не используется |
| `PointFeature` + `PointDragHandler` | Работает |
| `ClickRouter` / `ObjectIdentifier` / `InteractionOrchestrator` | Работает |
| `EventBus` — `on` / `off` / `emit` | Готов, не используется |

---

## Вне скопа Stage 4

| Тема | Почему не сейчас |
|------|------------------|
| RightPanel / PropertiesPanel | Stage 5. Зависит от `selection:changed`, подключается после отработки selection |
| WallFeature (drag, resize, split) | Stage 5. Нужен стабильный selection |
| Мульти-выделение (Shift+click) | Stage 5+. Сначала одиночный select |
| Hover-подсветка (mouseover без клика) | Stage 5+. Отдельный `hoverPass` или второй `OutlinePass` |
| Undo/Redo кнопки в UI | Stage 5. CommandManager готов, кнопки — после selection |

---

## Раздел A: SelectionManager

### A1. `src/threeApp/interaction/features/selection/SelectionManager.ts`

Синглтон. Единственный владелец `outlinePass.selectedObjects`. Хранит текущий выделенный объект, обновляет outline, эмитит событие.

```typescript
import * as THREE from 'three';
import { ContextSingleton } from '@/core/ContextSingleton';
import { EffectsManager }   from '@/threeApp/scene/EffectsManager';
import { RendererManager }  from '@/threeApp/scene/RendererManager';
import * as EventBus        from '@/threeApp/interaction/core/EventBus';

export class SelectionManager extends ContextSingleton<SelectionManager> {
  private selected: THREE.Object3D | null = null;

  /**
   * Выделить объект. Если тот же — ничего не делает.
   * Если другой — снимает старое, ставит новое.
   */
  public select(obj: THREE.Object3D): void {
    if (this.selected === obj) return;

    this.selected = obj;
    EffectsManager.inst().outlinePass.selectedObjects = [obj];

    RendererManager.inst().render();
    EventBus.emit('selection:changed', obj);
  }

  /**
   * Снять выделение. Если ничего не выделено — ничего не делает.
   */
  public deselect(): void {
    if (!this.selected) return;

    this.selected = null;
    EffectsManager.inst().outlinePass.selectedObjects = [];

    RendererManager.inst().render();
    EventBus.emit('selection:changed', null);
  }

  public getSelected(): THREE.Object3D | null {
    return this.selected;
  }
}
```

Зависимости:
- `EffectsManager` — уже инициализирован к моменту первого клика
- `RendererManager` — для перерисовки после смены выделения
- `EventBus` — для уведомления UI (PropertiesPanel в Stage 5)

---

## Раздел B: Интеграция с MouseManager

### B1. MouseManager — маршрутизация пустых кликов

Файл: `src/threeApp/scene/MouseManager.ts`

Сейчас `pointerDown` игнорирует клик, если `findInteractiveObject` вернул `null`. Нужно маршрутизировать и пустые клики — для deselect.

**Проблема:** нельзя слепо вызывать `deselect()` на каждый pointerdown в пустоту — нужно отличать клик от начала pan (OrbitControls). Но OrbitControls перехватывает события через свой listener, а `pointerDown` уже вызван.

**Решение:** deselect вызывается на `pointerDown` если не найден интерактивный объект. Pan через OrbitControls и deselect — не конфликтуют: pan двигает камеру, а selection меняет outline. Оба действия независимы и могут происходить одновременно без конфликта.

```typescript
// БЫЛО:
private pointerDown = (event: MouseEvent) => {
  this.updateRaycast(event.clientX, event.clientY);
  const intersects = this.raycaster.intersectObjects(SceneManager.inst().getScene().children, true);
  const target = this.findInteractiveObject(intersects);

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

// СТАНЕТ:
private pointerDown = (event: MouseEvent) => {
  this.updateRaycast(event.clientX, event.clientY);
  const intersects = this.raycaster.intersectObjects(SceneManager.inst().getScene().children, true);
  const target = this.findInteractiveObject(intersects);

  if (target) {
    this.actObj = target;
    ClickRouter.inst().route({
      objectType: identifyObject(target),
      object: target,
      action: 'down',
      clientX: event.clientX,
      clientY: event.clientY,
    });
  } else {
    // Клик в пустоту — снять выделение
    SelectionManager.inst().deselect();
  }
};
```

Добавить импорт:
```typescript
import { SelectionManager } from '@/threeApp/interaction/features/selection/SelectionManager';
```

---

## Раздел C: Интеграция с InteractionOrchestrator

### C1. InteractionOrchestrator — вызов select на 'down'

Файл: `src/threeApp/interaction/core/InteractionOrchestrator.ts`

Выделение — кросс-cutting concern: при клике на любой интерактивный объект (point, wall) он должен выделяться до того, как feature-handler обработает действие. Поэтому `select()` вызывается в `handleInteraction` перед `feature?.handle(data)`.

```typescript
// БЫЛО:
private handleInteraction(data: RouteData): void {
  if (data.objectType === 'unknown') return;
  const feature = this.features.get(data.objectType);
  feature?.handle(data);
}

// СТАНЕТ:
private handleInteraction(data: RouteData): void {
  if (data.objectType === 'unknown') return;

  if (data.action === 'down') {
    SelectionManager.inst().select(data.object);
  }

  const feature = this.features.get(data.objectType);
  feature?.handle(data);
}
```

Добавить импорт:
```typescript
import { SelectionManager } from '@/threeApp/interaction/features/selection/SelectionManager';
```

**Почему здесь, а не в каждом feature:**
- Выделение — единая логика для всех типов объектов
- Не нужен WallFeature только для selection (feature создаётся когда появляется wall-специфичная логика: drag, resize, split)
- Добавление нового типа объекта автоматически получит selection без дополнительного кода

---

## Раздел D: Фикс OutlinePass resize

### D1. EffectsManager.setSize — пересоздание render-target-ов OutlinePass

Файл: `src/threeApp/scene/EffectsManager.ts`, метод `setSize()`

`OutlinePass` создаёт внутренние render-target-ы (`renderTargetMaskBuffer`, `renderTargetEdgeBuffer1/2`, `renderTargetMaskDownSampleBuffer`, `renderTargetBlurBuffer1/2`, `renderTargetDepthBuffer`) в конструкторе с фиксированным размером. При resize окна эти target-ы не обновляются — outline рисуется в старом разрешении и масштабируется, что даёт артефакты.

`OutlinePass` имеет метод `setSize(width, height)` (наследуется от `Pass`), который обновляет все внутренние render-target-ы. `composer.setSize()` вызывает `pass.setSize()` для каждого pass-а в цепочке — поэтому resize уже должен работать через `composer.setSize()`.

Проверить: если `composer.setSize()` корректно вызывает `outlinePass.setSize()`, то дополнительных изменений не нужно. Если нет — добавить явный вызов.

Также нужно обновить `maskTexture` uniform в `linePass` после resize, т.к. `outlinePass.renderTargetMaskBuffer` мог быть пересоздан:

```typescript
// БЫЛО:
public setSize(width: number, height: number) {
  this.composer.setSize(width, height);

  if (this.linePass) {
    this.linePass.uniforms.resolution.value.set(width, height);
  }
}

// СТАНЕТ:
public setSize(width: number, height: number) {
  this.composer.setSize(width, height);

  if (this.linePass) {
    this.linePass.uniforms.resolution.value.set(width, height);
    // После resize OutlinePass может пересоздать render-target-ы —
    // обновляем ссылку на маску
    this.linePass.uniforms.maskTexture.value = this.outlinePass.renderTargetMaskBuffer.texture;
  }
}
```

---

## Проверочный чек-лист

После реализации всех разделов — по порядку:

- [ ] `npm run build` — без ошибок (`tsc` + `vite`)
- [ ] `npm run dev` — приложение запускается
- [ ] Клик на стену → зелёный outline по контуру стены
- [ ] Клик на точку → зелёный outline по контуру точки-сферы
- [ ] Клик в пустоту → outline исчезает
- [ ] Клик на стену A, затем на стену B → outline переключается на B (A теряет outline)
- [ ] Клик на стену, затем на точку → outline переключается на точку
- [ ] Drag точки: outline остаётся на точке во время и после drag
- [ ] Drag точки: стены обновляются как прежде
- [ ] 2D/3D toggle: outline корректно отображается в обоих режимах (камера синхронизируется в `EffectsManager.render()`)
- [ ] Resize окна: outline не «плывёт», разрешение корректное
- [ ] FPS / Draw calls оверлей работает как прежде
- [ ] Pan (перетаскивание фона) — снимает выделение, что ожидаемо и не создаёт проблем
- [ ] Кнопка «Сохранить» скачивает корректный JSON как прежде

---

## Структура файлов после Stage 4

Новые и изменённые файлы отмечены.

```
src/
├── threeApp/
│   ├── scene/
│   │   ├── EffectsManager.ts           # D1: фикс resize maskTexture
│   │   └── MouseManager.ts             # B1: deselect при клике в пустоту
│   │
│   └── interaction/
│       ├── core/
│       │   ├── EventBus.ts
│       │   ├── InteractionContext.ts
│       │   └── InteractionOrchestrator.ts  # C1: select на 'down'
│       │
│       └── features/
│           ├── points/
│           │   ├── PointFeature.ts
│           │   └── PointDragHandler.ts
│           └── selection/
│               └── SelectionManager.ts     # A1: NEW — управление outline-выделением
```

Итого: **1 новый файл**, **3 изменённых файла**.
