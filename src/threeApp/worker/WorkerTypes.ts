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
