export type PinMode = 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP';

export interface SerialLine {
  text: string;
  kind: 'out' | 'err' | 'sys';
}

export class SerialBuffer {
  private lines: SerialLine[] = [];
  private partial = '';
  private listeners = new Set<() => void>();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  write(text: string, newline: boolean): void {
    this.partial += text;
    if (newline) {
      this.lines.push({ text: this.partial, kind: 'out' });
      this.partial = '';
      this.trim();
    }
    this.emit();
  }

  system(text: string): void {
    this.lines.push({ text, kind: 'sys' });
    this.trim();
    this.emit();
  }

  error(text: string): void {
    this.partial = '';
    this.lines.push({ text, kind: 'err' });
    this.trim();
    this.emit();
  }

  clear(): void {
    this.lines = [];
    this.partial = '';
    this.emit();
  }

  getLines(): readonly SerialLine[] {
    return this.lines;
  }

  getPartial(): string {
    return this.partial;
  }

  private trim(): void {
    if (this.lines.length > 240) this.lines.splice(0, this.lines.length - 240);
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

export type BoardEvent =
  | { type: 'reset' }
  | { type: 'pin'; pin: number; value: number }
  | { type: 'pwm'; pin: number; value: number }
  | { type: 'button'; pressed: boolean }
  | { type: 'pot'; value: number }
  | { type: 'tone'; pin: number; freq: number }
  | { type: 'servo'; pin: number; angle: number }
  | { type: 'light'; value: number }
  | { type: 'temperature'; value: number }
  | { type: 'distance'; value: number }
  | { type: 'stepper'; angle: number }
  | { type: 'lcd'; lines: [string, string]; backlight: boolean };

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export class BoardState {
  readonly serial = new SerialBuffer();

  buttonPressed = false;
  potValue = 512;
  lightValue = 650;
  servoAngle = 90;
  temperatureValue = 22;
  distanceCm = 40;
  stepperAngle = 0;
  lcdLines: [string, string] = ['', ''];
  lcdBacklight = true;
  private lcdCursor = { col: 0, row: 0 };
  private toneTimer: number | null = null;

  private modes = new Map<number, PinMode>();
  private outputs = new Map<number, number>();
  private pwmValues = new Map<number, number>();
  private listeners = new Set<(event: BoardEvent) => void>();

  subscribe(listener: (event: BoardEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  reset(): void {
    this.modes.clear();
    this.outputs.clear();
    this.pwmValues.clear();
    this.buttonPressed = false;
    this.clearToneTimer();
    this.servoAngle = 90;
    this.stepperAngle = 0;
    this.lcdLines = ['', ''];
    this.lcdBacklight = true;
    this.lcdCursor = { col: 0, row: 0 };
    this.emit({ type: 'reset' });
    this.emit({ type: 'pot', value: this.potValue });
    this.emit({ type: 'light', value: this.lightValue });
    this.emit({ type: 'servo', pin: 10, angle: 90 });
    this.emit({ type: 'tone', pin: 8, freq: 0 });
    this.emit({ type: 'temperature', value: this.temperatureValue });
    this.emit({ type: 'distance', value: this.distanceCm });
    this.emit({ type: 'stepper', angle: 0 });
    this.emitLcd();
  }

  pinMode(pin: number, mode: number): void {
    const normalized: PinMode = mode === 2 ? 'INPUT_PULLUP' : mode === 1 ? 'OUTPUT' : 'INPUT';
    this.modes.set(pin, normalized);
  }

  digitalWrite(pin: number, value: number): void {
    const level = value ? 1 : 0;
    this.outputs.set(pin, level);
    this.pwmValues.delete(pin);
    this.emit({ type: 'pin', pin, value: level });
  }

  analogWrite(pin: number, value: number): void {
    const level = Math.round(clamp(value, 0, 255));
    this.pwmValues.set(pin, level);
    this.outputs.delete(pin);
    this.emit({ type: 'pwm', pin, value: level });
  }

  digitalRead(pin: number): number {
    if (pin === 2) return this.buttonPressed ? 0 : 1;
    const mode = this.modes.get(pin);
    if (mode === 'INPUT_PULLUP') return 1;
    return this.outputs.get(pin) ?? 0;
  }

  analogRead(pin: number): number {
    if (pin === 0 || pin === 14) return this.potValue;
    if (pin === 1 || pin === 15) return this.lightValue;
    if (pin === 2 || pin === 16) {
      const voltage = 0.5 + this.temperatureValue * 0.01;
      return Math.round(clamp(voltage / 5, 0, 1) * 1023);
    }
    return 0;
  }

  pulseIn(pin: number, _value: number, timeout = 1000000): number {
    if (pin !== 6) return 0;
    const duration = (this.distanceCm * 2) / 0.034;
    return Math.min(Math.round(duration), timeout);
  }

  ledBrightness(pin: number): number {
    const pwm = this.pwmValues.get(pin);
    if (pwm !== undefined) return pwm / 255;
    const output = this.outputs.get(pin);
    if (output !== undefined) return output;
    return 0;
  }

  setButton(pressed: boolean): void {
    if (this.buttonPressed === pressed) return;
    this.buttonPressed = pressed;
    this.emit({ type: 'button', pressed });
  }

  tone(pin: number, freq: number, duration: number): void {
    this.clearToneTimer();
    this.emit({ type: 'tone', pin, freq: Math.max(0, freq) });
    if (duration > 0) {
      this.toneTimer = window.setTimeout(() => {
        this.toneTimer = null;
        this.emit({ type: 'tone', pin, freq: 0 });
      }, duration);
    }
  }

  noTone(pin: number): void {
    this.clearToneTimer();
    this.emit({ type: 'tone', pin, freq: 0 });
  }

  servoWrite(pin: number, angle: number): void {
    this.servoAngle = Math.round(clamp(angle, 0, 180));
    this.emit({ type: 'servo', pin, angle: this.servoAngle });
  }

  setLight(value: number): void {
    const next = Math.round(clamp(value, 0, 1023));
    if (next === this.lightValue) return;
    this.lightValue = next;
    this.emit({ type: 'light', value: next });
  }

  setTemperature(value: number): void {
    const next = Math.round(clamp(value, -10, 50) * 10) / 10;
    if (next === this.temperatureValue) return;
    this.temperatureValue = next;
    this.emit({ type: 'temperature', value: next });
  }

  setDistance(value: number): void {
    const next = Math.round(clamp(value, 2, 200));
    if (next === this.distanceCm) return;
    this.distanceCm = next;
    this.emit({ type: 'distance', value: next });
  }

  stepperStep(steps: number): void {
    const delta = (steps / 2048) * 360;
    this.stepperAngle = ((this.stepperAngle + delta) % 360 + 360) % 360;
    this.emit({ type: 'stepper', angle: this.stepperAngle });
  }

  lcdInit(): void {
    this.lcdLines = ['', ''];
    this.lcdCursor = { col: 0, row: 0 };
    this.lcdBacklight = true;
    this.emitLcd();
  }

  lcdBacklightOn(): void {
    this.lcdBacklight = true;
    this.emitLcd();
  }

  lcdClear(): void {
    this.lcdLines = ['', ''];
    this.lcdCursor = { col: 0, row: 0 };
    this.emitLcd();
  }

  lcdSetCursor(col: number, row: number): void {
    this.lcdCursor = {
      col: Math.round(clamp(col, 0, 15)),
      row: Math.round(clamp(row, 0, 1)),
    };
  }

  lcdPrint(text: string): void {
    let { col, row } = this.lcdCursor;
    for (const char of text) {
      if (col >= 16) {
        col = 0;
        row = (row + 1) % 2;
      }
      const line = (this.lcdLines[row] ?? '').padEnd(16, ' ').slice(0, 16);
      this.lcdLines[row] = `${line.slice(0, col)}${char}${line.slice(col + 1)}`;
      col++;
    }
    this.lcdCursor = { col, row };
    this.emitLcd();
  }

  private emitLcd(): void {
    this.emit({
      type: 'lcd',
      lines: [this.lcdLines[0], this.lcdLines[1]],
      backlight: this.lcdBacklight,
    });
  }

  private clearToneTimer(): void {
    if (this.toneTimer !== null) window.clearTimeout(this.toneTimer);
    this.toneTimer = null;
  }

  setPot(value: number): void {
    const next = Math.round(clamp(value, 0, 1023));
    if (next === this.potValue) return;
    this.potValue = next;
    this.emit({ type: 'pot', value: next });
  }

  private emit(event: BoardEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}
