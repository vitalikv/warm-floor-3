import { ContextSingleton } from '@/core/ContextSingleton';
import { ApiThreeToUi } from '@/api/apiLocal/ApiThreeToUi';
import { PerformanceMonitor } from '@/utils/helpers/PerformanceMonitor';
import * as EventBus from '@/threeApp/interaction/core/EventBus';
import type { MainToWorkerMsg, WorkerToMainMsg } from './WorkerTypes';

/**
 * Main-thread сторона воркера.
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

    const rect = canvas.getBoundingClientRect();
    this.send({
      type: 'init',
      canvas: offscreen,
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      devicePixelRatio: window.devicePixelRatio,
    });

    this.setupPointerForwarding(canvas);
  }

  private setupPointerForwarding(canvas: HTMLCanvasElement): void {
    canvas.addEventListener('pointerdown', (e) => this.send({ type: 'pointerdown', clientX: e.clientX, clientY: e.clientY, button: e.button, buttons: e.buttons, pointerId: e.pointerId }));
    canvas.addEventListener('pointermove', (e) => this.send({ type: 'pointermove', clientX: e.clientX, clientY: e.clientY, button: e.button, buttons: e.buttons, pointerId: e.pointerId }));
    canvas.addEventListener('pointerup',   (e) => this.send({ type: 'pointerup',   clientX: e.clientX, clientY: e.clientY, button: e.button, buttons: e.buttons, pointerId: e.pointerId }));
    canvas.addEventListener('wheel', (e) => { e.preventDefault(); this.send({ type: 'wheel', deltaY: e.deltaY, clientX: e.clientX, clientY: e.clientY }); }, { passive: false });
    window.addEventListener('keydown', (e) => this.send({ type: 'keydown', key: e.key, code: e.code }));
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
        this.send({ type: 'loadHouse', url: '/assets/1.json' });
        break;
      case 'objectSelected':
        ApiThreeToUi.inst().onObjectSelected(msg.objectId);
        break;
      case 'houseLoaded':
        // уведомление UI через ApiThreeToUi (Stage 3)
        break;
      case 'stats':
        PerformanceMonitor.inst().pushStats(msg.fps, msg.drawCalls, msg.geometries);
        break;
      case 'wallCreationCancelled':
        EventBus.emit('wall:creation:cancelled', {});
        break;
    }
  }

  public isRunning(): boolean {
    return this.worker !== null;
  }
}
