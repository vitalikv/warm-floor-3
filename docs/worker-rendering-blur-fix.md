# Исправление проблем рендеринга в Web Worker

## Проблема 1: Размытое изображение

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

### Результат

Теперь рендеринг в Web Worker использует правильный `devicePixelRatio` и картинка такая же четкая, как и в основном потоке.

---

## Проблема 2: Разный угол обзора камеры

После исправления размытости обнаружилась вторая проблема — **разный угол обзора камеры** в воркере и основном потоке.

### Причина

Неправильный расчет aspect ratio в [CameraManager.ts:16-22](../src/threeApp/scene/CameraManager.ts#L16-L22):

```typescript
private getAspect(): number {
  if (typeof window !== 'undefined') {
    return window.innerWidth / window.innerHeight;  // ← размер окна браузера
  }
  const el = RendererManager.inst().getRenderer().domElement;
  return el.width / el.height;  // ← размер canvas
}
```

**Проблема:**
- В основном потоке использовался `window.innerWidth / window.innerHeight` (размер **всего окна** браузера)
- В воркере использовался `canvas.width / canvas.height` (размер **canvas**)
- Разные aspect ratio → разные углы обзора камеры

### Решение

Всегда использовать размеры canvas, передавая их в `CameraManager` при инициализации.

### Внесенные изменения

1. **[CameraManager.ts:14-16,21-24](../src/threeApp/scene/CameraManager.ts#L14-L16)** — добавлены поля для хранения размеров viewport:
   ```typescript
   private viewportWidth!: number;
   private viewportHeight!: number;

   private getAspect(): number {
     return this.viewportWidth / this.viewportHeight;
   }
   ```

2. **[CameraManager.ts:18-23](../src/threeApp/scene/CameraManager.ts#L18-L23)** — метод `init()` принимает размеры:
   ```typescript
   public init({ width, height }: { width: number; height: number }): void {
     this.viewportWidth = width;
     this.viewportHeight = height;
     // ...
   }
   ```

3. **[CameraManager.ts:25-28](../src/threeApp/scene/CameraManager.ts#L25-L28)** — добавлен метод обновления размеров:
   ```typescript
   public updateViewportSize(width: number, height: number): void {
     this.viewportWidth = width;
     this.viewportHeight = height;
   }
   ```

4. **[SceneManager.ts:30](../src/threeApp/scene/SceneManager.ts#L30)** — передаются размеры при инициализации:
   ```typescript
   CameraManager.inst().init({ width: rect.width, height: rect.height });
   ```

5. **[SceneManager.ts:45-46](../src/threeApp/scene/SceneManager.ts#L45-L46)** — обновление размеров при resize:
   ```typescript
   CameraManager.inst().updateViewportSize(width, height);
   CameraManager.inst().resize();
   ```

6. **[CameraManager.ts:1-3](../src/threeApp/scene/CameraManager.ts#L1-L3)** — удален неиспользуемый импорт `RendererManager`

### Результат

Теперь камера использует правильный aspect ratio (размеры canvas) как в основном потоке, так и в воркере. Угол обзора одинаковый.

---

**Дата:** 2026-02-07
**Коммиты:**
- Исправление размытости рендеринга в воркере через передачу devicePixelRatio
- Исправление угла обзора камеры через передачу размеров viewport
