import { ContextSingleton } from '@/core/ContextSingleton';
import { emit } from '@/threeApp/interaction/core/EventBus';
import type { Command } from './Command';

export class CommandManager extends ContextSingleton<CommandManager> {
  private history: Command[] = [];
  private currentIndex = -1;
  private readonly maxSize = 100;

  public execute(command: Command): void {
    // Отрезаем «будущее» если undo был сделан
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Попытка merge с последней командой
    const last = this.history[this.currentIndex];
    if (last?.canMerge?.(command)) {
      last.merge!(command);
      command.execute();
    } else {
      command.execute();
      this.history.push(command);
      this.currentIndex++;
    }

    if (this.history.length > this.maxSize) {
      this.history.shift();
      this.currentIndex--;
    }

    emit('history:changed', { canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  public undo(): void {
    if (!this.canUndo()) return;
    this.history[this.currentIndex].undo();
    this.currentIndex--;
    emit('history:changed', { canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  public redo(): void {
    if (!this.canRedo()) return;
    this.currentIndex++;
    this.history[this.currentIndex].redo();
    emit('history:changed', { canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  public canUndo(): boolean { return this.currentIndex >= 0; }
  public canRedo(): boolean { return this.currentIndex < this.history.length - 1; }
}
