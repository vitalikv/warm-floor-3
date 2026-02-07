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
      box-shadow: 0 4px 10px 0 ${COLORS.shadowStrong};
    `;
  }

  // Стиль для блоков с тенью (block_form_1)
  public getBlockStyle(): string {
    return `
      background-color: ${COLORS.background};
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

  // Тени
  public getShadow(type: 'light' | 'medium' | 'strong' = 'medium'): string {
    const shadows = {
      light: '0px 0px 2px #bababa, inset 0px 0px 1px #ffffff',
      medium: '0 4px 10px 0 rgba(0, 0, 0, 0.2)',
      strong: '0 4px 10px 0 rgba(0, 0, 0, 0.5)',
    };
    return `box-shadow: ${shadows[type]};`;
  }

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
}
