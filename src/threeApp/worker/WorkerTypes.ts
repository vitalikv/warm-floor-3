// ── Main → Worker ──────────────────────────────────────────

export interface WorkerMsgInit {
  type: 'init';
  canvas: OffscreenCanvas;
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface WorkerMsgResize {
  type: 'resize';
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface WorkerMsgPointerDown {
  type: 'pointerdown';
  clientX: number;
  clientY: number;
  button: number;
  buttons: number;
  pointerId: number;
}

export interface WorkerMsgPointerMove {
  type: 'pointermove';
  clientX: number;
  clientY: number;
  button: number;
  buttons: number;
  pointerId: number;
}

export interface WorkerMsgPointerUp {
  type: 'pointerup';
  clientX: number;
  clientY: number;
  button: number;
  buttons: number;
  pointerId: number;
}

export interface WorkerMsgSwitchCamera {
  type: 'switchCamera';
  mode: '2D' | '3D';
}

export interface WorkerMsgLoadHouse {
  type: 'loadHouse';
  url: string;
}

export interface WorkerMsgWheel {
  type: 'wheel';
  deltaY: number;
  clientX: number;
  clientY: number;
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
  | WorkerMsgWheel
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
