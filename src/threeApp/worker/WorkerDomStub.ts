/**
 * Минимальный стаб DOM-элемента для OrbitControls в Web Worker.
 *
 * OrbitControls (three r182) обращается к:
 *   domElement.addEventListener / removeEventListener          → наследуется от EventTarget
 *   domElement.ownerDocument.addEventListener / removeEventListener → отдельный EventTarget
 *   domElement.getRootNode()                                   → тот же EventTarget (keydown)
 *   domElement.style.touchAction                               → объект-заглушка
 *   domElement.setPointerCapture / releasePointerCapture       → no-op
 *   domElement.getBoundingClientRect()                         → обновляемый DOMRect
 *   domElement.clientHeight / clientWidth                      → из DOMRect
 *
 * Маршрутизация событий:
 *   pointerdown  → this          (OrbitControls навешивает на domElement)
 *   pointermove  → ownerDocument (OrbitControls навешивает в onPointerDown)
 *   pointerup    → ownerDocument
 */
export class WorkerDomStub extends EventTarget {
  style = { touchAction: '', userSelect: '' };

  /** EventTarget для ownerDocument и getRootNode() */
  ownerDocument: EventTarget;

  private _rect: DOMRect;

  get clientWidth(): number  { return this._rect.width; }
  get clientHeight(): number { return this._rect.height; }

  constructor(left: number, top: number, width: number, height: number) {
    super();
    this._rect = new DOMRect(left, top, width, height);
    this.ownerDocument = new EventTarget();
  }

  getBoundingClientRect(): DOMRect {
    return this._rect;
  }

  getRootNode(): EventTarget {
    return this.ownerDocument;
  }

  setPointerCapture(_id: number): void { /* no-op */ }
  releasePointerCapture(_id: number): void { /* no-op */ }

  updateRect(left: number, top: number, width: number, height: number): void {
    this._rect = new DOMRect(left, top, width, height);
  }

  /**
   * Создаёт синтетическое pointer-событие и отправляет на нужный target.
   *   pointerdown              → this
   *   pointermove / pointerup  → ownerDocument
   */
  emitPointer(type: string, clientX: number, clientY: number, button: number, buttons: number, pointerId: number): void {
    const e = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperties(e, {
      clientX:     { value: clientX },
      clientY:     { value: clientY },
      button:      { value: button },
      buttons:     { value: buttons },
      pointerId:   { value: pointerId },
      pointerType: { value: 'mouse' },
    });

    const target = (type === 'pointermove' || type === 'pointerup') ? this.ownerDocument : this;
    target.dispatchEvent(e);
  }

  /** wheel навешивается на domElement (не ownerDocument) */
  emitWheel(deltaY: number, clientX: number, clientY: number): void {
    const e = new Event('wheel', { bubbles: true, cancelable: true });
    Object.defineProperties(e, {
      deltaY:    { value: deltaY },
      deltaMode: { value: 0 },       // DOM_DELTA_PIXEL
      clientX:   { value: clientX },
      clientY:   { value: clientY },
    });
    this.dispatchEvent(e);
  }
}
