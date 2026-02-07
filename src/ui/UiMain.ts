import { ContextSingleton } from '@/core/ContextSingleton';
import { UiCameraToggle } from '@/ui/UiCameraToggle';
import { UiTopPanel } from './UiTopPanel';
import { RightPanel } from './RightPanel';
import { UiStatsPanel } from './UiStatsPanel';

export class UiMain extends ContextSingleton<UiMain> {
  public init({ container }: { container: HTMLElement }) {
    UiTopPanel.inst().init(container);
    RightPanel.inst().init(container);

    // UiCameraToggle больше не создает отдельную кнопку,
    // кнопки интегрированы в верхнюю панель
    // Но инициализируем для программного управления
    UiCameraToggle.inst().setCameraType({ type: '3D' });

    UiStatsPanel.inst().init(container);
  }
}
