import { ContextSingleton } from '@/core/ContextSingleton';

/**
 * Three.js → UI.
 * Stage 1: все заглушки. Stage 2: push-события (выделение, свойства).
 */
export class ApiThreeToUi extends ContextSingleton<ApiThreeToUi> {

  public onObjectSelected(_objectId: number): void {
    // TODO Stage 2
  }

  public onPropertiesUpdated(_objectId: number, _properties: Record<string, unknown>): void {
    // TODO Stage 2
  }
}
