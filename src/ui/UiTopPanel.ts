import { ContextSingleton } from '@/core/ContextSingleton';

export class UiTopPanel extends ContextSingleton<UiTopPanel> {
  private divMenu!: HTMLDivElement;

  public init(container: HTMLElement) {
    this.divMenu = this.crDiv();
    container.append(this.divMenu);

    this.eventStop({ div: this.divMenu });
  }

  private crDiv() {
    let div = document.createElement('div');
    div.innerHTML = this.html();
    div = div.children[0] as HTMLDivElement;

    return div;
  }

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

    const html = `<div style="${css1}"></div>`;

    return html;
  }

  private eventStop({ div }: { div: HTMLDivElement }) {
    const arrEvent = ['onmousedown', 'onwheel', 'onmousewheel', 'onmousemove', 'ontouchstart', 'ontouchend', 'ontouchmove'];

    arrEvent.forEach((events) => {
      (div as any)[events] = (e: Event) => {
        e.stopPropagation();
      };
    });
  }
}
