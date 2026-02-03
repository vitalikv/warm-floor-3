import { UiMain } from '@/ui/UiMain';
import { ThreeMain } from '@/threeApp/ThreeMain';

const container = document.body.querySelector('#container') as HTMLDivElement;
const canvas = document.getElementById('canvas') as HTMLCanvasElement;

ThreeMain.inst().init({ canvas });
UiMain.inst().init({ container });
