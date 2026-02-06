import { ContextSingleton } from '@/core/ContextSingleton';
import { ClickRouter } from '@/threeApp/interaction/routing/ClickRouter';
import type { RouteData } from '@/threeApp/interaction/routing/ClickRouter';
import { SelectionManager } from '@/threeApp/interaction/features/selection/SelectionManager';

export interface Feature {
  name: string;
  handle(data: RouteData): void;
}

export class InteractionOrchestrator extends ContextSingleton<InteractionOrchestrator> {
  private features = new Map<string, Feature>();

  public init(): void {
    ClickRouter.inst().onRouted((data) => this.handleInteraction(data));
  }

  public registerFeature(feature: Feature): void {
    this.features.set(feature.name, feature);
  }

  private handleInteraction(data: RouteData): void {
    if (data.objectType === 'unknown') return;

    if (data.action === 'down') {
      SelectionManager.inst().select(data.object);
    }

    const feature = this.features.get(data.objectType);
    feature?.handle(data);
  }
}
