# Stage 5 — Доработка UI: размеры, структура и элементы

> Продолжение Stage 5. Доработка UI компонентов с учетом структуры и размеров из ocsg-1\p1.
> Проверка после каждого раздела: `npm run build` должен быть зелёный.

---

## Что делает этот этап

Три основные задачи:

1. **Доработка верхней панели (UiTopPanel)** — добавление структуры с кнопкой меню, заголовком, кнопкой скриншота, переключателем 2D/3D. Размеры: высота 41px, структура flex.

2. **Доработка правой панели (RightPanel)** — создание структуры с вкладками (этажи, дом, объект, каталог), контентом для каждой вкладки, input полями, кнопками. Ширина 350px (как в ocsg-1\p1).

3. **Создание вспомогательных компонентов** — кнопки с градиентами, input поля, списки элементов, структура flex для layout.

---

## Уже готово — не трогаем

| Компонент | Статус |
|-----------|--------|
| `UiStyles` — система стилей | Готов, используется |
| `UiTopPanel` — базовая структура | Работает, требует доработки |
| `RightPanel` — базовая структура | Работает, требует доработки |
| `UiCameraToggle` — переключатель 2D/3D | Работает, нужно интегрировать в верхнюю панель |

---

## Вне скопа этого этапа

| Тема | Почему не сейчас |
|------|------------------|
| Функционал вкладок (переключение контента) | Stage 6. Сначала структура и визуал |
| Обработчики событий для кнопок | Stage 6. После создания структуры |
| Каталог объектов (загрузка изображений) | Stage 6. Сначала layout |
| Модальные окна | Stage 6+ |

---

## Раздел A: Доработка UiTopPanel

### A1. Структура верхней панели

Верхняя панель должна иметь структуру:
- Высота: 41px
- Flex layout с тремя секциями: слева (меню), центр (заголовок + скриншот), справа (2D/3D)
- Граница: `border: 1px solid #b3b3b3`
- Фон: `background-color: #f1f1f1`

### A2. Компоненты верхней панели

1. **Кнопка меню** (слева):
   - `margin-left: 15px`
   - Класс `button1 button_gradient_1`
   - `padding: 7px`
   - `font-weight: normal`
   - Текст: "меню"

2. **Центральная секция (toolbar)**:
   - Заголовок: "Конструктор дома"
   - Шрифт: `18px Arial, Helvetica, sans-serif`
   - Цвет: `#737373`
   - Кнопка скриншота (иконка)

3. **Правая секция (tp_right_1)**:
   - Flex контейнер
   - Кнопки 2D и 3D
   - Ширина кнопок: `39px`
   - `padding: 7px`
   - `font-weight: normal`

### A3. Обновление `src/ui/UiTopPanel.ts`

```typescript
// Структура HTML должна быть:
private html() {
  const styles = UiStyles.inst();
  
  const panelCss = `
    position: absolute;
    width: 100%;
    height: 41px;
    margin: 0;
    ${styles.getPanelStyle()}
    display: flex;
    align-items: center;
    z-index: 2;
  `;

  const menuBtnCss = `
    margin-left: 15px;
    ${styles.getButtonBaseStyle()}
    ${styles.getButtonGradient()}
    padding: 7px;
    font-weight: normal;
  `;

  const toolbarCss = `
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  `;

  const titleCss = `
    font: 18px Arial, Helvetica, sans-serif;
    color: #737373;
    margin: 0;
  `;

  const screenshotBtnCss = `
    ${styles.getButtonBaseStyle()}
    ${styles.getButtonGradient()}
    padding: 7px;
    font-weight: normal;
    width: auto;
    height: auto;
  `;

  const rightSectionCss = `
    display: flex;
    margin-right: 15px;
  `;

  const cameraBtnCss = `
    ${styles.getButtonBaseStyle()}
    ${styles.getButtonGradient()}
    width: 39px;
    padding: 7px;
    font-weight: normal;
  `;

  return `
    <div style="${panelCss}">
      <div class="button1-wrap-1" style="margin-left: 15px;">
        <button class="button1 button_gradient_1" style="${menuBtnCss}">меню</button>
      </div>
      
      <div class="toolbar" style="${toolbarCss}">
        <div style="color: #737373; align-items: center; padding: 0 10px;">
          <h1 style="${titleCss}">Конструктор дома</h1>
        </div>
        <div class="button1-wrap-1">
          <button class="button1 button_gradient_1" style="${screenshotBtnCss}">
            <img src="/img/screenshot.png" alt="Скриншот" style="width: 16px; height: 16px;">
          </button>
        </div>
      </div>
      
      <div class="tp_right_1" style="${rightSectionCss}">
        <div class="button1-wrap-1" nameid="butt_camera_2D" style="display: none;">
          <button class="button1 button_gradient_1" style="${cameraBtnCss}">2D</button>
        </div>
        <div class="button1-wrap-1" nameid="butt_camera_3D">
          <button class="button1 button_gradient_1" style="${cameraBtnCss}">3D</button>
        </div>
      </div>
    </div>
  `;
}
```

**Примечание:** Кнопки 2D/3D должны быть интегрированы в верхнюю панель вместо отдельного `UiCameraToggle`. `UiCameraToggle` можно оставить для программного переключения, но визуально кнопки должны быть в верхней панели.

---

## Раздел B: Доработка RightPanel

### B1. Структура правой панели

Правая панель должна иметь:
- Ширина: 350px (как в ocsg-1\p1: `right_panel_1_1`)
- Flex column layout
- Вкладки вверху (этажи, дом, объект, каталог)
- Контент для каждой вкладки
- Кнопка закрытия панели (крестик)

### B2. Вкладки (tabs)

Структура вкладок:
- Flex layout горизонтальный
- Каждая вкладка: `right_panel_1_item_block`
- Текст вкладки: `right_panel_1_item_block_text`
- Активная вкладка: другой фон (пока не реализуем переключение)

Вкладки:
1. "этажи" — `nameid="button_wrap_level"`
2. "дом" — `nameid="button_wrap_plan"`
3. "объект" — `nameid="button_wrap_object"`
4. "каталог" — `nameid="button_wrap_catalog"`

### B3. Контент вкладки "Этажи"

Структура:
- Заголовок: "Этажи" (`right_panel_1_1_h`)
- Список этажей с:
  - Кнопка номера этажа (`button1 button_gradient_1`)
  - Input поле "высота" (`rp_level_N_h2`)
  - Фон активного этажа: `background: rgb(213, 213, 213)`

### B4. Контент вкладки "Дом"

Структура:
- Заголовок: "Дом"
- Элементы:
  - Кнопка "стена" с input "толщина"
  - Выбор двери/проёма с input "ширина" и "высота"
  - Выбор окна с input "ширина", "высота", "над полом"
  - Кнопка "ворота" с input "ширина" и "высота"
  - Выбор крыши с input "ширина" и "длина"

Каждый элемент в `rp_item_plane` с flex layout.

### B5. Контент вкладки "Объект"

Структура:
- Заголовок: "Объект"
- Input "Название" (`rp_obj_name`)
- Контент зависит от типа объекта (стена, комната, окно/дверь, крыша, объект)

### B6. Контент вкладки "Каталог"

Структура:
- Заголовок: "Каталог"
- Grid layout для элементов каталога
- Каждый элемент: изображение + текст

### B7. Обновление `src/ui/RightPanel.ts`

```typescript
private html(): string {
  const styles = UiStyles.inst();
  
  const panelCss = `
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    width: 350px;
    ${styles.getPanelStyle()}
    border-left: 1px solid #b3b3b3;
    display: flex;
    flex-direction: column;
    z-index: 2;
  `;

  const closeBtnCss = `
    position: absolute;
    top: 10px;
    right: 10px;
    width: 30px;
    height: 30px;
    ${styles.getButtonBaseStyle()}
    ${styles.getButtonGradient()}
    padding: 5px;
    font-size: 20px;
    line-height: 1;
    z-index: 3;
  `;

  const tabsCss = `
    display: flex;
    border-bottom: 1px solid #b3b3b3;
  `;

  const tabCss = `
    flex: 1;
    ${styles.getButtonBaseStyle()}
    ${styles.getButtonGradient()}
    padding: 10px;
    text-align: center;
    font-weight: normal;
  `;

  const contentCss = `
    flex: 1;
    overflow: auto;
    padding: 10px;
  `;

  const sectionTitleCss = `
    ${styles.getTitleStyle()}
    margin: 15px 0 10px 0;
    font-size: 18px;
  `;

  const itemCss = `
    display: flex;
    flex-direction: column;
    margin-bottom: 15px;
    padding: 10px;
    background: #fff;
    ${styles.getShadow('light')}
  `;

  const inputRowCss = `
    display: flex;
    align-items: center;
    margin: 5px 0;
  `;

  const labelCss = `
    ${styles.getTextStyle()}
    min-width: 80px;
  `;

  const inputCss = `
    width: 100px;
    margin: 5px;
    padding: 5px;
    border: 1px solid #b3b3b3;
    ${styles.getTextStyle()}
  `;

  return `
    <div style="${panelCss}">
      <button class="button_catalog_close" style="${closeBtnCss}">×</button>
      
      <div class="flex_column_1" nameid="panelPlan">
        <div nameid="wrapTabsR" style="${tabsCss}">
          <div class="right_panel_1_item_block" nameid="button_wrap_level" style="${tabCss}">
            <div class="right_panel_1_item_block_text">этажи</div>
          </div>
          <div class="right_panel_1_item_block" nameid="button_wrap_plan" style="${tabCss}">
            <div class="right_panel_1_item_block_text">дом</div>
          </div>
          <div class="right_panel_1_item_block" nameid="button_wrap_object" style="${tabCss}">
            <div class="right_panel_1_item_block_text">объект</div>
          </div>
          <div class="right_panel_1_item_block" nameid="button_wrap_catalog" style="${tabCss}">
            <div class="right_panel_1_item_block_text">каталог</div>
          </div>
        </div>
        
        <div nameid="contLevelR" style="${contentCss}">
          <div class="right_panel_1_1_h" style="${sectionTitleCss}">Этажи</div>
          
          <div class="rp_item_plane" style="${itemCss}; background: rgb(213, 213, 213);">
            <div style="display: flex; align-items: center;">
              <button class="button1 button_gradient_1" style="width: 30px; height: 30px; padding: 5px; margin-right: 10px;">1</button>
              <div style="${labelCss}">высота</div>
              <input type="text" nameid="rp_level_1_h2" value="0" style="${inputCss}">
            </div>
          </div>
          
          <div class="rp_item_plane" style="${itemCss}">
            <div style="display: flex; align-items: center;">
              <button class="button1 button_gradient_1" style="width: 30px; height: 30px; padding: 5px; margin-right: 10px;">2</button>
              <div style="${labelCss}">высота</div>
              <input type="text" nameid="rp_level_2_h2" value="0" style="${inputCss}">
            </div>
          </div>
        </div>
        
        <div nameid="contPlanR" style="${contentCss}; display: none;">
          <div class="right_panel_1_1_h" style="${sectionTitleCss}">Дом</div>
          
          <div class="rp_item_plane" style="${itemCss}">
            <div style="display: flex; align-items: center;">
              <button class="button2 button_gradient_1" style="padding: 5px; margin-right: 10px; font-size: 14px; font-weight: normal;">стена</button>
              <div style="${labelCss}">толщина</div>
              <input type="text" nameid="rp_wall_width_1" value="0" style="${inputCss}">
            </div>
          </div>
        </div>
        
        <div nameid="contObjR" style="${contentCss}; display: none;">
          <div class="right_panel_1_1_h" style="${sectionTitleCss}">Объект</div>
          <div style="margin-top: 20px;">Содержимое появится позже</div>
        </div>
        
        <div nameid="wrap_catalog" style="${contentCss}; display: none;">
          <div class="right_panel_1_1_h" style="${sectionTitleCss}">Каталог</div>
          <div style="display: grid; grid-template-columns: auto auto; gap: 10px; margin-top: 10px;">
            <!-- Элементы каталога появятся позже -->
          </div>
        </div>
      </div>
    </div>
  `;
}
```

---

## Раздел C: Дополнительные стили в UiStyles

### C1. Добавление методов для специфичных элементов

```typescript
// В UiStyles.ts добавить:

// Стиль для input полей
public getInputStyle(): string {
  return `
    width: 100px;
    margin: 5px;
    padding: 5px;
    border: 1px solid ${COLORS.border};
    font-family: arial, sans-serif;
    font-size: 14px;
    color: ${COLORS.text};
    background: ${COLORS.background};
  `;
}

// Стиль для label (rp_label_plane)
public getLabelStyle(): string {
  return `
    ${this.getTextStyle()}
    min-width: 80px;
  `;
}

// Стиль для секции элемента (rp_item_plane)
public getItemSectionStyle(): string {
  return `
    display: flex;
    flex-direction: column;
    margin-bottom: 15px;
    padding: 10px;
    background: ${COLORS.background};
    ${this.getShadow('light')}
  `;
}

// Стиль для заголовка секции (right_panel_1_1_h)
public getSectionTitleStyle(): string {
  return `
    ${this.getTitleStyle()}
    margin: 15px 0 10px 0;
    font-size: 18px;
  `;
}

// Стиль для вкладки
public getTabStyle(): string {
  return `
    flex: 1;
    ${this.getButtonBaseStyle()}
    ${this.getButtonGradient()}
    padding: 10px;
    text-align: center;
    font-weight: normal;
  `;
}
```

---

## Раздел D: Интеграция UiCameraToggle в UiTopPanel

### D1. Обновление логики переключения камеры

Кнопки 2D/3D должны быть частью верхней панели, но логика переключения остается в `UiCameraToggle`. Нужно:

1. Убрать отдельную кнопку `UiCameraToggle` из UI
2. Добавить обработчики на кнопки 2D/3D в верхней панели
3. Вызывать `UiCameraToggle.inst().setCameraType()` при клике

```typescript
// В UiTopPanel.ts добавить:
private initCameraButtons() {
  const btn2D = this.divMenu.querySelector('[nameid="butt_camera_2D"] button') as HTMLButtonElement;
  const btn3D = this.divMenu.querySelector('[nameid="butt_camera_3D"] button') as HTMLButtonElement;
  
  if (btn2D) {
    btn2D.addEventListener('click', () => {
      UiCameraToggle.inst().setCameraType({ type: '2D' });
      this.updateCameraButtons('2D');
    });
  }
  
  if (btn3D) {
    btn3D.addEventListener('click', () => {
      UiCameraToggle.inst().setCameraType({ type: '3D' });
      this.updateCameraButtons('3D');
    });
  }
}

private updateCameraButtons(activeType: '2D' | '3D') {
  const div2D = this.divMenu.querySelector('[nameid="butt_camera_2D"]') as HTMLElement;
  const div3D = this.divMenu.querySelector('[nameid="butt_camera_3D"]') as HTMLElement;
  
  if (activeType === '2D') {
    if (div2D) div2D.style.display = '';
    if (div3D) div3D.style.display = 'none';
  } else {
    if (div2D) div2D.style.display = 'none';
    if (div3D) div3D.style.display = '';
  }
}
```

---

## Проверочный чек-лист

После реализации всех разделов:

- [ ] `npm run build` — без ошибок
- [ ] Верхняя панель имеет высоту 41px
- [ ] Верхняя панель содержит: кнопку меню, заголовок, кнопку скриншота, кнопки 2D/3D
- [ ] Правая панель имеет ширину 350px
- [ ] Правая панель содержит вкладки: этажи, дом, объект, каталог
- [ ] Вкладка "Этажи" показывает список этажей с input полями
- [ ] Вкладка "Дом" показывает элементы для работы с домом
- [ ] Все кнопки имеют градиентный стиль
- [ ] Все input поля имеют правильные стили
- [ ] Кнопки 2D/3D в верхней панели работают (переключают камеру)
- [ ] Кнопка закрытия правой панели видна
- [ ] Flex layout работает корректно
- [ ] Все элементы позиционируются правильно

---

## Структура файлов после доработки

```
src/
├── ui/
│   ├── UiMain.ts
│   ├── UiTopPanel.ts                    # A3: доработанная структура
│   ├── RightPanel.ts                    # B7: доработанная структура
│   ├── UiCameraToggle.ts               # D1: интеграция в верхнюю панель
│   ├── UiStatsPanel.ts
│   │
│   └── styles/
│       └── UiStyles.ts                  # C1: дополнительные методы
```

---

## Примечания

1. **Размеры из ocsg-1\p1:**
   - Верхняя панель: высота 41px
   - Правая панель: ширина 350px
   - Кнопки камеры: ширина 39px
   - Input поля: ширина 100px

2. **Структура flex:**
   - Верхняя панель: `display: flex` с тремя секциями
   - Правая панель: `flex-direction: column`
   - Элементы внутри: `display: flex` для горизонтального layout

3. **Классы из ocsg-1\p1:**
   - `button1 button_gradient_1` — кнопки с градиентом
   - `right_panel_1_item_block` — вкладки
   - `rp_item_plane` — секции элементов
   - `right_panel_1_1_h` — заголовки секций

4. **nameid атрибуты:**
   - Используются для идентификации элементов (аналог id, но через nameid)
   - Нужны для будущих обработчиков событий
