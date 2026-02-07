# Stage 5 — Улучшение UI и дизайна

> Базируется на результатах Stage 1–4.
> Проверка после каждого раздела: `npm run build` должен быть зелёный.

---

## Что делает Stage 5

Три основные задачи:

1. **Стилизация панелей** — добавление теней, скруглений, градиентов в стиле ocsg-1\p1. Обновление `UiTopPanel`, `LeftPanel`, `UiCameraToggle`, `UiStatsPanel` с современным визуальным оформлением.

2. **Система стилей** — создание централизованного модуля `UiStyles` для переиспользования CSS-стилей (градиенты, тени, скругления, цвета) во всех UI-компонентах.

3. **Улучшение кнопок и интерактивных элементов** — добавление hover-эффектов, градиентов, улучшенных теней для всех кнопок и кликабельных элементов.

Плюс: подготовка структуры для будущих панелей (RightPanel, PropertiesPanel) с единым стилем.

---

## Уже готово (Stage 1–4) — не трогаем

| Компонент | Статус |
|-----------|--------|
| `UiTopPanel` — кнопка «Сохранить» | Работает, требует стилизации |
| `LeftPanel` — placeholder «Каталог» | Работает, требует стилизации |
| `UiCameraToggle` — переключатель 2D/3D | Работает, требует стилизации |
| `UiStatsPanel` — оверлей FPS/Draw calls | Работает, требует стилизации |
| `SelectionManager` + outline | Работает (Stage 4) |
| `EffectsManager` + постобработка | Работает (Stage 3) |

---

## Вне скопа Stage 5

| Тема | Почему не сейчас |
|------|------------------|
| RightPanel / PropertiesPanel | Stage 6. Сначала стилизация существующих панелей, затем добавление новых |
| Каталог объектов в LeftPanel | Stage 6. Сначала визуальное оформление, затем функционал |
| Модальные окна (диалоги) | Stage 6. После стилизации основных панелей |
| Анимации и transitions | Stage 5+ (опционально). Сначала статический дизайн |
| Темная тема | Stage 6+. Сначала светлая тема в стиле ocsg-1\p1 |

---

## Раздел A: Система стилей UiStyles

### A1. `src/ui/styles/UiStyles.ts`

Централизованный модуль для переиспользования CSS-стилей. Все стили в стиле ocsg-1\p1: градиенты, тени, скругления, цвета.

```typescript
import { ContextSingleton } from '@/core/ContextSingleton';

// Цветовая палитра в стиле ocsg-1\p1
const COLORS = {
  background: '#ffffff',
  panel: '#f1f1f1',
  panelHeader: '#e8e8e8',
  border: '#b3b3b3',
  text: '#666666',
  textLight: '#888888',
  shadow: 'rgba(0, 0, 0, 0.2)',
  shadowStrong: 'rgba(0, 0, 0, 0.5)',
};

export class UiStyles extends ContextSingleton<UiStyles> {
  // Градиент для кнопок (button_gradient_1)
  public getButtonGradient(): string {
    return `
      background-color: #ffffff;
      background-image: linear-gradient(to bottom, #ffffff 0%, #e3e3e3 100%);
      box-shadow: 0px 0px 2px #bababa, inset 0px 0px 1px #ffffff;
    `;
  }

  // Градиент для кнопок при hover
  public getButtonGradientHover(): string {
    return `
      background-image: linear-gradient(to bottom, #e3e3e3 100%, #ffffff 0%);
    `;
  }

  // Стиль для панелей (right_panel_1_1, left_panel_1)
  public getPanelStyle(): string {
    return `
      background-color: ${COLORS.panel};
      border: 1px solid ${COLORS.border};
      box-shadow: 0px 0px 2px #bababa, inset 0px 0px 1px #ffffff;
    `;
  }

  // Стиль для заголовков панелей (modal_header, block_form_1_h1)
  public getPanelHeaderStyle(): string {
    return `
      background: ${COLORS.panelHeader};
      border-bottom: 2px solid #f2f2f2;
      color: ${COLORS.text};
      font-family: arial, sans-serif;
    `;
  }

  // Стиль для модальных окон (modal_window)
  public getModalStyle(): string {
    return `
      background: ${COLORS.background};
      border-radius: 8px;
      box-shadow: 0 4px 10px 0 ${COLORS.shadowStrong};
    `;
  }

  // Стиль для блоков с тенью (block_form_1)
  public getBlockStyle(): string {
    return `
      background-color: ${COLORS.background};
      border-radius: 7px;
      box-shadow: 0 0 6px 0 ${COLORS.shadow};
    `;
  }

  // Стиль для блоков при hover
  public getBlockHoverStyle(): string {
    return `
      box-shadow: 0 0 3px 0 rgba(0, 0, 0, 0.7);
    `;
  }

  // Базовый стиль для кнопок
  public getButtonBaseStyle(): string {
    return `
      font-family: arial, sans-serif;
      font-size: 14px;
      color: ${COLORS.text};
      border: 1px solid ${COLORS.border};
      border-radius: 4px;
      cursor: pointer;
      padding: 8px 16px;
      transition: background 0.2s, box-shadow 0.2s;
    `;
  }

  // Стиль для текста
  public getTextStyle(): string {
    return `
      font-family: arial, sans-serif;
      color: ${COLORS.text};
      font-size: 14px;
    `;
  }

  // Стиль для заголовков
  public getTitleStyle(): string {
    return `
      font-family: arial, sans-serif;
      font-size: 20px;
      color: ${COLORS.text};
    `;
  }

  // Скругления
  public getBorderRadius(size: 'small' | 'medium' | 'large' = 'medium'): string {
    const sizes = {
      small: '4px',
      medium: '8px',
      large: '12px',
    };
    return `border-radius: ${sizes[size]};`;
  }

  // Тени
  public getShadow(type: 'light' | 'medium' | 'strong' = 'medium'): string {
    const shadows = {
      light: '0px 0px 2px #bababa, inset 0px 0px 1px #ffffff',
      medium: '0 4px 10px 0 rgba(0, 0, 0, 0.2)',
      strong: '0 4px 10px 0 rgba(0, 0, 0, 0.5)',
    };
    return `box-shadow: ${shadows[type]};`;
  }
}
```

---

## Раздел B: Стилизация UiTopPanel

### B1. Обновление `src/ui/UiTopPanel.ts`

Добавить импорт `UiStyles`, применить стили к панели и кнопке. Панель должна выглядеть как верхняя панель из ocsg-1\p1 (top_panel_1).

```typescript
// добавить импорт:
import { UiStyles } from '@/ui/styles/UiStyles';

// БЫЛО:
private html() {
  const css1 = `
    position: absolute; 
    width: 100%; 
    height: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color:rgb(133, 133, 133);
    border: 1px solid rgb(179, 179, 179);
    background: rgb(241, 241, 241);`;

  const btnCss = `
    padding: 8px 16px;
    background: rgb(70, 130, 180);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;`;

  const html = `<div style="${css1}"><button style="${btnCss}">Сохранить</button></div>`;
  return html;
}

// СТАНЕТ:
private html() {
  const styles = UiStyles.inst();
  
  const panelCss = `
    position: absolute;
    width: 100%;
    height: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    ${styles.getPanelStyle()}
    border-bottom: 1px solid #f1f1f1;
    z-index: 2;
  `;

  const btnCss = `
    ${styles.getButtonBaseStyle()}
    ${styles.getButtonGradient()}
    font-weight: bold;
  `;

  const html = `<div style="${panelCss}"><button style="${btnCss}">Сохранить</button></div>`;
  return html;
}
```

### B2. Добавление hover-эффекта для кнопки

Добавить обработчик hover для кнопки «Сохранить»:

```typescript
// добавить в init() после создания кнопки:
const btn = this.divMenu.querySelector('button') as HTMLButtonElement;
btn.addEventListener('click', () => this.saveProject());

// добавить hover-эффект:
btn.addEventListener('mouseenter', () => {
  const styles = UiStyles.inst();
  btn.style.cssText += styles.getButtonGradientHover();
});
btn.addEventListener('mouseleave', () => {
  const styles = UiStyles.inst();
  btn.style.cssText = btn.style.cssText.replace(
    /background-image:.*?;/g,
    styles.getButtonGradient()
  );
});
```

---

## Раздел C: Стилизация LeftPanel

### C1. Обновление `src/ui/LeftPanel.ts`

Применить стили из ocsg-1\p1 (left_panel_1): тени, скругления, градиенты.

```typescript
// добавить импорт:
import { UiStyles } from '@/ui/styles/UiStyles';

// БЫЛО:
private html(): string {
  const css = `
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 200px;
    background: rgb(241, 241, 241);
    border-right: 1px solid rgb(179, 179, 179);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgb(133, 133, 133);
    font-size: 14px;`;
  return `<div style="${css}">Каталог</div>`;
}

// СТАНЕТ:
private html(): string {
  const styles = UiStyles.inst();
  
  const panelCss = `
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 200px;
    ${styles.getPanelStyle()}
    ${styles.getBorderRadius('small')}
    border-right: 1px solid ${styles.getPanelStyle().match(/border:\s*1px solid ([^;]+)/)?.[1] || '#b3b3b3'};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: 20px;
    z-index: 2;
  `;

  const titleCss = `
    ${styles.getTitleStyle()}
    margin-bottom: 20px;
    text-align: center;
  `;

  const contentCss = `
    ${styles.getTextStyle()}
    text-align: center;
    padding: 10px;
  `;

  return `
    <div style="${panelCss}">
      <div style="${titleCss}">Каталог</div>
      <div style="${contentCss}">Содержимое каталога появится позже</div>
    </div>
  `;
}
```

---

## Раздел D: Стилизация UiCameraToggle

### D1. Обновление `src/ui/UiCameraToggle.ts`

Применить градиентный стиль кнопки в стиле ocsg-1\p1.

```typescript
// добавить импорт:
import { UiStyles } from '@/ui/styles/UiStyles';

// БЫЛО:
private getHtml(): string {
  const css = `
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.9);
    padding: 10px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    transition: background 0.3s;
  `;
  return `<button style="${css}">3D</button>`;
}

// СТАНЕТ:
private getHtml(): string {
  const styles = UiStyles.inst();
  
  const btnCss = `
    position: absolute;
    top: 20px;
    right: 20px;
    ${styles.getButtonBaseStyle()}
    ${styles.getButtonGradient()}
    font-weight: bold;
    z-index: 10;
  `;

  return `<button style="${btnCss}">3D</button>`;
}
```

### D2. Добавление hover-эффекта

Добавить обработчики hover в `init()`:

```typescript
// добавить в init() после создания кнопки:
this.button = div.querySelector('button') as HTMLButtonElement;
this.button.addEventListener('click', () => this.toggle());

// добавить hover-эффект:
const styles = UiStyles.inst();
this.button.addEventListener('mouseenter', () => {
  this.button!.style.cssText += styles.getButtonGradientHover();
});
this.button.addEventListener('mouseleave', () => {
  const baseStyle = styles.getButtonBaseStyle() + styles.getButtonGradient();
  this.button!.style.cssText = baseStyle + `
    position: absolute;
    top: 20px;
    right: 20px;
    font-weight: bold;
    z-index: 10;
  `;
});
```

---

## Раздел E: Стилизация UiStatsPanel

### E1. Обновление `src/ui/UiStatsPanel.ts`

Улучшить визуальное оформление оверлея FPS/Draw calls в стиле ocsg-1\p1.

```typescript
// добавить импорт:
import { UiStyles } from '@/ui/styles/UiStyles';

// БЫЛО:
private html(): string {
  const css = `
    position: absolute;
    bottom: 20px;
    right: 20px;
    background: rgba(20, 20, 20, 0.75);
    color: #888;
    padding: 8px 12px;
    border-radius: 5px;
    font-family: monospace;
    font-size: 13px;
    line-height: 1.7;
    pointer-events: none;
    user-select: none;`;

  return `<div style="${css}">
    <div>FPS:  <span id="stats-fps"  style="color:#ddd">0</span></div>
    <div>Draw: <span id="stats-dc"   style="color:#ddd">0</span></div>
  </div>`;
}

// СТАНЕТ:
private html(): string {
  const styles = UiStyles.inst();
  
  const panelCss = `
    position: absolute;
    bottom: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.9);
    ${styles.getBorderRadius('medium')}
    ${styles.getShadow('light')}
    padding: 10px 15px;
    font-family: monospace;
    font-size: 13px;
    line-height: 1.7;
    pointer-events: none;
    user-select: none;
    z-index: 10;
  `;

  const labelCss = `
    color: #666;
    font-weight: normal;
  `;

  const valueCss = `
    color: #333;
    font-weight: bold;
  `;

  return `
    <div style="${panelCss}">
      <div>FPS:  <span id="stats-fps" style="${valueCss}">0</span></div>
      <div>Draw: <span id="stats-dc" style="${valueCss}">0</span></div>
    </div>
  `;
}
```

---

## Раздел F: Глобальные стили (опционально)

### F1. Создание `src/ui/styles/global.css` (опционально)

Если нужны глобальные стили для всего приложения (например, сброс стилей, базовые шрифты), можно создать отдельный CSS-файл. Но для Stage 5 это не обязательно — все стили инлайновые через `UiStyles`.

---

## Проверочный чек-лист

После реализации всех разделов — по порядку:

- [ ] `npm run build` — без ошибок (`tsc` + `vite`)
- [ ] `npm run dev` — приложение запускается
- [ ] `UiStyles.ts` создан и компилируется
- [ ] Верхняя панель (`UiTopPanel`) имеет градиентный фон, тени, скругления
- [ ] Кнопка «Сохранить» имеет градиент и hover-эффект
- [ ] Левая панель (`LeftPanel`) имеет стили в стиле ocsg-1\p1 (тени, скругления)
- [ ] Кнопка переключения камеры (`UiCameraToggle`) имеет градиент и hover-эффект
- [ ] Оверлей FPS/Draw calls (`UiStatsPanel`) имеет улучшенное оформление (белый фон, тени)
- [ ] Все панели визуально похожи на стиль из ocsg-1\p1
- [ ] Hover-эффекты работают на всех кнопках
- [ ] Все функциональные возможности работают как прежде (сохранение, переключение камеры, drag точек)
- [ ] Outline-выделение (Stage 4) работает корректно
- [ ] Resize окна: панели корректно позиционируются

---

## Структура файлов после Stage 5

Новые и изменённые файлы отмечены.

```
src/
├── ui/
│   ├── UiMain.ts
│   ├── UiTopPanel.ts                    # B1, B2: стилизация + hover
│   ├── LeftPanel.ts                     # C1: стилизация
│   ├── UiCameraToggle.ts               # D1, D2: стилизация + hover
│   ├── UiStatsPanel.ts                 # E1: стилизация
│   │
│   └── styles/                          # NEW — система стилей
│       └── UiStyles.ts                  # A1: NEW — централизованные стили
│
├── threeApp/
│   └── ... (без изменений)
│
└── ... (остальное без изменений)
```

Итого: **1 новый файл** (`UiStyles.ts`), **4 изменённых файла** (UI-компоненты).

---

## Примечания по стилю ocsg-1\p1

Основные характеристики дизайна из ocsg-1\p1:

1. **Цвета:**
   - Фон: `#ffffff` (белый)
   - Панели: `#f1f1f1` (светло-серый)
   - Заголовки панелей: `#e8e8e8` (серый)
   - Текст: `#666666` (темно-серый)
   - Границы: `#b3b3b3` (серый)

2. **Градиенты:**
   - Кнопки: `linear-gradient(to bottom, #ffffff 0%, #e3e3e3 100%)`
   - Hover: `linear-gradient(to bottom, #e3e3e3 100%, #ffffff 0%)`

3. **Тени:**
   - Легкие: `0px 0px 2px #bababa, inset 0px 0px 1px #ffffff`
   - Средние: `0 4px 10px 0 rgba(0, 0, 0, 0.2)`
   - Сильные: `0 4px 10px 0 rgba(0, 0, 0, 0.5)`

4. **Скругления:**
   - Маленькие: `4px`
   - Средние: `8px`
   - Большие: `12px`

5. **Шрифты:**
   - Основной: `arial, sans-serif`
   - Размеры: `14px` (обычный текст), `18px` (кнопки), `20px` (заголовки)

Все эти значения должны быть использованы в `UiStyles` и применены к компонентам.
