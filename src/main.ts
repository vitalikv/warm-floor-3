import { UiMain } from '@/ui/UiMain';
import { ThreeMain } from '@/threeApp/ThreeMain';

const container = document.body.querySelector('#container') as HTMLDivElement;
const canvas = document.getElementById('canvas') as HTMLCanvasElement;

container.style.position = 'absolute';
container.style.left = '100px';
container.style.top = '100px';
container.style.bottom = '100px';
container.style.right = '100px';
container.style.width = 'auto';
container.style.height = 'auto';

ThreeMain.inst().init({ canvas });
UiMain.inst().init({ container });
