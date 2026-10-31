/**
 * Voiture robot à deux moteurs (Motor Shield : M1 = gauche, M2 = droite) + capteur HC-SR04 à l'avant.
 * Unités de la scène : 1 unité = 4 cm (la voiture mesure environ 22 cm de long).
 */

export interface Box {
  x: number; // centre
  z: number;
  w: number; // largeur (axe x)
  d: number; // profondeur (axe z)
  color: number;
}

export const ARENA = {
  minX: -11,
  maxX: 11,
  minZ: 5,
  maxZ: 21,
  obstacles: [
    { x: -5.5, z: 11.5, w: 4, d: 2, color: 0xd94f3d },
    { x: 5.5, z: 14, w: 2.5, d: 4.5, color: 0x3f7bd9 },
    { x: -1, z: 8.2, w: 2.2, d: 2.2, color: 0x2f9e6f },
  ] as Box[],
};

export const CM_PER_UNIT = 4;
/** Vitesse à pleine puissance, en unités / s (≈ 32 cm/s). */
export const TOP_SPEED = 8;
const TRACK = 4.5; // écart entre les roues
export const CAR_RADIUS = 2.7;
export const SENSOR_OFFSET = 2.6;
const START = { x: 0, z: 17.8, heading: 0 };

export class CarModel {
  x = START.x;
  z = START.z;
  /** 0 = la voiture regarde vers -z ; positif = tourne vers la droite. */
  heading = START.heading;
  /** Vitesse linéaire courante (unités/s), pour animer les roues. */
  speed = 0;
  /** Vitesses normalisées des roues (-1 … 1), pour animer les roues. */
  left = 0;
  right = 0;

  reset(): void {
    this.x = START.x;
    this.z = START.z;
    this.heading = START.heading;
    this.speed = 0;
    this.left = 0;
    this.right = 0;
  }

  forward(): { x: number; z: number } {
    return { x: Math.sin(this.heading), z: -Math.cos(this.heading) };
  }

  /** left / right : de -1 (arrière) à 1 (avant). */
  step(dt: number, left: number, right: number): void {
    this.left = left;
    this.right = right;
    const v = ((left + right) / 2) * TOP_SPEED;
    this.speed = v;
    this.heading -= ((right - left) * TOP_SPEED * dt) / TRACK;

    const f = this.forward();
    const nx = this.x + f.x * v * dt;
    const nz = this.z + f.z * v * dt;
    if (!this.collides(nx, nz)) {
      this.x = nx;
      this.z = nz;
    } else if (!this.collides(nx, this.z)) {
      this.x = nx;
    } else if (!this.collides(this.x, nz)) {
      this.z = nz;
    } else {
      this.speed = 0;
    }
  }

  private collides(x: number, z: number): boolean {
    const r = CAR_RADIUS;
    if (x < ARENA.minX + r || x > ARENA.maxX - r || z < ARENA.minZ + r || z > ARENA.maxZ - r) return true;
    return ARENA.obstacles.some((o) => {
      const dx = Math.max(Math.abs(x - o.x) - o.w / 2, 0);
      const dz = Math.max(Math.abs(z - o.z) - o.d / 2, 0);
      return dx * dx + dz * dz < r * r;
    });
  }

  /**
   * Distance mesurée par le capteur, en cm : un cône d'environ 35° devant la voiture, plus un
   * « couloir » de la largeur de la voiture (pour qu'elle voie tout ce qu'elle risque de heurter).
   */
  sensorCm(): number {
    let best = Infinity;
    const f = this.forward();
    const ox = this.x + f.x * SENSOR_OFFSET;
    const oz = this.z + f.z * SENSOR_OFFSET;
    for (const angle of BEAM) best = Math.min(best, this.rayDistance(ox, oz, this.heading + angle));
    for (const side of CORRIDOR) {
      // décalage latéral (perpendiculaire à l'avant) : (cos h, sin h)
      best = Math.min(
        best,
        this.rayDistance(ox + Math.cos(this.heading) * side, oz + Math.sin(this.heading) * side, this.heading),
      );
    }
    return Math.max(3, Math.round(best * CM_PER_UNIT));
  }

  private rayDistance(ox: number, oz: number, angle: number): number {
    const dx = Math.sin(angle);
    const dz = -Math.cos(angle);
    let best = Infinity;

    // Sortie du rectangle de l'arène.
    if (dx > 1e-9) best = Math.min(best, (ARENA.maxX - ox) / dx);
    if (dx < -1e-9) best = Math.min(best, (ARENA.minX - ox) / dx);
    if (dz > 1e-9) best = Math.min(best, (ARENA.maxZ - oz) / dz);
    if (dz < -1e-9) best = Math.min(best, (ARENA.minZ - oz) / dz);

    for (const o of ARENA.obstacles) {
      const t = rayBox(ox, oz, dx, dz, o);
      if (t !== null) best = Math.min(best, t);
    }
    return best;
  }
}

const BEAM = [-0.3, -0.15, 0, 0.15, 0.3];
const CORRIDOR = [-2.6, -1.3, 1.3, 2.6];

function rayBox(ox: number, oz: number, dx: number, dz: number, b: Box): number | null {
  let tMin = -Infinity;
  let tMax = Infinity;
  const slabs: [number, number, number, number][] = [
    [ox, dx, b.x - b.w / 2, b.x + b.w / 2],
    [oz, dz, b.z - b.d / 2, b.z + b.d / 2],
  ];
  for (const [o, d, lo, hi] of slabs) {
    if (Math.abs(d) < 1e-9) {
      if (o < lo || o > hi) return null;
    } else {
      const t1 = (lo - o) / d;
      const t2 = (hi - o) / d;
      tMin = Math.max(tMin, Math.min(t1, t2));
      tMax = Math.min(tMax, Math.max(t1, t2));
    }
  }
  if (tMax < Math.max(tMin, 0)) return null;
  return tMin >= 0 ? tMin : 0;
}
