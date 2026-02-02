import { ContextSingleton } from '@/core/ContextSingleton';
import { UiCameraToggle } from '@/ui/UiCameraToggle';
import { UiTopPanel } from './UiTopPanel';

export class UiMain extends ContextSingleton<UiMain> {
  public init({ container }: { container: HTMLElement }) {
    UiTopPanel.inst().init(container);

    UiCameraToggle.inst().init(container);
    UiCameraToggle.inst().setCameraType({ type: '3D' });
  }
}
