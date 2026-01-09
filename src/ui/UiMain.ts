import { ContextSingleton } from '@/core/ContextSingleton';
import { UiCameraToggle } from '@/ui/UiCameraToggle';

export class UiMain extends ContextSingleton<UiMain> {
  public init({ container }: { container: HTMLElement }) {
    UiCameraToggle.inst().init(container);
    UiCameraToggle.inst().setCameraType(false);
  }
}
