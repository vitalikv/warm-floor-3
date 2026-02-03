# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite development server (http://localhost:5173)
npm run build        # TypeScript compilation + Vite production build
npm run preview      # Preview production build locally
```

No test runner or linter is configured. `npm run build` is the primary correctness check — it runs `tsc` first, so TypeScript errors will fail the build.

## Project Overview

3D home builder/visualizer built with Vite + TypeScript + Three.js. Users visualize building layouts, toggle between 3D/2D camera views, and drag wall endpoints to reshape structures in real time.

## Architecture

### ContextSingleton Pattern

Every manager in the app extends `ContextSingleton<T>` ([src/core/ContextSingleton.ts](src/core/ContextSingleton.ts)). Access any manager via its static `inst()` method — instances are created lazily on first access.

```typescript
SceneManager.inst().init()   // creates instance if needed, returns singleton
```

The pattern supports named contexts (`inst('worker')`) but only the default `'main'` context is used today. Do not instantiate managers with `new` — always go through `inst()`.

### Initialization Flow

Entry point: [src/main.ts](src/main.ts)

```
main.ts
├── ThreeMain.inst().init({ canvas })
│   ├── SceneManager.inst().init()
│   │   ├── RendererManager   – WebGL renderer (antialias, stencil)
│   │   ├── CameraManager     – perspective + orthographic cameras
│   │   ├── LightsManager     – ambient + directional lights
│   │   ├── ObjectsManager    – debug cube + grid helper
│   │   ├── ControlsManager   – OrbitControls (pan-only in 2D, rotate in 3D)
│   │   └── MouseManager      – pointer event hub + raycasting
│   ├── LoaderModel.inst().loadJSON()   → fetches /assets/fileJson-2.json → GridProcessor
│   └── HouseLoader.inst().loadHouse()  → fetches /assets/1.json → WallsManager + PointsManager
└── UiMain.inst().init({ container })
    ├── UiTopPanel        – top bar (currently empty placeholder)
    └── UiCameraToggle    – 2D/3D toggle button (top-right corner)
```

### Rendering is Event-Driven, Not Loop-Based

There is **no `requestAnimationFrame` loop**. The scene renders only when something changes:
- `ControlsManager` listens to OrbitControls `start`/`change`/`end` events and calls `RendererManager.inst().render()`.
- `MouseManager` calls `render()` on each `pointermove` while a point is being dragged.
- `SceneManager.handleResize` renders immediately after resizing to prevent flicker.

When you add new interactive behaviour, you must trigger `RendererManager.inst().render()` explicitly after mutating the scene.

### Wall System (`src/threeApp/house/walls/`)

`WallsManager` is the central coordinator. It owns three maps: `pointsMap` (source-of-truth point positions), `wallsMap` (wall definitions from JSON), and `wallMeshesMap` (live Three.js meshes).

Flow: `HouseLoader` fetches [public/assets/1.json](public/assets/1.json), extracts `level[0].points` and `level[0].walls`, and hands them to `WallsManager.buildWalls()`. That method:
1. Creates `PointWall` spheres via `PointsManager` for each point.
2. For each wall, calls `WallGeometry.createWallGeometry()` to build a 6-vertex contour (the two endpoints plus a midpoint on each side, forming a thin slab shape), extrudes it upward along Y by `wall.size.y`, and produces a `BufferGeometry` with correct normals.
3. Applies a `MeshStandardMaterial` coloured from `wall.material[0].color` via `WallMaterial`.

When a point is dragged, `WallsManager.updatePointPosition()` updates `pointsMap` and calls `rebuildWall()` for every wall referencing that point. `rebuildWall` disposes the old geometry and swaps in a freshly computed one — the mesh and material stay the same.

### Interactive Point Dragging

`MouseManager` handles all pointer events. On `pointerdown` it raycasts and looks for objects with `userData.type === 'point'`. When found:
1. It disables OrbitControls and delegates to `PointMove`.
2. `PointMove` positions a large horizontal plane at the point's Y level, then on each `pointermove` it raycasts against that plane to get a world-space hit, computes the delta from the previous hit, and moves the point + rebuilds walls via `WallsManager.updatePointPosition()`.
3. On `pointerup`, controls are re-enabled.

**Note:** The drag plane in `PointMove` is currently semi-visible (yellow, opacity 0.5). This appears to be a debug artifact.

### Dual Camera / Controls

- Default view is **orthographic** (top-down 2D). OrbitControls left-mouse is remapped to pan; rotation is disabled.
- The "3D" button switches to **perspective** camera with rotation enabled. Camera state (position + target) is saved/restored on each toggle via `userData.state`.
- The actual camera object swap happens in `ControlsManager.switchControls()`, which also calls `controls.object = camera` and `controls.update()`.

### Grid System (`src/threeApp/model/`)

`LoaderModel` fetches [public/assets/fileJson-2.json](public/assets/fileJson-2.json) and passes it to `GridProcessor`. Each grid entry defines a polygon (array of 3D points) and a `sizeCell`. `GridProcessor` draws the polygon outline, then fills it with grid lines clipped to the polygon boundary using 2D line-segment intersection in the XZ plane.

### Planned Interaction Architecture

[INTERACTION_ARCHITECTURE.md](INTERACTION_ARCHITECTURE.md) is a design document for a future `src/threeApp/interaction/` layer. It is **not yet implemented**. It proposes a layered system: Input → Routing → Policy check → Capability check → Feature handlers → Command pattern (undo/redo) → EventBus. [COMMANDS.md](COMMANDS.md) contains an earlier iteration of the same planned file structure. When implementing new interactive features, refer to this document for the intended direction — but do not create files under `interaction/` without confirming the plan is still current.

### Path Aliases

`@/` maps to `src/` (configured in both [tsconfig.json](tsconfig.json) and [vite.config.ts](vite.config.ts)):

```typescript
import { SceneManager } from '@/threeApp/scene/SceneManager';
```

### TypeScript Strictness

`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`. Any unused variable or parameter will fail `tsc` and therefore `npm run build`. Remove or prefix with `_` before committing.

### Known Debug Artifacts

- Multiple `console.log` calls throughout the codebase (SceneManager, RendererManager, HouseLoader, MouseManager, CameraManager, UiCameraToggle).
- `PointMove` drag plane is visible (yellow, 0.5 opacity) — likely should be `material.visible = false`.
- `three-mesh-bvh` is in `package.json` dependencies but is not imported anywhere.
- `ObjectsManager` adds a green debug cube and grid helper to the scene.
