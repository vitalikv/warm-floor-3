# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start Vite development server
npm run build        # TypeScript compilation + Vite production build
npm run preview      # Preview production build locally
```

## Project Overview

3D home builder/visualizer built with Vite + TypeScript + Three.js. Users can visualize building layouts, interact with 3D/2D views, and drag wall endpoints to modify structures.

## Architecture

### ContextSingleton Pattern

All managers inherit from `ContextSingleton<T>` ([src/core/ContextSingleton.ts](src/core/ContextSingleton.ts)), enabling context-based singleton instances:

```typescript
// Access singleton instance (uses 'main' context by default)
SceneManager.inst().init()

// Multiple contexts supported (though currently unused)
MyManager.inst('worker')
```

This pattern allows lazy initialization and global access throughout the application while maintaining the flexibility for future multi-context scenarios.

### Initialization Flow

Entry point: [src/main.ts](src/main.ts)

```
main.ts
├── ThreeMain.inst().init({ canvas })
│   ├── SceneManager.inst().init()
│   │   ├── Creates THREE.Scene (white background 0xffffff)
│   │   ├── RendererManager: WebGL with antialias, stencil, preserveDrawingBuffer
│   │   ├── CameraManager: Dual camera system (perspective + orthographic)
│   │   ├── LightsManager: Ambient + directional lights
│   │   ├── ObjectsManager: Test cube and grid helpers
│   │   ├── ControlsManager: OrbitControls with pan/rotate
│   │   └── MouseManager: Centralized pointer event handling
│   ├── LoaderModel.inst().loadJSON()  # /assets/fileJson-2.json
│   └── HouseLoader.inst().loadHouse() # /assets/1.json
└── UiMain.inst().init({ container })
    ├── UiTopPanel: Top UI panel
    └── UiCameraToggle: 3D/2D camera toggle button
```

### Module Organization

**[src/threeApp/](src/threeApp/)** - Three.js logic
- `ThreeMain.ts` - Main Three.js orchestrator
- `scene/` - Core scene management (SceneManager, CameraManager, RendererManager, ControlsManager, LightsManager, ObjectsManager, MouseManager)
- `house/` - Building data loading and rendering (HouseLoader, WallBuilder)
  - `points/` - Interactive point system (PointsManager, PointWall, PointMove)
- `model/` - Grid data processing (LoaderModel, GridProcessor)

**[src/ui/](src/ui/)** - UI components
- `UiMain.ts` - UI orchestrator
- `UiTopPanel.ts` - Top panel
- `UiCameraToggle.ts` - 3D/2D camera toggle

**[src/core/](src/core/)** - Base classes and utilities

### Key Architectural Patterns

**Dual Camera System**:
- Perspective camera (3D view with OrbitControls rotation)
- Orthographic camera (2D top-down, pan-only, rotation disabled)
- Toggle via `UiCameraToggle` button
- CameraManager handles switching and maintains separate controls states

**Wall Building System**:
- Loads from [/public/assets/1.json](public/assets/1.json) (building levels, walls, rooms, points)
- WallBuilder creates wall meshes from point pairs using custom geometry extrusion
- Generates 6-sided geometry (bottom, top, 4 sides) with proper normals
- Materials support colors from JSON data

**Interactive Points**:
- Red spheres (radius 0.1) mark wall endpoints
- PointMove handles drag-and-drop via raycasting
- Creates invisible horizontal plane at point's Y level for dragging
- Disables camera controls during drag, re-enables on release
- Updates connected wall geometries in real-time

**Grid System**:
- Loads from [/public/assets/fileJson-2.json](public/assets/fileJson-2.json)
- GridProcessor renders polygon boundaries and internal grid lines
- Uses ray-segment intersection for accurate grid placement within polygons

**Mouse Event Centralization**:
- MouseManager centralizes all pointer events (`pointermove`, `pointerdown`, `pointerup`)
- Delegates to specialized handlers (PointMove for dragging)
- Uses Three.js raycasting for object picking

### Path Aliases

Configured in [tsconfig.json](tsconfig.json) and [vite.config.ts](vite.config.ts):

```typescript
import { Something } from '@/threeApp/scene/SceneManager';
// Resolves to: src/threeApp/scene/SceneManager.ts
```

### Data Files

- [/public/assets/1.json](public/assets/1.json) - Building layout (levels, walls, rooms, objects, roofs)
- [/public/assets/fileJson-2.json](public/assets/fileJson-2.json) - Grid definitions with polygon boundaries

Both loaded asynchronously during initialization via singleton loaders.

### TypeScript Configuration

Strict mode enabled with:
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

Target ES2020, module ESNext, bundler resolution.
