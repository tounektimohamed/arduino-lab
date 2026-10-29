import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { BoardEvent, BoardState } from '../sim/BoardState';
import type { LessonId } from '../data/lessons';
import {
  BOARD,
  BREADBOARD,
  COMPONENT_LAYOUT,
  HOLES,
  PINS,
  POWER_GND,
  RAIL_Z,
  holeX,
  holeZ,
  pinWorld,
  railHoleX,
} from './layout';
import {
  boardTexture,
  breadboardTexture,
  deskTexture,
  labelSprite,
  wireMesh,
} from './builders';

const COLORS = {
  pcb: 0x0b6f7d,
  gold: 0xd8a63a,
  green: 0x2f9e6f,
  black: 0x24211d,
  red: 0xd0453a,
  blue: 0x3f7bd9,
  orange: 0xe08a2e,
  accent: 0xe2543f,
};

function std(
  color: number,
  params: THREE.MeshStandardMaterialParameters = {},
): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.08, ...params });
}

function vec(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x, y, z);
}

function archPoints(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }, lift: number): THREE.Vector3[] {
  const start = new THREE.Vector3(a.x, a.y, a.z);
  const end = new THREE.Vector3(b.x, b.y, b.z);
  const mid = start.clone().lerp(end, 0.5);
  mid.y = Math.max(start.y, end.y) + lift;
  const startUp = start.clone();
  startUp.y += Math.min(0.45, lift * 0.5);
  const endUp = end.clone();
  endUp.y += Math.min(0.45, lift * 0.5);
  return [start, startUp, mid, endUp, end];
}

function lanePoints(
  start: { x: number; y: number; z: number },
  end: { x: number; y: number; z: number },
  laneZ: number,
  laneY: number,
): THREE.Vector3[] {
  const startVector = new THREE.Vector3(start.x, start.y, start.z);
  const endVector = new THREE.Vector3(end.x, end.y, end.z);
  const startUp = startVector.clone();
  startUp.y += 0.45;
  const endUp = endVector.clone();
  endUp.y += 0.4;
  return [
    startVector,
    startUp,
    vec(start.x, laneY, laneZ),
    vec(end.x, laneY, laneZ),
    endUp,
    endVector,
  ];
}

interface InteractiveItem {
  root: THREE.Object3D;
  kind: 'button' | 'pot' | 'lamp';
}

export class ArduinoScene {
  private readonly container: HTMLElement;
  private readonly board: BoardState;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera: THREE.PerspectiveCamera;
  private readonly controls: OrbitControls;
  private readonly clock = new THREE.Clock();
  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private readonly interactive: InteractiveItem[] = [];
  private readonly rings = new Map<string, THREE.Mesh>();
  private readonly labels = new Map<string, THREE.Sprite>();
  private readonly buttonGroup = new THREE.Group();
  private readonly buttonWires = new THREE.Group();
  private readonly potGroup = new THREE.Group();
  private readonly potWires = new THREE.Group();
  private readonly buzzerGroup = new THREE.Group();
  private readonly buzzerWires = new THREE.Group();
  private readonly ldrGroup = new THREE.Group();
  private readonly ldrWires = new THREE.Group();
  private readonly servoGroup = new THREE.Group();
  private readonly servoWires = new THREE.Group();
  private readonly ledGroup = new THREE.Group();
  private readonly resistorGroup = new THREE.Group();
  private readonly ledWires = new THREE.Group();
  private readonly trafficGroup = new THREE.Group();
  private readonly trafficWires = new THREE.Group();
  private readonly temperatureGroup = new THREE.Group();
  private readonly temperatureWires = new THREE.Group();
  private readonly ultrasonicGroup = new THREE.Group();
  private readonly ultrasonicWires = new THREE.Group();
  private readonly rgbGroup = new THREE.Group();
  private readonly rgbWires = new THREE.Group();
  private readonly lcdGroup = new THREE.Group();
  private readonly lcdWires = new THREE.Group();
  private readonly stepperGroup = new THREE.Group();
  private readonly stepperWires = new THREE.Group();
  private readonly lamp = new THREE.Group();
  private readonly soundRings: THREE.Mesh[] = [];
  private readonly dayColor = new THREE.Color('#f2e8d7');
  private readonly nightColor = new THREE.Color('#2f2c3d');
  private lampMaterial!: THREE.MeshBasicMaterial;
  private sunLight!: THREE.PointLight;
  private servoHorn!: THREE.Group;
  private servoTarget = 90;
  private servoCurrent = 90;
  private readonly trafficMaterials = new Map<number, THREE.MeshStandardMaterial>();
  private readonly rgbMaterials = new Map<number, THREE.MeshStandardMaterial>();
  private rgbLight!: THREE.PointLight;
  private lcdCanvas!: HTMLCanvasElement;
  private lcdCtx!: CanvasRenderingContext2D;
  private lcdTexture!: THREE.CanvasTexture;
  private stepperHorn!: THREE.Group;
  private stepperTarget = 0;
  private stepperCurrent = 0;
  private toneFreq = 0;
  private lightLevel = 0.63;
  private exposure = 1.05;
  private activeLesson: LessonId = 'blink';
  private lampStartY = 0;
  private lampStartValue = 0;
  private readonly unsubscribers: (() => void)[] = [];
  private readonly resizeObserver: ResizeObserver;

  private ledMaterial!: THREE.MeshStandardMaterial;
  private ledLight!: THREE.PointLight;
  private ledTarget = 0;
  private ledValue = 0;
  private onboardMaterial!: THREE.MeshStandardMaterial;
  private onboardTarget = 0;
  private onboardValue = 0;
  private txMaterial!: THREE.MeshStandardMaterial;
  private txTimeout: number | null = null;
  private buttonCap!: THREE.Mesh;
  private buttonCapY = 0.2;
  private potKnob!: THREE.Group;
  private activePointer: 'button' | 'pot' | 'lamp' | null = null;
  private potStartX = 0;
  private potStartValue = 0;
  private disposed = false;

  constructor(container: HTMLElement, board: BoardState) {
    this.container = container;
    this.board = board;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = 'scene-canvas';
    container.appendChild(this.renderer.domElement);

    this.scene.background = new THREE.Color('#f2e8d7');
    this.scene.fog = new THREE.Fog('#f2e8d7', 30, 56);

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);
    this.camera.position.set(11.5, 10.5, 13.5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0.3, 0.35, 0.25);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.075;
    this.controls.minDistance = 7;
    this.controls.maxDistance = 30;
    this.controls.minPolarAngle = 0.25;
    this.controls.maxPolarAngle = 1.42;
    this.controls.screenSpacePanning = true;
    this.controls.update();

    this.buildEnvironment();
    this.buildLights();
    this.buildDesk();
    this.buildBoard();
    this.buildBreadboard();
    this.buildComponents();
    this.buildWires();
    this.buildHighlights();
    this.attachEvents();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();

    this.setPotVisual(board.potValue);
    this.renderer.setAnimationLoop(() => this.frame());
  }

  setLesson(id: LessonId, pins: string[]): void {
    this.activeLesson = id;
    const baseLed = id === 'blink' || id === 'button' || id === 'pot' || id === 'light';
    this.ledGroup.visible = baseLed;
    this.resistorGroup.visible = baseLed;
    this.ledWires.visible = baseLed;
    this.trafficGroup.visible = id === 'traffic';
    this.trafficWires.visible = id === 'traffic';
    this.temperatureGroup.visible = id === 'temperature';
    this.temperatureWires.visible = id === 'temperature';
    this.ultrasonicGroup.visible = id === 'ultrasonic';
    this.ultrasonicWires.visible = id === 'ultrasonic';
    this.rgbGroup.visible = id === 'rgb';
    this.rgbWires.visible = id === 'rgb';
    this.lcdGroup.visible = id === 'lcd';
    this.lcdWires.visible = id === 'lcd';
    this.stepperGroup.visible = id === 'stepper';
    this.stepperWires.visible = id === 'stepper';
    this.buzzerGroup.visible = id === 'buzzer';
    this.buzzerWires.visible = id === 'buzzer';
    this.ldrGroup.visible = id === 'light';
    this.ldrWires.visible = id === 'light';
    this.servoGroup.visible = id === 'servo';
    this.servoWires.visible = id === 'servo';
    const nextTarget = this.viewTarget();
    this.camera.position.add(nextTarget.clone().sub(this.controls.target));
    this.controls.target.copy(nextTarget);
    this.controls.update();
    this.buttonGroup.visible = id === 'button';
    this.buttonWires.visible = id === 'button';
    this.potGroup.visible = id === 'pot';
    this.potWires.visible = id === 'pot';
    this.updateTrafficVisual();
    this.updateRgbVisual();

    for (const [label, ring] of this.rings) {
      const active = pins.includes(label);
      ring.visible = active;
      const sprite = this.labels.get(label);
      if (sprite) sprite.visible = active;
    }

    if (id !== 'button') this.board.setButton(false);
    if (id === 'pot') this.setPotVisual(this.board.potValue);
  }

  resetView(): void {
    const target = this.viewTarget();
    this.controls.target.copy(target);
    this.camera.position.copy(target).add(vec(11.2, 10.15, 13.25));
    this.controls.update();
  }

  private viewTarget(): THREE.Vector3 {
    if (this.activeLesson === 'lcd' || this.activeLesson === 'ultrasonic') {
      return vec(0.6, 0.35, 1.8);
    }
    if (this.activeLesson === 'stepper') {
      return vec(1.6, 0.35, 0.5);
    }
    return vec(0.3, 0.35, this.activeLesson === 'servo' ? 1.6 : 0.25);
  }

  private buildEnvironment(): void {
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.45;
    pmrem.dispose();
  }

  dispose(): void {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.controls.dispose();
    this.scene.environment?.dispose();
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.isMesh && mesh.geometry) mesh.geometry.dispose();
      const material = mesh.material;
      if (Array.isArray(material)) {
        for (const item of material) item.dispose();
      } else if (material) {
        material.dispose();
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private buildLights(): void {
    this.scene.add(new THREE.HemisphereLight(0xfff8ea, 0x9d8c73, 1.25));

    const key = new THREE.DirectionalLight(0xfff0d8, 2.6);
    key.position.set(-7, 15, 9);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -15;
    key.shadow.camera.right = 15;
    key.shadow.camera.top = 15;
    key.shadow.camera.bottom = -15;
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 45;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0xdce8ff, 0.55);
    fill.position.set(10, 8, -8);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffd6ad, 0.6);
    rim.position.set(2, 6, 12);
    this.scene.add(rim);
  }

  private buildDesk(): void {
    const desk = new THREE.Mesh(
      new THREE.PlaneGeometry(70, 70),
      std(0xffffff, { map: deskTexture(), roughness: 0.95, metalness: 0 }),
    );
    desk.rotation.x = -Math.PI / 2;
    desk.position.y = -0.03;
    desk.receiveShadow = true;
    this.scene.add(desk);
  }

  private buildBoard(): void {
    const group = new THREE.Group();
    group.position.set(BOARD.x, BOARD.y, BOARD.z);
    this.scene.add(group);

    const pcb = new THREE.Mesh(
      new RoundedBoxGeometry(BOARD.w, BOARD.h, BOARD.d, 3, 0.06),
      std(COLORS.pcb, { roughness: 0.5, metalness: 0.15 }),
    );
    pcb.castShadow = true;
    pcb.receiveShadow = true;
    group.add(pcb);

    const silk = new THREE.Mesh(
      new THREE.PlaneGeometry(BOARD.w, BOARD.d),
      new THREE.MeshStandardMaterial({
        map: boardTexture(),
        transparent: true,
        roughness: 0.6,
        metalness: 0,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    );
    silk.rotation.x = -Math.PI / 2;
    silk.position.y = BOARD.h / 2 + 0.004;
    group.add(silk);

    const headerMat = std(0x171717, { roughness: 0.8 });
    const goldMat = std(COLORS.gold, { metalness: 0.8, roughness: 0.28 });
    const rows = [
      { pins: PINS.filter((pin) => pin.z === -2.28), z: -2.28 },
      { pins: PINS.filter((pin) => pin.z === -1.96), z: -1.96 },
      { pins: PINS.filter((pin) => pin.z === 2.28 && pin.label.startsWith('A')), z: 2.28 },
      { pins: PINS.filter((pin) => pin.z === 2.28 && !pin.label.startsWith('A')), z: 2.28 },
    ];

    for (const row of rows) {
      const xs = row.pins.map((pin) => pin.x);
      const min = Math.min(...xs);
      const max = Math.max(...xs);
      const strip = new THREE.Mesh(
        new RoundedBoxGeometry(max - min + 0.14, 0.22, 0.24, 2, 0.03),
        headerMat,
      );
      strip.position.set((min + max) / 2, 0.19, row.z);
      strip.castShadow = true;
      group.add(strip);

      for (const pin of row.pins) {
        const gold = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.07), goldMat);
        gold.position.set(pin.x, 0.315, row.z);
        group.add(gold);
      }
    }

    const chip = new THREE.Mesh(
      new RoundedBoxGeometry(1.16, 0.18, 0.56, 2, 0.03),
      std(0x161616, { roughness: 0.62 }),
    );
    chip.position.set(-0.2, 0.18, -0.15);
    chip.castShadow = true;
    group.add(chip);

    const chipDot = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 12), std(0x9a9a9a));
    chipDot.position.set(-0.7, 0.28, -0.35);
    group.add(chipDot);

    const legMat = std(0xc7c9cc, { metalness: 0.7, roughness: 0.35 });
    for (let i = 0; i < 8; i++) {
      const x = -0.62 + i * 0.18;
      for (const z of [-0.43, 0.13]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.12), legMat);
        leg.position.set(x, 0.12, z);
        group.add(leg);
      }
    }

    const usb = new THREE.Mesh(
      new RoundedBoxGeometry(0.95, 0.34, 0.72, 2, 0.04),
      std(0xc9cbd0, { metalness: 0.85, roughness: 0.3 }),
    );
    usb.position.set(-3.55, 0.25, -0.9);
    usb.castShadow = true;
    group.add(usb);

    const usbSlot = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.2, 0.5), std(0x2b2b2b));
    usbSlot.position.set(-4.02, 0.25, -0.9);
    group.add(usbSlot);

    const jack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.55, 20),
      std(0x1b1b1b, { roughness: 0.7 }),
    );
    jack.rotation.z = Math.PI / 2;
    jack.position.set(-3.62, 0.22, 1.35);
    jack.castShadow = true;
    group.add(jack);

    const jackFace = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.02, 16), std(0x111111));
    jackFace.rotation.z = Math.PI / 2;
    jackFace.position.set(-3.91, 0.22, 1.35);
    group.add(jackFace);

    const reset = new THREE.Mesh(
      new RoundedBoxGeometry(0.3, 0.14, 0.3, 2, 0.03),
      std(0xb9bcc1, { metalness: 0.6, roughness: 0.35 }),
    );
    reset.position.set(2.95, 0.2, -1.55);
    group.add(reset);

    const resetTop = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 12), std(0x222222));
    resetTop.position.set(2.95, 0.285, -1.55);
    group.add(resetTop);

    for (const cap of [
      { x: 2.35, z: 1.65, r: 0.14, h: 0.34 },
      { x: 2.72, z: 1.65, r: 0.12, h: 0.28 },
    ]) {
      const body = new THREE.Mesh(
        new THREE.CylinderGeometry(cap.r, cap.r, cap.h, 16),
        std(0x24272b, { roughness: 0.6 }),
      );
      body.position.set(cap.x, 0.11 + cap.h / 2, cap.z);
      body.castShadow = true;
      group.add(body);
      const top = new THREE.Mesh(
        new THREE.CylinderGeometry(cap.r * 0.96, cap.r * 0.96, 0.015, 16),
        std(0xaeb2b8, { metalness: 0.6 }),
      );
      top.position.set(cap.x, 0.11 + cap.h + 0.01, cap.z);
      group.add(top);
    }

    const regulator = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.2, 0.42), std(0x1a1a1a));
    regulator.position.set(-0.9, 0.19, 1.9);
    group.add(regulator);

    const crystal = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.14, 0.18),
      std(0xc7c9cc, { metalness: 0.7, roughness: 0.3 }),
    );
    crystal.position.set(0.9, 0.18, 1.85);
    group.add(crystal);

    const onMat = new THREE.MeshStandardMaterial({
      color: 0x37d67a,
      emissive: 0x37d67a,
      emissiveIntensity: 1.2,
      roughness: 0.35,
    });
    const on = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 12), onMat);
    on.position.set(2.72, 0.11, 1.7);
    group.add(on);

    this.onboardMaterial = new THREE.MeshStandardMaterial({
      color: 0xffa63a,
      emissive: 0xffa63a,
      emissiveIntensity: 0,
      roughness: 0.35,
    });
    const ledL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 12), this.onboardMaterial);
    ledL.position.set(2.36, 0.11, -1.28);
    group.add(ledL);

    this.txMaterial = new THREE.MeshStandardMaterial({
      color: 0xffb347,
      emissive: 0xffb347,
      emissiveIntensity: 0,
      roughness: 0.35,
    });
    for (const z of [-1.35, -1.08]) {
      const led = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 12), this.txMaterial);
      led.position.set(2.96, 0.11, z);
      group.add(led);
    }
  }

  private buildBreadboard(): void {
    const base = new THREE.Mesh(
      new RoundedBoxGeometry(BREADBOARD.w, BREADBOARD.h, BREADBOARD.d, 3, 0.1),
      std(0xf1ece0, { roughness: 0.85, metalness: 0 }),
    );
    base.position.set(BREADBOARD.x, BREADBOARD.h / 2, BREADBOARD.z);
    base.castShadow = true;
    base.receiveShadow = true;
    this.scene.add(base);

    const top = new THREE.Mesh(
      new THREE.PlaneGeometry(BREADBOARD.w, BREADBOARD.d),
      new THREE.MeshStandardMaterial({
        map: breadboardTexture(),
        transparent: true,
        roughness: 0.8,
        metalness: 0,
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    );
    top.rotation.x = -Math.PI / 2;
    top.position.set(BREADBOARD.x, BREADBOARD.h + 0.004, BREADBOARD.z);
    this.scene.add(top);

    const groove = new THREE.Mesh(
      new THREE.BoxGeometry(BREADBOARD.w - 0.5, 0.03, 0.14),
      std(0xded6c6, { roughness: 0.9 }),
    );
    groove.position.set(BREADBOARD.x, BREADBOARD.h + 0.01, BREADBOARD.z);
    this.scene.add(groove);

    const positions: { x: number; z: number }[] = [];
    for (let col = 0; col < HOLES.cols; col++) {
      for (let row = 0; row < HOLES.rows; row++) {
        positions.push({ x: holeX(col), z: holeZ(row) });
      }
    }
    for (const z of RAIL_Z) {
      for (let i = 0; i < 25; i++) positions.push({ x: railHoleX(i), z });
    }

    const holes = new THREE.InstancedMesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.012, 10),
      std(0xb9b09f, { roughness: 0.95, metalness: 0 }),
      positions.length,
    );
    const dummy = new THREE.Object3D();
    positions.forEach((position, index) => {
      dummy.position.set(position.x, BREADBOARD.h + 0.006, position.z);
      dummy.updateMatrix();
      holes.setMatrixAt(index, dummy.matrix);
    });
    holes.instanceMatrix.needsUpdate = true;
    this.scene.add(holes);
  }

  private buildComponents(): void {
    this.buildLed();
    this.buildResistor();
    this.buildButton();
    this.buildPot();
    this.buildBuzzer();
    this.buildLdr();
    this.buildServo();
    this.buildTraffic();
    this.buildTemperature();
    this.buildUltrasonic();
    this.buildRgb();
    this.buildLcd();
    this.buildStepper();
  }

  private buildLed(): void {
    const group = this.ledGroup;
    group.position.set(COMPONENT_LAYOUT.led.x, BREADBOARD.h, COMPONENT_LAYOUT.led.z);

    this.ledMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6a52,
      emissive: 0xff2d12,
      emissiveIntensity: 0,
      roughness: 0.22,
      metalness: 0.05,
      transparent: true,
      opacity: 0.9,
    });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.36, 20), this.ledMaterial);
    body.position.y = 0.52;
    body.castShadow = true;
    group.add(body);

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.25, 0.05, 20),
      std(0xd94632, { roughness: 0.3 }),
    );
    rim.position.y = 0.34;
    group.add(rim);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.23, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      this.ledMaterial,
    );
    dome.position.y = 0.7;
    dome.scale.y = 0.75;
    group.add(dome);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffb199 }),
    );
    core.position.y = 0.52;
    group.add(core);

    const legMat = std(0xc9c9c9, { metalness: 0.7, roughness: 0.3 });
    for (const dx of [-0.135, 0.135]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.4, 8), legMat);
      leg.position.set(dx, 0.2, 0);
      group.add(leg);
    }

    this.ledLight = new THREE.PointLight(0xff5a33, 0, 3.2, 2);
    this.ledLight.position.set(0, 0.6, 0);
    group.add(this.ledLight);

    this.scene.add(group);
  }

  private buildResistor(): void {
    const group = this.resistorGroup;
    group.position.set(
      (COMPONENT_LAYOUT.resistor.left.x + COMPONENT_LAYOUT.resistor.right.x) / 2,
      BREADBOARD.h,
      COMPONENT_LAYOUT.resistor.left.z,
    );

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.62, 16),
      std(0xd8b98c, { roughness: 0.6 }),
    );
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.28;
    body.castShadow = true;
    group.add(body);

    for (const band of [
      { offset: -0.16, color: 0x7a4a2a },
      { offset: 0, color: 0xd0453a },
      { offset: 0.16, color: 0xd8a63a },
    ]) {
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.104, 0.104, 0.035, 16),
        std(band.color, { roughness: 0.5 }),
      );
      ring.rotation.z = Math.PI / 2;
      ring.position.set(band.offset, 0.28, 0);
      group.add(ring);
    }

    const legMat = std(0xc9c9c9, { metalness: 0.7, roughness: 0.3 });
    for (const dx of [-0.405, 0.405]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.28, 8), legMat);
      leg.position.set(dx, 0.14, 0);
      group.add(leg);
    }

    this.scene.add(group);
  }

  private buildButton(): void {
    this.buttonGroup.position.set(
      COMPONENT_LAYOUT.button.x,
      BREADBOARD.h,
      COMPONENT_LAYOUT.button.z,
    );

    const base = new THREE.Mesh(
      new RoundedBoxGeometry(0.62, 0.14, 0.62, 2, 0.03),
      std(0x202327, { roughness: 0.65 }),
    );
    base.position.y = 0.07;
    base.castShadow = true;
    this.buttonGroup.add(base);

    this.buttonCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.22, 0.14, 20),
      std(0x2c3238, { roughness: 0.5 }),
    );
    this.buttonCap.position.y = this.buttonCapY;
    this.buttonCap.castShadow = true;
    this.buttonGroup.add(this.buttonCap);

    const ring = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.23, 0.03, 20),
      std(COLORS.accent, { roughness: 0.4 }),
    );
    ring.position.y = 0.275;
    this.buttonGroup.add(ring);

    const legMat = std(0xc9c9c9, { metalness: 0.7, roughness: 0.3 });
    for (const [dx, dz] of [
      [-0.135, -0.15],
      [-0.135, 0.15],
      [0.135, -0.15],
      [0.135, 0.15],
    ]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.1, 8), legMat);
      leg.position.set(dx, 0.05, dz);
      this.buttonGroup.add(leg);
    }

    this.buttonGroup.visible = false;
    this.scene.add(this.buttonGroup);
    this.interactive.push({ root: this.buttonCap, kind: 'button' });
  }

  private buildPot(): void {
    this.potGroup.position.set(COMPONENT_LAYOUT.pot.x, BREADBOARD.h, COMPONENT_LAYOUT.pot.z);

    const base = new THREE.Mesh(
      new RoundedBoxGeometry(0.9, 0.34, 0.9, 2, 0.04),
      std(0x2f5fa8, { roughness: 0.55 }),
    );
    base.position.y = 0.17;
    base.castShadow = true;
    this.potGroup.add(base);

    this.potKnob = new THREE.Group();
    this.potKnob.position.y = 0.42;

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.18, 20),
      std(0x1c1f23, { roughness: 0.45 }),
    );
    this.potKnob.add(shaft);

    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.03, 20),
      std(0xb9bcc1, { metalness: 0.6, roughness: 0.35 }),
    );
    top.position.y = 0.105;
    this.potKnob.add(top);

    const marker = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.02, 0.18), std(0xf4ede0));
    marker.position.set(0, 0.125, 0.08);
    this.potKnob.add(marker);

    this.potGroup.add(this.potKnob);

    const legMat = std(0xc9c9c9, { metalness: 0.7, roughness: 0.3 });
    for (const dx of [-0.27, 0, 0.27]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.1, 8), legMat);
      leg.position.set(dx, 0.05, 0);
      this.potGroup.add(leg);
    }

    this.potGroup.visible = false;
    this.scene.add(this.potGroup);
    this.interactive.push({ root: this.potKnob, kind: 'pot' });
  }


  private buildBuzzer(): void {
    this.buzzerGroup.position.set((holeX(20) + holeX(23)) / 2, BREADBOARD.h, holeZ(3));

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.52, 0.6, 32),
      std(0x1f1f23, { roughness: 0.35, metalness: 0.15 }),
    );
    body.position.y = 0.4;
    body.castShadow = true;
    this.buzzerGroup.add(body);

    const top = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 0.02, 32),
      std(0x2d2d33, { roughness: 0.25 }),
    );
    top.position.y = 0.71;
    this.buzzerGroup.add(top);

    const hole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.07, 0.03, 16),
      std(0x050505, { roughness: 0.9 }),
    );
    hole.position.y = 0.72;
    this.buzzerGroup.add(hole);

    const plus = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.04), std(0xd0453a));
    plus.position.set(-0.36, 0.72, 0);
    this.buzzerGroup.add(plus);

    const legMat = std(0xc9c9c9, { metalness: 0.7, roughness: 0.3 });
    for (const dx of [-0.405, 0.405]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.2, 8), legMat);
      leg.position.set(dx, 0.1, 0);
      this.buzzerGroup.add(leg);
    }

    for (let i = 0; i < 3; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.025, 8, 40),
        new THREE.MeshBasicMaterial({ color: 0xe2543f, transparent: true, opacity: 0, depthWrite: false }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 1.0;
      this.buzzerGroup.add(ring);
      this.soundRings.push(ring);
    }

    this.buzzerGroup.visible = false;
    this.scene.add(this.buzzerGroup);
  }

  private buildLdr(): void {
    this.ldrGroup.position.set(holeX(21), BREADBOARD.h, holeZ(6));

    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.36, 0.1, 28),
      std(0xd9b36a, { roughness: 0.4 }),
    );
    disc.position.y = 0.3;
    disc.castShadow = true;
    this.ldrGroup.add(disc);

    const trackMat = std(0x6b3b1a, { roughness: 0.6 });
    for (let i = -2; i <= 2; i++) {
      const track = new THREE.Mesh(new THREE.BoxGeometry(0.5 - Math.abs(i) * 0.06, 0.012, 0.05), trackMat);
      track.position.set(0, 0.356, i * 0.12);
      this.ldrGroup.add(track);
    }

    const legMat = std(0xc9c9c9, { metalness: 0.7, roughness: 0.3 });
    for (const dx of [-0.27, 0.27]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.3, 8), legMat);
      leg.position.set(dx, 0.15, 0);
      this.ldrGroup.add(leg);
    }

    const res = new THREE.Group();
    res.position.set((holeX(22) + holeX(25)) / 2 - holeX(21), 0, holeZ(8) - holeZ(6));
    const resBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.62, 16),
      std(0xd8b98c, { roughness: 0.6 }),
    );
    resBody.rotation.z = Math.PI / 2;
    resBody.position.y = 0.28;
    res.add(resBody);
    [-0.16, 0, 0.16].forEach((offset, index) => {
      const band = new THREE.Mesh(
        new THREE.CylinderGeometry(0.104, 0.104, 0.035, 16),
        std([0x7a4a2a, 0x1c1a18, 0xe08a2e][index]),
      );
      band.rotation.z = Math.PI / 2;
      band.position.set(offset, 0.28, 0);
      res.add(band);
    });
    for (const dx of [-0.405, 0.405]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.28, 8), legMat);
      leg.position.set(dx, 0.14, 0);
      res.add(leg);
    }
    this.ldrGroup.add(res);

    // Le « soleil » : on le fait glisser pour changer la lumière ambiante.
    this.lampMaterial = new THREE.MeshBasicMaterial({ color: 0xffc94a });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), this.lampMaterial);
    this.lamp.add(sun);
    for (let i = 0; i < 8; i++) {
      const ray = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.42), this.lampMaterial);
      const angle = (i / 8) * Math.PI * 2;
      ray.position.set(Math.cos(angle) * 0.82, 0, Math.sin(angle) * 0.82);
      ray.rotation.y = -angle + Math.PI / 2;
      this.lamp.add(ray);
    }
    this.sunLight = new THREE.PointLight(0xfff0c0, 2, 14, 1.4);
    this.lamp.add(this.sunLight);
    this.ldrGroup.add(this.lamp);
    this.interactive.push({ root: this.lamp, kind: 'lamp' });

    this.ldrGroup.visible = false;
    this.scene.add(this.ldrGroup);
    this.setLightVisual(this.board.lightValue);
  }

  private buildServo(): void {
    this.servoGroup.position.set(-0.6, 0, 5.0);
    const blue = std(0x2f6bb5, { roughness: 0.45 });

    const body = new THREE.Mesh(new RoundedBoxGeometry(1.5, 1.1, 0.78, 2, 0.05), blue);
    body.position.y = 0.55;
    body.castShadow = true;
    this.servoGroup.add(body);

    const flange = new THREE.Mesh(new RoundedBoxGeometry(2.1, 0.1, 0.74, 1, 0.03), blue);
    flange.position.y = 0.82;
    flange.castShadow = true;
    this.servoGroup.add(flange);

    const bump = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 24), blue);
    bump.position.set(0.45, 1.2, 0);
    this.servoGroup.add(bump);

    const plug = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.44), std(0x222225, { roughness: 0.7 }));
    plug.position.set(-0.9, 0.55, 0);
    this.servoGroup.add(plug);

    this.servoHorn = new THREE.Group();
    this.servoHorn.position.set(0.45, 1.36, 0);
    const white = std(0xf2eee6, { roughness: 0.5 });
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.14, 20), white);
    this.servoHorn.add(hub);
    const arm = new THREE.Mesh(new RoundedBoxGeometry(1.05, 0.07, 0.2, 1, 0.03), white);
    arm.position.x = 0.42;
    arm.castShadow = true;
    this.servoHorn.add(arm);
    const screw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.16, 10),
      std(0x333333, { metalness: 0.6 }),
    );
    this.servoHorn.add(screw);
    this.servoGroup.add(this.servoHorn);

    this.servoGroup.visible = false;
    this.scene.add(this.servoGroup);
  }

  private createLed(
    color: number,
    emissive: number,
  ): { group: THREE.Group; material: THREE.MeshStandardMaterial } {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: 0,
      roughness: 0.22,
      metalness: 0.05,
      transparent: true,
      opacity: 0.9,
    });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.34, 18), material);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      material,
    );
    dome.position.y = 0.67;
    dome.scale.y = 0.7;
    group.add(dome);

    const legMat = std(0xc9c9c9, { metalness: 0.7, roughness: 0.3 });
    for (const dx of [-0.12, 0.12]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.36, 8), legMat);
      leg.position.set(dx, 0.18, 0);
      group.add(leg);
    }

    return { group, material };
  }

  private addResistor(group: THREE.Group, x: number, z: number): void {
    const resistor = new THREE.Group();
    resistor.position.set(x, 0, z);

    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.58, 14),
      std(0xd8b98c, { roughness: 0.6 }),
    );
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.27;
    body.castShadow = true;
    resistor.add(body);

    for (const band of [
      { offset: -0.15, color: 0x7a4a2a },
      { offset: 0, color: 0xd0453a },
      { offset: 0.15, color: 0xd8a63a },
    ]) {
      const ring = new THREE.Mesh(
        new THREE.CylinderGeometry(0.088, 0.088, 0.032, 14),
        std(band.color, { roughness: 0.5 }),
      );
      ring.rotation.z = Math.PI / 2;
      ring.position.set(band.offset, 0.27, 0);
      resistor.add(ring);
    }

    const legMat = std(0xc9c9c9, { metalness: 0.7, roughness: 0.3 });
    for (const dx of [-0.39, 0.39]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.26, 8), legMat);
      leg.position.set(dx, 0.13, 0);
      resistor.add(leg);
    }

    group.add(resistor);
  }

  private buildTraffic(): void {
    const originX = holeX(7);
    const originZ = holeZ(4);
    this.trafficGroup.position.set(originX, BREADBOARD.h, originZ);

    const leds = [
      { pin: 9, x: -1.1, color: 0xff4b3a, emissive: 0xff1a0a },
      { pin: 10, x: 0, color: 0xffb43a, emissive: 0xff8a00 },
      { pin: 11, x: 1.1, color: 0x49d17a, emissive: 0x00b84a },
    ];

    for (const def of leds) {
      const led = this.createLed(def.color, def.emissive);
      led.group.position.set(def.x, 0, 0);
      this.trafficGroup.add(led.group);
      this.trafficMaterials.set(def.pin, led.material);
      this.addResistor(this.trafficGroup, def.x, 1.35);
    }

    this.trafficGroup.visible = false;
    this.scene.add(this.trafficGroup);

    const gnd = vec(POWER_GND.x, POWER_GND.y, POWER_GND.z);
    for (const def of leds) {
      const pin = pinWorld(String(def.pin));
      const left = vec(originX + def.x - 0.39, 1.08, originZ + 1.35);
      const right = vec(originX + def.x + 0.39, 1.08, originZ + 1.35);
      const anode = vec(originX + def.x + 0.12, 1.12, originZ);
      const cathode = vec(originX + def.x - 0.12, 1.12, originZ);
      this.trafficWires.add(
        wireMesh(lanePoints(pin, left, -3.35, 1.35), COLORS.green),
        wireMesh(archPoints(right, anode, 0.55), COLORS.green),
        wireMesh(lanePoints(cathode, gnd, 3.55, 1.25), COLORS.black),
      );
    }
    this.trafficWires.visible = false;
    this.scene.add(this.trafficWires);
  }

  private buildTemperature(): void {
    const originX = holeX(16);
    const originZ = holeZ(8);
    this.temperatureGroup.position.set(originX, BREADBOARD.h, originZ);

    const body = new THREE.Mesh(
      new RoundedBoxGeometry(0.52, 0.62, 0.16, 2, 0.04),
      std(0x24272b, { roughness: 0.75 }),
    );
    body.position.y = 0.5;
    body.castShadow = true;
    this.temperatureGroup.add(body);

    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(0.38, 0.46),
      std(0x3b4047, { roughness: 0.6 }),
    );
    face.position.set(0, 0.5, 0.085);
    this.temperatureGroup.add(face);

    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.032, 12),
      new THREE.MeshBasicMaterial({ color: 0xe8e2d4 }),
    );
    dot.position.set(-0.15, 0.77, 0.086);
    this.temperatureGroup.add(dot);

    const legMat = std(0xc9c9c9, { metalness: 0.7, roughness: 0.3 });
    for (const dx of [-0.15, 0, 0.15]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.3, 8), legMat);
      leg.position.set(dx, 0.18, 0);
      this.temperatureGroup.add(leg);
    }

    this.temperatureGroup.visible = false;
    this.scene.add(this.temperatureGroup);

    const v5 = pinWorld('5V');
    const a2 = pinWorld('A2');
    const gnd = vec(POWER_GND.x, POWER_GND.y, POWER_GND.z);
    const left = vec(originX - 0.15, 0.9, originZ);
    const middle = vec(originX, 0.9, originZ);
    const right = vec(originX + 0.15, 0.9, originZ);

    this.temperatureWires.add(
      wireMesh(lanePoints(v5, left, -3.3, 1.4), COLORS.red),
      wireMesh(archPoints(a2, middle, 1.2), COLORS.orange),
      wireMesh(lanePoints(gnd, right, 3.55, 1.25), COLORS.black),
    );
    this.temperatureWires.visible = false;
    this.scene.add(this.temperatureWires);
  }

  private buildUltrasonic(): void {
    const originX = -3.5;
    const originZ = 4.0;
    this.ultrasonicGroup.position.set(originX, 0, originZ);

    const pcb = new THREE.Mesh(
      new RoundedBoxGeometry(3.1, 0.12, 1.45, 2, 0.05),
      std(0x2f5fa8, { roughness: 0.55 }),
    );
    pcb.position.y = 0.22;
    pcb.castShadow = true;
    this.ultrasonicGroup.add(pcb);

    const metal = std(0xc7c9c8, { metalness: 0.75, roughness: 0.3 });
    for (const dx of [-0.82, 0.82]) {
      const can = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 24), metal);
      can.rotation.x = Math.PI / 2;
      can.position.set(dx, 0.52, 0.52);
      can.castShadow = true;
      this.ultrasonicGroup.add(can);

      const grille = new THREE.Mesh(
        new THREE.CylinderGeometry(0.27, 0.27, 0.04, 20),
        std(0x30353a, { roughness: 0.8 }),
      );
      grille.rotation.x = Math.PI / 2;
      grille.position.set(dx, 0.52, 0.7);
      this.ultrasonicGroup.add(grille);
    }

    const crystal = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.12, 0.26),
      std(0xbfc4c6, { metalness: 0.4, roughness: 0.4 }),
    );
    crystal.position.set(0, 0.45, 0.1);
    this.ultrasonicGroup.add(crystal);

    const legMat = std(0xc9c9c9, { metalness: 0.7, roughness: 0.3 });
    for (const dx of [-0.9, -0.3, 0.3, 0.9]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.22, 8), legMat);
      leg.position.set(dx, 0.12, -0.78);
      this.ultrasonicGroup.add(leg);
    }

    this.ultrasonicGroup.visible = false;
    this.scene.add(this.ultrasonicGroup);

    const v5 = pinWorld('5V');
    const trig = pinWorld('7');
    const echo = pinWorld('6');
    const gnd = vec(POWER_GND.x, POWER_GND.y, POWER_GND.z);
    const pin = (dx: number): THREE.Vector3 => vec(originX + dx, 0.8, originZ - 0.78);

    this.ultrasonicWires.add(
      wireMesh(lanePoints(trig, pin(-0.9), -3.25, 1.45), COLORS.orange),
      wireMesh(lanePoints(echo, pin(-0.3), -3.05, 1.35), COLORS.blue),
      wireMesh(lanePoints(v5, pin(0.3), -2.85, 1.25), COLORS.red),
      wireMesh(lanePoints(gnd, pin(0.9), 3.7, 1.2), COLORS.black),
    );
    this.ultrasonicWires.visible = false;
    this.scene.add(this.ultrasonicWires);
  }

  private buildRgb(): void {
    const originX = holeX(7);
    const originZ = holeZ(4);
    this.rgbGroup.position.set(originX, BREADBOARD.h, originZ);

    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.4, 0.6, 24),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.08,
        metalness: 0,
        transparent: true,
        opacity: 0.2,
      }),
    );
    shell.position.y = 0.55;
    shell.castShadow = true;
    this.rgbGroup.add(shell);

    const channels = [
      { pin: 9, x: -0.08, color: 0xff3b2f, emissive: 0xff1200 },
      { pin: 10, x: 0.08, color: 0x3bd96b, emissive: 0x00c43c },
      { pin: 11, x: 0.24, color: 0x3f7bff, emissive: 0x003cff },
    ];
    for (const channel of channels) {
      const material = new THREE.MeshStandardMaterial({
        color: channel.color,
        emissive: channel.emissive,
        emissiveIntensity: 0,
        roughness: 0.25,
        transparent: true,
        opacity: 0.95,
      });
      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 10), material);
      dome.position.set(channel.x, 0.58, 0);
      this.rgbGroup.add(dome);
      this.rgbMaterials.set(channel.pin, material);
      this.addResistor(this.rgbGroup, channel.x - 0.1, 1.35);
    }

    const legMat = std(0xc9c9c9, { metalness: 0.7, roughness: 0.3 });
    for (const dx of [-0.24, -0.08, 0.08, 0.24]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.38, 8), legMat);
      leg.position.set(dx, 0.18, 0);
      this.rgbGroup.add(leg);
    }

    this.rgbLight = new THREE.PointLight(0xffffff, 0, 3.2, 2);
    this.rgbLight.position.set(0, 0.65, 0);
    this.rgbGroup.add(this.rgbLight);

    this.rgbGroup.visible = false;
    this.scene.add(this.rgbGroup);

    const gnd = vec(POWER_GND.x, POWER_GND.y, POWER_GND.z);
    const anodeX = [-0.08, 0.08, 0.24];
    channels.forEach((channel, index) => {
      const pin = pinWorld(String(channel.pin));
      const left = vec(originX + channel.x - 0.1 - 0.39, 1.08, originZ + 1.35);
      const right = vec(originX + channel.x - 0.1 + 0.39, 1.08, originZ + 1.35);
      const anode = vec(originX + anodeX[index], 1.12, originZ);
      this.rgbWires.add(
        wireMesh(lanePoints(pin, left, -3.35, 1.35), COLORS.green),
        wireMesh(archPoints(right, anode, 0.5), COLORS.green),
      );
    });
    this.rgbWires.add(
      wireMesh(
        lanePoints(vec(originX - 0.24, 1.12, originZ), gnd, 3.55, 1.25),
        COLORS.black,
      ),
    );
    this.rgbWires.visible = false;
    this.scene.add(this.rgbWires);
  }

  private buildLcd(): void {
    const originX = 2.8;
    const originZ = 4.15;
    this.lcdGroup.position.set(originX, 0, originZ);

    const pcb = new THREE.Mesh(
      new RoundedBoxGeometry(4.7, 0.18, 1.95, 2, 0.05),
      std(0x123f52, { roughness: 0.55 }),
    );
    pcb.position.y = 0.09;
    pcb.castShadow = true;
    this.lcdGroup.add(pcb);

    this.lcdCanvas = document.createElement('canvas');
    this.lcdCanvas.width = 512;
    this.lcdCanvas.height = 192;
    const ctx = this.lcdCanvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D indisponible pour le LCD.');
    this.lcdCtx = ctx;
    this.lcdTexture = new THREE.CanvasTexture(this.lcdCanvas);
    this.lcdTexture.colorSpace = THREE.SRGBColorSpace;
    this.lcdTexture.anisotropy = 8;

    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(3.9, 1.35),
      new THREE.MeshBasicMaterial({ map: this.lcdTexture, toneMapped: false }),
    );
    screen.rotation.x = -Math.PI / 2;
    screen.position.set(0, 0.2, 0.04);
    this.lcdGroup.add(screen);

    const legMat = std(0xc9c9c9, { metalness: 0.7, roughness: 0.3 });
    for (const dx of [-1.0, -0.33, 0.33, 1.0]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.24, 8), legMat);
      leg.position.set(dx, 0.1, -1.02);
      this.lcdGroup.add(leg);
    }

    this.setLcdVisual(['', ''], true);
    this.lcdGroup.visible = false;
    this.scene.add(this.lcdGroup);

    const sda = pinWorld('A4');
    const scl = pinWorld('A5');
    const v5 = pinWorld('5V');
    const gnd = vec(POWER_GND.x, POWER_GND.y, POWER_GND.z);
    const pin = (dx: number): THREE.Vector3 => vec(originX + dx, 0.8, originZ - 1.02);

    this.lcdWires.add(
      wireMesh(lanePoints(sda, pin(-1.0), 3.7, 1.35), COLORS.blue),
      wireMesh(lanePoints(scl, pin(-0.33), 3.55, 1.25), COLORS.orange),
      wireMesh(lanePoints(v5, pin(0.33), -3.2, 1.4), COLORS.red),
      wireMesh(lanePoints(gnd, pin(1.0), 3.85, 1.45), COLORS.black),
    );
    this.lcdWires.visible = false;
    this.scene.add(this.lcdWires);
  }

  private setLcdVisual(lines: [string, string], backlight: boolean): void {
    const ctx = this.lcdCtx;
    const width = this.lcdCanvas.width;
    const height = this.lcdCanvas.height;
    ctx.fillStyle = backlight ? '#176b5c' : '#16332e';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = backlight ? '#4fb79d' : '#2e5a50';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, width - 8, height - 8);
    ctx.fillStyle = backlight ? '#d6ffe8' : '#6f9588';
    ctx.font = '700 30px "Courier New", monospace';
    ctx.textBaseline = 'top';
    for (let index = 0; index < 2; index++) {
      const text = (lines[index] ?? '').padEnd(16, ' ').slice(0, 16);
      ctx.fillText(text, 24, 26 + index * 66);
    }
    this.lcdTexture.needsUpdate = true;
  }

  private buildStepper(): void {
    const originX = 5.2;
    const originZ = -1.7;
    this.stepperGroup.position.set(originX, 0, originZ);

    const blue = std(0x2f6bb5, { roughness: 0.45 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.0, 24), blue);
    body.position.y = 0.5;
    body.castShadow = true;
    this.stepperGroup.add(body);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.53, 0.53, 0.08, 24), std(0x22518c));
    cap.position.y = 1.02;
    this.stepperGroup.add(cap);

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.2, 12),
      std(0xc9c9c9, { metalness: 0.7, roughness: 0.3 }),
    );
    shaft.position.y = 1.16;
    this.stepperGroup.add(shaft);

    this.stepperHorn = new THREE.Group();
    this.stepperHorn.position.y = 1.26;
    const white = std(0xf2eee6, { roughness: 0.5 });
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.12, 18), white);
    this.stepperHorn.add(hub);
    const arm = new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.07, 0.18, 1, 0.03), white);
    arm.position.x = 0.38;
    arm.castShadow = true;
    this.stepperHorn.add(arm);
    this.stepperGroup.add(this.stepperHorn);

    const driver = new THREE.Mesh(
      new RoundedBoxGeometry(1.3, 0.12, 0.9, 2, 0.04),
      std(0xb23a32, { roughness: 0.55 }),
    );
    driver.position.set(0, 0.06, 1.25);
    driver.castShadow = true;
    this.stepperGroup.add(driver);

    const chip = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.08, 0.34),
      std(0x1d2023, { roughness: 0.7 }),
    );
    chip.position.set(0, 0.16, 1.25);
    this.stepperGroup.add(chip);

    const connector = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.18, 0.24),
      std(0xe7e2d8, { roughness: 0.6 }),
    );
    connector.position.set(0, 0.18, 1.56);
    this.stepperGroup.add(connector);

    this.stepperGroup.visible = false;
    this.scene.add(this.stepperGroup);

    const v5 = pinWorld('5V');
    const gnd = vec(POWER_GND.x, POWER_GND.y, POWER_GND.z);
    const motorPins = [pinWorld('8'), pinWorld('10'), pinWorld('9'), pinWorld('11')];
    const driverPins = [
      vec(originX - 0.45, 0.3, originZ + 0.8),
      vec(originX - 0.15, 0.3, originZ + 0.8),
      vec(originX + 0.15, 0.3, originZ + 0.8),
      vec(originX + 0.45, 0.3, originZ + 0.8),
    ];
    const wireColors = [COLORS.blue, 0xd45aa0, COLORS.orange, COLORS.green];

    motorPins.forEach((pin, index) => {
      this.stepperWires.add(
        wireMesh(
          lanePoints(pin, driverPins[index], -3.25 - index * 0.08, 1.3 + index * 0.04),
          wireColors[index],
        ),
      );
    });
    this.stepperWires.add(
      wireMesh(lanePoints(v5, vec(originX + 0.55, 0.2, originZ + 1.25), -3.6, 1.5), COLORS.red),
      wireMesh(lanePoints(gnd, vec(originX - 0.55, 0.2, originZ + 1.25), 3.7, 1.4), COLORS.black),
    );
    this.stepperWires.visible = false;
    this.scene.add(this.stepperWires);
  }

  private buildExtraWires(): void {
    const v = (p: { x: number; y: number; z: number }): THREE.Vector3 => vec(p.x, p.y, p.z);
    const p8 = v(pinWorld('8'));
    const gndBack = v(pinWorld('GND'));
    const a1 = v(pinWorld('A1'));
    const v5 = v(pinWorld('5V'));
    const gndFront = v(POWER_GND);
    const p10 = v(pinWorld('10'));

    this.buzzerWires.add(
      wireMesh(lanePoints(p8, vec(holeX(20), 0.95, holeZ(3)), -3.45, 1.3), COLORS.blue),
      wireMesh(archPoints(gndBack, vec(holeX(23), 0.95, holeZ(3)), 1.2), COLORS.black),
    );
    this.buzzerWires.visible = false;
    this.scene.add(this.buzzerWires);

    this.ldrWires.add(
      wireMesh(lanePoints(v5, vec(holeX(20), 1.02, holeZ(7)), 3.35, 1.35), COLORS.red),
      wireMesh(lanePoints(a1, vec(holeX(22), 1.02, holeZ(7)), 3.55, 1.55), 0x8a5ad6),
      wireMesh(lanePoints(gndFront, vec(holeX(25), 1.02, holeZ(7)), 3.15, 1.15), COLORS.black),
    );
    this.ldrWires.visible = false;
    this.scene.add(this.ldrWires);

    this.servoWires.add(
      wireMesh(archPoints(p10, vec(-1.6, 0.55, 4.87), 2.4), COLORS.orange),
      wireMesh(archPoints(v5, vec(-1.6, 0.55, 5.0), 0.9), COLORS.red),
      wireMesh(archPoints(gndFront, vec(-1.6, 0.55, 5.13), 0.9), 0x6b4226),
    );
    this.servoWires.visible = false;
    this.scene.add(this.servoWires);
  }

  private setLightVisual(value: number): void {
    const level = value / 1023;
    this.lightLevel = level;
    this.lamp.position.y = 5.2 - level * 3.2 - BREADBOARD.h;
    this.lampMaterial.color.setHSL(0.12, 0.95, 0.35 + level * 0.3);
    this.sunLight.intensity = 0.3 + level * 3;
  }

  private buildWires(): void {
    this.buildExtraWires();
    const p9 = pinWorld('9');
    const gnd = pinWorld('GND');
    const p2 = pinWorld('2');
    const a0 = pinWorld('A0');
    const v5 = pinWorld('5V');

    const rLeft = vec(COMPONENT_LAYOUT.resistor.left.x, 1.1, COMPONENT_LAYOUT.resistor.left.z);
    const rRight = vec(COMPONENT_LAYOUT.resistor.right.x, 1.1, COMPONENT_LAYOUT.resistor.right.z);
    const ledAnode = vec(COMPONENT_LAYOUT.led.anode.x, 1.15, COMPONENT_LAYOUT.led.anode.z);
    const ledCathode = vec(COMPONENT_LAYOUT.led.cathode.x, 1.15, COMPONENT_LAYOUT.led.cathode.z);
    const btnA = vec(COMPONENT_LAYOUT.button.a.x, 0.95, COMPONENT_LAYOUT.button.a.z);
    const btnB = vec(COMPONENT_LAYOUT.button.b.x, 0.95, COMPONENT_LAYOUT.button.b.z);
    const potL = vec(COMPONENT_LAYOUT.pot.left.x, 1.02, COMPONENT_LAYOUT.pot.left.z);
    const potM = vec(COMPONENT_LAYOUT.pot.middle.x, 1.02, COMPONENT_LAYOUT.pot.middle.z);
    const potR = vec(COMPONENT_LAYOUT.pot.right.x, 1.02, COMPONENT_LAYOUT.pot.right.z);

    const base = this.ledWires;
    base.add(
      wireMesh(archPoints(vec(p9.x, p9.y, p9.z), rLeft, 1.25), COLORS.green),
      wireMesh(archPoints(rRight, ledAnode, 0.55), COLORS.green),
      wireMesh(archPoints(ledCathode, vec(gnd.x, gnd.y, gnd.z), 1.05), COLORS.black),
    );
    this.scene.add(base);

    this.buttonWires.add(
      wireMesh(
        [
          vec(p2.x, p2.y, p2.z),
          vec(p2.x, p2.y + 0.45, p2.z),
          vec(-6.3, 1.3, -3.45),
          vec(3.7, 1.3, -3.45),
          vec(btnA.x, btnA.y + 0.35, btnA.z),
          btnA,
        ],
        COLORS.blue,
      ),
      wireMesh(archPoints(vec(gnd.x, gnd.y, gnd.z), btnB, 1.2), COLORS.black),
    );
    this.buttonWires.visible = false;
    this.scene.add(this.buttonWires);

    this.potWires.add(
      wireMesh(lanePoints(vec(a0.x, a0.y, a0.z), potM, 3.55, 1.55), COLORS.orange),
      wireMesh(lanePoints(vec(v5.x, v5.y, v5.z), potL, 3.35, 1.35), COLORS.red),
      wireMesh(lanePoints(vec(POWER_GND.x, POWER_GND.y, POWER_GND.z), potR, 3.15, 1.15), COLORS.black),
    );
    this.potWires.visible = false;
    this.scene.add(this.potWires);
  }

  private buildHighlights(): void {
    for (const label of [
      '9',
      '2',
      'A0',
      '5V',
      'GND',
      'GND-F',
      '8',
      '10',
      'A1',
      '6',
      '7',
      '11',
      'A2',
      'A4',
      'A5',
    ]) {
      const pin = label === 'GND-F' ? POWER_GND : pinWorld(label);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.022, 8, 24),
        new THREE.MeshBasicMaterial({
          color: 0xf2a93b,
          transparent: true,
          opacity: 0.9,
          depthTest: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(pin.x, 0.5, pin.z);
      ring.visible = false;
      ring.renderOrder = 10;
      this.scene.add(ring);
      this.rings.set(label, ring);

      const sprite = labelSprite(label === 'GND-F' ? 'GND' : label);
      sprite.position.set(pin.x, pin.y + 0.75, pin.z);
      sprite.visible = false;
      this.scene.add(sprite);
      this.labels.set(label, sprite);
    }
  }

  private attachEvents(): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown, true);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerUp);
    window.addEventListener('keydown', this.onKeyDown);
    canvas.addEventListener('pointerleave', this.onPointerLeave);

    this.unsubscribers.push(
      () => canvas.removeEventListener('pointerdown', this.onPointerDown, true),
      () => window.removeEventListener('pointermove', this.onPointerMove),
      () => window.removeEventListener('pointerup', this.onPointerUp),
      () => window.removeEventListener('pointercancel', this.onPointerUp),
      () => window.removeEventListener('keydown', this.onKeyDown),
      () => canvas.removeEventListener('pointerleave', this.onPointerLeave),
      this.board.subscribe((event) => this.onBoardEvent(event)),
      this.board.serial.subscribe(() => this.flashTx()),
    );
  }

  private onPointerDown = (event: PointerEvent): void => {
    const hit = this.pick(event);
    if (!hit) return;
    event.preventDefault();
    event.stopPropagation();
    this.controls.enabled = false;

    if (hit.kind === 'button') {
      this.activePointer = 'button';
      this.board.setButton(true);
    } else if (hit.kind === 'lamp') {
      this.activePointer = 'lamp';
      this.lampStartY = event.clientY;
      this.lampStartValue = this.board.lightValue;
      this.renderer.domElement.style.cursor = 'ns-resize';
    } else {
      this.activePointer = 'pot';
      this.potStartX = event.clientX;
      this.potStartValue = this.board.potValue;
      this.renderer.domElement.style.cursor = 'grabbing';
    }
  };

  private onPointerMove = (event: PointerEvent): void => {
    if (this.activePointer === 'pot') {
      const delta = event.clientX - this.potStartX;
      this.board.setPot(this.potStartValue + delta * 3.2);
      return;
    }
    if (this.activePointer === 'lamp') {
      this.board.setLight(this.lampStartValue + (event.clientY - this.lampStartY) * 4);
      return;
    }
    if (this.activePointer) return;

    const hit = this.pick(event);
    const cursors = { pot: 'grab', button: 'pointer', lamp: 'ns-resize' } as const;
    this.renderer.domElement.style.cursor = hit ? cursors[hit.kind] : 'grab';
  };

  private onPointerUp = (): void => {
    if (this.activePointer === 'button') this.board.setButton(false);
    this.activePointer = null;
    this.controls.enabled = true;
    this.renderer.domElement.style.cursor = 'grab';
  };

  private onPointerLeave = (): void => {
    if (this.activePointer === 'button') {
      this.board.setButton(false);
      this.activePointer = null;
      this.controls.enabled = true;
    }
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    ) {
      return;
    }

    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const move = new THREE.Vector3();
    switch (event.key.toLowerCase()) {
      case 'w':
        move.add(forward);
        break;
      case 's':
        move.sub(forward);
        break;
      case 'd':
        move.add(right);
        break;
      case 'a':
        move.sub(right);
        break;
      case 'q':
        this.rotateCamera(0.12);
        event.preventDefault();
        return;
      case 'e':
        this.rotateCamera(-0.12);
        event.preventDefault();
        return;
      default:
        return;
    }

    move.multiplyScalar(0.6);
    this.camera.position.add(move);
    this.controls.target.add(move);
    this.controls.update();
    event.preventDefault();
  };

  private rotateCamera(angle: number): void {
    const offset = this.camera.position.clone().sub(this.controls.target);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
  }

  private pick(event: PointerEvent): { kind: InteractiveItem['kind'] } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const roots = this.interactive.filter((item) => this.isVisible(item.root));
    if (roots.length === 0) return null;

    const hits = this.raycaster.intersectObjects(
      roots.map((item) => item.root),
      true,
    );
    if (hits.length === 0) return null;

    for (const item of roots) {
      if (this.isWithin(hits[0].object, item.root)) return { kind: item.kind };
    }
    return null;
  }

  private isVisible(object: THREE.Object3D): boolean {
    let node: THREE.Object3D | null = object;
    while (node) {
      if (!node.visible) return false;
      node = node.parent;
    }
    return true;
  }

  private isWithin(object: THREE.Object3D, root: THREE.Object3D): boolean {
    let node: THREE.Object3D | null = object;
    while (node) {
      if (node === root) return true;
      node = node.parent;
    }
    return false;
  }

  private onBoardEvent = (event: BoardEvent): void => {
    switch (event.type) {
      case 'reset':
        this.toneFreq = 0;
        this.ledTarget = 0;
        this.onboardTarget = 0;
        this.stepperTarget = 0;
        this.setButtonVisual(false);
        this.updateTrafficVisual();
        this.updateRgbVisual();
        this.setLcdVisual(['', ''], true);
        break;
      case 'pin':
      case 'pwm':
        this.ledTarget = this.board.ledBrightness(9);
        this.onboardTarget = this.board.ledBrightness(13);
        this.updateTrafficVisual();
        this.updateRgbVisual();
        break;
      case 'button':
        this.setButtonVisual(event.pressed);
        break;
      case 'pot':
        this.setPotVisual(event.value);
        break;
      case 'tone':
        this.toneFreq = event.freq;
        break;
      case 'servo':
        this.servoTarget = event.angle;
        break;
      case 'light':
        this.setLightVisual(event.value);
        break;
      case 'stepper':
        this.stepperTarget = event.angle;
        break;
      case 'lcd':
        this.setLcdVisual(event.lines, event.backlight);
        break;
      case 'temperature':
      case 'distance':
        break;
    }
  };

  private updateTrafficVisual(): void {
    for (const [pin, material] of this.trafficMaterials) {
      const value = this.board.ledBrightness(pin);
      material.emissiveIntensity = value * 2.8;
      material.opacity = 0.72 + value * 0.28;
    }
  }

  private updateRgbVisual(): void {
    let red = 0;
    let green = 0;
    let blue = 0;
    for (const [pin, material] of this.rgbMaterials) {
      const value = this.board.ledBrightness(pin);
      material.emissiveIntensity = value * 2.8;
      material.opacity = 0.75 + value * 0.25;
      if (pin === 9) red = value;
      if (pin === 10) green = value;
      if (pin === 11) blue = value;
    }
    this.rgbLight.color.setRGB(red, green, blue);
    this.rgbLight.intensity = (red + green + blue) * 1.1;
  }

  private setButtonVisual(pressed: boolean): void {
    this.buttonCap.position.y = this.buttonCapY - (pressed ? 0.05 : 0);
  }

  private setPotVisual(value: number): void {
    this.potKnob.rotation.y = -2.35 + (value / 1023) * 4.7;
  }

  private flashTx(): void {
    this.txMaterial.emissiveIntensity = 2.2;
    if (this.txTimeout !== null) window.clearTimeout(this.txTimeout);
    this.txTimeout = window.setTimeout(() => {
      this.txMaterial.emissiveIntensity = 0;
      this.txTimeout = null;
    }, 70);
  }

  private frame(): void {
    if (this.disposed) return;
    const delta = Math.min(this.clock.getDelta(), 0.05);
    const time = this.clock.elapsedTime;
    this.controls.update();

    this.ledValue += (this.ledTarget - this.ledValue) * Math.min(1, delta * 14);
    this.ledMaterial.emissiveIntensity = this.ledValue * 2.6;
    this.ledMaterial.opacity = 0.78 + this.ledValue * 0.22;
    this.ledLight.intensity = this.ledValue * 1.6;

    this.onboardValue += (this.onboardTarget - this.onboardValue) * Math.min(1, delta * 16);
    this.onboardMaterial.emissiveIntensity = this.onboardValue * 2.4;

    for (const ring of this.rings.values()) {
      if (!ring.visible) continue;
      const pulse = 1 + Math.sin(time * 4) * 0.14;
      ring.scale.setScalar(pulse);
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(time * 4) * 0.25;
    }

    const maxStep = 420 * delta;
    this.servoCurrent += Math.max(-maxStep, Math.min(maxStep, this.servoTarget - this.servoCurrent));
    this.servoHorn.rotation.y = THREE.MathUtils.degToRad(this.servoCurrent);

    this.stepperCurrent +=
      (this.stepperTarget - this.stepperCurrent) * Math.min(1, delta * 10);
    this.stepperHorn.rotation.y = THREE.MathUtils.degToRad(this.stepperCurrent);

    this.soundRings.forEach((ring, index) => {
      const material = ring.material as THREE.MeshBasicMaterial;
      if (this.toneFreq <= 0) {
        material.opacity = 0;
        return;
      }
      const phase = (time * (1.2 + this.toneFreq / 900) + index / 3) % 1;
      ring.scale.setScalar(1 + phase * 2.2);
      material.opacity = (1 - phase) * 0.7;
      material.color.setHSL(Math.min(0.85, this.toneFreq / 1400), 0.65, 0.5);
    });

    const night = this.activeLesson === 'light';
    const exposureTarget = night ? 0.4 + this.lightLevel * 0.75 : 1.05;
    this.exposure += (exposureTarget - this.exposure) * Math.min(1, delta * 6);
    this.renderer.toneMappingExposure = this.exposure;
    const sky = this.scene.background as THREE.Color;
    sky.lerpColors(this.nightColor, this.dayColor, night ? this.lightLevel : 1);
    (this.scene.fog as THREE.Fog).color.copy(sky);

    this.renderer.render(this.scene, this.camera);
  }

  private resize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (width === 0 || height === 0) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
