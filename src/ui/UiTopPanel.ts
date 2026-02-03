import { ContextSingleton } from '@/core/ContextSingleton';
import { HouseLoader } from '@/threeApp/house/HouseLoader';
import { WallsManager } from '@/threeApp/house/walls/WallsManager';

export class UiTopPanel extends ContextSingleton<UiTopPanel> {
  private divMenu!: HTMLDivElement;

  public init(container: HTMLElement) {
    this.divMenu = this.crDiv();
    container.append(this.divMenu);

    this.eventStop({ div: this.divMenu });

    const btn = this.divMenu.querySelector('button') as HTMLButtonElement;
    btn.addEventListener('click', () => this.saveProject());
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

  private saveProject(): void {
    const houseData = HouseLoader.inst().getHouseData();
    if (!houseData) {
      console.warn('Данные дома не загружены');
      return;
    }

    houseData.level[0].points = WallsManager.inst().getPoints();
    houseData.level[0].walls = WallsManager.inst().getWalls();

    this.downloadJson(houseData, 'house.json');
  }

  private downloadJson(data: unknown, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
