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
