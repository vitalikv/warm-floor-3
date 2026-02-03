# Архитектура системы взаимодействий

> **Гибридная архитектура**: "Слоистая + Capabilities + Events"
> Версия: 1.0
> Дата: 2026-02-02

## 📋 Содержание

- [Обзор](#обзор)
- [Структура файлов](#структура-файлов)
- [Архитектура слоёв](#архитектура-слоёв)
- [Ключевые концепции](#ключевые-концепции)
- [Система этажей (Levels)](#система-этажей-levels)
- [Потоки данных](#потоки-данных)
- [Примеры использования](#примеры-использования)
- [Миграция существующего кода](#миграция-существующего-кода)

---

## 🎯 Обзор

Система взаимодействий объединяет лучшее из двух подходов:
- **Слоистую архитектуру** (простота отладки, чёткое разделение)
- **Capabilities Pattern** (динамические возможности объектов)
- **Command Pattern** (полноценный Undo/Redo)
- **Policy Pattern** (гибкие правила доступа)

### Принципы

✅ **Разделение ответственности** - каждый слой решает свою задачу
✅ **Расширяемость** - легко добавлять новые типы объектов и режимы
✅ **Переиспользование** - общие поведения (Behaviors) для всех обработчиков
✅ **Типобезопасность** - строгая типизация TypeScript
✅ **Тестируемость** - каждый компонент можно тестировать изолированно

---

## 📁 Структура файлов

```
src/
├── main.ts                            # 🚀 Точка входа приложения
├── core/
│   └── ContextSingleton.ts           # Базовый класс для синглтонов
│
├── threeApp/
│   ├── ThreeMain.ts                  # 🎯 Главный оркестратор Three.js
│   │
│   ├── scene/                         # 🎬 БАЗОВЫЙ ФУНКЦИОНАЛ СЦЕНЫ
│   │   ├── SceneManager.ts           # Управление THREE.Scene
│   │   ├── RendererManager.ts        # WebGL рендерер
│   │   ├── CameraManager.ts          # Двойная камера (2D/3D)
│   │   ├── ControlsManager.ts        # OrbitControls
│   │   ├── LightsManager.ts          # Освещение
│   │   ├── GridHelper.ts             # Сетка и вспомогательные объекты
│   │   └── PostProcessing.ts         # Постобработка (outline, etc.)
│   │
│   ├── house/                         # 🏠 ЛОГИКА ПОСТРОЕНИЯ ДОМА
│   │   ├── HouseManager.ts           # Главный менеджер дома (оркестратор)
│   │   ├── HouseLoader.ts            # Загрузка данных дома из JSON
│   │   ├── HouseExporter.ts          # Экспорт данных дома в JSON
│   │   │
│   │   ├── levels/                    # 🏢 Система этажей
│   │   │   ├── LevelManager.ts       # Управление этажами
│   │   │   ├── Level.ts              # Класс этажа
│   │   │   ├── LevelContext.ts       # Контекст активного этажа
│   │   │   └── LevelVisibility.ts    # Видимость этажей (ghost/hidden)
│   │   │
│   │   ├── points/                    # 📍 Точки (вершины стен)
│   │   │   ├── PointsManager.ts      # Управление точками
│   │   │   ├── Point.ts              # Класс точки
│   │   │   ├── PointMesh.ts          # Визуальное представление
│   │   │   └── PointFactory.ts       # Создание точек
│   │   │
│   │   ├── walls/                     # 🧱 Стены
│   │   │   ├── WallsManager.ts       # Управление стенами
│   │   │   ├── Wall.ts               # Класс стены
│   │   │   ├── WallGeometry.ts       # Генерация геометрии стены
│   │   │   ├── WallMaterial.ts       # Материалы стен
│   │   │   └── WallFactory.ts        # Создание стен
│   │   │
│   │   ├── rooms/                     # 🚪 Комнаты
│   │   │   ├── RoomsManager.ts       # Управление комнатами
│   │   │   ├── Room.ts               # Класс комнаты
│   │   │   ├── RoomDetector.ts       # Автоопределение комнат по стенам
│   │   │   └── RoomFloor.ts          # Пол комнаты
│   │   │
│   │   ├── openings/                  # 🚪🪟 Двери и окна
│   │   │   ├── OpeningsManager.ts    # Управление проёмами
│   │   │   ├── Door.ts               # Класс двери
│   │   │   ├── Window.ts             # Класс окна
│   │   │   ├── OpeningPlacer.ts      # Размещение на стене
│   │   │   └── OpeningCutter.ts      # Вырезание проёмов в стене
│   │   │
│   │   ├── objects/                   # 🪑 Мебель и объекты
│   │   │   ├── ObjectsManager.ts     # Управление объектами
│   │   │   ├── FurnitureObject.ts    # Класс мебели
│   │   │   ├── ObjectCatalog.ts      # Каталог объектов
│   │   │   └── ObjectPlacer.ts       # Размещение объектов
│   │   │
│   │   ├── roofs/                     # 🏠 Крыши
│   │   │   ├── RoofsManager.ts       # Управление крышами
│   │   │   ├── Roof.ts               # Класс крыши
│   │   │   ├── RoofGeometry.ts       # Генерация геометрии
│   │   │   └── RoofTypes.ts          # Типы крыш (плоская, двускатная, etc.)
│   │   │
│   │   ├── stairs/                    # 🪜 Лестницы
│   │   │   ├── StairsManager.ts      # Управление лестницами
│   │   │   ├── Stairway.ts           # Класс лестницы
│   │   │   └── StairTypes.ts         # Типы лестниц
│   │   │
│   │   └── floors/                    # 🟫 Перекрытия
│   │       ├── FloorsManager.ts      # Управление перекрытиями
│   │       ├── FloorSlab.ts          # Плита перекрытия
│   │       └── FloorOpening.ts       # Проёмы в перекрытиях
│   │
│   ├── interaction/                   # 🖱️ СИСТЕМА ВЗАИМОДЕЙСТВИЙ
│   │   ├── core/
│   │   │   ├── InteractionOrchestrator.ts  # Главный координатор
│   │   │   ├── EventBus.ts                 # Event Bus для событий
│   │   │   ├── InteractionContext.ts       # Глобальное состояние
│   │   │   └── CursorManager.ts            # Управление курсором
│   │   │
│   │   ├── input/                     # 📥 Слой ввода
│   │   │   ├── MouseInputManager.ts  # Mouse/touch события
│   │   │   ├── KeyboardInputManager.ts # Клавиатура
│   │   │   └── GestureDetector.ts    # Жесты
│   │   │
│   │   ├── routing/                   # 🚦 Слой маршрутизации
│   │   │   ├── ClickRouter.ts        # Маршрутизация событий
│   │   │   ├── RaycastService.ts     # Centralized raycasting
│   │   │   └── ObjectIdentifier.ts   # Определение типа объекта
│   │   │
│   │   ├── modes/                     # 🎨 Режимы работы
│   │   │   ├── ModeManager.ts        # Управление режимами
│   │   │   ├── Mode.ts               # Базовый класс режима
│   │   │   ├── Camera2DMode.ts       # 2D режим
│   │   │   ├── Camera3DMode.ts       # 3D режим
│   │   │   ├── ViewOnlyMode.ts       # Только просмотр
│   │   │   └── MeasureMode.ts        # Режим измерений
│   │   │
│   │   ├── policies/                  # 🔒 Правила доступа
│   │   │   ├── InteractionPolicy.ts  # Базовый класс политик
│   │   │   ├── Camera2DPolicy.ts     # Правила для 2D
│   │   │   ├── Camera3DPolicy.ts     # Правила для 3D
│   │   │   ├── LevelPolicy.ts        # Правила для этажей
│   │   │   └── PolicyRegistry.ts     # Реестр политик
│   │   │
│   │   ├── capabilities/              # 🧩 Возможности объектов (Mixins)
│   │   │   ├── Capability.ts         # Базовый интерфейс
│   │   │   ├── Draggable.ts          # Можно перетаскивать
│   │   │   ├── Selectable.ts         # Можно выделять
│   │   │   ├── Snappable.ts          # Привязка к сетке
│   │   │   ├── Resizable.ts          # Изменение размера
│   │   │   ├── Hoverable.ts          # Подсветка при наведении
│   │   │   ├── Rotatable.ts          # Можно вращать
│   │   │   ├── Deletable.ts          # Можно удалить
│   │   │   ├── LevelBound.ts         # Привязка к этажу
│   │   │   └── utils.ts              # Утилиты (applyCapabilities, hasCapability)
│   │   │
│   │   ├── features/                  # 🎭 Фичи (группы обработчиков)
│   │   │   ├── Feature.ts            # Базовый класс фичи
│   │   │   │
│   │   │   ├── points/
│   │   │   │   ├── PointFeature.ts
│   │   │   │   ├── PointDragHandler.ts
│   │   │   │   └── PointSnapHandler.ts
│   │   │   │
│   │   │   ├── walls/
│   │   │   │   ├── WallFeature.ts
│   │   │   │   ├── WallDragHandler.ts
│   │   │   │   ├── WallResizeHandler.ts
│   │   │   │   └── WallSplitHandler.ts
│   │   │   │
│   │   │   ├── rooms/
│   │   │   │   ├── RoomFeature.ts
│   │   │   │   └── RoomSelectHandler.ts
│   │   │   │
│   │   │   ├── objects/
│   │   │   │   ├── ObjectFeature.ts
│   │   │   │   ├── ObjectPlaceHandler.ts
│   │   │   │   ├── ObjectDragHandler.ts
│   │   │   │   └── ObjectRotateHandler.ts
│   │   │   │
│   │   │   ├── openings/
│   │   │   │   ├── OpeningFeature.ts
│   │   │   │   ├── OpeningMoveHandler.ts
│   │   │   │   └── OpeningResizeHandler.ts
│   │   │   │
│   │   │   └── roofs/
│   │   │       ├── RoofFeature.ts
│   │   │       └── RoofEditHandler.ts
│   │   │
│   │   ├── behaviors/                 # 🔄 Переиспользуемые поведения
│   │   │   ├── DragBehavior.ts       # Общая логика drag
│   │   │   ├── SnapBehavior.ts       # Привязка к сетке/точкам
│   │   │   ├── HoverBehavior.ts      # Подсветка при наведении
│   │   │   ├── OutlineBehavior.ts    # Обводка выделенных
│   │   │   └── CollisionBehavior.ts  # Проверка коллизий
│   │   │
│   │   ├── tools/                     # 🛠️ Универсальные инструменты
│   │   │   ├── ToolManager.ts        # Управление инструментами
│   │   │   ├── SelectionTool.ts      # Выделение (box selection)
│   │   │   ├── MeasureTool.ts        # Измерения
│   │   │   ├── TransformTool.ts      # Трансформация (pivot/rotate/scale)
│   │   │   └── SnapTool.ts           # Привязка
│   │   │
│   │   ├── commands/                  # ⏮️ Команды для Undo/Redo
│   │   │   ├── CommandManager.ts     # История команд
│   │   │   ├── Command.ts            # Базовый интерфейс
│   │   │   ├── MoveCommand.ts
│   │   │   ├── DeleteCommand.ts
│   │   │   ├── AddCommand.ts
│   │   │   ├── ResizeCommand.ts
│   │   │   ├── TransformCommand.ts
│   │   │   ├── CreateLevelCommand.ts
│   │   │   ├── DeleteLevelCommand.ts
│   │   │   └── ChangeLevelCommand.ts
│   │   │
│   │   └── blocking/                  # 🚫 Система блокировок
│   │       ├── BlockingManager.ts
│   │       └── BlockingRules.ts
│   │
│   └── loaders/                       # 📦 Загрузчики ресурсов
│       ├── ModelLoader.ts            # Загрузка 3D моделей
│       ├── TextureLoader.ts          # Загрузка текстур
│       └── MaterialLibrary.ts        # Библиотека материалов
│
├── ui/                                # 🖼️ UI КОМПОНЕНТЫ
│   ├── UiMain.ts                     # Главный UI оркестратор
│   │
│   ├── panels/
│   │   ├── TopPanel.ts               # Верхняя панель
│   │   ├── LeftPanel.ts              # Левая панель (каталог)
│   │   ├── RightPanel.ts             # Правая панель (свойства)
│   │   ├── LevelPanel.ts             # Панель этажей
│   │   └── PropertiesPanel.ts        # Панель свойств объекта
│   │
│   ├── toolbar/
│   │   ├── Toolbar.ts                # Панель инструментов
│   │   └── ToolButton.ts             # Кнопка инструмента
│   │
│   ├── controls/
│   │   ├── CameraToggle.ts           # Переключатель 2D/3D
│   │   ├── UndoRedoButtons.ts        # Кнопки отмены/повтора
│   │   └── ZoomControls.ts           # Управление зумом
│   │
│   └── dialogs/
│       ├── ConfirmDialog.ts          # Диалог подтверждения
│       └── SettingsDialog.ts         # Диалог настроек
│
└── utils/                             # 🔧 УТИЛИТЫ
    ├── math/
    │   ├── GeometryUtils.ts          # Геометрические вычисления
    │   ├── VectorUtils.ts            # Работа с векторами
    │   └── PolygonUtils.ts           # Работа с полигонами
    │
    ├── helpers/
    │   ├── DebugHelper.ts            # Отладочные инструменты
    │   └── PerformanceMonitor.ts     # Мониторинг производительности
    │
    └── types/
        ├── HouseTypes.ts             # Типы для дома
        ├── InteractionTypes.ts       # Типы для взаимодействий
        └── EventTypes.ts             # Типы событий
```

---

## 🏗️ Архитектура слоёв

### Поток обработки событий

```
┌─────────────────────────────────────────────────────────────┐
│  USER INPUT (Mouse, Keyboard, Touch)                        │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  INPUT LAYER: MouseInputManager, KeyboardInputManager       │
│  - Нормализация событий                                     │
│  - Обнаружение жестов                                       │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  ROUTING LAYER: ClickRouter, RaycastService                 │
│  - Raycasting                                               │
│  - Определение типа объекта (point, wall, object)          │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  POLICY CHECK: PolicyRegistry                               │
│  - Проверка: можно ли взаимодействовать?                   │
│  - Текущий режим разрешает это действие?                   │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  CAPABILITY CHECK: Объект имеет нужную Capability?         │
│  - Draggable? Selectable? Resizable?                        │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  FEATURE LAYER: PointFeature, WallFeature, ObjectFeature    │
│  - Делегирует в конкретный Handler                         │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  HANDLER: PointDragHandler, WallMoveHandler, etc.           │
│  - Использует Behaviors (DragBehavior, SnapBehavior)        │
│  - Создает Command и отправляет в CommandManager            │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  COMMAND EXECUTION: CommandManager                          │
│  - Выполняет команду                                        │
│  - Сохраняет в истории для Undo/Redo                       │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  EVENT BUS: Уведомления других модулей                      │
│  - 'object:moved', 'wall:resized', 'selection:changed'      │
└─────────────────────────────────────────────────────────────┘
```

### Описание слоёв

#### 1. INPUT LAYER (Слой ввода)
**Ответственность**: Захват и нормализация событий ввода

- **MouseInputManager**: Централизованная обработка mouse/touch событий
- **KeyboardInputManager**: Обработка клавиатурных shortcuts
- **GestureDetector**: Распознавание жестов (long-press, pinch-zoom, swipe)

**Выходные данные**: Нормализованные события с координатами, типом, модификаторами

#### 2. ROUTING LAYER (Слой маршрутизации)
**Ответственность**: Определение цели события

- **RaycastService**: Централизованный raycasting для определения объектов под курсором
- **ObjectIdentifier**: Определяет тип объекта по `userData.tag`
- **ClickRouter**: Маршрутизирует события к соответствующим обработчикам

**Выходные данные**: `{ objectType, object, event, action }`

#### 3. POLICY LAYER (Слой политик)
**Ответственность**: Проверка разрешений

- **PolicyRegistry**: Хранит текущую активную политику
- **InteractionPolicy**: Базовый класс политик
- **Camera2DPolicy/Camera3DPolicy**: Конкретные правила для режимов

**Выходные данные**: `boolean` (разрешено/запрещено)

#### 4. CAPABILITY LAYER (Слой возможностей)
**Ответственность**: Проверка возможностей объекта

- Проверяет наличие capability в `object.userData.capabilities`
- Динамическое добавление/удаление возможностей

**Выходные данные**: `boolean` (объект имеет/не имеет capability)

#### 5. FEATURE LAYER (Слой фич)
**Ответственность**: Группировка обработчиков по типам объектов

- **PointFeature**: Управляет всеми обработчиками точек
- **WallFeature**: Управляет всеми обработчиками стен
- **ObjectFeature**: Управляет обработчиками объектов

**Выходные данные**: Делегирование в конкретный Handler

#### 6. HANDLER LAYER (Слой обработчиков)
**Ответственность**: Выполнение конкретного действия

- Использует **Behaviors** для общей логики
- Создаёт **Command** для выполнения
- Управляет состоянием (isDown, isMove, selectedObject)

**Выходные данные**: Command для выполнения

#### 7. COMMAND LAYER (Слой команд)
**Ответственность**: Выполнение и история операций

- **CommandManager**: Выполняет команды и управляет историей
- **Command**: Базовый интерфейс с методами execute/undo/redo
- Автоматическая поддержка Undo/Redo

**Выходные данные**: Изменения в сцене + запись в историю

#### 8. EVENT BUS (Шина событий)
**Ответственность**: Межмодульная коммуникация

- Используется **только** для критичных событий
- Слабая связанность между модулями
- События: `object:moved`, `camera:switched`, `selection:changed`

---

## 💡 Ключевые концепции

### 1. Режимы (Modes)

Режимы определяют контекст работы приложения.

```typescript
// modes/Mode.ts
export abstract class Mode {
  abstract name: string;
  abstract enabledFeatures: string[];
  abstract policy: InteractionPolicy;

  abstract onActivate(): void;
  abstract onDeactivate(): void;
}
```

**Примеры режимов:**
- **Camera2DMode**: Редактирование в 2D (точки, стены, комнаты)
- **Camera3DMode**: Просмотр в 3D + размещение объектов
- **ViewOnlyMode**: Только навигация, никаких изменений
- **MeasureMode**: Измерения расстояний и площадей

```typescript
// modes/Camera2DMode.ts
export class Camera2DMode extends Mode {
  name = '2D';
  enabledFeatures = ['points', 'walls', 'rooms'];
  policy = new Camera2DPolicy();

  onActivate() {
    ToolManager.inst().enableTools(['snap', 'measure']);
    CursorManager.inst().setCursor('default');
  }

  onDeactivate() {
    // Cleanup
  }
}
```

### 2. Политики (Policies)

Политики определяют правила доступа для каждого режима.

```typescript
// policies/InteractionPolicy.ts
export abstract class InteractionPolicy {
  abstract allows(action: string, objectType: string): boolean;
}
```

```typescript
// policies/Camera2DPolicy.ts
export class Camera2DPolicy extends InteractionPolicy {
  private rules = {
    drag: ['point', 'wall'],
    select: ['point', 'wall', 'room'],
    delete: ['point', 'wall'],
    resize: ['wall'],
  };

  allows(action: string, objectType: string): boolean {
    const allowedTypes = this.rules[action];
    return allowedTypes?.includes(objectType) ?? false;
  }
}
```

**Использование:**
```typescript
const policy = ModeManager.inst().getCurrentMode().policy;
if (policy.allows('drag', 'point')) {
  // Разрешено перетаскивать точки
}
```

### 3. Capabilities (Возможности)

Capabilities добавляют динамические возможности объектам через миксины.

```typescript
// capabilities/Capability.ts
export interface Capability {
  type: string;
  attach(object: THREE.Object3D): void;
  detach(object: THREE.Object3D): void;
}
```

```typescript
// capabilities/Draggable.ts
export class Draggable implements Capability {
  type = 'draggable';

  attach(object: THREE.Object3D) {
    object.userData.capabilities = object.userData.capabilities || [];
    if (!object.userData.capabilities.includes('draggable')) {
      object.userData.capabilities.push('draggable');
    }
  }

  detach(object: THREE.Object3D) {
    const caps = object.userData.capabilities || [];
    const index = caps.indexOf('draggable');
    if (index > -1) {
      caps.splice(index, 1);
    }
  }
}
```

**Использование:**
```typescript
// Применение возможностей к объекту
const pointMesh = createPoint();
applyCapabilities(pointMesh, [
  new Draggable(),
  new Selectable(),
  new Snappable()
]);

// Проверка возможностей
if (hasCapability(object, 'draggable')) {
  // Объект можно перетаскивать
}
```

**Утилиты:**
```typescript
// capabilities/utils.ts
export function applyCapabilities(
  object: THREE.Object3D,
  capabilities: Capability[]
) {
  capabilities.forEach(cap => cap.attach(object));
}

export function hasCapability(
  object: THREE.Object3D,
  capabilityType: string
): boolean {
  const caps = object.userData.capabilities || [];
  return caps.includes(capabilityType);
}
```

### 4. Features (Фичи)

Features группируют обработчики по типам объектов.

```typescript
// features/Feature.ts
export abstract class Feature {
  abstract name: string;
  protected handlers: Map<string, any> = new Map();
  protected enabled: boolean = false;

  abstract init(): void;

  enable() {
    this.enabled = true;
    this.handlers.forEach(h => h.enable?.());
  }

  disable() {
    this.enabled = false;
    this.handlers.forEach(h => h.disable?.());
  }

  handle(event: any, object: THREE.Object3D) {
    if (!this.enabled) return;

    const action = event.action; // 'drag', 'select', 'resize', etc.
    const handler = this.handlers.get(action);

    if (handler) {
      handler.handle(event, object);
    }
  }
}
```

```typescript
// features/points/PointFeature.ts
export class PointFeature extends Feature {
  name = 'points';

  init() {
    this.handlers.set('drag', new PointDragHandler());
    this.handlers.set('snap', new PointSnapHandler());
  }
}
```

### 5. Behaviors (Поведения)

Behaviors содержат переиспользуемую логику для разных обработчиков.

```typescript
// behaviors/DragBehavior.ts
export class DragBehavior {
  private plane: THREE.Plane;
  private offset: THREE.Vector3;

  startDrag(object: THREE.Object3D, event: PointerEvent) {
    // Создаём плоскость на уровне объекта
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -object.position.y);

    // Вычисляем начальное смещение
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(getNormalizedCoords(event), camera);

    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(this.plane, intersection);

    this.offset = intersection.clone().sub(object.position);
  }

  updateDrag(object: THREE.Object3D, event: PointerEvent): THREE.Vector3 {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(getNormalizedCoords(event), camera);

    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(this.plane, intersection);

    return intersection.sub(this.offset);
  }

  endDrag() {
    this.plane = null;
    this.offset = null;
  }
}
```

**Использование в Handler:**
```typescript
// features/points/PointDragHandler.ts
export class PointDragHandler {
  private dragBehavior = new DragBehavior();
  private snapBehavior = new SnapBehavior();

  handleMouseDown(event: PointerEvent, object: THREE.Object3D) {
    this.dragBehavior.startDrag(object, event);
  }

  handleMouseMove(event: PointerEvent, object: THREE.Object3D) {
    let newPos = this.dragBehavior.updateDrag(object, event);

    // Применяем привязку к сетке
    newPos = this.snapBehavior.snapToGrid(newPos, 0.1);

    // Обновляем позицию
    object.position.copy(newPos);
  }
}
```

### 6. Commands (Команды)

Commands реализуют паттерн Command для Undo/Redo.

```typescript
// commands/Command.ts
export interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
  canMerge?(other: Command): boolean;
  merge?(other: Command): void;
}
```

```typescript
// commands/MoveCommand.ts
export class MoveCommand implements Command {
  constructor(
    private object: THREE.Object3D,
    private oldPosition: THREE.Vector3,
    private newPosition: THREE.Vector3
  ) {}

  execute() {
    this.object.position.copy(this.newPosition);
    EventBus.emit('object:moved', { object: this.object });
  }

  undo() {
    this.object.position.copy(this.oldPosition);
    EventBus.emit('object:moved', { object: this.object });
  }

  redo() {
    this.execute();
  }

  // Опционально: объединение последовательных перемещений
  canMerge(other: Command): boolean {
    return other instanceof MoveCommand && other.object === this.object;
  }

  merge(other: MoveCommand) {
    this.newPosition = other.newPosition.clone();
  }
}
```

**CommandManager:**
```typescript
// commands/CommandManager.ts
export class CommandManager extends ContextSingleton {
  private history: Command[] = [];
  private currentIndex: number = -1;
  private maxHistorySize: number = 100;

  execute(command: Command) {
    // Удаляем "будущее" если мы не в конце истории
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // Пытаемся объединить с предыдущей командой
    const lastCommand = this.history[this.currentIndex];
    if (lastCommand?.canMerge?.(command)) {
      lastCommand.merge(command);
      command.execute();
      return;
    }

    // Выполняем команду
    command.execute();

    // Добавляем в историю
    this.history.push(command);
    this.currentIndex++;

    // Ограничиваем размер истории
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
      this.currentIndex--;
    }

    EventBus.emit('history:changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    });
  }

  undo() {
    if (!this.canUndo()) return;

    const command = this.history[this.currentIndex];
    command.undo();
    this.currentIndex--;

    EventBus.emit('history:changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    });
  }

  redo() {
    if (!this.canRedo()) return;

    this.currentIndex++;
    const command = this.history[this.currentIndex];
    command.redo();

    EventBus.emit('history:changed', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    });
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
  }
}
```

### 7. Tools (Инструменты)

Tools - это универсальные функции, которые могут работать в разных режимах.

```typescript
// tools/ToolManager.ts
export class ToolManager extends ContextSingleton {
  private tools: Map<string, Tool> = new Map();
  private activeTool: Tool | null = null;

  registerTool(name: string, tool: Tool) {
    this.tools.set(name, tool);
  }

  activateTool(name: string) {
    if (this.activeTool) {
      this.activeTool.deactivate();
    }

    const tool = this.tools.get(name);
    if (tool) {
      tool.activate();
      this.activeTool = tool;
      EventBus.emit('tool:activated', { name });
    }
  }

  deactivateTool() {
    if (this.activeTool) {
      this.activeTool.deactivate();
      this.activeTool = null;
      EventBus.emit('tool:deactivated');
    }
  }
}
```

```typescript
// tools/MeasureTool.ts
export class MeasureTool implements Tool {
  private line: THREE.Line | null = null;
  private points: THREE.Vector3[] = [];

  activate() {
    CursorManager.inst().setCursor('crosshair');
    EventBus.on('click', this.handleClick);
  }

  deactivate() {
    this.clear();
    CursorManager.inst().setCursor('default');
    EventBus.off('click', this.handleClick);
  }

  handleClick = (event: PointerEvent) => {
    const intersection = RaycastService.inst().getIntersection(event);
    if (!intersection) return;

    this.points.push(intersection.point);

    if (this.points.length === 2) {
      const distance = this.points[0].distanceTo(this.points[1]);
      console.log(`Distance: ${distance.toFixed(2)} units`);
      this.showMeasurement(distance);
      this.clear();
    }
  }

  private showMeasurement(distance: number) {
    // Показать UI с результатом
  }

  private clear() {
    this.points = [];
    if (this.line) {
      this.line.removeFromParent();
      this.line = null;
    }
  }
}
```

### 8. Blocking System (Система блокировок)

Предотвращает конфликты между разными режимами и инструментами.

```typescript
// blocking/BlockingManager.ts
export class BlockingManager extends ContextSingleton {
  private blocks: Map<string, Set<string>> = new Map();

  block(category: string, type: string) {
    if (!this.blocks.has(category)) {
      this.blocks.set(category, new Set());
    }
    this.blocks.get(category)!.add(type);

    EventBus.emit('blocking:changed', { category, type, blocked: true });
  }

  unblock(category: string, type: string) {
    const categoryBlocks = this.blocks.get(category);
    if (categoryBlocks) {
      categoryBlocks.delete(type);
      EventBus.emit('blocking:changed', { category, type, blocked: false });
    }
  }

  isBlocked(category: string, type: string): boolean {
    return this.blocks.get(category)?.has(type) ?? false;
  }

  clearCategory(category: string) {
    this.blocks.delete(category);
  }

  clearAll() {
    this.blocks.clear();
  }
}
```

**Использование:**
```typescript
// Блокировка взаимодействий с точками во время операции со стенами
BlockingManager.inst().block('click', 'point');
BlockingManager.inst().block('hover', 'point');

// ... выполнение операции ...

BlockingManager.inst().unblock('click', 'point');
BlockingManager.inst().unblock('hover', 'point');
```

### 9. InteractionOrchestrator (Оркестратор)

Главный координатор, который связывает все компоненты.

```typescript
// core/InteractionOrchestrator.ts
export class InteractionOrchestrator extends ContextSingleton {
  private features: Map<string, Feature> = new Map();
  private modeManager: ModeManager;
  private clickRouter: ClickRouter;
  private blockingManager: BlockingManager;

  init() {
    // 1. Инициализация фич
    this.registerFeature(new PointFeature());
    this.registerFeature(new WallFeature());
    this.registerFeature(new ObjectFeature());
    this.registerFeature(new RoomFeature());

    this.features.forEach(f => f.init());

    // 2. Routing
    this.clickRouter = ClickRouter.inst();
    this.clickRouter.onRouted((routeData) => {
      this.handleInteraction(routeData);
    });

    // 3. Mode management
    this.modeManager = ModeManager.inst();
    this.modeManager.onModeChange((mode) => {
      this.switchMode(mode);
    });

    // 4. Blocking
    this.blockingManager = BlockingManager.inst();

    // 5. Подписки на события
    this.subscribeToEvents();
  }

  private registerFeature(feature: Feature) {
    this.features.set(feature.name, feature);
  }

  private handleInteraction(routeData: RouteData) {
    const { objectType, action, event, object } = routeData;

    // 1. Проверка блокировок
    if (this.blockingManager.isBlocked('click', objectType)) {
      return;
    }

    // 2. Проверка Policy
    const mode = this.modeManager.getCurrentMode();
    if (!mode.policy.allows(action, objectType)) {
      return;
    }

    // 3. Проверка Capability
    if (!hasCapability(object, action)) {
      return;
    }

    // 4. Делегирование в Feature
    const feature = this.features.get(objectType);
    if (feature && feature.enabled) {
      feature.handle(event, object);
    }
  }

  private switchMode(mode: Mode) {
    // Деактивация предыдущего режима
    const prevMode = this.modeManager.getPreviousMode();
    if (prevMode) {
      prevMode.onDeactivate();
    }

    // Активация нового режима
    mode.onActivate();

    // Включение/отключение фич
    this.features.forEach((feature, name) => {
      if (mode.enabledFeatures.includes(name)) {
        feature.enable();
      } else {
        feature.disable();
      }
    });

    EventBus.emit('mode:changed', { mode: mode.name });
  }

  private subscribeToEvents() {
    // Подписка на переключение камеры
    EventBus.on('camera:switched', ({ cameraMode }) => {
      if (cameraMode === '2D') {
        this.modeManager.setMode(new Camera2DMode());
      } else if (cameraMode === '3D') {
        this.modeManager.setMode(new Camera3DMode());
      }
    });
  }
}
```

---

## 🏢 Система этажей (Levels)

Система поддерживает многоэтажные здания с возможностью редактирования только активного этажа.

### Принципы работы с этажами

1. **Объекты привязаны к этажам** через `userData.levelId`
2. **Активен только один этаж** для редактирования в любой момент времени
3. **Неактивные этажи заблокированы** для взаимодействий через `LevelPolicy`
4. **Видимость настраивается** - неактивные этажи могут быть ghost/hidden/wireframe
5. **В 3D можно видеть все этажи**, но редактировать только активный
6. **Commands сохраняют levelId** для правильного Undo/Redo

### 10. LevelManager (Менеджер этажей)

Главный менеджер для работы с этажами.

```typescript
// house/levels/LevelManager.ts
export class LevelManager extends ContextSingleton {
  private levels: Map<string, Level> = new Map();
  private activeLevel: Level | null = null;

  // Создание этажа
  createLevel(id: string, options: LevelOptions): Level {
    const level = new Level(id, options);
    this.levels.set(id, level);

    // Добавляем контейнер этажа на сцену
    SceneManager.inst().scene.add(level.container);

    EventBus.emit('level:created', { level });
    return level;
  }

  // Удаление этажа
  deleteLevel(levelId: string): boolean {
    const level = this.levels.get(levelId);
    if (!level) return false;

    // Нельзя удалить активный этаж
    if (level === this.activeLevel) {
      console.warn('Cannot delete active level');
      return false;
    }

    // Удаляем с сцены
    SceneManager.inst().scene.remove(level.container);
    level.dispose();

    this.levels.delete(levelId);
    EventBus.emit('level:deleted', { levelId });
    return true;
  }

  // Переключение активного этажа
  setActiveLevel(levelId: string) {
    const prevLevel = this.activeLevel;
    const newLevel = this.levels.get(levelId);

    if (!newLevel) {
      console.warn(`Level ${levelId} not found`);
      return;
    }

    // Деактивируем предыдущий этаж
    if (prevLevel) {
      prevLevel.setActive(false);
      LevelVisibility.inst().setVisibility(prevLevel, 'ghost');
    }

    // Активируем новый этаж
    newLevel.setActive(true);
    LevelVisibility.inst().setVisibility(newLevel, 'full');
    this.activeLevel = newLevel;

    // Блокируем объекты других этажей для взаимодействий
    BlockingManager.inst().setLevelBlock(levelId);

    EventBus.emit('level:changed', {
      from: prevLevel?.id,
      to: newLevel.id
    });
  }

  // Получение активного этажа
  getActiveLevel(): Level | null {
    return this.activeLevel;
  }

  // Получение этажа по ID
  getLevel(levelId: string): Level | undefined {
    return this.levels.get(levelId);
  }

  // Получение всех этажей
  getAllLevels(): Level[] {
    return Array.from(this.levels.values())
      .sort((a, b) => a.elevation - b.elevation); // Сортировка по высоте
  }

  // Получение этажа выше/ниже текущего
  getLevelAbove(levelId: string): Level | undefined {
    const levels = this.getAllLevels();
    const currentIndex = levels.findIndex(l => l.id === levelId);
    return levels[currentIndex + 1];
  }

  getLevelBelow(levelId: string): Level | undefined {
    const levels = this.getAllLevels();
    const currentIndex = levels.findIndex(l => l.id === levelId);
    return levels[currentIndex - 1];
  }

  // Копирование этажа (создание нового на основе существующего)
  copyLevel(sourceLevelId: string, newId: string, newElevation: number): Level | null {
    const sourceLevel = this.levels.get(sourceLevelId);
    if (!sourceLevel) return null;

    const newLevel = this.createLevel(newId, {
      name: `${sourceLevel.name} (копия)`,
      height: sourceLevel.height,
      elevation: newElevation
    });

    // Копируем объекты (точки, стены, комнаты)
    sourceLevel.copyObjectsTo(newLevel);

    return newLevel;
  }
}
```

### 11. Level (Класс этажа)

Класс, представляющий отдельный этаж здания.

```typescript
// house/levels/Level.ts
export interface LevelOptions {
  name?: string;
  height?: number;      // Высота потолка этажа (по умолчанию 2.8м)
  elevation?: number;   // Высота от земли (Y координата пола)
}

export class Level {
  id: string;
  name: string;
  height: number;
  elevation: number;
  isActive: boolean = false;

  // Главный контейнер этажа
  container: THREE.Group;

  // Подгруппы для разных типов объектов
  pointsGroup: THREE.Group;
  wallsGroup: THREE.Group;
  roomsGroup: THREE.Group;
  objectsGroup: THREE.Group;
  doorsWindowsGroup: THREE.Group;

  // Связи с другими этажами
  stairways: Stairway[] = [];      // Лестницы на этот этаж
  openings: FloorOpening[] = [];   // Проёмы в полу/потолке

  constructor(id: string, options: LevelOptions = {}) {
    this.id = id;
    this.name = options.name || `Этаж ${id}`;
    this.height = options.height || 2.8;
    this.elevation = options.elevation || 0;

    // Создаём главный контейнер
    this.container = new THREE.Group();
    this.container.name = `level-${id}`;
    this.container.position.y = this.elevation;
    this.container.userData.levelId = this.id;
    this.container.userData.isLevel = true;

    // Создаём подгруппы
    this.pointsGroup = new THREE.Group();
    this.pointsGroup.name = 'points';

    this.wallsGroup = new THREE.Group();
    this.wallsGroup.name = 'walls';

    this.roomsGroup = new THREE.Group();
    this.roomsGroup.name = 'rooms';

    this.objectsGroup = new THREE.Group();
    this.objectsGroup.name = 'objects';

    this.doorsWindowsGroup = new THREE.Group();
    this.doorsWindowsGroup.name = 'doors-windows';

    // Добавляем подгруппы в контейнер
    this.container.add(
      this.pointsGroup,
      this.wallsGroup,
      this.roomsGroup,
      this.objectsGroup,
      this.doorsWindowsGroup
    );
  }

  setActive(active: boolean) {
    this.isActive = active;
    this.container.userData.isActive = active;
  }

  // Добавление объектов на этаж
  addPoint(point: PointWall) {
    point.mesh.userData.levelId = this.id;
    this.pointsGroup.add(point.mesh);
  }

  addWall(wall: Wall) {
    wall.mesh.userData.levelId = this.id;
    this.wallsGroup.add(wall.mesh);
  }

  addRoom(room: Room) {
    room.mesh.userData.levelId = this.id;
    this.roomsGroup.add(room.mesh);
  }

  addObject(obj: THREE.Object3D) {
    obj.userData.levelId = this.id;
    this.objectsGroup.add(obj);
  }

  addDoorWindow(dw: DoorWindow) {
    dw.mesh.userData.levelId = this.id;
    this.doorsWindowsGroup.add(dw.mesh);
  }

  // Удаление объектов
  removePoint(point: PointWall) {
    this.pointsGroup.remove(point.mesh);
  }

  removeWall(wall: Wall) {
    this.wallsGroup.remove(wall.mesh);
  }

  // Получение всех объектов определённого типа
  getPoints(): THREE.Object3D[] {
    return this.pointsGroup.children;
  }

  getWalls(): THREE.Object3D[] {
    return this.wallsGroup.children;
  }

  getRooms(): THREE.Object3D[] {
    return this.roomsGroup.children;
  }

  getObjects(): THREE.Object3D[] {
    return this.objectsGroup.children;
  }

  // Копирование объектов на другой этаж
  copyObjectsTo(targetLevel: Level) {
    // Копируем точки
    this.pointsGroup.children.forEach(pointMesh => {
      const newPoint = PointsManager.inst().createPointFromMesh(pointMesh, targetLevel);
      targetLevel.addPoint(newPoint);
    });

    // Копируем стены (после точек, чтобы связать с новыми точками)
    this.wallsGroup.children.forEach(wallMesh => {
      const newWall = WallsManager.inst().createWallFromMesh(wallMesh, targetLevel);
      targetLevel.addWall(newWall);
    });

    // Копируем комнаты
    this.roomsGroup.children.forEach(roomMesh => {
      const newRoom = RoomsManager.inst().createRoomFromMesh(roomMesh, targetLevel);
      targetLevel.addRoom(newRoom);
    });
  }

  // Очистка ресурсов
  dispose() {
    this.container.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();
        if (object.material instanceof THREE.Material) {
          object.material.dispose();
        }
      }
    });

    this.container.clear();
  }
}
```

### 12. LevelVisibility (Управление видимостью)

Управляет отображением этажей в зависимости от режима.

```typescript
// house/levels/LevelVisibility.ts
export type VisibilityMode = 'full' | 'ghost' | 'wireframe' | 'hidden';

export interface VisibilitySettings {
  showBelowLevels: boolean;    // Показывать этажи ниже активного
  showAboveLevels: boolean;    // Показывать этажи выше активного
  belowMode: VisibilityMode;   // Режим отображения нижних этажей
  aboveMode: VisibilityMode;   // Режим отображения верхних этажей
  ghostOpacity: number;        // Прозрачность для режима ghost
}

export class LevelVisibility extends ContextSingleton {
  private originalMaterials: Map<THREE.Object3D, THREE.Material | THREE.Material[]> = new Map();

  private settings: VisibilitySettings = {
    showBelowLevels: true,
    showAboveLevels: false,
    belowMode: 'ghost',
    aboveMode: 'hidden',
    ghostOpacity: 0.2
  };

  setSettings(settings: Partial<VisibilitySettings>) {
    this.settings = { ...this.settings, ...settings };
    this.applyVisibilityToAllLevels();
  }

  // Установка видимости для конкретного этажа
  setVisibility(level: Level, mode: VisibilityMode) {
    level.container.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        switch (mode) {
          case 'full':
            this.restoreMaterial(object);
            object.visible = true;
            break;

          case 'ghost':
            this.makeGhost(object, this.settings.ghostOpacity);
            object.visible = true;
            break;

          case 'wireframe':
            this.makeWireframe(object);
            object.visible = true;
            break;

          case 'hidden':
            object.visible = false;
            break;
        }
      }
    });

    EventBus.emit('level:visibility', { levelId: level.id, mode });
  }

  // Применить видимость ко всем этажам на основе настроек
  applyVisibilityToAllLevels() {
    const activeLevel = LevelManager.inst().getActiveLevel();
    if (!activeLevel) return;

    LevelManager.inst().getAllLevels().forEach(level => {
      if (level.id === activeLevel.id) {
        // Активный этаж всегда полностью видим
        this.setVisibility(level, 'full');
      } else if (level.elevation < activeLevel.elevation) {
        // Этажи ниже
        if (this.settings.showBelowLevels) {
          this.setVisibility(level, this.settings.belowMode);
        } else {
          this.setVisibility(level, 'hidden');
        }
      } else {
        // Этажи выше
        if (this.settings.showAboveLevels) {
          this.setVisibility(level, this.settings.aboveMode);
        } else {
          this.setVisibility(level, 'hidden');
        }
      }
    });
  }

  // Показать все этажи (для 3D просмотра)
  showAllLevels(mode: VisibilityMode = 'full') {
    LevelManager.inst().getAllLevels().forEach(level => {
      this.setVisibility(level, mode);
    });
  }

  // Показать только активный этаж
  showOnlyActiveLevel() {
    const activeLevel = LevelManager.inst().getActiveLevel();

    LevelManager.inst().getAllLevels().forEach(level => {
      if (level.id === activeLevel?.id) {
        this.setVisibility(level, 'full');
      } else {
        this.setVisibility(level, 'hidden');
      }
    });
  }

  // Сделать объект полупрозрачным
  private makeGhost(mesh: THREE.Mesh, opacity: number) {
    // Сохраняем оригинальный материал если ещё не сохранён
    if (!this.originalMaterials.has(mesh)) {
      this.originalMaterials.set(mesh, mesh.material);
    }

    // Создаём полупрозрачную копию материала
    const material = mesh.material as THREE.Material;
    const ghostMaterial = material.clone();
    ghostMaterial.transparent = true;
    ghostMaterial.opacity = opacity;
    ghostMaterial.depthWrite = false; // Чтобы не было артефактов прозрачности

    mesh.material = ghostMaterial;
  }

  // Сделать объект wireframe
  private makeWireframe(mesh: THREE.Mesh) {
    if (!this.originalMaterials.has(mesh)) {
      this.originalMaterials.set(mesh, mesh.material);
    }

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x888888,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });

    mesh.material = wireframeMaterial;
  }

  // Восстановить оригинальный материал
  private restoreMaterial(mesh: THREE.Mesh) {
    const original = this.originalMaterials.get(mesh);
    if (original) {
      // Удаляем временный материал
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }

      mesh.material = original;
      this.originalMaterials.delete(mesh);
    }

    mesh.visible = true;
  }

  // Очистка всех сохранённых материалов
  clearCache() {
    this.originalMaterials.clear();
  }
}
```

### 13. LevelPolicy (Политика доступа к этажам)

Проверяет, можно ли взаимодействовать с объектом на основе его этажа.

```typescript
// interaction/policies/LevelPolicy.ts
export class LevelPolicy {
  // Проверка: можно ли взаимодействовать с объектом?
  static canInteract(object: THREE.Object3D): boolean {
    const objectLevelId = this.getObjectLevelId(object);
    const activeLevelId = LevelManager.inst().getActiveLevel()?.id;

    // Если объект не привязан к этажу - разрешаем (глобальные объекты)
    if (!objectLevelId) {
      return true;
    }

    // Можно взаимодействовать только с объектами активного этажа
    return objectLevelId === activeLevelId;
  }

  // Получить levelId объекта (ищем вверх по иерархии)
  static getObjectLevelId(object: THREE.Object3D): string | null {
    let current: THREE.Object3D | null = object;

    while (current) {
      if (current.userData.levelId) {
        return current.userData.levelId;
      }
      current = current.parent;
    }

    return null;
  }

  // Проверить, принадлежит ли объект активному этажу
  static isOnActiveLevel(object: THREE.Object3D): boolean {
    const objectLevelId = this.getObjectLevelId(object);
    const activeLevelId = LevelManager.inst().getActiveLevel()?.id;

    return objectLevelId === activeLevelId;
  }

  // Получить Level объекта
  static getObjectLevel(object: THREE.Object3D): Level | null {
    const levelId = this.getObjectLevelId(object);
    if (!levelId) return null;

    return LevelManager.inst().getLevel(levelId) || null;
  }
}
```

### 14. LevelBound Capability

Capability для привязки объекта к этажу.

```typescript
// interaction/capabilities/LevelBound.ts
export class LevelBound implements Capability {
  type = 'level-bound';

  constructor(private levelId: string) {}

  attach(object: THREE.Object3D) {
    object.userData.levelId = this.levelId;
    object.userData.capabilities = object.userData.capabilities || [];

    if (!object.userData.capabilities.includes('level-bound')) {
      object.userData.capabilities.push('level-bound');
    }
  }

  detach(object: THREE.Object3D) {
    delete object.userData.levelId;

    const caps = object.userData.capabilities || [];
    const index = caps.indexOf('level-bound');
    if (index > -1) {
      caps.splice(index, 1);
    }
  }

  // Изменить привязку к другому этажу
  static changeLevel(object: THREE.Object3D, newLevelId: string) {
    object.userData.levelId = newLevelId;
    EventBus.emit('object:level-changed', { object, levelId: newLevelId });
  }
}
```

### Интеграция с InteractionOrchestrator

```typescript
// core/InteractionOrchestrator.ts - обновлённый handleInteraction
private handleInteraction(routeData: RouteData) {
  const { objectType, action, event, object } = routeData;

  // 1. Проверка блокировок
  if (this.blockingManager.isBlocked('click', objectType)) {
    return;
  }

  // 🏢 2. ПРОВЕРКА ЭТАЖА (НОВОЕ)
  if (!LevelPolicy.canInteract(object)) {
    // Объект на неактивном этаже - игнорируем взаимодействие
    // Опционально: показать визуальную индикацию
    CursorManager.inst().setCursor('not-allowed');
    return;
  }

  // 3. Проверка Policy режима
  const mode = this.modeManager.getCurrentMode();
  if (!mode.policy.allows(action, objectType)) {
    return;
  }

  // 4. Проверка Capability
  if (!hasCapability(object, action)) {
    return;
  }

  // 5. Делегирование в Feature
  const feature = this.features.get(objectType);
  if (feature && feature.enabled) {
    feature.handle(event, object);
  }
}
```

### Обновлённая схема потока обработки событий

```
┌─────────────────────────────────────────────────────────────┐
│  USER INPUT (Mouse, Keyboard, Touch)                        │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  INPUT LAYER: MouseInputManager, KeyboardInputManager       │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  ROUTING LAYER: ClickRouter, RaycastService                 │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  🏢 LEVEL CHECK: LevelPolicy.canInteract(object)            │
│  - Получаем levelId объекта                                 │
│  - Сравниваем с activeLevel                                 │
│  - Если не совпадает → БЛОК ❌                              │
└──────────────────────┬──────────────────────────────────────┘
                       ↓ (если этаж активный)
┌─────────────────────────────────────────────────────────────┐
│  POLICY CHECK: Camera2DPolicy / Camera3DPolicy              │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  CAPABILITY CHECK: Draggable? Selectable? Resizable?        │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────────┐
│  FEATURE → HANDLER → COMMAND                                │
└─────────────────────────────────────────────────────────────┘
```

### UI для управления этажами

```typescript
// ui/panels/LevelPanel.ts
export class LevelPanel extends ContextSingleton {
  private container: HTMLElement;
  private levelList: HTMLElement;

  init(parentContainer: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'level-panel';
    this.container.innerHTML = `
      <div class="level-panel__header">
        <h3>Этажи</h3>
        <button class="level-panel__add-btn" title="Добавить этаж">+</button>
      </div>
      <div class="level-panel__list"></div>
      <div class="level-panel__visibility">
        <label>
          <input type="checkbox" id="show-below-levels" checked>
          Показывать нижние этажи
        </label>
      </div>
    `;

    parentContainer.appendChild(this.container);
    this.levelList = this.container.querySelector('.level-panel__list')!;

    this.bindEvents();
    this.render();

    // Подписка на события
    EventBus.on('level:created', this.render);
    EventBus.on('level:deleted', this.render);
    EventBus.on('level:changed', this.render);
  }

  private render = () => {
    const levels = LevelManager.inst().getAllLevels().reverse(); // Сверху вниз
    const activeId = LevelManager.inst().getActiveLevel()?.id;

    this.levelList.innerHTML = levels.map(level => `
      <div class="level-item ${level.id === activeId ? 'level-item--active' : ''}"
           data-level-id="${level.id}">
        <span class="level-item__name">${level.name}</span>
        <span class="level-item__elevation">${level.elevation.toFixed(1)}м</span>
        <div class="level-item__actions">
          <button class="level-item__visibility-btn"
                  data-action="toggle-visibility"
                  title="Переключить видимость">
            👁
          </button>
          <button class="level-item__delete-btn"
                  data-action="delete"
                  title="Удалить этаж"
                  ${level.id === activeId ? 'disabled' : ''}>
            🗑
          </button>
        </div>
      </div>
    `).join('');
  }

  private bindEvents() {
    // Клик по этажу - переключение
    this.levelList.addEventListener('click', (e) => {
      const levelItem = (e.target as HTMLElement).closest('.level-item');
      if (!levelItem) return;

      const levelId = levelItem.getAttribute('data-level-id');
      if (!levelId) return;

      const action = (e.target as HTMLElement).getAttribute('data-action');

      if (action === 'delete') {
        this.handleDelete(levelId);
      } else if (action === 'toggle-visibility') {
        this.handleToggleVisibility(levelId);
      } else {
        // Клик по самому элементу - переключение этажа
        LevelManager.inst().setActiveLevel(levelId);
      }
    });

    // Кнопка добавления этажа
    this.container.querySelector('.level-panel__add-btn')?.addEventListener('click', () => {
      this.handleAddLevel();
    });

    // Чекбокс показа нижних этажей
    this.container.querySelector('#show-below-levels')?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      LevelVisibility.inst().setSettings({ showBelowLevels: checked });
    });
  }

  private handleAddLevel() {
    const levels = LevelManager.inst().getAllLevels();
    const topLevel = levels[levels.length - 1];

    const newId = `level-${Date.now()}`;
    const newElevation = topLevel ? topLevel.elevation + topLevel.height : 0;

    LevelManager.inst().createLevel(newId, {
      name: `Этаж ${levels.length + 1}`,
      elevation: newElevation
    });

    // Автоматически переключаемся на новый этаж
    LevelManager.inst().setActiveLevel(newId);
  }

  private handleDelete(levelId: string) {
    if (confirm('Удалить этаж? Все объекты на нём будут удалены.')) {
      LevelManager.inst().deleteLevel(levelId);
    }
  }

  private handleToggleVisibility(levelId: string) {
    const level = LevelManager.inst().getLevel(levelId);
    if (!level) return;

    // Переключаем между 'ghost' и 'hidden'
    const currentMode = level.container.visible ? 'ghost' : 'hidden';
    const newMode = currentMode === 'ghost' ? 'hidden' : 'ghost';

    LevelVisibility.inst().setVisibility(level, newMode);
  }
}
```

### События этажей

```typescript
// События для EventBus, связанные с этажами
interface LevelEvents {
  'level:created': { level: Level };
  'level:deleted': { levelId: string };
  'level:changed': { from: string | undefined; to: string };
  'level:visibility': { levelId: string; mode: VisibilityMode };
  'object:level-changed': { object: THREE.Object3D; levelId: string };
}
```

### Commands для этажей

```typescript
// commands/CreateLevelCommand.ts
export class CreateLevelCommand implements Command {
  private level: Level | null = null;

  constructor(
    private levelId: string,
    private options: LevelOptions
  ) {}

  execute() {
    this.level = LevelManager.inst().createLevel(this.levelId, this.options);
  }

  undo() {
    if (this.level) {
      LevelManager.inst().deleteLevel(this.level.id);
      this.level = null;
    }
  }

  redo() {
    this.execute();
  }
}

// commands/DeleteLevelCommand.ts
export class DeleteLevelCommand implements Command {
  private levelData: LevelSerializedData | null = null;

  constructor(private levelId: string) {}

  execute() {
    const level = LevelManager.inst().getLevel(this.levelId);
    if (level) {
      // Сохраняем данные этажа для возможного восстановления
      this.levelData = level.serialize();
      LevelManager.inst().deleteLevel(this.levelId);
    }
  }

  undo() {
    if (this.levelData) {
      // Восстанавливаем этаж из сохранённых данных
      LevelManager.inst().restoreLevelFromData(this.levelData);
    }
  }

  redo() {
    this.execute();
  }
}

// commands/ChangeLevelCommand.ts
export class ChangeLevelCommand implements Command {
  constructor(
    private object: THREE.Object3D,
    private fromLevelId: string,
    private toLevelId: string
  ) {}

  execute() {
    const fromLevel = LevelManager.inst().getLevel(this.fromLevelId);
    const toLevel = LevelManager.inst().getLevel(this.toLevelId);

    if (fromLevel && toLevel) {
      // Перемещаем объект между этажами
      fromLevel.container.remove(this.object);
      toLevel.container.add(this.object);

      // Обновляем levelId
      this.object.userData.levelId = this.toLevelId;

      // Корректируем Y позицию
      const heightDiff = toLevel.elevation - fromLevel.elevation;
      this.object.position.y += heightDiff;
    }
  }

  undo() {
    // Меняем местами from и to
    const temp = this.fromLevelId;
    this.fromLevelId = this.toLevelId;
    this.toLevelId = temp;

    this.execute();

    // Возвращаем обратно
    const temp2 = this.fromLevelId;
    this.fromLevelId = this.toLevelId;
    this.toLevelId = temp2;
  }

  redo() {
    this.execute();
  }
}
```

### Дополнения к порядку реализации

#### Фаза 15: Система этажей (2-3 дня)
- [ ] `Level` класс
- [ ] `LevelManager`
- [ ] `LevelContext`
- [ ] `LevelVisibility`
- [ ] `LevelPolicy`
- [ ] `LevelBound` capability
- [ ] Интеграция с `InteractionOrchestrator`
- [ ] `LevelPanel` UI
- [ ] Commands для этажей (`CreateLevelCommand`, `DeleteLevelCommand`)
- [ ] Тестирование переключения этажей
- [ ] Тестирование блокировки неактивных этажей

---

## 🔄 Потоки данных

### Поток 1: Перетаскивание точки в 2D режиме

```
1. User clicks on point
   ↓
2. MouseInputManager captures pointerdown
   ↓
3. ClickRouter performs raycasting
   ↓
4. ObjectIdentifier: type = 'point'
   ↓
5. Camera2DPolicy.allows('drag', 'point') → true
   ↓
6. Check point.userData.capabilities includes 'draggable' → true
   ↓
7. PointFeature.handle({ action: 'drag' })
   ↓
8. PointDragHandler.handleMouseDown()
   - Uses DragBehavior.startDrag()
   ↓
9. User moves mouse
   ↓
10. MouseInputManager captures pointermove
    ↓
11. PointDragHandler.handleMouseMove()
    - Uses DragBehavior.updateDrag()
    - Uses SnapBehavior.snapToGrid()
    - Updates point position
    ↓
12. User releases mouse
    ↓
13. PointDragHandler.handleMouseUp()
    - Creates MoveCommand(point, oldPos, newPos)
    - CommandManager.execute(command)
    ↓
14. EventBus.emit('object:moved', { object: point })
```

### Поток 2: Попытка перетащить объект в 2D режиме (запрещено)

```
1. User clicks on 3D object
   ↓
2. MouseInputManager captures pointerdown
   ↓
3. ClickRouter performs raycasting
   ↓
4. ObjectIdentifier: type = 'object'
   ↓
5. Camera2DPolicy.allows('drag', 'object') → false ❌
   ↓
6. Interaction blocked, no further action
```

### Поток 3: Переключение камеры 2D → 3D

```
1. User clicks camera toggle button
   ↓
2. CameraManager.switchToCamera3D()
   ↓
3. EventBus.emit('camera:switched', { cameraMode: '3D' })
   ↓
4. InteractionOrchestrator receives event
   ↓
5. ModeManager.setMode(new Camera3DMode())
   ↓
6. Camera3DMode.onActivate()
   - Changes policy to Camera3DPolicy
   - Enables features: ['objects', 'roofs']
   - Disables features: ['points', 'walls']
   ↓
7. PointFeature.disable()
   - All point handlers stop listening
   ↓
8. ObjectFeature.enable()
   - Object handlers start listening
   ↓
9. EventBus.emit('mode:changed', { mode: '3D' })
```

### Поток 4: Переключение этажа

```
1. User clicks on level in LevelPanel
   ↓
2. LevelPanel calls LevelManager.setActiveLevel(levelId)
   ↓
3. LevelManager deactivates previous level
   - prevLevel.setActive(false)
   - LevelVisibility.setVisibility(prevLevel, 'ghost')
   ↓
4. LevelManager activates new level
   - newLevel.setActive(true)
   - LevelVisibility.setVisibility(newLevel, 'full')
   ↓
5. BlockingManager.setLevelBlock(levelId)
   - All objects on inactive levels are now blocked
   ↓
6. EventBus.emit('level:changed', { from, to })
   ↓
7. UI components react to event
   - LevelPanel updates active state
   - PropertiesPanel clears selection
   ↓
8. Next interaction: LevelPolicy.canInteract() checks levelId
```

### Поток 5: Попытка взаимодействия с объектом на неактивном этаже

```
1. User clicks on object (on inactive level)
   ↓
2. MouseInputManager captures pointerdown
   ↓
3. ClickRouter performs raycasting
   - Finds object on inactive level
   ↓
4. ObjectIdentifier: type = 'wall', levelId = 'level-2'
   ↓
5. LevelPolicy.canInteract(object)
   - activeLevel = 'level-1'
   - objectLevel = 'level-2'
   - Returns false ❌
   ↓
6. InteractionOrchestrator blocks interaction
   - CursorManager.setCursor('not-allowed')
   - No further processing
```

### Поток 6: Undo/Redo

```
Undo:
1. User presses Ctrl+Z
   ↓
2. KeyboardInputManager detects shortcut
   ↓
3. CommandManager.undo()
   ↓
4. Get command from history[currentIndex]
   ↓
5. command.undo() - reverts changes
   ↓
6. currentIndex--
   ↓
7. EventBus.emit('history:changed', { canUndo, canRedo })

Redo:
1. User presses Ctrl+Y
   ↓
2. KeyboardInputManager detects shortcut
   ↓
3. CommandManager.redo()
   ↓
4. currentIndex++
   ↓
5. Get command from history[currentIndex]
   ↓
6. command.redo() - reapplies changes
   ↓
7. EventBus.emit('history:changed', { canUndo, canRedo })
```

---

## 📚 Примеры использования

### Инициализация системы

```typescript
// main.ts
import { InteractionOrchestrator } from '@/threeApp/interaction/core/InteractionOrchestrator';
import { ModeManager } from '@/threeApp/interaction/modes/ModeManager';
import { Camera2DMode } from '@/threeApp/interaction/modes/Camera2DMode';

// Инициализация в ThreeMain
export class ThreeMain extends ContextSingleton {
  init() {
    // ... существующая инициализация ...

    // Инициализация системы взаимодействий
    InteractionOrchestrator.inst().init();

    // Установка начального режима
    ModeManager.inst().setMode(new Camera2DMode());
  }
}
```

### Создание объекта с возможностями

```typescript
// house/points/PointsManager.ts
import { applyCapabilities } from '@/threeApp/interaction/capabilities/utils';
import { Draggable } from '@/threeApp/interaction/capabilities/Draggable';
import { Selectable } from '@/threeApp/interaction/capabilities/Selectable';
import { Snappable } from '@/threeApp/interaction/capabilities/Snappable';

export class PointsManager extends ContextSingleton {
  createPoint(x: number, y: number, z: number): PointWall {
    const point = new PointWall(x, y, z);

    // Добавляем возможности
    applyCapabilities(point.mesh, [
      new Draggable(),
      new Selectable(),
      new Snappable(),
      new Deletable()
    ]);

    // Устанавливаем тип объекта
    point.mesh.userData.tag = 'point';

    return point;
  }
}
```

### Переключение режима при смене камеры

```typescript
// scene/CameraManager.ts
import { EventBus } from '@/threeApp/interaction/core/EventBus';

export class CameraManager extends ContextSingleton {
  switchCamera(to2D: boolean) {
    if (to2D) {
      this.activeCamera = this.camera2D;
      // ... настройка камеры ...
      EventBus.emit('camera:switched', { cameraMode: '2D' });
    } else {
      this.activeCamera = this.camera3D;
      // ... настройка камеры ...
      EventBus.emit('camera:switched', { cameraMode: '3D' });
    }
  }
}
```

### Создание custom Handler

```typescript
// features/walls/WallSplitHandler.ts
import { DragBehavior } from '@/threeApp/interaction/behaviors/DragBehavior';
import { CommandManager } from '@/threeApp/interaction/commands/CommandManager';
import { SplitWallCommand } from '@/threeApp/interaction/commands/SplitWallCommand';

export class WallSplitHandler {
  private isActive = false;

  enable() {
    this.isActive = true;
  }

  disable() {
    this.isActive = false;
  }

  handle(event: PointerEvent, wall: THREE.Object3D) {
    if (!this.isActive) return;

    // Находим точку клика на стене
    const intersection = RaycastService.inst().getIntersection(event);
    if (!intersection) return;

    const splitPoint = intersection.point;

    // Создаём команду разделения
    const command = new SplitWallCommand(wall, splitPoint);
    CommandManager.inst().execute(command);
  }
}
```

### Создание custom Command

```typescript
// commands/SplitWallCommand.ts
export class SplitWallCommand implements Command {
  private newPoint: PointWall | null = null;
  private newWall: Wall | null = null;

  constructor(
    private originalWall: Wall,
    private splitPoint: THREE.Vector3
  ) {}

  execute() {
    // Создаём новую точку в месте разделения
    this.newPoint = PointsManager.inst().createPoint(
      this.splitPoint.x,
      this.splitPoint.y,
      this.splitPoint.z
    );

    // Сохраняем исходную конечную точку
    const originalEndPoint = this.originalWall.endPoint;

    // Меняем конечную точку исходной стены
    this.originalWall.endPoint = this.newPoint;
    this.originalWall.updateGeometry();

    // Создаём новую стену от новой точки до исходной конечной
    this.newWall = WallsManager.inst().createWall(
      this.newPoint,
      originalEndPoint
    );

    EventBus.emit('wall:split', {
      original: this.originalWall,
      new: this.newWall
    });
  }

  undo() {
    // Удаляем новую стену
    WallsManager.inst().deleteWall(this.newWall);
    this.newWall = null;

    // Удаляем новую точку
    PointsManager.inst().deletePoint(this.newPoint);

    // Восстанавливаем исходную стену
    // (сохранили originalEndPoint в execute)
    this.originalWall.updateGeometry();
  }

  redo() {
    this.execute();
  }
}
```

### Использование инструментов

```typescript
// ui/toolbar/Toolbar.ts
import { ToolManager } from '@/threeApp/interaction/tools/ToolManager';

export class Toolbar {
  private measureButton: HTMLButtonElement;

  init() {
    this.measureButton = document.getElementById('measure-tool');

    this.measureButton.addEventListener('click', () => {
      ToolManager.inst().activateTool('measure');
      this.setActiveButton(this.measureButton);
    });
  }

  private setActiveButton(button: HTMLButtonElement) {
    // Визуальное выделение активной кнопки
    document.querySelectorAll('.tool-button').forEach(btn => {
      btn.classList.remove('active');
    });
    button.classList.add('active');
  }
}
```

### Подписка на события через EventBus

```typescript
// ui/panels/PropertiesPanel.ts
import { EventBus } from '@/threeApp/interaction/core/EventBus';

export class PropertiesPanel {
  init() {
    // Слушаем изменения выделения
    EventBus.on('selection:changed', this.updatePanel);

    // Слушаем изменения истории для Undo/Redo кнопок
    EventBus.on('history:changed', this.updateHistoryButtons);
  }

  private updatePanel = (data: { selected: THREE.Object3D[] }) => {
    if (data.selected.length === 0) {
      this.hide();
    } else if (data.selected.length === 1) {
      this.showProperties(data.selected[0]);
    } else {
      this.showMultipleSelection(data.selected);
    }
  }

  private updateHistoryButtons = (data: { canUndo: boolean, canRedo: boolean }) => {
    this.undoButton.disabled = !data.canUndo;
    this.redoButton.disabled = !data.canRedo;
  }
}
```

---

## 🔄 Миграция существующего кода

### Этап 1: Подготовка структуры папок

1. Создать базовую структуру папок `src/threeApp/interaction/`
2. Создать базовые классы:
   - `Mode.ts`, `InteractionPolicy.ts`, `Capability.ts`, `Feature.ts`, `Command.ts`

### Этап 2: Миграция MouseManager → MouseInputManager

**Было:**
```typescript
// scene/MouseManager.ts
export class MouseManager {
  private canvas: HTMLCanvasElement;

  init() {
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
  }

  private onPointerMove = (event: PointerEvent) => {
    // Сразу вызывает PointMove
    PointMove.inst().onPointerMove(event);
  }
}
```

**Стало:**
```typescript
// interaction/input/MouseInputManager.ts
export class MouseInputManager extends ContextSingleton {
  init() {
    // Такая же подписка на события
    // Но делегирует в ClickRouter вместо прямого вызова
  }

  private onPointerMove = (event: PointerEvent) => {
    ClickRouter.inst().route('pointermove', event);
  }
}
```

### Этап 3: Создание ClickRouter

```typescript
// interaction/routing/ClickRouter.ts
export class ClickRouter extends ContextSingleton {
  private raycaster = new RaycastService();

  route(eventType: string, event: PointerEvent) {
    // 1. Raycasting
    const intersection = this.raycaster.getIntersection(event);
    if (!intersection) return;

    const object = intersection.object;

    // 2. Определение типа
    const objectType = ObjectIdentifier.getType(object);

    // 3. Определение действия
    const action = this.getActionFromEventType(eventType);

    // 4. Отправка в Orchestrator
    InteractionOrchestrator.inst().handleInteraction({
      objectType,
      action,
      event,
      object
    });
  }
}
```

### Этап 4: Перенос PointMove → PointDragHandler

**Было:**
```typescript
// house/points/PointMove.ts
export class PointMove extends ContextSingleton {
  private isDown = false;
  private selectedPoint: PointWall | null = null;

  onPointerDown(event: PointerEvent) {
    // Raycasting
    const intersection = this.raycast(event);
    if (!intersection) return;

    // Проверка типа
    if (intersection.object.userData.tag !== 'point') return;

    this.isDown = true;
    this.selectedPoint = intersection.object;
    // ... создание plane ...
  }

  onPointerMove(event: PointerEvent) {
    if (!this.isDown) return;
    // ... логика перетаскивания ...
  }
}
```

**Стало:**
```typescript
// interaction/features/points/PointDragHandler.ts
export class PointDragHandler {
  private dragBehavior = new DragBehavior();
  private snapBehavior = new SnapBehavior();
  private selectedPoint: THREE.Object3D | null = null;
  private originalPosition: THREE.Vector3 | null = null;

  handleMouseDown(event: PointerEvent, object: THREE.Object3D) {
    this.selectedPoint = object;
    this.originalPosition = object.position.clone();
    this.dragBehavior.startDrag(object, event);
  }

  handleMouseMove(event: PointerEvent) {
    if (!this.selectedPoint) return;

    let newPos = this.dragBehavior.updateDrag(this.selectedPoint, event);
    newPos = this.snapBehavior.snapToGrid(newPos, 0.1);

    this.selectedPoint.position.copy(newPos);
  }

  handleMouseUp() {
    if (!this.selectedPoint || !this.originalPosition) return;

    const command = new MoveCommand(
      this.selectedPoint,
      this.originalPosition,
      this.selectedPoint.position.clone()
    );

    CommandManager.inst().execute(command);

    this.selectedPoint = null;
    this.originalPosition = null;
  }
}
```

### Этап 5: Создание PointFeature

```typescript
// interaction/features/points/PointFeature.ts
export class PointFeature extends Feature {
  name = 'points';

  init() {
    this.handlers.set('drag', new PointDragHandler());
    this.handlers.set('snap', new PointSnapHandler());
  }

  handle(event: any, object: THREE.Object3D) {
    if (!this.enabled) return;

    const handler = this.handlers.get('drag') as PointDragHandler;

    if (event.type === 'pointerdown') {
      handler.handleMouseDown(event, object);
    } else if (event.type === 'pointermove') {
      handler.handleMouseMove(event);
    } else if (event.type === 'pointerup') {
      handler.handleMouseUp();
    }
  }
}
```

### Этап 6: Добавление Capabilities к существующим объектам

```typescript
// house/points/PointWall.ts (существующий класс)
import { applyCapabilities } from '@/threeApp/interaction/capabilities/utils';
import { Draggable, Selectable, Snappable } from '@/threeApp/interaction/capabilities';

export class PointWall {
  mesh: THREE.Mesh;

  constructor(x: number, y: number, z: number) {
    // ... существующий код создания mesh ...

    // Добавляем capabilities
    applyCapabilities(this.mesh, [
      new Draggable(),
      new Selectable(),
      new Snappable()
    ]);

    // Устанавливаем тип
    this.mesh.userData.tag = 'point';
  }
}
```

### Этап 7: Интеграция с CameraManager

```typescript
// scene/CameraManager.ts (существующий)
import { EventBus } from '@/threeApp/interaction/core/EventBus';

export class CameraManager extends ContextSingleton {
  switchCamera(to2D: boolean) {
    // ... существующая логика ...

    // Уведомляем систему взаимодействий
    EventBus.emit('camera:switched', {
      cameraMode: to2D ? '2D' : '3D'
    });
  }
}
```

### Этап 8: Постепенная миграция остальных обработчиков

1. **WallBuilder** → **WallFeature** с handlers (drag, resize, split)
2. **ObjectsManager** → **ObjectFeature** с handlers (place, drag, rotate)
3. Добавить **RoomFeature**, **DWFeature** (двери/окна), **RoofFeature**

---

## 🎯 Порядок реализации

### Фаза 1: Фундамент (1-2 дня)
- [ ] Создать структуру папок
- [ ] Базовые классы: `Mode`, `InteractionPolicy`, `Capability`, `Feature`, `Command`
- [ ] `EventBus`
- [ ] `InteractionContext`
- [ ] `CursorManager`

### Фаза 2: Слой ввода (1 день)
- [ ] `MouseInputManager` (миграция из `MouseManager`)
- [ ] `KeyboardInputManager`
- [ ] `GestureDetector` (опционально)

### Фаза 3: Слой маршрутизации (1 день)
- [ ] `RaycastService`
- [ ] `ObjectIdentifier`
- [ ] `ClickRouter`

### Фаза 4: Режимы и политики (1 день)
- [ ] `ModeManager`
- [ ] `Camera2DMode`, `Camera3DMode`
- [ ] `Camera2DPolicy`, `Camera3DPolicy`
- [ ] `PolicyRegistry`

### Фаза 5: Capabilities (1 день)
- [ ] Интерфейс `Capability`
- [ ] `Draggable`, `Selectable`, `Snappable`
- [ ] Утилиты `applyCapabilities`, `hasCapability`
- [ ] Интеграция с существующими объектами (PointWall, Wall)

### Фаза 6: Commands (1-2 дня)
- [ ] `CommandManager`
- [ ] `Command` интерфейс
- [ ] `MoveCommand`, `DeleteCommand`, `AddCommand`
- [ ] Тесты Undo/Redo

### Фаза 7: Behaviors (1 день)
- [ ] `DragBehavior`
- [ ] `SnapBehavior`
- [ ] `HoverBehavior`
- [ ] `OutlineBehavior`

### Фаза 8: Features - Points (2 дня)
- [ ] `PointFeature`
- [ ] `PointDragHandler` (миграция из `PointMove`)
- [ ] `PointSnapHandler`
- [ ] Интеграция с остальной системой

### Фаза 9: Features - Walls (2-3 дня)
- [ ] `WallFeature`
- [ ] `WallDragHandler`
- [ ] `WallResizeHandler`
- [ ] `WallSplitHandler`

### Фаза 10: Оркестратор (1 день)
- [ ] `InteractionOrchestrator`
- [ ] Интеграция всех компонентов
- [ ] Подписки на события

### Фаза 11: Tools (1-2 дня)
- [ ] `ToolManager`
- [ ] `MeasureTool`
- [ ] `SelectionTool`
- [ ] `TransformTool`

### Фаза 12: Остальные Features (3-4 дня)
- [ ] `ObjectFeature` (мебель)
- [ ] `RoomFeature`
- [ ] `DWFeature` (двери/окна)
- [ ] `RoofFeature`

### Фаза 13: Blocking System (1 день)
- [ ] `BlockingManager`
- [ ] `BlockingRules`
- [ ] Интеграция с Features

### Фаза 14: Тестирование и отладка (2-3 дня)
- [ ] Unit тесты для критичных компонентов
- [ ] Интеграционные тесты
- [ ] Исправление багов
- [ ] Оптимизация производительности

### Фаза 15: Система этажей (2-3 дня)
- [ ] `Level` класс
- [ ] `LevelManager`
- [ ] `LevelContext`
- [ ] `LevelVisibility`
- [ ] `LevelPolicy`
- [ ] `LevelBound` capability
- [ ] Интеграция с `InteractionOrchestrator`
- [ ] `LevelPanel` UI
- [ ] Commands для этажей (`CreateLevelCommand`, `DeleteLevelCommand`)
- [ ] Тестирование переключения этажей и блокировки

---

## 📖 Итого

**Общее время реализации: ~23-28 дней**

Эта архитектура предоставляет:

✅ **Чёткое разделение ответственности** между слоями
✅ **Лёгкое добавление** новых типов объектов и режимов
✅ **Переиспользование** кода через Behaviors
✅ **Встроенный Undo/Redo** через Commands
✅ **Гибкие правила доступа** через Policies
✅ **Динамические возможности** через Capabilities
✅ **Простую отладку** благодаря линейному потоку данных
✅ **Расширяемость** для будущих фич
✅ **Многоэтажность** с изоляцией редактирования через Levels
✅ **Гибкая видимость** этажей (ghost/wireframe/hidden)

Архитектура масштабируется и готова к росту проекта!
