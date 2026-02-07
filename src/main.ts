import { UiMain } from '@/ui/UiMain';
import { ThreeMain } from '@/threeApp/ThreeMain';

const container = document.body.querySelector('#container') as HTMLDivElement;

// Сначала инициализируем UI и получаем контейнер для 3D сцены
const threeContainer = UiMain.inst().init({ container });

// Затем инициализируем Three.js в выделенном контейнере
ThreeMain.inst().init({ container: threeContainer });

// После инициализации Three.js устанавливаем начальное состояние камеры
UiMain.inst().initializeCamera('3D');
