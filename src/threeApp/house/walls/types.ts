export interface Point {
  id: number;
  pos: { x: number; y: number; z: number };
  type: string;
}

export interface Wall {
  id: number;
  p: { id: number[] };
  size: { y: number; z: number };
  windows: any[];
  doors: any[];
  material: Array<{ index: number; color: number; img: string }>;
}
