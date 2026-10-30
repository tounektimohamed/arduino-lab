import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { BoardEvent, BoardState } from '../sim/BoardState';
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

function archPoints(a: THREE.Vector3, b: THREE.Vector3, lift: number): THREE.Vector3[] {
  const start = a.clone();
  const end = b.clone();
  const mid = start.clone().lerp(end, 0.5);
  mid.y = Math.max(start.y, end.y) + lift;
  const startUp = start.clone();
  startUp.y += Math.min(0.45, lift * 0.5);
  const endUp = end.clone();
  endUp.y += Math.min(0.45, lift * 0.5);
  return [start, startUp, mid, endUp, end];
}

function lanePoints(
  start: THREE.Vector3,
  end: THREE.Vector3,
  laneZ: number,
  laneY: number,
): THREE.Vector3[] {
  const startUp = start.clone();
  startUp.y += 0.45;
  const endUp = end.clone();
  endUp.y += 0.4;
  return [
    start,
    startUp,
    vec(start.x, laneY, laneZ),
    vec(end.x, laneY, laneZ),
    endUp,
    end,
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
  private readonly lcdGroup = new THREE.Group();
  private readonly lcdWires = new THREE.Group();
  private readonly lcdCanvas = document.createElement('canvas');
  private lcdTexture!: THREE.CanvasTexture;
  private readonly lamp = new THREE.Group();
  private readonly partKeys = new Map<THREE.Object3D, string>();
  private selection: THREE.BoxHelper | null = null;
  private strip: THREE.Mesh | null = null;
  private breadboardBase!: THREE.Mesh;
  private downX = 0;
  private downY = 0;
  private activeComponents: string[] = [];
  onPartSelect: ((key: string | null) => void) | null = null;
  private readonly soundRings: THREE.Mesh[] = [];
  private readonly dayColor = new THREE.Color('#f2e8d7');
  private readonly nightColor = new THREE.Color('#2f2c3d');
  private lampMaterial!: THREE.MeshBasicMaterial;
  private sunLight!: THREE.PointLight;
  private servoHorn!: THREE.Group;
  private servoTarget = 90;
  private servoCurrent = 90;
  private toneFreq = 0;
  private lightLevel = 0.63;
  private exposure = 1.05;
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

  setLesson(pins: string[], components: string[]): void {
    this.activeComponents = components;
    this.clearSelection();
    const has = (name: string): boolean => components.includes(name);
    this.buzzerGroup.visible = has('buzzer');
    this.buzzerWires.visible = has('buzzer');
    this.ldrGroup.visible = has('ldr');
    this.ldrWires.visible = has('ldr');
    this.servoGroup.visible = has('servo');
    this.servoWires.visible = has('servo');
    this.lcdGroup.visible = has('lcd');
    this.lcdWires.visible = has('lcd');
    const nextTarget = this.viewTarget();
    this.camera.position.add(nextTarget.clone().sub(this.controls.target));
    this.controls.target.copy(nextTarget);
    this.controls.update();
    this.buttonGroup.visible = has('button');
    this.buttonWires.visible = has('button');
    this.potGroup.visible = has('pot');
    this.potWires.visible = has('pot');

    for (const [label, ring] of this.rings) {
      const active = pins.includes(label);
      ring.visible = active;
      const sprite = this.labels.get(label);
      if (sprite) sprite.visible = active;
    }

    if (!has('button')) this.board.setButton(false);
    if (has('pot')) this.setPotVisual(this.board.potValue);
  }

  resetView(): void {
    const target = this.viewTarget();
    this.controls.target.copy(target);
    this.camera.position.copy(target).add(vec(11.2, 10.15, 13.25));
    this.controls.update();
  }

  private viewTarget(): THREE.Vector3 {
    const near = this.activeComponents.includes('servo') || this.activeComponents.includes('lcd');
    return vec(0.3, 0.35, near ? 1.6 : 0.25);
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
      { pins: PINS.filter((pin) => pin.z === -2.28), z: -2.28, key: 'digitalPins' },
      { pins: PINS.filter((pin) => pin.z === -1.96), z: -1.96, key: 'digitalPins' },
      { pins: PINS.filter((pin) => pin.z === 2.28 && pin.label.startsWith('A')), z: 2.28, key: 'analogPins' },
      { pins: PINS.filter((pin) => pin.z === 2.28 && !pin.label.startsWith('A')), z: 2.28, key: 'powerPins' },
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
      this.registerPart(strip, row.key);

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
    this.registerPart(chip, 'chip');

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
    this.registerPart(usb, 'usb');

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
    this.registerPart(jack, 'jack');

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
    this.registerPart(reset, 'reset');

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
      this.registerPart(body, 'capacitors');
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
    this.registerPart(regulator, 'regulator');

    const crystal = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.14, 0.18),
      std(0xc7c9cc, { metalness: 0.7, roughness: 0.3 }),
    );
    crystal.position.set(0.9, 0.18, 1.85);
    group.add(crystal);
    this.registerPart(crystal, 'crystal');

    const onMat = new THREE.MeshStandardMaterial({
      color: 0x37d67a,
      emissive: 0x37d67a,
      emissiveIntensity: 1.2,
      roughness: 0.35,
    });
    const on = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 12), onMat);
    on.position.set(2.72, 0.11, 1.7);
    group.add(on);
    this.registerPart(on, 'powerLed');

    this.onboardMaterial = new THREE.MeshStandardMaterial({
      color: 0xffa63a,
      emissive: 0xffa63a,
      emissiveIntensity: 0,
      roughness: 0.35,
    });
    const ledL = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 12), this.onboardMaterial);
    ledL.position.set(2.36, 0.11, -1.28);
    group.add(ledL);
    this.registerPart(ledL, 'pin13Led');

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
      this.registerPart(led, 'txrxLed');
    }

    // --- détails réalistes : puce USB, ICSP, composants CMS
    const usbChip = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.09, 0.46), std(0x161616, { roughness: 0.55 }));
    usbChip.position.set(-2.55, 0.15, -0.62);
    group.add(usbChip);
    this.registerPart(usbChip, 'usbChip');

    const icsp = new THREE.Group();
    icsp.position.set(3.0, 0.18, 0.25);
    icsp.add(new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.5), headerMat));
    for (const dx of [-0.08, 0.08]) {
      for (const dz of [-0.17, 0, 0.17]) {
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.1, 0.055), goldMat);
        pin.position.set(dx, 0.14, dz);
        icsp.add(pin);
      }
    }
    group.add(icsp);
    this.registerPart(icsp, 'icsp');

    const smdMats = [std(0x1d1d1d, { roughness: 0.6 }), std(0xb89b6a, { roughness: 0.5 })];
    for (let i = 0; i < 24; i++) {
      const smd = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.04, 0.085), smdMats[i % 2]);
      smd.position.set(-2.2 + (i % 8) * 0.68 + (i % 3) * 0.05, 0.1, 0.55 + Math.floor(i / 8) * 0.38);
      smd.rotation.y = i % 5 === 0 ? Math.PI / 2 : 0;
      group.add(smd);
      this.registerPart(smd, 'smd');
    }
  }

  private registerPart(object: THREE.Object3D, key: string): void {
    this.partKeys.set(object, key);
  }

  private pickPart(event: PointerEvent): string | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);

    const roots = [...this.partKeys.keys()].filter((root) => this.isVisible(root));
    const hits = this.raycaster.intersectObjects(roots, true);
    if (hits.length === 0) return null;
    for (const root of roots) {
      if (this.isWithin(hits[0].object, root)) return this.partKeys.get(root) ?? null;
    }
    return null;
  }

  private selectPart(key: string | null): void {
    if (this.selection) {
      this.scene.remove(this.selection);
      this.selection.geometry.dispose();
      this.selection = null;
    }
    if (!key || !key.startsWith('breadboard')) this.clearStrip();
    if (key && !key.startsWith('breadboard')) {
      const root = [...this.partKeys.entries()].find(
        ([object, k]) => k === key && this.isVisible(object),
      )?.[0];
      if (root) {
        root.updateWorldMatrix(true, true);
        const box = new THREE.BoxHelper(root, 0xf2a93b);
        const material = box.material as THREE.LineBasicMaterial;
        material.depthTest = false;
        box.renderOrder = 11;
        this.selection = box;
        this.scene.add(box);
      }
    }
    this.onPartSelect?.(key);
  }

  clearSelection(): void {
    this.selectPart(null);
  }

  private clearStrip(): void {
    if (!this.strip) return;
    this.scene.remove(this.strip);
    this.strip.geometry.dispose();
    this.strip = null;
  }

  /** Surligne les trous reliés entre eux : une demi-colonne de 5 trous, ou un rail entier. */
  private pickBreadboardNode(): string {
    const hit = this.raycaster.intersectObject(this.breadboardBase)[0];
    if (!hit) return 'breadboard';
    const { x, z } = hit.point;

    let width: number;
    let depth: number;
    let cx: number;
    let cz: number;
    let key: string;

    const rail = RAIL_Z.findIndex((railZ) => Math.abs(z - railZ) < 0.12);
    if (rail >= 0) {
      width = railHoleX(24) - railHoleX(0) + 0.3;
      depth = 0.2;
      cx = BREADBOARD.x;
      cz = RAIL_Z[rail];
      key = 'breadboardRail';
    } else if (z > holeZ(0) - 0.2 && z < holeZ(9) + 0.2) {
      const col = Math.min(HOLES.cols - 1, Math.max(0, Math.round((x - BREADBOARD.x) / HOLES.spacing + (HOLES.cols - 1) / 2)));
      const upper = z < BREADBOARD.z;
      const first = upper ? 0 : 5;
      width = 0.2;
      depth = holeZ(first + 4) - holeZ(first) + 0.24;
      cx = holeX(col);
      cz = (holeZ(first) + holeZ(first + 4)) / 2;
      key = 'breadboardColumn';
    } else {
      return 'breadboard';
    }

    this.strip = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.04, depth),
      new THREE.MeshBasicMaterial({ color: 0xf2a93b, transparent: true, opacity: 0.55, depthTest: false }),
    );
    this.strip.position.set(cx, BREADBOARD.h + 0.03, cz);
    this.strip.renderOrder = 9;
    this.scene.add(this.strip);
    return key;
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
    this.registerPart(base, 'breadboard');
    this.breadboardBase = base;

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
    this.buildLcd();
  }

  private buildLed(): void {
    const group = new THREE.Group();
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

    this.registerPart(group, 'led');
    this.scene.add(group);
  }

  private buildResistor(): void {
    const group = new THREE.Group();
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

    this.registerPart(group, 'resistor');
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
    this.registerPart(this.buttonGroup, 'button');
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
    this.registerPart(this.potGroup, 'pot');
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
    this.registerPart(this.buzzerGroup, 'buzzer');
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
    this.registerPart(this.ldrGroup, 'ldr');
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
    this.registerPart(this.servoGroup, 'servo');
    this.scene.add(this.servoGroup);
  }

  /**
   * Module LCD 16x2 I2C posé sur le bureau (comme le servo) : il n'est PAS planté dans la platine.
   * Il se câble directement sur la carte : GND, VCC, SDA (A4) et SCL (A5).
   */
  private buildLcd(): void {
    this.lcdGroup.position.set(-2.6, 0, 5.3);

    const pcb = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.1, 1.8), std(0x1e4fa0, { roughness: 0.6 }));
    pcb.position.y = 0.05;
    pcb.castShadow = true;
    pcb.receiveShadow = true;
    this.lcdGroup.add(pcb);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.14, 1.35), std(0x0e1114, { roughness: 0.5 }));
    frame.position.set(0, 0.17, 0.1);
    frame.castShadow = true;
    this.lcdGroup.add(frame);

    this.lcdCanvas.width = 640;
    this.lcdCanvas.height = 180;
    this.lcdTexture = new THREE.CanvasTexture(this.lcdCanvas);
    this.lcdTexture.colorSpace = THREE.SRGBColorSpace;
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 0.9),
      new THREE.MeshStandardMaterial({
        map: this.lcdTexture,
        emissiveMap: this.lcdTexture,
        emissive: 0xffffff,
        emissiveIntensity: 0.55,
        roughness: 0.4,
      }),
    );
    screen.rotation.x = -Math.PI / 2;
    screen.position.set(0, 0.245, 0.1);
    this.lcdGroup.add(screen);

    // Embase 4 broches (GND, VCC, SDA, SCL) sur le bord arrière du module.
    const header = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.14), std(0x15171a));
    header.position.set(-1.4, 0.16, -0.82);
    this.lcdGroup.add(header);
    const gold = std(0xd4af37, { metalness: 0.8, roughness: 0.3 });
    const pinX = [-1.73, -1.51, -1.29, -1.07];
    for (const x of pinX) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.3, 0.035), gold);
      pin.position.set(x, 0.3, -0.82);
      this.lcdGroup.add(pin);
    }

    // Câbles : GND→GND, 5V→VCC, A4→SDA, A5→SCL (chaque fil va à une broche différente).
    const v = (p: { x: number; y: number; z: number }): THREE.Vector3 => vec(p.x, p.y, p.z);
    const tip = (index: number): THREE.Vector3 =>
      vec(this.lcdGroup.position.x + pinX[index], 0.46, this.lcdGroup.position.z - 0.82);
    this.lcdWires.add(
      wireMesh(archPoints(v(POWER_GND), tip(0), 1.7), COLORS.black),
      wireMesh(archPoints(v(pinWorld('5V')), tip(1), 1.35), COLORS.red),
      wireMesh(archPoints(v(pinWorld('A4')), tip(2), 0.8), COLORS.blue),
      wireMesh(archPoints(v(pinWorld('A5')), tip(3), 1.0), 0xe0b21e),
    );
    this.lcdWires.visible = false;
    this.scene.add(this.lcdWires);

    this.drawLcd(this.board.lcdLines(), this.board.lcdBacklightOn);
    this.registerPart(this.lcdGroup, 'lcd');
    this.scene.add(this.lcdGroup);
    this.lcdGroup.visible = false;
  }

  /** Dessine la grille 16x2 de caractères sur la texture de l'écran. */
  private drawLcd(lines: string[], backlight: boolean): void {
    const ctx = this.lcdCanvas.getContext('2d');
    if (!ctx) return;
    const width = this.lcdCanvas.width;
    const height = this.lcdCanvas.height;
    const cellW = width / 16;
    const cellH = height / 2;

    ctx.fillStyle = backlight ? '#2f86e8' : '#1a2536';
    ctx.fillRect(0, 0, width, height);
    ctx.font = `bold ${Math.floor(cellH * 0.78)}px "Courier New", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 16; col++) {
        ctx.fillStyle = backlight ? 'rgba(10, 50, 120, 0.28)' : 'rgba(255, 255, 255, 0.04)';
        ctx.fillRect(col * cellW + 2, row * cellH + 6, cellW - 4, cellH - 12);
        const char = lines[row]?.[col] ?? ' ';
        if (char !== ' ') {
          ctx.fillStyle = backlight ? '#f2f9ff' : '#3b4d68';
          ctx.fillText(char, col * cellW + cellW / 2, row * cellH + cellH / 2 + 2);
        }
      }
    }
    this.lcdTexture.needsUpdate = true;
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
      wireMesh(lanePoints(p8, vec(holeX(20), 0.95, holeZ(0)), -3.85, 1.55), COLORS.blue),
      wireMesh(archPoints(gndBack, vec(holeX(23), 0.95, holeZ(0)), 1.2), COLORS.black),
    );
    this.buzzerWires.visible = false;
    this.scene.add(this.buzzerWires);

    this.ldrWires.add(
      wireMesh(lanePoints(v5, vec(holeX(20), 1.02, holeZ(9)), 3.35, 1.35), COLORS.red),
      wireMesh(lanePoints(a1, vec(holeX(22), 1.02, holeZ(9)), 3.55, 1.55), 0x8a5ad6),
      wireMesh(lanePoints(gndFront, vec(holeX(25), 1.02, holeZ(9)), 3.15, 1.15), COLORS.black),
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

    const btnA = vec(holeX(16), 0.95, holeZ(0));
    const btnB = vec(holeX(17), 0.95, holeZ(9));
    const potL = vec(holeX(20), 1.02, holeZ(9));
    const potM = vec(holeX(21), 1.02, holeZ(9));
    const potR = vec(holeX(22), 1.02, holeZ(9));

    const p9v = vec(p9.x, p9.y, p9.z);
    const gndv = vec(gnd.x, gnd.y, gnd.z);
    // Les fils arrivent dans la rangée 0 de la même colonne que la patte du composant :
    // le courant circule dans la colonne (5 trous reliés), jamais à travers le composant.
    const base = new THREE.Group();
    base.add(
      wireMesh(archPoints(p9v, vec(holeX(8), 1.0, holeZ(0)), 1.25), COLORS.green),
      wireMesh(archPoints(gndv, vec(holeX(12), 1.0, holeZ(0)), 1.05), COLORS.black),
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
      wireMesh(lanePoints(vec(POWER_GND.x, POWER_GND.y, POWER_GND.z), btnB, 3.15, 1.15), COLORS.black),
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
    for (const label of ['9', '2', 'A0', '5V', 'GND', 'GND-F', '8', '10', 'A1', 'A4', 'A5']) {
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
    canvas.addEventListener('click', this.onCanvasClick);

    this.unsubscribers.push(
      () => canvas.removeEventListener('click', this.onCanvasClick),
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
    this.downX = event.clientX;
    this.downY = event.clientY;
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
    const overPart = hit ? null : this.pickPart(event);
    this.renderer.domElement.style.cursor = hit ? cursors[hit.kind] : overPart ? 'help' : 'grab';
  };

  private onCanvasClick = (event: MouseEvent): void => {
    if (Math.hypot(event.clientX - this.downX, event.clientY - this.downY) > 5) return;
    if (this.pick(event as PointerEvent)) return;
    let key = this.pickPart(event as PointerEvent);
    if (key === 'breadboard') key = this.pickBreadboardNode();
    this.selectPart(key);
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
        this.setButtonVisual(false);
        break;
      case 'pin':
      case 'pwm':
        this.ledTarget = this.board.ledBrightness(9);
        this.onboardTarget = this.board.ledBrightness(13);
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
      case 'lcd':
        this.drawLcd(event.lines, event.backlight);
        break;
    }
  };

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

    const night = this.activeComponents.includes('ldr');
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
