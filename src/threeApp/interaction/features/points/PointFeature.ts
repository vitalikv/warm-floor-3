import { PointDragHandler } from './PointDragHandler';
import type { Feature } from '@/threeApp/interaction/core/InteractionOrchestrator';
import type { RouteData } from '@/threeApp/interaction/routing/ClickRouter';

export class PointFeature implements Feature {
  public readonly name = 'point';
  private dragHandler = new PointDragHandler();

  public handle(data: RouteData): void {
    this.dragHandler.handle(data);
  }
}
