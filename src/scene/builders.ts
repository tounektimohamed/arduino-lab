import * as THREE from 'three';
import { BOARD, BREADBOARD, HOLES, PINS, RAIL_Z, holeX, holeZ, railHoleX } from './layout';

export function canvasTexture(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponible');
  draw(ctx);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export function boardTexture(): THREE.CanvasTexture {
  const W = 1372;
  const H = 1068;
  return canvasTexture(W, H, (ctx) => {
    const px = (x: number): number => ((x + BOARD.w / 2) / BOARD.w) * W;
    const py = (z: number): number => ((z + BOARD.d / 2) / BOARD.d) * H;

    ctx.strokeStyle = 'rgba(244, 239, 226, 0.5)';
    ctx.lineWidth = 3;
    roundRect(ctx, 12, 12, W - 24, H - 24, 34);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(244, 239, 226, 0.28)';
    ctx.lineWidth = 2;
    for (const [x, z] of [
      [-3.25, -2.45],
      [3.25, -2.45],
      [-3.25, 2.45],
      [3.25, 2.45],
    ]) {
      ctx.beginPath();
      ctx.arc(px(x), py(z), 18, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(247, 242, 231, 0.94)';
    ctx.textAlign = 'right';
    ctx.font = '700 60px Arial, sans-serif';
    ctx.fillText('ARDUINO', px(3.12), py(-1.02));
    ctx.font = '700 36px Arial, sans-serif';
    ctx.fillText('UNO', px(3.12), py(-0.62));
    ctx.font = '600 15px Arial, sans-serif';
    ctx.fillStyle = 'rgba(247, 242, 231, 0.66)';
    ctx.fillText('MADE IN ITALY', px(3.1), py(-0.36));

    ctx.textAlign = 'center';
    for (const pin of PINS) {
      let labelZ = pin.z;
      if (pin.z < -2.1) labelZ = -2.52;
      else if (pin.z < 0) labelZ = -1.67;
      else labelZ = 2.52;

      ctx.fillStyle = 'rgba(247, 242, 231, 0.9)';
      ctx.font = pin.label.length > 3 ? '600 16px Arial, sans-serif' : '700 20px Arial, sans-serif';
      ctx.fillText(pin.label, px(pin.x), py(labelZ) + 6);
    }

    ctx.font = '600 14px Arial, sans-serif';
    ctx.fillStyle = 'rgba(247, 242, 231, 0.62)';
    ctx.fillText('DIGITAL (PWM ~)', px(-1.7), py(-1.48));
    ctx.fillText('ANALOG IN', px(-2.1), py(1.82));
    ctx.fillText('POWER', px(1.05), py(1.82));

    ctx.fillStyle = 'rgba(247, 242, 231, 0.8)';
    ctx.font = '700 12px Arial, sans-serif';
    ctx.fillText('ON', px(2.72), py(1.78));
    ctx.fillText('L', px(2.36), py(-1.22));
    ctx.fillText('TX', px(2.96), py(-1.32));
    ctx.fillText('RX', px(2.96), py(-1.08));
  });
}

export function breadboardTexture(): THREE.CanvasTexture {
  const W = 1660;
  const H = 1100;
  return canvasTexture(W, H, (ctx) => {
    const px = (x: number): number => ((x + BREADBOARD.w / 2) / BREADBOARD.w) * W;
    const py = (z: number): number => ((z + BREADBOARD.d / 2) / BREADBOARD.d) * H;

    const railLine = (z: number, color: string): void => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(px(railHoleX(0)), py(z));
      ctx.lineTo(px(railHoleX(24)), py(z));
      ctx.stroke();
    };

    railLine(RAIL_Z[0], 'rgba(197, 61, 52, 0.55)');
    railLine(RAIL_Z[1], 'rgba(55, 103, 170, 0.55)');
    railLine(RAIL_Z[2], 'rgba(55, 103, 170, 0.55)');
    railLine(RAIL_Z[3], 'rgba(197, 61, 52, 0.55)');

    ctx.font = '700 26px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(197, 61, 52, 0.75)';
    ctx.fillText('+', px(railHoleX(0)) - 16, py(RAIL_Z[0]) + 9);
    ctx.fillText('+', px(railHoleX(24)) + 16, py(RAIL_Z[3]) + 9);
    ctx.fillStyle = 'rgba(55, 103, 170, 0.75)';
    ctx.fillText('−', px(railHoleX(0)) - 16, py(RAIL_Z[1]) + 9);
    ctx.fillText('−', px(railHoleX(24)) + 16, py(RAIL_Z[2]) + 9);

    ctx.fillStyle = 'rgba(74, 64, 50, 0.5)';
    ctx.font = '600 19px Arial, sans-serif';
    for (let col = 0; col < HOLES.cols; col++) {
      const x = px(holeX(col));
      ctx.fillText(String(col + 1), x, py(-2.56) + 6);
      ctx.fillText(String(col + 1), x, py(2.56) + 6);
    }

    ctx.font = '600 18px Arial, sans-serif';
    for (let rowIndex = 0; rowIndex < HOLES.rows; rowIndex++) {
      const label = String.fromCharCode(97 + rowIndex);
      const z = py(holeZ(rowIndex)) + 6;
      ctx.fillText(label, px(-4.02), z);
      ctx.fillText(label, px(4.02), z);
    }

    ctx.strokeStyle = 'rgba(74, 64, 50, 0.12)';
    ctx.lineWidth = 2;
    roundRect(ctx, 16, 16, W - 32, H - 32, 26);
    ctx.stroke();
  });
}

export function deskTexture(): THREE.CanvasTexture {
  const size = 512;
  return canvasTexture(size, size, (ctx) => {
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.05,
      size / 2,
      size / 2,
      size * 0.7,
    );
    gradient.addColorStop(0, '#f8f0e1');
    gradient.addColorStop(0.55, '#f0e5d2');
    gradient.addColorStop(1, '#e3d6c0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = 'rgba(120, 100, 70, 0.045)';
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillRect(x, y, 1.2, 1.2);
    }
  });
}

export function labelSprite(text: string): THREE.Sprite {
  const texture = canvasTexture(256, 128, (ctx) => {
    ctx.clearRect(0, 0, 256, 128);
    ctx.fillStyle = 'rgba(255, 250, 240, 0.96)';
    ctx.strokeStyle = 'rgba(226, 84, 63, 0.8)';
    ctx.lineWidth = 5;
    roundRect(ctx, 14, 18, 228, 92, 26);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2a241c';
    ctx.font = '700 56px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 65);
  });

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.62, 0.31, 1);
  sprite.renderOrder = 20;
  return sprite;
}

export function wireMesh(points: THREE.Vector3[], color: number, radius = 0.042): THREE.Group {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.16);
  const geometry = new THREE.TubeGeometry(curve, Math.max(32, points.length * 18), radius, 7, false);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.42,
    metalness: 0.05,
  });

  const group = new THREE.Group();
  const tube = new THREE.Mesh(geometry, material);
  tube.castShadow = true;
  tube.receiveShadow = true;
  group.add(tube);

  for (const point of [points[0], points[points.length - 1]]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(radius, 8, 8), material);
    cap.position.copy(point);
    cap.castShadow = true;
    group.add(cap);
  }

  return group;
}
