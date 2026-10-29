import { BoardState } from './BoardState';
import {
  Interpreter,
  StopSignal,
  type ArduinoRuntime,
  type ParsedProgram,
} from './interpreter';

export class Simulator {
  readonly board = new BoardState();

  private token = 0;
  private runningFlag = false;
  private listeners = new Set<(running: boolean) => void>();

  get running(): boolean {
    return this.runningFlag;
  }

  subscribe(listener: (running: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async start(code: string): Promise<void> {
    this.stop();

    const token = this.token;
    const startedAt = performance.now();
    this.runningFlag = true;
    this.board.reset();
    this.emit();

    const runtime = this.createRuntime(token, startedAt);
    const interpreter = new Interpreter(runtime);

    try {
      const program: ParsedProgram = interpreter.parse(code);
      await interpreter.run(program, () => token !== this.token || !this.runningFlag);
    } catch (error) {
      if (!(error instanceof StopSignal)) {
        const message = error instanceof Error ? error.message : String(error);
        this.board.serial.error(message);
      }
    } finally {
      if (token === this.token) {
        this.runningFlag = false;
        this.emit();
      }
    }
  }

  stop(): void {
    this.token++;
    if (this.runningFlag) {
      this.runningFlag = false;
      this.emit();
    }
  }

  private createRuntime(token: number, startedAt: number): ArduinoRuntime {
    const board = this.board;
    const isActive = (): boolean => token === this.token && this.runningFlag;

    return {
      pinMode: (pin, mode) => board.pinMode(pin, mode),
      digitalWrite: (pin, value) => board.digitalWrite(pin, value),
      digitalRead: (pin) => board.digitalRead(pin),
      analogRead: (pin) => board.analogRead(pin),
      analogWrite: (pin, value) => board.analogWrite(pin, value),
      delay: async (ms) => {
        const end = performance.now() + Math.min(Math.max(ms, 0), 5000);
        while (performance.now() < end) {
          if (!isActive()) throw new StopSignal();
          const remaining = Math.max(0, end - performance.now());
          await new Promise<void>((resolve) => setTimeout(resolve, Math.min(24, remaining)));
        }
        if (!isActive()) throw new StopSignal();
      },
      millis: () => Math.round(performance.now() - startedAt),
      serialBegin: () => undefined,
      serialPrint: (text, newline) => board.serial.write(text, newline),
    };
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.runningFlag);
  }
}
