import { ContextSingleton } from '../../core/ContextSingleton';
import { WallBuilder } from './WallBuilder';
import { SceneManager } from '../scene/SceneManager';

interface Point {
  id: number;
  pos: { x: number; y: number; z: number };
  type: string;
}

interface Wall {
  id: number;
  p: { id: number[] };
  size: { y: number; z: number };
  windows: any[];
  doors: any[];
  material: Array<{ index: number; color: number; img: string }>;
}

interface Level {
  version: { id: number };
  points: Point[];
  walls: Wall[];
  rooms: any[];
  object: any[];
  roofs: any[];
  height: number;
}

interface HouseData {
  level: Level[];
}

export class HouseLoader extends ContextSingleton<HouseLoader> {
  public async loadHouse(): Promise<void> {
    try {
      const url = new URL('/assets/1.json', import.meta.url);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Ошибка загрузки файла: ${response.statusText}`);
      }

      const jsonData: HouseData = await response.json();
      console.log('Загруженный JSON дома:', jsonData);

      if (!jsonData.level || jsonData.level.length === 0) {
        console.warn('Нет уровней в данных');
        return;
      }

      const firstLevel = jsonData.level[0];

      if (!firstLevel.points || firstLevel.points.length === 0) {
        console.warn('Нет точек в первом уровне');
        return;
      }

      if (!firstLevel.walls || firstLevel.walls.length === 0) {
        console.warn('Нет стен в первом уровне');
        return;
      }

      const scene = SceneManager.inst().getScene();

      WallBuilder.inst().buildWalls(firstLevel.points, firstLevel.walls, scene);

      console.log(`Построено ${firstLevel.walls.length} стен`);
    } catch (error) {
      console.error('Ошибка при загрузке дома:', error);
    }
  }
}
