import { ContextSingleton } from '@/core/ContextSingleton';
import type { MainToWorkerMsg, WorkerToMainMsg } from './WorkerTypes';

/**
 * Main-thread сторона воркера.
 * Stage 1: скелет, не подключён к приложению.
 * Stage 2: вызывается из ThreeMain при useWorker === true.
 */
export class WorkerManager extends ContextSingleton<WorkerManager> {
  private worker: Worker | null = null;

  public init(canvas: HTMLCanvasElement): void {
    const offscreen = canvas.transferControlToOffscreen();

    this.worker = new Worker(new URL('./RenderWorker.ts', import.meta.url), { type: 'module' });

    this.worker.onmessage = (event: MessageEvent<WorkerToMainMsg>) => {
      this.handleMessage(event.data);
    };

    this.send({
      type: 'init',
      canvas: offscreen,
      width: canvas.getBoundingClientRect().width,
      height: canvas.getBoundingClientRect().height,
    });
  }

  public send(msg: MainToWorkerMsg): void {
    if (!this.worker) return;
    if (msg.type === 'init') {
      this.worker.postMessage(msg, [msg.canvas]);
    } else {
      this.worker.postMessage(msg);
    }
  }

  private handleMessage(msg: WorkerToMainMsg): void {
    switch (msg.type) {
      case 'ready':
        // TODO Stage 2
        break;
      case 'objectSelected':
        // TODO Stage 2: ApiThreeToUi.inst().onObjectSelected(msg.objectId)
        break;
      case 'houseLoaded':
        // TODO Stage 2
        break;
    }
  }

  public isRunning(): boolean {
    return this.worker !== null;
  }
}
