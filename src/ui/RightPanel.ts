import { ContextSingleton } from '@/core/ContextSingleton';
import { UiStyles } from '@/ui/styles/UiStyles';
import { UiTopPanel } from '@/ui/UiTopPanel';
import { UiMain } from '@/ui/UiMain';
import { ApiUiToThree } from '@/api/apiLocal/ApiUiToThree';
import * as EventBus from '@/threeApp/interaction/core/EventBus';

/**
 * Правая панель — каталог объектов.
 * Stage 1: placeholder. Stage 2+: каталог мебели и объектов.
 */
export class RightPanel extends ContextSingleton<RightPanel> {
  private div!: HTMLDivElement;
  private toggleBtn!: HTMLButtonElement;

  public init(container: HTMLElement): void {
    this.div = this.createDiv();
    container.appendChild(this.div);
    this.initToggleButton(); // Инициализируем кнопку ДО блокировки событий
    this.initTabs();
    this.stopEvents();
    // Устанавливаем начальный offset для верхней панели (панель видна)
    UiTopPanel.inst().setRightOffset(350);
  }

  private createDiv(): HTMLDivElement {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.html();
    return wrapper.children[0] as HTMLDivElement;
  }

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
      transition: right 0.3s ease-in-out;
    `;

    const toggleBtnCss = `
      position: absolute;
      bottom: 20px;
      left: -25px;
      width: 25px;
      height: 50px;
      ${styles.getButtonBaseStyle()}
      ${styles.getButtonGradient()}
      padding: 0;
      font-size: 16px;
      line-height: 1;
      z-index: 3;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px 0 0 4px;
      cursor: pointer;
    `;

    const tabsCss = `
      display: flex;
      border-bottom: 1px solid #b3b3b3;
    `;

    const tabCss = styles.getTabStyle();

    const contentCss = `
      flex: 1;
      overflow: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
    `;

    const sectionTitleCss = styles.getSectionTitleStyle();

    const itemCss = styles.getItemSectionStyle();

    const labelCss = styles.getLabelStyle();

    const inputCss = styles.getInputStyle();

    return `
      <div style="${panelCss}">
        <button class="button_panel_toggle" style="${toggleBtnCss}">▶</button>

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
                <button class="button1 button_gradient_1" style="width: 30px; height: 30px; padding: 5px; margin-right: 10px; ${styles.getButtonBaseStyle()} ${styles.getButtonGradient()}">1</button>
                <div style="${labelCss}">высота</div>
                <input type="text" nameid="rp_level_1_h2" value="0" style="${inputCss}">
              </div>
            </div>
            
            <div class="rp_item_plane" style="${itemCss}">
              <div style="display: flex; align-items: center;">
                <button class="button1 button_gradient_1" style="width: 30px; height: 30px; padding: 5px; margin-right: 10px; ${styles.getButtonBaseStyle()} ${styles.getButtonGradient()}">2</button>
                <div style="${labelCss}">высота</div>
                <input type="text" nameid="rp_level_2_h2" value="0" style="${inputCss}">
              </div>
            </div>
            
            <div class="rp_item_plane" style="${itemCss}">
              <div style="display: flex; align-items: center;">
                <button class="button1 button_gradient_1" style="width: 30px; height: 30px; padding: 5px; margin-right: 10px; ${styles.getButtonBaseStyle()} ${styles.getButtonGradient()}">3</button>
                <div style="${labelCss}">высота</div>
                <input type="text" nameid="rp_level_3_h2" value="0" style="${inputCss}">
              </div>
            </div>
            
            <div class="rp_item_plane" style="${itemCss}">
              <div style="display: flex; align-items: center;">
                <button class="button1 button_gradient_1" style="width: 30px; height: 30px; padding: 5px; margin-right: 10px; ${styles.getButtonBaseStyle()} ${styles.getButtonGradient()}">4</button>
                <div style="${labelCss}">высота</div>
                <input type="text" nameid="rp_level_4_h2" value="0" style="${inputCss}">
              </div>
            </div>
          </div>
          
          <div nameid="contPlanR" style="${contentCss}; display: none;">
            <div class="right_panel_1_1_h" style="${sectionTitleCss}">Дом</div>
            
            <div class="rp_item_plane" style="${itemCss}">
              <div style="display: flex; align-items: center;">
                <button class="button2 button_gradient_1 wall-create-btn" nameid="wall_create_btn" style="padding: 5px; margin-right: 10px; font-size: 14px; font-weight: normal; ${styles.getButtonBaseStyle()} ${styles.getButtonGradient()}">стена</button>
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

    // Инициализируем кнопки инструментов
    this.initToolButtons();
  }

  private initToolButtons(): void {
    // Кнопка "Создать стену"
    this.wallCreateBtn = this.div.querySelector('[nameid="wall_create_btn"]') as HTMLButtonElement;
    if (this.wallCreateBtn) {
      this.wallCreateBtn.addEventListener('click', () => this.onWallCreateClick());
    }

    // Подписаться на события создания стены
    EventBus.on('wall:creation:cancelled', () => this.onWallCreationCancelled());
    EventBus.on('wall:creation:completed', () => {
      // Стена создана, но режим продолжается (continuous mode)
      // Кнопка остается подсвеченной
    });
  }

  private wallCreateBtn: HTMLButtonElement | null = null;

  private onWallCreateClick(): void {
    console.log('[RightPanel] Wall creation button clicked');

    // Активировать режим создания стены
    ApiUiToThree.inst().activateWallCreationMode();

    // Подсветить кнопку
    if (this.wallCreateBtn) {
      this.wallCreateBtn.style.background = 'rgba(68, 136, 255, 0.3)';
      this.wallCreateBtn.style.boxShadow = '0 0 10px rgba(68, 136, 255, 0.5)';
    }
  }

  /**
   * Обработчик отмены режима создания стены
   */
  private onWallCreationCancelled(): void {
    console.log('[RightPanel] Wall creation mode cancelled');

    // Убрать подсветку кнопки
    if (this.wallCreateBtn) {
      this.wallCreateBtn.style.background = '';
      this.wallCreateBtn.style.boxShadow = '';
    }
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

    // Обновляем стили активной вкладки
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

  private initToggleButton(): void {
    this.toggleBtn = this.div.querySelector('.button_panel_toggle') as HTMLButtonElement;
    if (this.toggleBtn) {
      // Используем capture:true чтобы обработчик срабатывал раньше stopPropagation
      this.toggleBtn.addEventListener(
        'click',
        (e) => {
          e.stopPropagation(); // Останавливаем всплытие
          this.toggle();
        },
        true,
      );
    }
  }

  /** Скрыть панель */
  public hide(): void {
    this.div.style.right = '-350px';
    UiTopPanel.inst().setRightOffset(0);
    UiMain.inst().setThreeContainerRightOffset(0);
    if (this.toggleBtn) {
      this.toggleBtn.textContent = '◀';
    }
  }

  /** Показать панель */
  public show(): void {
    this.div.style.right = '0';
    UiTopPanel.inst().setRightOffset(350);
    UiMain.inst().setThreeContainerRightOffset(350);
    if (this.toggleBtn) {
      this.toggleBtn.textContent = '▶';
    }
  }

  /** Переключить видимость панели */
  public toggle(): void {
    const currentRight = this.div.style.right;
    const isVisible = currentRight === '0' || currentRight === '' || currentRight === '0px';
    if (isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /** Блокировка событий мыши — они не должны проходить в Three.js */
  private stopEvents(): void {
    const events = ['mousedown', 'wheel', 'mousemove', 'touchstart', 'touchend', 'touchmove'];
    events.forEach((name) => {
      this.div.addEventListener(name, (e: Event) => {
        // Не блокируем события на кнопке toggle (проверяем сам элемент и родителей)
        const target = e.target as HTMLElement;
        if (target && target.closest('.button_panel_toggle')) {
          return;
        }
        e.stopPropagation();
      });
    });
  }
}
