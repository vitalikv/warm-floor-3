import { ContextSingleton } from '../../core/ContextSingleton';
import { WallsManager } from './walls/WallsManager';
import { SceneManager } from '../scene/SceneManager';
import type { Point, Wall } from './walls/types';

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
  private houseData: HouseData | null = null;

  public getHouseData(): HouseData | null {
    return this.houseData;
  }

  public async loadHouse(): Promise<void> {
    try {
      const url = new URL('/assets/1.json', import.meta.url);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Ошибка загрузки файла: ${response.statusText}`);
      }

      const jsonData: HouseData = await response.json();
      this.houseData = jsonData;

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

      WallsManager.inst().buildWalls(firstLevel.points, firstLevel.walls, scene);
    } catch (error) {
      console.error('Ошибка при загрузке дома:', error);
    }
  }
}
