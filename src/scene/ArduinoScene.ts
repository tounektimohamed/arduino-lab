import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
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
  kind: 'button' | 'pot';
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
  private activePointer: 'button' | 'pot' | null = null;
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
    this.buttonGroup.visible = id === 'button';
    this.buttonWires.visible = id === 'button';
    this.potGroup.visible = id === 'pot';
    this.potWires.visible = id === 'pot';

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
    this.controls.target.set(0.3, 0.35, 0.25);
    this.camera.position.set(11.5, 10.5, 13.5);
    this.controls.update();
  }

  dispose(): void {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    for (const unsubscribe of this.unsubscribers) unsubscribe();
    this.controls.dispose();
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

  private buildWires(): void {
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

    const base = new THREE.Group();
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
    for (const label of ['9', '2', 'A0', '5V', 'GND']) {
      const pin = pinWorld(label);

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

      const sprite = labelSprite(label);
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
    if (this.activePointer) return;

    const hit = this.pick(event);
    this.renderer.domElement.style.cursor = hit ? (hit.kind === 'pot' ? 'grab' : 'pointer') : 'grab';
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

  private pick(event: PointerEvent): { kind: 'button' | 'pot' } | null {
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
