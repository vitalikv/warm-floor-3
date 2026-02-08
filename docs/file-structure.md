# Структура файлов

> **Статус обновления:** 2026-02-08
> ✅ = Реализовано | 🚧 = В разработке | 📋 = Запланировано

## Текущая структура (реализованная)

```
src/
├── main.ts                            # 🚀 Точка входа приложения ✅
├── core/
│   └── ContextSingleton.ts           # Базовый класс для синглтонов ✅
│
├── threeApp/
│   ├── ThreeMain.ts                  # 🎯 Главный оркестратор Three.js ✅
│   │
│   ├── scene/                         # 🎬 БАЗОВЫЙ ФУНКЦИОНАЛ СЦЕНЫ ✅
│   │   ├── SceneManager.ts           # Управление THREE.Scene ✅
│   │   ├── RendererManager.ts        # WebGL рендерер ✅
│   │   ├── CameraManager.ts          # Двойная камера (2D/3D) ✅
│   │   ├── ControlsManager.ts        # OrbitControls ✅
│   │   ├── LightsManager.ts          # Освещение ✅
│   │   ├── ObjectsManager.ts         # Debug объекты (куб, сетка) ✅
│   │   ├── MouseManager.ts           # Pointer события + raycasting ✅
│   │   └── EffectsManager.ts         # Постобработка (EffectComposer, outline, lines) ✅
│   │
│   ├── house/                         # 🏠 ЛОГИКА ПОСТРОЕНИЯ ДОМА
│   │   ├── HouseLoader.ts            # Загрузка данных дома из JSON ✅
│   │   │
│   │   ├── points/                    # 📍 Точки (вершины стен) ✅
│   │   │   ├── PointsManager.ts      # Управление точками ✅
│   │   │   └── PointWall.ts          # Класс точки с визуализацией ✅
│   │   │
│   │   ├── walls/                     # 🧱 Стены ✅
│   │   │   ├── WallsManager.ts       # Управление стенами ✅
│   │   │   ├── Wall.ts               # Класс стены ✅
│   │   │   ├── WallGeometry.ts       # Генерация геометрии стены ✅
│   │   │   ├── WallMaterial.ts       # Материалы стен ✅
│   │   │   └── types.ts              # Типы для стен ✅
│   │   │
│   │   ├── levels/                    # 🏢 Система этажей 📋
│   │   │   ├── LevelManager.ts       # Управление этажами 📋
│   │   │   ├── Level.ts              # Класс этажа 📋
│   │   │   ├── LevelContext.ts       # Контекст активного этажа 📋
│   │   │   └── LevelVisibility.ts    # Видимость этажей (ghost/hidden) 📋
│   │   │
│   │   ├── rooms/                     # 🚪 Комнаты 📋
│   │   │   ├── RoomsManager.ts       # Управление комнатами 📋
│   │   │   ├── Room.ts               # Класс комнаты 📋
│   │   │   ├── RoomDetector.ts       # Автоопределение комнат по стенам 📋
│   │   │   └── RoomFloor.ts          # Пол комнаты 📋
│   │   │
│   │   ├── openings/                  # 🚪🪟 Двери и окна 📋
│   │   │   ├── OpeningsManager.ts    # Управление проёмами 📋
│   │   │   ├── Door.ts               # Класс двери 📋
│   │   │   ├── Window.ts             # Класс окна 📋
│   │   │   ├── OpeningPlacer.ts      # Размещение на стене 📋
│   │   │   └── OpeningCutter.ts      # Вырезание проёмов в стене 📋
│   │   │
│   │   ├── objects/                   # 🪑 Мебель и объекты 📋
│   │   │   ├── ObjectsManager.ts     # Управление объектами 📋
│   │   │   ├── FurnitureObject.ts    # Класс мебели 📋
│   │   │   ├── ObjectCatalog.ts      # Каталог объектов 📋
│   │   │   └── ObjectPlacer.ts       # Размещение объектов 📋
│   │   │
│   │   ├── roofs/                     # 🏠 Крыши 📋
│   │   │   ├── RoofsManager.ts       # Управление крышами 📋
│   │   │   ├── Roof.ts               # Класс крыши 📋
│   │   │   ├── RoofGeometry.ts       # Генерация геометрии 📋
│   │   │   └── RoofTypes.ts          # Типы крыш (плоская, двускатная, etc.) 📋
│   │   │
│   │   ├── stairs/                    # 🪜 Лестницы 📋
│   │   │   ├── StairsManager.ts      # Управление лестницами 📋
│   │   │   ├── Stairway.ts           # Класс лестницы 📋
│   │   │   └── StairTypes.ts         # Типы лестниц 📋
│   │   │
│   │   └── floors/                    # 🟫 Перекрытия 📋
│   │       ├── FloorsManager.ts      # Управление перекрытиями 📋
│   │       ├── FloorSlab.ts          # Плита перекрытия 📋
│   │       └── FloorOpening.ts       # Проёмы в перекрытиях 📋
│   │
│   ├── model/                         # 📐 СЕТОЧНАЯ МОДЕЛЬ ✅
│   │   ├── LoaderModel.ts            # Загрузка модели сетки из JSON ✅
│   │   └── GridProcessor.ts          # Обработка и отрисовка сетки ✅
│   │
│   ├── interaction/                   # 🖱️ СИСТЕМА ВЗАИМОДЕЙСТВИЙ (частично) 🚧
│   │   ├── core/                      # Ядро системы взаимодействий ✅
│   │   │   ├── InteractionOrchestrator.ts  # Главный координатор ✅
│   │   │   ├── EventBus.ts                 # Event Bus для событий ✅
│   │   │   └── InteractionContext.ts       # Глобальное состояние ✅
│   │   │
│   │   ├── routing/                   # 🚦 Слой маршрутизации ✅
│   │   │   ├── ClickRouter.ts        # Маршрутизация событий ✅
│   │   │   ├── RaycastService.ts     # Centralized raycasting ✅
│   │   │   └── ObjectIdentifier.ts   # Определение типа объекта ✅
│   │   │
│   │   ├── features/                  # 🎭 Фичи (группы обработчиков) 🚧
│   │   │   ├── points/               # Работа с точками ✅
│   │   │   │   ├── PointFeature.ts   # Feature для точек ✅
│   │   │   │   └── PointDragHandler.ts # Перетаскивание точек ✅
│   │   │   │
│   │   │   ├── selection/            # Система выделения ✅
│   │   │   │   └── SelectionManager.ts # Управление выделением ✅
│   │   │   │
│   │   │   ├── walls/                # Работа со стенами 📋
│   │   │   │   ├── WallFeature.ts    # 📋
│   │   │   │   ├── WallDragHandler.ts # 📋
│   │   │   │   ├── WallResizeHandler.ts # 📋
│   │   │   │   └── WallSplitHandler.ts # 📋
│   │   │   │
│   │   │   ├── rooms/                # Работа с комнатами 📋
│   │   │   ├── objects/              # Работа с объектами 📋
│   │   │   ├── openings/             # Работа с проёмами 📋
│   │   │   └── roofs/                # Работа с крышами 📋
│   │   │
│   │   ├── behaviors/                 # 🔄 Переиспользуемые поведения 🚧
│   │   │   ├── DragBehavior.ts       # Общая логика drag ✅
│   │   │   ├── SnapBehavior.ts       # Привязка к сетке/точкам 📋
│   │   │   ├── HoverBehavior.ts      # Подсветка при наведении 📋
│   │   │   ├── OutlineBehavior.ts    # Обводка выделенных 📋
│   │   │   └── CollisionBehavior.ts  # Проверка коллизий 📋
│   │   │
│   │   ├── commands/                  # ⏮️ Команды для Undo/Redo ✅
│   │   │   ├── CommandManager.ts     # История команд ✅
│   │   │   ├── Command.ts            # Базовый интерфейс ✅
│   │   │   ├── MovePointCommand.ts   # Команда перемещения точки ✅
│   │   │   ├── DeleteCommand.ts      # 📋
│   │   │   ├── AddCommand.ts         # 📋
│   │   │   ├── ResizeCommand.ts      # 📋
│   │   │   ├── TransformCommand.ts   # 📋
│   │   │   ├── CreateLevelCommand.ts # 📋
│   │   │   ├── DeleteLevelCommand.ts # 📋
│   │   │   └── ChangeLevelCommand.ts # 📋
│   │   │
│   │   ├── input/                     # 📥 Слой ввода 📋
│   │   ├── modes/                     # 🎨 Режимы работы 📋
│   │   ├── policies/                  # 🔒 Правила доступа 📋
│   │   ├── capabilities/              # 🧩 Возможности объектов (Mixins) 📋
│   │   ├── tools/                     # 🛠️ Универсальные инструменты 📋
│   │   └── blocking/                  # 🚫 Система блокировок 📋
│   │
│   ├── loaders/                       # 📦 Загрузчики ресурсов 📋
│   │   ├── ModelLoader.ts            # Загрузка 3D моделей 📋
│   │   ├── TextureLoader.ts          # Загрузка текстур 📋
│   │   └── MaterialLibrary.ts        # Библиотека материалов 📋
│   │
│   └── worker/                       # 🧵 РЕНДЕР В ВОРКЕРЕ ✅
│       ├── WorkerManager.ts          # Сторона main-thread: спавн воркера, bridge событий ✅
│       ├── RenderWorker.ts           # Сторона Worker: Three.js сцена + обработка сообщений ✅
│       ├── WorkerTypes.ts            # Union-тип сообщений main ↔ worker ✅
│       └── WorkerDomStub.ts          # DOM-стаб для OrbitControls в Worker ✅
│
├── ui/                                # 🖼️ UI КОМПОНЕНТЫ 🚧
│   ├── UiMain.ts                     # Главный UI оркестратор ✅
│   ├── UiTopPanel.ts                 # Верхняя панель (кнопка Сохранить) ✅
│   ├── UiCameraToggle.ts             # Переключатель 2D/3D ✅
│   ├── UiStatsPanel.ts               # Оверлей FPS + draw calls ✅
│   ├── RightPanel.ts                 # Правая панель (свойства) ✅
│   │
│   ├── styles/                       # Стили UI ✅
│   │   └── UiStyles.ts               # CSS-in-JS стили ✅
│   │
│   ├── panels/                       # Панели 📋
│   │   ├── LeftPanel.ts              # Левая панель (каталог) 📋
│   │   ├── LevelPanel.ts             # Панель этажей 📋
│   │   └── PropertiesPanel.ts        # Панель свойств объекта 📋
│   │
│   ├── toolbar/                      # Панель инструментов 📋
│   ├── controls/                     # Дополнительные контролы 📋
│   └── dialogs/                      # Диалоги 📋
│
├── api/                               # 🔗 API СЛОЙ 🚧
│   ├── apiLocal/                      # 📨 Команды между UI и Three.js ✅
│   │   ├── ApiUiToThree.ts            # UI → Three.js (добавить стену, сместить точку, сменить режим) ✅
│   │   ├── ApiThreeToUi.ts            # Three.js → UI (обновление свойств, события выделения) ✅
│   │   └── ApiLocalTypes.ts           # Типы событий и команд между слоями ✅
│   │
│   └── apiGlobal/                     # 🌐 Взаимодействие с внешней БД 📋
│       ├── ApiGlobalLoader.ts         # Загрузка данных дома из внешней БД (GET) 📋
│       ├── ApiGlobalSaver.ts          # Сохранение состояния дома в внешнюю БД (POST/PUT) 📋
│       └── ApiGlobalTypes.ts          # Типы запросов/ответов для внешней БД 📋
│
└── utils/                             # 🔧 УТИЛИТЫ 🚧
    ├── helpers/                       # Вспомогательные инструменты ✅
    │   └── PerformanceMonitor.ts     # Мониторинг производительности ✅
    │
    ├── math/                          # Математические утилиты 📋
    │   ├── GeometryUtils.ts          # Геометрические вычисления 📋
    │   ├── VectorUtils.ts            # Работа с векторами 📋
    │   └── PolygonUtils.ts           # Работа с полигонами 📋
    │
    └── types/                         # Общие типы 📋
        ├── HouseTypes.ts             # Типы для дома 📋
        ├── InteractionTypes.ts       # Типы для взаимодействий 📋
        └── EventTypes.ts             # Типы событий 📋
```

---

## Текущее состояние реализации

### ✅ Полностью реализованные модули

1. **Core** - `ContextSingleton` паттерн для всех менеджеров
2. **Scene** - полная базовая функциональность Three.js сцены (8 менеджеров)
3. **House (частично)** - точки и стены полностью работают
4. **Model** - система сеточной модели (не было в изначальном плане)
5. **Worker** - рендер в воркере полностью реализован (4 файла)
6. **Interaction (частично)** - базовая архитектура + drag точек + выделение
7. **API Local** - коммуникация UI ↔ Three.js
8. **UI (частично)** - основные панели и контролы

### 🚧 Частично реализованные модули

- **House** - только точки и стены; нет этажей, комнат, проёмов, объектов, крыш, лестниц
- **Interaction** - есть core/routing/features(points+selection)/behaviors(drag)/commands, но нет input/modes/policies/capabilities/tools/blocking
- **UI** - базовые компоненты есть, нет toolbar/dialogs/полной панели этажей
- **Utils** - только PerformanceMonitor, нет math утилит

### 📋 Запланированные модули (не реализованы)

- **House**: levels/, rooms/, openings/, objects/, roofs/, stairs/, floors/
- **Interaction**: input/, modes/, policies/, capabilities/, большинство features, большинство behaviors, tools/, blocking/
- **Loaders**: загрузчики 3D моделей и текстур
- **API Global**: взаимодействие с внешней БД
- **Utils**: математические утилиты, типы

### 📐 Добавлено (не было в плане)

- **threeApp/model/** - LoaderModel и GridProcessor для сеточной визуализации
- **threeApp/scene/MouseManager** - централизованная обработка pointer событий
- **threeApp/interaction/features/selection/** - SelectionManager для управления выделением
- **ui/styles/** - CSS-in-JS стили

---

## API слой — контракты

### apiGlobal — внешняя БД

Ответственен за всё, что касается серверной стороны. UI и Three.js не вызывают внешние запросы напрямую — всё через этот слой.

| Файл | Направление | Назначение |
|------|-------------|------------|
| `ApiGlobalLoader` | БД → App | Загрузка проекта дома (список этажей, стен, точек, объектов) |
| `ApiGlobalSaver` | App → БД | Сохранение текущего состояния проекта обратно в БД |
| `ApiGlobalTypes` | — | DTO и типы запросов/ответов, общие для обоих классов |

Паттерн: оба класса — `ContextSingleton`, доступ через `.inst()`. Внутри они используют `fetch` (или итог его обёртки) и возвращают Promise. Если в дальнейшем появится WebSocket (например, для real-time синхронизации), поток добавляется сюда же.

### apiLocal — команды UI ↔ Three.js

Задача слоя — строго разделить ответственность между UI и Three.js, исключая прямые импорты между ними. Аналог схемы из `tp-viewer3D`: там `ApiUiToThree` и `ApiThreeToUi` также являются синглтонами и маршрутизируют вызовы либо напрямую, либо через `postMessage` в Worker.

| Файл | Направление | Примеры команд |
|------|-------------|----------------|
| `ApiUiToThree` | UI → Three.js | `addWall()`, `movePoint()`, `deleteObject()`, `switchCameraMode()` |
| `ApiThreeToUi` | Three.js → UI | `onPointSelected()`, `onWallUpdated()`, `updateProperties()` |
| `ApiLocalTypes` | — | Интерфейсы событий и параметров команд |

Правило: если UI нуждается в данных из сцены — он вызывает метод на `ApiUiToThree` (запрос) или получает их через событие от `ApiThreeToUi` (push). Прямой импорт менеджеров Three.js из файлов `ui/` запрещён.

---

## Рендер в воркере — два режима

Схема скопирована из `tp-viewer3D`. Поток выбирается на старте через флаг `useWorker` (по умолчанию `true`). Оба режима инициализируют одну и ту же сцену через общую функцию `InitScene` — расходятся только в том, где она запущена и как доставляются команды/события.

### Режим 1: Worker (по умолчанию)

```
main thread                                  Worker
─────────────────────────────────            ─────────────────────────────
canvas (DOM)                                 OffscreenCanvas
   │                                            │
   ├─ transferControlToOffscreen() ───────►     │
   │                                            ├─ InitScene.init()   ← Three.js сцена
   │                                            ├─ SceneManager
   │                                            ├─ RendererManager    ← рендер тут
   │                                            └─ все менеджеры
   │
   ├─ pointer/wheel events ──postMessage()──►  RenderWorker.handleMessage()
   │                                            └─ proxies to controls + MouseManager
   │
   ├─ UI команда
   │   └─ ApiUiToThree.inst().addWall()
   │       └─ WorkerManager.worker
   │           .postMessage({ type })  ───►     └─ вызов менеджера напрямую
   │
   ◄── self.postMessage({ type }) ─────────    RenderWorker → UI событие
   │       └─ WorkerManager.onmessage()
   │           └─ ApiThreeToUi → UI класс
   │
   ├─ resize (ResizeObserver)  ──postMessage()──►  SceneManager.handleResize()
```

Ключевые файлы:

| Файл | Роль |
|------|------|
| `WorkerManager` | Main-thread сторона: спавнит Worker, передаёт OffscreenCanvas, перехватывает pointer-события с canvas и forwarding-ит их, обрабатывает входящие сообщения от Worker и зовёт UI |
| `RenderWorker` | Worker сторона: получает OffscreenCanvas, запускает `InitScene`, реагирует на все `postMessage` команды, вызывает менеджеры Three.js напрямую |
| `WorkerTypes` | `type WorkerMessage = { type: 'init' … } \| { type: 'movePoint' … } \| …` — единый union для всех сообщений в обе стороны |
| `ApiUiToThree` | Внутри `shouldUseWorker()`: если воркер запущен — команда идёт через `WorkerManager.worker.postMessage`, иначе — прямой вызов менеджера |
| `ApiThreeToUi` | Внутри `isInWorker()`: если код крутится в Worker — `self.postMessage`, иначе — прямой вызов UI |

### Режим 2: Main thread (`useWorker: false`)

```
main thread
─────────────────────────────────────
canvas (DOM)
   │
   ├─ InitScene.init()   ← Three.js сцена здесь же
   ├─ SceneManager / RendererManager / все менеджеры
   │
   ├─ pointer events → MouseManager напрямую (через DOM listener)
   │
   ├─ ApiUiToThree.addWall() → менеджер напрямую  (shouldUseWorker = false)
   ├─ ApiThreeToUi.onPointSelected() → UI напрямую (isInWorker = false)
   │
   └─ resize → SceneManager.handleResize() напрямую
```

Нет воркера, нет OffscreenCanvas, нет `postMessage`. Удобен для отладки и для окружений, где Worker недоступен.

### Дублирование инициализации между путями

Некоторые вызовы присутствуют в обоих путях — в `ThreeMain` (при `!useWorker`) и в `RenderWorker` (при `useWorker`):

- `InteractionOrchestrator.inst().init()` + `registerFeature(…)` — в `ThreeMain` и в кейсе `init` воркера.
- `HouseLoader.inst().loadHouse()` + `LoaderModel.inst().loadJSON()` — в `ThreeMain` и в кейсе `loadHouse` воркера.

Это **структурно неизбежно**: код запускается в разных потоках и не может быть вызван из одного места. Пока features и loaders единицы — дублирование не болезненно. Когда features станет 3+, нужно ввести статический метод `InteractionOrchestrator.registerAll()`, который регистрирует все features, и вызывать его в обоих путях. Отдельный класс-оркестратор для этого не нужен.

### Сборка

Для воркера нужна вторая конфигурация Vite, аналог `vite.worker.config.ts` из `tp-viewer3D`:

| Конфиг | Entry | Output |
|--------|-------|--------|
| `vite.config.ts` | `src/main.ts` | `dist/index.js` (приложение) |
| `vite.worker.config.ts` | `src/threeApp/worker/RenderWorker.ts` | `dist/worker.js` (отдельный бандл) |

`WorkerManager` загружает воркер через `new Worker(url, { type: 'module' })`. В dev-режиме URL = `import.meta.url`-относительный путь к `.ts` файлу (Vite обрабатывает), в prod — замена `index.js` → `worker.js` в том же каталоге.

---

## Примечания

### История документа
- **Изначальный план** (до реализации) - описывал полную архитектуру с этажами, комнатами, проёмами, объектами и т.д.
- **Текущая версия** (обновлено 2026-02-08) - отражает реальное состояние кодовой базы

### Дополнительная документация
- [CLAUDE.md](../CLAUDE.md) - руководство для работы с проектом, описание инициализации и ключевых компонентов
- [INTERACTION_ARCHITECTURE.md](../INTERACTION_ARCHITECTURE.md) - детальный план будущей системы взаимодействий (не полностью реализован)
- [COMMANDS.md](../COMMANDS.md) - ранняя итерация плана структуры файлов для команд

### Следующие шаги
Следующие модули по приоритету реализации:
1. **Levels** - система этажей (необходима для масштабирования)
2. **Rooms** - автоопределение комнат и работа с полами
3. **Openings** - двери и окна с вырезанием проёмов
4. **Objects** - каталог мебели и размещение объектов
5. Расширение **Interaction** - modes, policies, capabilities для полной гибкости
6. **API Global** - интеграция с внешней БД для сохранения/загрузки проектов
