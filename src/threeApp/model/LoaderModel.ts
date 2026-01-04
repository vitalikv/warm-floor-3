import { ContextSingleton } from '../../core/ContextSingleton';

export class LoaderModel extends ContextSingleton<LoaderModel> {
  public async loadJSON() {
    const url = new URL('/assets/fileJson-2.json', import.meta.url);
    const response = await fetch(url);

    const jsonData = await response.json();
    console.log('Загруженный JSON:', jsonData);
  }
}
