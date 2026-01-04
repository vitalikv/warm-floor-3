import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ContextSingleton } from '../../core/ContextSingleton';
import { CameraManager } from './CameraManager';
import { RendererManager } from './RendererManager';

/**
 * Кастомные контролы для ортогональной камеры
 * Поддерживает только перемещение (pan) и зум, без вращения
 */
class OrthographicControls {
  private camera: THREE.OrthographicCamera;
  private domElement: HTMLElement;
  private raycaster: THREE.Raycaster;
  private plane: THREE.Plane;
  private mouse: THREE.Vector2;
  private isMouseDown: boolean = false;
  private mouseDownPosition: THREE.Vector3 = new THREE.Vector3();
  private mouseDownScreen: THREE.Vector2 = new THREE.Vector2();
  public enabled: boolean = true;

  // Сохраняем ссылки на обработчики для правильного удаления
  private boundOnMouseDown: (event: MouseEvent) => void;
  private boundOnMouseMove: (event: MouseEvent) => void;
  private boundOnMouseUp: (event: MouseEvent) => void;
  private boundOnWheel: (event: WheelEvent) => void;
  private boundOnContextMenu: (event: Event) => void;

  constructor(camera: THREE.OrthographicCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Плоскость XZ на уровне y=0
    this.mouse = new THREE.Vector2();

    // Привязываем обработчики и сохраняем ссылки
    this.boundOnMouseDown = this.onMouseDown.bind(this);
    this.boundOnMouseMove = this.onMouseMove.bind(this);
    this.boundOnMouseUp = this.onMouseUp.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnContextMenu = (e) => e.preventDefault();

    this.domElement.addEventListener('mousedown', this.boundOnMouseDown);
    this.domElement.addEventListener('mousemove', this.boundOnMouseMove);
    this.domElement.addEventListener('mouseup', this.boundOnMouseUp);
    this.domElement.addEventListener('wheel', this.boundOnWheel);
    this.domElement.addEventListener('contextmenu', this.boundOnContextMenu);
  }

  private onMouseDown(event: MouseEvent): void {
    if (!this.enabled) return;

    if (event.button === 0 || event.button === 2) {
      // Левая или правая кнопка мыши
      this.isMouseDown = true;
      this.mouseDownScreen.set(event.clientX, event.clientY);

      // Получаем точку на плоскости при клике
      this.mouse.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1);

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersection = new THREE.Vector3();
      const hasIntersection = this.raycaster.ray.intersectPlane(this.plane, intersection);

      if (hasIntersection) {
        this.mouseDownPosition.copy(intersection);
      }
    }
  }

  private onMouseMove(event: MouseEvent): void {
    if (!this.enabled) return;
    if (!this.isMouseDown) return;

    // Вычисляем смещение в экранных координатах
    const deltaX = event.clientX - this.mouseDownScreen.x;
    const deltaY = event.clientY - this.mouseDownScreen.y;

    // Конвертируем экранное смещение в мировые координаты
    // Учитываем текущий зум камеры для правильного масштабирования
    const aspect = window.innerWidth / window.innerHeight;
    const size = 5; // Базовый размер ортогональной камеры
    const worldDeltaX = ((-deltaX / window.innerWidth) * (size * 2 * aspect)) / this.camera.zoom;
    const worldDeltaZ = ((-deltaY / window.innerHeight) * (size * 2)) / this.camera.zoom; // Инвертировано: верх/низ

    // Перемещаем камеру
    this.camera.position.x += worldDeltaX;
    this.camera.position.z += worldDeltaZ;
    // Y остается постоянным

    // Камера всегда смотрит вниз
    this.camera.lookAt(this.camera.position.x, 0, this.camera.position.z);

    // Обновляем экранную позицию для следующего кадра
    this.mouseDownScreen.set(event.clientX, event.clientY);
  }

  private onMouseUp(event: MouseEvent): void {
    if (!this.enabled) return;

    if (event.button === 0 || event.button === 2) {
      this.isMouseDown = false;
    }
  }

  private onWheel(event: WheelEvent): void {
    if (!this.enabled) return;

    event.preventDefault();

    // Более плавное изменение зума
    // Инвертировано: прокрутка вниз = уменьшение зума (отдаление), вверх = увеличение (приближение)
    const zoomSpeed = 0.1;
    const delta = event.deltaY > 0 ? 1 - zoomSpeed * (this.camera.zoom / 2) : 1 + zoomSpeed * (this.camera.zoom / 2);

    this.camera.zoom *= delta;

    // Ограничиваем зум
    this.camera.zoom = Math.max(0.1, Math.min(10, this.camera.zoom));

    this.camera.updateProjectionMatrix();
  }

  public update(): void {
    if (!this.enabled) return;

    // Убеждаемся, что камера всегда смотрит вниз
    this.camera.lookAt(this.camera.position.x, 0, this.camera.position.z);
  }

  public dispose(): void {
    this.domElement.removeEventListener('mousedown', this.boundOnMouseDown);
    this.domElement.removeEventListener('mousemove', this.boundOnMouseMove);
    this.domElement.removeEventListener('mouseup', this.boundOnMouseUp);
    this.domElement.removeEventListener('wheel', this.boundOnWheel);
    this.domElement.removeEventListener('contextmenu', this.boundOnContextMenu);
  }
}

/**
 * Менеджер контролов камеры
 */
export class ControlsManager extends ContextSingleton<ControlsManager> {
  public perspectiveControls!: OrbitControls;
  public orthographicControls!: OrthographicControls;
  public currentControls!: OrbitControls | OrthographicControls;

  public init(): void {
    const cameraManager = CameraManager.inst();
    const rendererManager = RendererManager.inst();

    this.perspectiveControls = this.createPerspectiveControls(cameraManager.perspectiveCamera, rendererManager.getDomElement());

    this.orthographicControls = this.createOrthographicControls(cameraManager.orthographicCamera, rendererManager.getDomElement());

    // По умолчанию активна ортогональная камера
    this.perspectiveControls.enabled = false;
    this.orthographicControls.enabled = true;
    this.currentControls = this.orthographicControls;
  }

  private createPerspectiveControls(camera: THREE.PerspectiveCamera, domElement: HTMLElement): OrbitControls {
    const controls = new OrbitControls(camera, domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    return controls;
  }

  private createOrthographicControls(camera: THREE.OrthographicCamera, domElement: HTMLElement): OrthographicControls {
    return new OrthographicControls(camera, domElement);
  }

  public switchControls(isPerspective: boolean): void {
    const cameraManager = CameraManager.inst();

    if (isPerspective) {
      // Отключаем ортогональные контролы
      this.orthographicControls.enabled = false;

      // Переключаемся на перспективную камеру
      // Камеры полностью независимы - не копируем позиции/повороты/зум
      cameraManager.currentCamera = cameraManager.perspectiveCamera;
      this.currentControls = this.perspectiveControls;

      // Включаем перспективные контролы
      this.perspectiveControls.enabled = true;
      // Обновляем контролы, чтобы синхронизировать с текущей позицией камеры
      // НЕ вызываем reset(), чтобы сохранить позицию камеры
      this.perspectiveControls.update();
    } else {
      // Отключаем перспективные контролы, чтобы они не влияли на камеру
      this.perspectiveControls.enabled = false;

      // Переключаемся на ортогональную камеру
      // Камеры полностью независимы - не копируем позиции/повороты/зум
      cameraManager.currentCamera = cameraManager.orthographicCamera;
      this.currentControls = this.orthographicControls;

      // Включаем ортогональные контролы
      this.orthographicControls.enabled = true;

      // Обновляем размеры ортогональной камеры
      cameraManager.updateOrthographicCameraSize();
    }

    this.currentControls.update();
  }

  public getCurrentControls(): OrbitControls | OrthographicControls {
    return this.currentControls;
  }

  public update(): void {
    this.currentControls.update();
  }
}
