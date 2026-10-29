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
  | { type: 'pot'; value: number };

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export class BoardState {
  readonly serial = new SerialBuffer();

  buttonPressed = false;
  potValue = 512;

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
    this.emit({ type: 'reset' });
    this.emit({ type: 'pot', value: this.potValue });
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
    return 0;
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
