export interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
  canMerge?(other: Command): boolean;
  merge?(other: Command): void;
}
