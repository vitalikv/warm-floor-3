# Исправление размытости рендеринга в Web Worker

## Проблема

При использовании Web Worker для рендеринга (`useWorker = true` в [ThreeMain.ts](../src/threeApp/ThreeMain.ts)) изображение получалось размытым по сравнению с рендерингом в основном потоке.

## Причина

`devicePixelRatio` не передавался из главного потока в Web Worker.

В [RendererManager.ts:15](../src/threeApp/scene/RendererManager.ts#L15) была проверка:

```typescript
this.renderer.setPixelRatio(typeof window !== 'undefined' ? window.devicePixelRatio : 1);
```

Проблема: в Web Worker объект `window` недоступен, поэтому `devicePixelRatio` всегда устанавливался в `1` вместо реального значения (обычно `2` на Retina-дисплеях).

Результат: на дисплеях с высокой плотностью пикселей (Retina) изображение рендерилось с половинным разрешением и выглядело размытым.

## Решение

Передача `devicePixelRatio` из главного потока в Worker через сообщение `init`.

### Внесенные изменения

1. **[WorkerTypes.ts:10](../src/threeApp/worker/WorkerTypes.ts#L10)** — добавлено поле `devicePixelRatio: number` в интерфейс `WorkerMsgInit`

2. **[WorkerManager.ts:30](../src/threeApp/worker/WorkerManager.ts#L30)** — передача значения из главного потока:
   ```typescript
   devicePixelRatio: window.devicePixelRatio
   ```

3. **[RendererManager.ts:12](../src/threeApp/scene/RendererManager.ts#L12)** — принимает опциональный параметр:
   ```typescript
   public init({ canvas, rect, pixelRatio }: { ...; pixelRatio?: number })
   this.renderer.setPixelRatio(pixelRatio ?? (typeof window !== 'undefined' ? window.devicePixelRatio : 1));
   ```

4. **[SceneManager.ts:17,28](../src/threeApp/scene/SceneManager.ts#L17)** — пробрасывает `pixelRatio` в `RendererManager`

5. **[RenderWorker.ts:33](../src/threeApp/worker/RenderWorker.ts#L33)** — использует переданное значение:
   ```typescript
   SceneManager.inst().init({ canvas: msg.canvas, rect, pixelRatio: msg.devicePixelRatio });
   ```

## Результат

Теперь рендеринг в Web Worker использует правильный `devicePixelRatio` и картинка такая же четкая, как и в основном потоке.

---

**Дата:** 2026-02-07
**Коммит:** Исправление размытости рендеринга в воркере через передачу devicePixelRatio
