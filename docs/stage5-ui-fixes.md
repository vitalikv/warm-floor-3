# Stage 5 — Исправления UI по референсу

> Анализ текущего UI и сравнение с референсным проектом ocsg-1\p1.
> Проверка после каждого раздела: `npm run build` должен быть зелёный.

---

## Анализ референсного UI

Из DOM-структуры референса видно следующее содержимое:
```
видеоинструкция меню Конструктор дома 3D + этажи дом объект каталог 
Этажи 1 высота 2 высота 3 высота 4 высота Показать крышу
```

### Элементы референса:

1. **Кнопка "меню"** — есть ✓
2. **Заголовок "Конструктор дома"** — есть ✓
3. **Кнопка "3D"** — есть, но возможно не видна (проблема с селекторами)
4. **Кнопка "+" (закрытие панели)** — есть ✓
5. **Вкладки: этажи, дом, объект, каталог** — есть ✓
6. **Контент "Этажи"** — есть частично (только этажи 1 и 2, нужно 4)
7. **Переключение вкладок** — отсутствует (все панели скрыты, кроме "Этажи")

---

## Проблемы текущего UI

### Проблема 1: Кнопка "3D" не видна

**Причина:** Селектор `querySelector('[nameid="butt_camera_3D"]')` может не работать, так как `nameid` — нестандартный атрибут. Нужно использовать `data-nameid` или проверять через `getAttribute`.

**Решение:** Исправить селекторы и убедиться, что элементы создаются правильно.

### Проблема 2: Неполный контент вкладки "Этажи"

**Причина:** Только 2 этажа вместо 4.

**Решение:** Добавить этажи 3 и 4.

### Проблема 3: Отсутствует переключение вкладок в правой панели

**Причина:** Все контентные панели (contPlanR, contObjR, wrap_catalog) скрыты через `display: none`, нет обработчиков для переключения.

**Решение:** Добавить обработчики кликов на вкладки, которые показывают/скрывают соответствующий контент.

### Проблема 4: Стили кнопок могут отличаться от референса

**Причина:** Возможно, не все стили из референса применены.

**Решение:** Проверить и уточнить стили кнопок.

---

## Раздел A: Исправление видимости кнопок камеры

### A1. Исправление селекторов в `UiTopPanel.ts`

Проблема: `nameid` — нестандартный атрибут, селектор может не работать.

**Решение 1:** Использовать `data-nameid` вместо `nameid`:

```typescript
// В html() заменить nameid на data-nameid:
<div class="button1-wrap-1" data-nameid="butt_camera_2D" style="display: none;">
  <button class="button1 button_gradient_1" style="${cameraBtnCss}">2D</button>
</div>
<div class="button1-wrap-1" data-nameid="butt_camera_3D">
  <button class="button1 button_gradient_1" style="${cameraBtnCss}">3D</button>
</div>

// В initCameraButtons() использовать правильный селектор:
private initCameraButtons() {
  const div2D = this.divMenu.querySelector('[data-nameid="butt_camera_2D"]') as HTMLElement;
  const div3D = this.divMenu.querySelector('[data-nameid="butt_camera_3D"]') as HTMLElement;
  const btn2D = div2D?.querySelector('button') as HTMLButtonElement;
  const btn3D = div3D?.querySelector('button') as HTMLButtonElement;
  
  // ... остальной код
}
```

**Решение 2 (альтернатива):** Использовать классы или id для идентификации.

### A2. Проверка z-index и позиционирования

Убедиться, что кнопки не перекрываются другими элементами:

```typescript
const cameraBtnCss = `
  ${styles.getButtonBaseStyle()}
  ${styles.getButtonGradient()}
  width: 39px;
  padding: 7px;
  font-weight: normal;
  min-width: 39px;
  text-align: center;
  position: relative;
  z-index: 10;
`;
```

---

## Раздел B: Доработка вкладки "Этажи"

### B1. Добавление этажей 3 и 4 в `RightPanel.ts`

В `html()` метода, в секции `contLevelR`, добавить этажи 3 и 4:

```typescript
<div nameid="contLevelR" style="${contentCss}">
  <div class="right_panel_1_1_h" style="${sectionTitleCss}">Этажи</div>
  
  <!-- Этаж 1 -->
  <div class="rp_item_plane" style="${itemCss}; background: rgb(213, 213, 213);">
    <div style="display: flex; align-items: center;">
      <button class="button1 button_gradient_1" style="width: 30px; height: 30px; padding: 5px; margin-right: 10px; ${styles.getButtonBaseStyle()} ${styles.getButtonGradient()}">1</button>
      <div style="${labelCss}">высота</div>
      <input type="text" nameid="rp_level_1_h2" value="0" style="${inputCss}">
    </div>
  </div>
  
  <!-- Этаж 2 -->
  <div class="rp_item_plane" style="${itemCss}">
    <div style="display: flex; align-items: center;">
      <button class="button1 button_gradient_1" style="width: 30px; height: 30px; padding: 5px; margin-right: 10px; ${styles.getButtonBaseStyle()} ${styles.getButtonGradient()}">2</button>
      <div style="${labelCss}">высота</div>
      <input type="text" nameid="rp_level_2_h2" value="0" style="${inputCss}">
    </div>
  </div>
  
  <!-- Этаж 3 -->
  <div class="rp_item_plane" style="${itemCss}">
    <div style="display: flex; align-items: center;">
      <button class="button1 button_gradient_1" style="width: 30px; height: 30px; padding: 5px; margin-right: 10px; ${styles.getButtonBaseStyle()} ${styles.getButtonGradient()}">3</button>
      <div style="${labelCss}">высота</div>
      <input type="text" nameid="rp_level_3_h2" value="0" style="${inputCss}">
    </div>
  </div>
  
  <!-- Этаж 4 -->
  <div class="rp_item_plane" style="${itemCss}">
    <div style="display: flex; align-items: center;">
      <button class="button1 button_gradient_1" style="width: 30px; height: 30px; padding: 5px; margin-right: 10px; ${styles.getButtonBaseStyle()} ${styles.getButtonGradient()}">4</button>
      <div style="${labelCss}">высота</div>
      <input type="text" nameid="rp_level_4_h2" value="0" style="${inputCss}">
    </div>
  </div>
</div>
```

---

## Раздел C: Переключение вкладок в правой панели

### C1. Добавление обработчиков кликов на вкладки

В `RightPanel.ts` добавить метод для инициализации переключения вкладок:

```typescript
public init(container: HTMLElement): void {
  this.div = this.createDiv();
  container.appendChild(this.div);
  this.stopEvents();
  this.initTabs(); // NEW
}

private initTabs(): void {
  // Вкладка "Этажи"
  const tabLevel = this.div.querySelector('[nameid="button_wrap_level"]') as HTMLElement;
  if (tabLevel) {
    tabLevel.addEventListener('click', () => this.showTab('level'));
  }

  // Вкладка "Дом"
  const tabPlan = this.div.querySelector('[nameid="button_wrap_plan"]') as HTMLElement;
  if (tabPlan) {
    tabPlan.addEventListener('click', () => this.showTab('plan'));
  }

  // Вкладка "Объект"
  const tabObject = this.div.querySelector('[nameid="button_wrap_object"]') as HTMLElement;
  if (tabObject) {
    tabObject.addEventListener('click', () => this.showTab('object'));
  }

  // Вкладка "Каталог"
  const tabCatalog = this.div.querySelector('[nameid="button_wrap_catalog"]') as HTMLElement;
  if (tabCatalog) {
    tabCatalog.addEventListener('click', () => this.showTab('catalog'));
  }

  // По умолчанию показываем вкладку "Этажи"
  this.showTab('level');
}

private showTab(tabName: 'level' | 'plan' | 'object' | 'catalog'): void {
  // Скрываем все контентные панели
  const contLevel = this.div.querySelector('[nameid="contLevelR"]') as HTMLElement;
  const contPlan = this.div.querySelector('[nameid="contPlanR"]') as HTMLElement;
  const contObj = this.div.querySelector('[nameid="contObjR"]') as HTMLElement;
  const wrapCatalog = this.div.querySelector('[nameid="wrap_catalog"]') as HTMLElement;

  if (contLevel) contLevel.style.display = 'none';
  if (contPlan) contPlan.style.display = 'none';
  if (contObj) contObj.style.display = 'none';
  if (wrapCatalog) wrapCatalog.style.display = 'none';

  // Показываем нужную панель
  switch (tabName) {
    case 'level':
      if (contLevel) contLevel.style.display = 'flex';
      break;
    case 'plan':
      if (contPlan) contPlan.style.display = 'flex';
      break;
    case 'object':
      if (contObj) contObj.style.display = 'flex';
      break;
    case 'catalog':
      if (wrapCatalog) wrapCatalog.style.display = 'flex';
      break;
  }

  // Обновляем стили активной вкладки (опционально)
  this.updateActiveTab(tabName);
}

private updateActiveTab(activeTab: 'level' | 'plan' | 'object' | 'catalog'): void {
  const tabs = [
    { nameid: 'button_wrap_level', tab: 'level' },
    { nameid: 'button_wrap_plan', tab: 'plan' },
    { nameid: 'button_wrap_object', tab: 'object' },
    { nameid: 'button_wrap_catalog', tab: 'catalog' },
  ];

  tabs.forEach(({ nameid, tab }) => {
    const tabEl = this.div.querySelector(`[nameid="${nameid}"]`) as HTMLElement;
    if (tabEl) {
      if (tab === activeTab) {
        tabEl.style.background = 'rgb(213, 213, 213)';
      } else {
        tabEl.style.background = '';
      }
    }
  });
}
```

### C2. Исправление стилей контентных панелей

В `html()` метода изменить `display: none` на правильные значения:

```typescript
// БЫЛО:
<div nameid="contPlanR" style="${contentCss}; display: none;">

// СТАНЕТ:
<div nameid="contPlanR" style="${contentCss}; display: none;">
// (display будет управляться через showTab())
```

---

## Раздел D: Уточнение стилей кнопок

### D1. Проверка и уточнение стилей кнопок

Убедиться, что все кнопки имеют правильные стили из референса:

**Обязательные свойства для всех кнопок:**
- Градиент: `linear-gradient(to bottom, #ffffff 0%, #e3e3e3 100%)`
- Тень: `0px 0px 2px #bababa, inset 0px 0px 1px #ffffff`
- Без скруглений (border-radius: 0 или отсутствует)
- Border: `1px solid #b3b3b3`
- Font-family: `arial, sans-serif`
- Font-weight: `normal` (не bold)
- Color: `#666666`

**Размеры для разных типов кнопок:**
- Маленькие кнопки (меню, скриншот, 2D/3D): `padding: 7px`, `font-size: 14px`
- Кнопки вкладок: `padding: 10px`, `font-size: 14px`
- Кнопки этажей: `width: 30px`, `height: 30px`, `padding: 5px`

**Hover-эффект:**
- Градиент меняется на: `linear-gradient(to bottom, #e3e3e3 100%, #ffffff 0%)`

### D2. Исправление стилей в `UiStyles.ts`

Убедиться, что `getButtonBaseStyle()` не содержит `border-radius` (уже удален) и имеет правильные значения:

```typescript
public getButtonBaseStyle(): string {
  return `
    font-family: arial, sans-serif;
    font-size: 14px;
    color: ${COLORS.text};
    border: 1px solid ${COLORS.border};
    cursor: pointer;
    padding: 8px 16px;
    transition: background 0.2s, box-shadow 0.2s;
  `;
}
```

### D3. Добавление метода для маленьких кнопок в `UiStyles.ts`

```typescript
// Стиль для маленьких кнопок (как в верхней панели)
public getButtonSmallStyle(): string {
  return `
    ${this.getButtonBaseStyle()}
    ${this.getButtonGradient()}
    padding: 7px;
    font-weight: normal;
    font-size: 14px;
    min-height: auto;
    line-height: 1.2;
  `;
}
```

### D4. Уточнение стилей контентных панелей

В `RightPanel.ts` убедиться, что контентные панели имеют правильный `display` при показе:

```typescript
const contentCss = `
  flex: 1;
  overflow: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
`;
```

При переключении вкладок использовать `display: flex` вместо `display: block` для правильного layout.

### D5. Стили элементов в правой панели

**Стили для элементов этажей (rp_item_plane):**
- Background активного: `rgb(213, 213, 213)`
- Background неактивного: `#ffffff` (или прозрачный)
- Padding: `10px`
- Margin-bottom: `15px`
- Тень: `0px 0px 2px #bababa, inset 0px 0px 1px #ffffff`

**Стили для input полей:**
- Width: `100px` (или `90%` в некоторых случаях)
- Margin: `5px`
- Padding: `5px`
- Border: `1px solid #b3b3b3`
- Font-size: `14px`

**Стили для labels (rp_label_plane):**
- Min-width: `80px`
- Font-size: `14px`
- Color: `#666666`

---

## Раздел E: Исправление структуры верхней панели

### E1. Проверка позиционирования элементов

Убедиться, что все элементы верхней панели правильно позиционированы:

- Кнопка "меню" — слева, `margin-left: 15px`
- Toolbar — центр, `flex: 1`
- Кнопки 2D/3D — справа, `margin-right: 15px`

### E2. Исправление отображения кнопки скриншота

В референсе кнопка скриншота может иметь иконку вместо эмодзи. Если есть изображение, использовать его:

```typescript
<button class="button1 button_gradient_1" style="${screenshotBtnCss}" title="Скриншот">
  <img src="/img/screenshot.png" alt="Скриншот" style="width: 16px; height: 16px;">
</button>
```

---

## Проверочный чек-лист

После реализации всех разделов:

- [ ] `npm run build` — без ошибок
- [ ] Кнопка "3D" видна и работает
- [ ] Вкладка "Этажи" содержит 4 этажа (1, 2, 3, 4)
- [ ] Переключение вкладок работает (клик на вкладку показывает соответствующий контент)
- [ ] Активная вкладка визуально выделена (фон rgb(213, 213, 213))
- [ ] Все кнопки имеют правильные стили (градиент, тень, без скруглений)
- [ ] Кнопки 2D/3D переключают камеру корректно
- [ ] Все элементы позиционируются правильно
- [ ] Hover-эффекты работают на всех кнопках
- [ ] Стили соответствуют референсу ocsg-1\p1

---

## Структура файлов после исправлений

```
src/
├── ui/
│   ├── UiMain.ts
│   ├── UiTopPanel.ts                # A1, A2: исправлены селекторы, z-index
│   ├── RightPanel.ts                # B1: добавлены этажи 3-4; C1, C2: переключение вкладок
│   ├── UiCameraToggle.ts
│   ├── UiStatsPanel.ts
│   │
│   └── styles/
│       └── UiStyles.ts              # D2, D3: уточнение стилей, getButtonSmallStyle()
```

---

## Приоритет исправлений

1. **Высокий приоритет:**
   - Исправление видимости кнопки "3D" (A1, A2)
   - Добавление этажей 3 и 4 (B1)
   - Переключение вкладок в правой панели (C1, C2)

2. **Средний приоритет:**
   - Уточнение стилей кнопок (D1, D2, D3)
   - Исправление структуры верхней панели (E1, E2)

---

## Примечания

1. **Атрибут `nameid`:** В референсе используется `nameid`, но это нестандартный атрибут. Можно использовать `data-nameid` для совместимости с селекторами, или оставить `nameid` и использовать `querySelector('[nameid="..."]')` (работает в современных браузерах).

2. **Переключение вкладок:** При клике на вкладку нужно:
   - Скрыть все контентные панели
   - Показать соответствующую панель
   - Визуально выделить активную вкладку (изменить фон)

3. **Стили кнопок:** Все кнопки должны иметь:
   - Градиентный фон
   - Тень (inset + внешняя)
   - Без скруглений
   - Правильный padding и font-weight

4. **Z-index:** Убедиться, что все UI-элементы имеют правильный z-index и не перекрываются.

5. **Flex layout:** Контентные панели должны использовать `display: flex` или `display: block` при показе, а не `display: none` при скрытии.
