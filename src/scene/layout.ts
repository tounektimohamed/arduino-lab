export const BOARD = {
  x: -4.2,
  y: 0.08,
  z: 0,
  w: 6.86,
  h: 0.16,
  d: 5.34,
};

export const BREADBOARD = {
  x: 3.45,
  y: 0,
  z: 0.35,
  w: 8.3,
  h: 0.84,
  d: 5.5,
};

export interface PinDef {
  label: string;
  x: number;
  z: number;
}

const row = (labels: string[], x0: number, z: number): PinDef[] =>
  labels.map((label, index) => ({ label, x: x0 + index * 0.32, z }));

export const PINS: PinDef[] = [
  ...row(['0', '1', '2', '3', '4', '5', '6', '7'], -2.9, -2.28),
  ...row(['8', '9', '10', '11', '12', '13', 'GND', 'AREF'], 0.3, -1.96),
  ...row(['A0', 'A1', 'A2', 'A3', 'A4', 'A5'], -2.9, 2.28),
  ...row(['IOREF', 'RESET', '3V3', '5V', 'GND', 'GND', 'VIN'], 0.1, 2.28),
];

export function pinDef(label: string): PinDef {
  return PINS.find((pin) => pin.label === label) ?? PINS[0];
}

export function pinWorld(label: string): { x: number; y: number; z: number } {
  const pin = pinDef(label);
  return { x: BOARD.x + pin.x, y: BOARD.y + 0.38, z: BOARD.z + pin.z };
}

export const POWER_GND = {
  x: BOARD.x + 1.38,
  y: BOARD.y + 0.38,
  z: 2.28,
};

export const HOLES = {
  cols: 30,
  rows: 10,
  spacing: 0.27,
};

export function holeX(col: number): number {
  return BREADBOARD.x + (col - (HOLES.cols - 1) / 2) * HOLES.spacing;
}

export function holeZ(row: number): number {
  if (row < 5) {
    return BREADBOARD.z - 0.15 - (4 - row) * HOLES.spacing;
  }
  return BREADBOARD.z + 0.15 + (row - 5) * HOLES.spacing;
}

export function holeWorld(col: number, row: number): { x: number; y: number; z: number } {
  return { x: holeX(col), y: BREADBOARD.h, z: holeZ(row) };
}

export const RAIL_Z = [-2.28, -2.06, 2.06, 2.28];

export function railHoleX(index: number): number {
  return BREADBOARD.x + (index - 12) * 0.29;
}

export const COMPONENT_LAYOUT = {
  led: {
    x: (holeX(10) + holeX(11)) / 2,
    z: holeZ(6),
    anode: { x: holeX(10), z: holeZ(6) },
    cathode: { x: holeX(11), z: holeZ(6) },
  },
  resistor: {
    left: { x: holeX(8), z: holeZ(3) },
    right: { x: holeX(11), z: holeZ(3) },
  },
  button: {
    x: (holeX(16) + holeX(17)) / 2,
    z: (holeZ(4) + holeZ(5)) / 2,
    a: { x: holeX(16), z: holeZ(4) },
    b: { x: holeX(17), z: holeZ(5) },
  },
  pot: {
    x: holeX(21),
    z: holeZ(6),
    left: { x: holeX(20), z: holeZ(6) },
    middle: { x: holeX(21), z: holeZ(6) },
    right: { x: holeX(22), z: holeZ(6) },
  },
};
