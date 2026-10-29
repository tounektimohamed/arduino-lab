export class StopSignal extends Error {
  constructor() {
    super('stop');
    this.name = 'StopSignal';
  }
}

export class ProgramError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProgramError';
  }
}

type Value = number | string;

export interface ArduinoRuntime {
  pinMode(pin: number, mode: number): void;
  digitalWrite(pin: number, value: number): void;
  digitalRead(pin: number): number;
  analogRead(pin: number): number;
  analogWrite(pin: number, value: number): void;
  tone(pin: number, freq: number, duration: number): void;
  noTone(pin: number): void;
  servoAttach(pin: number): void;
  servoWrite(pin: number, angle: number): void;
  pulseIn(pin: number, value: number, timeout: number): number;
  delayMicroseconds(us: number): void;
  lcdInit(): void;
  lcdBacklight(): void;
  lcdClear(): void;
  lcdSetCursor(col: number, row: number): void;
  lcdPrint(text: string): void;
  stepperStep(steps: number): void;
  delay(ms: number): Promise<void>;
  millis(): number;
  serialBegin(baud: number): void;
  serialPrint(text: string, newline: boolean): void;
}

type TokenType = 'num' | 'str' | 'id' | 'op' | 'eof';

interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

type Expr =
  | { type: 'num'; value: number }
  | { type: 'str'; value: string }
  | { type: 'id'; name: string }
  | { type: 'unary'; op: string; expr: Expr }
  | { type: 'binary'; op: string; left: Expr; right: Expr }
  | { type: 'assign'; name: string; op: string; value: Expr }
  | { type: 'postfix'; name: string; op: string }
  | { type: 'member'; object: Expr; property: string }
  | { type: 'call'; callee: Expr; args: Expr[] };

type Stmt =
  | { type: 'block'; body: Stmt[] }
  | { type: 'decl'; decls: { name: string; init: Expr | null }[] }
  | { type: 'expr'; expr: Expr }
  | { type: 'if'; cond: Expr; then: Stmt; otherwise?: Stmt }
  | { type: 'while'; cond: Expr; body: Stmt }
  | { type: 'for'; init: Stmt | null; cond: Expr | null; update: Expr | null; body: Stmt }
  | { type: 'return'; value: Expr | null }
  | { type: 'break' };

interface FuncDef {
  params: string[];
  body: Stmt;
}

export interface ParsedProgram {
  globals: Stmt[];
  functions: Map<string, FuncDef>;
}

const MULTI_OPS = ['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/='];
const TYPE_WORDS = new Set([
  'void',
  'int',
  'float',
  'double',
  'long',
  'short',
  'byte',
  'bool',
  'boolean',
  'char',
  'unsigned',
  'signed',
  'word',
  'String',
  'Servo',
  'Stepper',
  'LiquidCrystal',
  'LiquidCrystal_I2C',
  'auto',
]);
const MODIFIERS = new Set(['const', 'static', 'volatile']);

const CONSTANTS = new Map<string, Value>([
  ['HIGH', 1],
  ['LOW', 0],
  ['INPUT', 0],
  ['OUTPUT', 1],
  ['INPUT_PULLUP', 2],
  ['true', 1],
  ['false', 0],
  ['LED_BUILTIN', 13],
  ['PI', Math.PI],
  ['NOTE_C4', 262],
  ['NOTE_D4', 294],
  ['NOTE_E4', 330],
  ['NOTE_F4', 349],
  ['NOTE_G4', 392],
  ['NOTE_A4', 440],
  ['NOTE_B4', 494],
  ['NOTE_C5', 523],
  ['A0', 14],
  ['A1', 15],
  ['A2', 16],
  ['A3', 17],
  ['A4', 18],
  ['A5', 19],
]);

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  const length = code.length;
  let i = 0;

  while (i < length) {
    const char = code[i];

    if (char === ' ' || char === '\t' || char === '\r' || char === '\n') {
      i++;
      continue;
    }

    if (char === '/' && code[i + 1] === '/') {
      i += 2;
      while (i < length && code[i] !== '\n') i++;
      continue;
    }

    if (char === '/' && code[i + 1] === '*') {
      i += 2;
      while (i < length && !(code[i] === '*' && code[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    if (char === '#') {
      while (i < length && code[i] !== '\n') i++;
      continue;
    }

    if (/[0-9]/.test(char)) {
      const start = i;
      if (char === '0' && (code[i + 1] === 'x' || code[i + 1] === 'X')) {
        i += 2;
        while (i < length && /[0-9a-fA-F]/.test(code[i])) i++;
      } else {
        while (i < length && /[0-9.]/.test(code[i])) i++;
      }
      tokens.push({ type: 'num', value: code.slice(start, i), pos: start });
      continue;
    }

    if (/[A-Za-z_]/.test(char)) {
      const start = i;
      while (i < length && /[A-Za-z0-9_]/.test(code[i])) i++;
      tokens.push({ type: 'id', value: code.slice(start, i), pos: start });
      continue;
    }

    if (char === '"') {
      const start = i;
      i++;
      let value = '';
      while (i < length && code[i] !== '"') {
        if (code[i] === '\\' && i + 1 < length) {
          const escape = code[i + 1];
          value += escape === 'n' ? '\n' : escape === 't' ? '\t' : escape;
          i += 2;
        } else {
          value += code[i];
          i++;
        }
      }
      if (i >= length) throw new ProgramError('Chaîne de caractères non fermée.');
      i++;
      tokens.push({ type: 'str', value, pos: start });
      continue;
    }

    const multi = MULTI_OPS.find((operator) => code.startsWith(operator, i));
    if (multi) {
      tokens.push({ type: 'op', value: multi, pos: i });
      i += multi.length;
      continue;
    }

    if ('+-*/%=<>!(){};,.[]'.includes(char)) {
      tokens.push({ type: 'op', value: char, pos: i });
      i++;
      continue;
    }

    throw new ProgramError(`Caractère inattendu : « ${char} ».`);
  }

  tokens.push({ type: 'eof', value: '', pos: length });
  return tokens;
}

class Parser {
  private tokens: Token[];
  private index = 0;

  constructor(private code: string) {
    this.tokens = tokenize(code);
  }

  parse(): ParsedProgram {
    const globals: Stmt[] = [];
    const functions = new Map<string, FuncDef>();

    while (!this.atEnd()) {
      if (this.isDeclarationStart()) {
        const save = this.index;
        while (this.peek().type === 'id' && MODIFIERS.has(this.peek().value)) this.next();
        if (this.peek().type === 'id' && TYPE_WORDS.has(this.peek().value)) {
          this.next();
          if (this.peek().type === 'id' && this.peek(1).value === '(') {
            const name = this.next().value;
            const params = this.parseParams();
            const body = this.parseBlock();
            functions.set(name, { params, body });
            continue;
          }
        }
        this.index = save;
        globals.push(this.parseDeclaration());
      } else {
        globals.push(this.parseStatement());
      }
    }

    return { globals, functions };
  }

  private parseParams(): string[] {
    this.expect('(');
    const params: string[] = [];
    if (!this.check(')')) {
      do {
        while (this.peek().type === 'id' && TYPE_WORDS.has(this.peek().value)) this.next();
        params.push(this.expectId());
      } while (this.match(','));
    }
    this.expect(')');
    return params;
  }

  private parseBlock(): Stmt {
    this.expect('{');
    const body: Stmt[] = [];
    while (!this.check('}') && !this.atEnd()) body.push(this.parseStatement());
    this.expect('}');
    return { type: 'block', body };
  }

  private parseStatement(): Stmt {
    if (this.check('{')) return this.parseBlock();
    if (this.match('if')) return this.parseIf();
    if (this.match('while')) return this.parseWhile();
    if (this.match('for')) return this.parseFor();
    if (this.match('return')) {
      const value = this.check(';') ? null : this.parseExpression();
      this.expect(';');
      return { type: 'return', value };
    }
    if (this.match('break')) {
      this.expect(';');
      return { type: 'break' };
    }
    if (this.isDeclarationStart()) return this.parseDeclaration();

    const expr = this.parseExpression();
    this.expect(';');
    return { type: 'expr', expr };
  }

  private parseIf(): Stmt {
    this.expect('(');
    const cond = this.parseExpression();
    this.expect(')');
    const thenBranch = this.parseStatement();
    const otherwise = this.match('else') ? this.parseStatement() : undefined;
    return { type: 'if', cond, then: thenBranch, otherwise };
  }

  private parseWhile(): Stmt {
    this.expect('(');
    const cond = this.parseExpression();
    this.expect(')');
    return { type: 'while', cond, body: this.parseStatement() };
  }

  private parseFor(): Stmt {
    this.expect('(');
    let init: Stmt | null = null;
    if (!this.check(';')) {
      if (this.isDeclarationStart()) {
        init = this.parseDeclaration();
      } else {
        init = { type: 'expr', expr: this.parseExpression() };
        this.expect(';');
      }
    } else {
      this.expect(';');
    }

    const cond = this.check(';') ? null : this.parseExpression();
    this.expect(';');
    const update = this.check(')') ? null : this.parseExpression();
    this.expect(')');
    return { type: 'for', init, cond, update, body: this.parseStatement() };
  }

  private parseDeclaration(): Stmt {
    while (this.peek().type === 'id' && MODIFIERS.has(this.peek().value)) this.next();
    if (!this.isTypeStart()) throw this.error('Type attendu');
    this.next();
    const decls: { name: string; init: Expr | null }[] = [];
    do {
      const name = this.expectId();
      let init: Expr | null = null;
      if (this.match('=')) {
        init = this.parseExpression();
      } else if (this.match('(')) {
        this.parseArgs();
      }
      decls.push({ name, init });
    } while (this.match(','));
    this.expect(';');
    return { type: 'decl', decls };
  }

  private parseExpression(): Expr {
    return this.parseAssignment();
  }

  private parseAssignment(): Expr {
    const left = this.parseOr();
    const token = this.peek();
    if (token.type === 'op' && ['=', '+=', '-=', '*=', '/='].includes(token.value)) {
      this.next();
      const value = this.parseAssignment();
      if (left.type !== 'id') throw this.error('Assignation invalide');
      return { type: 'assign', name: left.name, op: token.value, value };
    }
    return left;
  }

  private parseOr(): Expr {
    let left = this.parseAnd();
    while (this.check('||')) {
      this.next();
      left = { type: 'binary', op: '||', left, right: this.parseAnd() };
    }
    return left;
  }

  private parseAnd(): Expr {
    let left = this.parseEquality();
    while (this.check('&&')) {
      this.next();
      left = { type: 'binary', op: '&&', left, right: this.parseEquality() };
    }
    return left;
  }

  private parseEquality(): Expr {
    let left = this.parseRelational();
    while (this.check('==') || this.check('!=')) {
      const op = this.next().value;
      left = { type: 'binary', op, left, right: this.parseRelational() };
    }
    return left;
  }

  private parseRelational(): Expr {
    let left = this.parseAdditive();
    while (this.check('<') || this.check('>') || this.check('<=') || this.check('>=')) {
      const op = this.next().value;
      left = { type: 'binary', op, left, right: this.parseAdditive() };
    }
    return left;
  }

  private parseAdditive(): Expr {
    let left = this.parseMultiplicative();
    while (this.check('+') || this.check('-')) {
      const op = this.next().value;
      left = { type: 'binary', op, left, right: this.parseMultiplicative() };
    }
    return left;
  }

  private parseMultiplicative(): Expr {
    let left = this.parseUnary();
    while (this.check('*') || this.check('/') || this.check('%')) {
      const op = this.next().value;
      left = { type: 'binary', op, left, right: this.parseUnary() };
    }
    return left;
  }

  private parseUnary(): Expr {
    if (this.check('!') || this.check('-') || this.check('+')) {
      const op = this.next().value;
      return { type: 'unary', op, expr: this.parseUnary() };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Expr {
    let expr = this.parsePrimary();

    for (;;) {
      if (this.match('.')) {
        expr = { type: 'member', object: expr, property: this.expectId() };
      } else if (this.match('(')) {
        expr = { type: 'call', callee: expr, args: this.parseArgs() };
      } else if (this.check('++') || this.check('--')) {
        const op = this.next().value;
        if (expr.type !== 'id') throw this.error('Incrément invalide');
        expr = { type: 'postfix', name: expr.name, op };
      } else {
        break;
      }
    }

    return expr;
  }

  private parseArgs(): Expr[] {
    const args: Expr[] = [];
    if (!this.check(')')) {
      do {
        args.push(this.parseExpression());
      } while (this.match(','));
    }
    this.expect(')');
    return args;
  }

  private parsePrimary(): Expr {
    const token = this.peek();
    if (token.type === 'num') {
      this.next();
      return { type: 'num', value: Number(token.value) };
    }
    if (token.type === 'str') {
      this.next();
      return { type: 'str', value: token.value };
    }
    if (token.type === 'id') {
      this.next();
      return { type: 'id', name: token.value };
    }
    if (this.match('(')) {
      const expr = this.parseExpression();
      this.expect(')');
      return expr;
    }
    throw this.error('Expression attendue');
  }

  private isTypeStart(): boolean {
    return this.peek().type === 'id' && TYPE_WORDS.has(this.peek().value);
  }

  private isDeclarationStart(): boolean {
    if (this.peek().type !== 'id') return false;
    return MODIFIERS.has(this.peek().value) || TYPE_WORDS.has(this.peek().value);
  }

  private peek(offset = 0): Token {
    return this.tokens[Math.min(this.index + offset, this.tokens.length - 1)];
  }

  private next(): Token {
    return this.tokens[this.index++];
  }

  private check(value: string): boolean {
    return this.peek().value === value;
  }

  private match(value: string): boolean {
    if (!this.check(value)) return false;
    this.index++;
    return true;
  }

  private expect(value: string): Token {
    if (!this.check(value)) throw this.error(`« ${value} » attendu`);
    return this.next();
  }

  private expectId(): string {
    const token = this.peek();
    if (token.type !== 'id') throw this.error('Nom attendu');
    this.index++;
    return token.value;
  }

  private atEnd(): boolean {
    return this.peek().type === 'eof';
  }

  private error(message: string): ProgramError {
    const token = this.peek();
    let line = 1;
    for (let i = 0; i < token.pos && i < this.code.length; i++) {
      if (this.code[i] === '\n') line++;
    }
    return new ProgramError(`${message} (ligne ${line}).`);
  }
}

class Scope {
  private vars = new Map<string, Value>();

  constructor(private parent: Scope | null = null) {}

  get(name: string): Value | undefined {
    if (this.vars.has(name)) return this.vars.get(name);
    return this.parent?.get(name);
  }

  set(name: string, value: Value): void {
    this.vars.set(name, value);
  }

  assign(name: string, value: Value): boolean {
    if (this.vars.has(name)) {
      this.vars.set(name, value);
      return true;
    }
    return this.parent?.assign(name, value) ?? false;
  }
}

class ReturnSignal extends Error {
  constructor(readonly value: Value) {
    super('return');
    this.name = 'ReturnSignal';
  }
}

class BreakSignal extends Error {
  constructor() {
    super('break');
    this.name = 'BreakSignal';
  }
}

function truthy(value: Value): boolean {
  return typeof value === 'string' ? value.length > 0 : value !== 0;
}

function toNumber(value: Value): number {
  if (typeof value === 'number') return value;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatValue(value: Value): string {
  if (typeof value === 'string') return value;
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 1000) / 1000);
}

function valuesEqual(left: Value, right: Value): boolean {
  if (typeof left === 'string' || typeof right === 'string') {
    return formatValue(left) === formatValue(right);
  }
  return left === right;
}

function binary(op: string, left: Value, right: Value): Value {
  switch (op) {
    case '+':
      if (typeof left === 'string' || typeof right === 'string') {
        return formatValue(left) + formatValue(right);
      }
      return left + right;
    case '-':
      return toNumber(left) - toNumber(right);
    case '*':
      return toNumber(left) * toNumber(right);
    case '/':
      return toNumber(left) / toNumber(right);
    case '%':
      return toNumber(left) % toNumber(right);
    case '==':
      return valuesEqual(left, right) ? 1 : 0;
    case '!=':
      return valuesEqual(left, right) ? 0 : 1;
    case '<':
      return toNumber(left) < toNumber(right) ? 1 : 0;
    case '>':
      return toNumber(left) > toNumber(right) ? 1 : 0;
    case '<=':
      return toNumber(left) <= toNumber(right) ? 1 : 0;
    case '>=':
      return toNumber(left) >= toNumber(right) ? 1 : 0;
    default:
      throw new ProgramError(`Opérateur inconnu : ${op}.`);
  }
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin;
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

class Executor {
  private globals = new Scope();
  private ops = 0;
  private callDepth = 0;
  private servos = new Map<string, number>();

  constructor(
    private program: ParsedProgram,
    private runtime: ArduinoRuntime,
    private shouldStop: () => boolean,
  ) {}

  async run(): Promise<void> {
    for (const statement of this.program.globals) {
      await this.exec(statement, this.globals);
    }

    const setup = this.program.functions.get('setup');
    const loop = this.program.functions.get('loop');
    if (!setup || !loop) {
      throw new ProgramError('Le programme doit contenir setup() et loop().');
    }

    await this.callUser('setup', []);
    while (!this.shouldStop()) {
      await this.callUser('loop', []);
      await this.tick();
    }
  }

  private async callUser(name: string, args: Value[]): Promise<Value> {
    const fn = this.program.functions.get(name);
    if (!fn) throw new ProgramError(`Fonction inconnue : ${name}().`);
    if (this.callDepth > 32) throw new ProgramError('Récursion trop profonde.');

    this.callDepth++;
    const scope = new Scope(this.globals);
    fn.params.forEach((param, index) => scope.set(param, args[index] ?? 0));

    try {
      await this.exec(fn.body, scope);
    } catch (error) {
      if (error instanceof ReturnSignal) return error.value;
      throw error;
    } finally {
      this.callDepth--;
    }
    return 0;
  }

  private async exec(stmt: Stmt, scope: Scope): Promise<void> {
    await this.tick();

    switch (stmt.type) {
      case 'block':
        for (const statement of stmt.body) await this.exec(statement, scope);
        return;
      case 'decl':
        for (const declaration of stmt.decls) {
          const value = declaration.init ? await this.evaluate(declaration.init, scope) : 0;
          scope.set(declaration.name, value);
        }
        return;
      case 'expr':
        await this.evaluate(stmt.expr, scope);
        return;
      case 'if':
        if (truthy(await this.evaluate(stmt.cond, scope))) {
          await this.exec(stmt.then, scope);
        } else if (stmt.otherwise) {
          await this.exec(stmt.otherwise, scope);
        }
        return;
      case 'while':
        while (truthy(await this.evaluate(stmt.cond, scope))) {
          try {
            await this.exec(stmt.body, scope);
          } catch (error) {
            if (error instanceof BreakSignal) break;
            throw error;
          }
          await this.tick();
        }
        return;
      case 'for': {
        const forScope = new Scope(scope);
        if (stmt.init) await this.exec(stmt.init, forScope);
        while (!stmt.cond || truthy(await this.evaluate(stmt.cond, forScope))) {
          try {
            await this.exec(stmt.body, forScope);
          } catch (error) {
            if (error instanceof BreakSignal) break;
            throw error;
          }
          if (stmt.update) await this.evaluate(stmt.update, forScope);
          await this.tick();
        }
        return;
      }
      case 'return':
        throw new ReturnSignal(stmt.value ? await this.evaluate(stmt.value, scope) : 0);
      case 'break':
        throw new BreakSignal();
    }
  }

  private async evaluate(expr: Expr, scope: Scope): Promise<Value> {
    switch (expr.type) {
      case 'num':
        return expr.value;
      case 'str':
        return expr.value;
      case 'id': {
        const value = scope.get(expr.name) ?? CONSTANTS.get(expr.name);
        if (value === undefined) throw new ProgramError(`Variable inconnue : ${expr.name}.`);
        return value;
      }
      case 'unary': {
        const value = await this.evaluate(expr.expr, scope);
        if (expr.op === '!') return truthy(value) ? 0 : 1;
        if (expr.op === '-') return -toNumber(value);
        return toNumber(value);
      }
      case 'binary': {
        if (expr.op === '&&') {
          const left = await this.evaluate(expr.left, scope);
          if (!truthy(left)) return 0;
          return truthy(await this.evaluate(expr.right, scope)) ? 1 : 0;
        }
        if (expr.op === '||') {
          const left = await this.evaluate(expr.left, scope);
          if (truthy(left)) return 1;
          return truthy(await this.evaluate(expr.right, scope)) ? 1 : 0;
        }
        const left = await this.evaluate(expr.left, scope);
        const right = await this.evaluate(expr.right, scope);
        return binary(expr.op, left, right);
      }
      case 'assign': {
        let value = await this.evaluate(expr.value, scope);
        if (expr.op !== '=') {
          value = binary(expr.op[0], scope.get(expr.name) ?? 0, value);
        }
        if (!scope.assign(expr.name, value)) scope.set(expr.name, value);
        return value;
      }
      case 'postfix': {
        const current = toNumber(scope.get(expr.name) ?? 0);
        const next = current + (expr.op === '++' ? 1 : -1);
        if (!scope.assign(expr.name, next)) scope.set(expr.name, next);
        return current;
      }
      case 'member':
        throw new ProgramError('Accès membre invalide.');
      case 'call':
        return this.evalCall(expr, scope);
    }
  }

  private async evalCall(expr: Extract<Expr, { type: 'call' }>, scope: Scope): Promise<Value> {
    const args: Value[] = [];
    for (const arg of expr.args) args.push(await this.evaluate(arg, scope));

    if (expr.callee.type === 'member') {
      const member = expr.callee;
      if (member.object.type === 'id' && member.object.name === 'Serial') {
        switch (member.property) {
          case 'begin':
            this.runtime.serialBegin(toNumber(args[0] ?? 9600));
            return 0;
          case 'print':
            this.runtime.serialPrint(args.map(formatValue).join(''), false);
            return 0;
          case 'println':
            this.runtime.serialPrint(args.map(formatValue).join(''), true);
            return 0;
          default:
            throw new ProgramError(`Serial.${member.property}() n'est pas supporté.`);
        }
      }
      if (member.object.type === 'id') {
        const name = member.object.name;
        const num = (index: number): number => toNumber(args[index] ?? 0);
        switch (member.property) {
          case 'attach':
            this.servos.set(name, num(0));
            this.runtime.servoAttach(num(0));
            return 0;
          case 'write': {
            const pin = this.servos.get(name);
            if (pin === undefined) throw new ProgramError('Servo : appelez attach() avant write().');
            this.runtime.servoWrite(pin, Math.min(180, Math.max(0, num(0))));
            return 0;
          }
          case 'detach':
            this.servos.delete(name);
            return 0;
          case 'init':
            this.runtime.lcdInit();
            return 0;
          case 'backlight':
            this.runtime.lcdBacklight();
            return 0;
          case 'clear':
            this.runtime.lcdClear();
            return 0;
          case 'setCursor':
            this.runtime.lcdSetCursor(num(0), num(1));
            return 0;
          case 'print':
            this.runtime.lcdPrint(args.map(formatValue).join(''));
            return 0;
          case 'setSpeed':
            return 0;
          case 'step':
            this.runtime.stepperStep(num(0));
            return 0;
        }
      }
      throw new ProgramError('Appel de méthode non supporté.');
    }

    if (expr.callee.type === 'id') {
      const name = expr.callee.name;
      if (this.program.functions.has(name)) return this.callUser(name, args);
      return this.callBuiltin(name, args);
    }

    throw new ProgramError('Appel invalide.');
  }

  private async callBuiltin(name: string, args: Value[]): Promise<Value> {
    const arg = (index: number): number => toNumber(args[index] ?? 0);

    switch (name) {
      case 'pinMode':
        this.runtime.pinMode(arg(0), arg(1));
        return 0;
      case 'digitalWrite':
        this.runtime.digitalWrite(arg(0), arg(1));
        return 0;
      case 'digitalRead':
        return this.runtime.digitalRead(arg(0));
      case 'analogRead':
        return this.runtime.analogRead(arg(0));
      case 'analogWrite':
        this.runtime.analogWrite(arg(0), arg(1));
        return 0;
      case 'delay':
        await this.runtime.delay(Math.max(0, arg(0)));
        return 0;
      case 'delayMicroseconds':
        this.runtime.delayMicroseconds(Math.max(0, arg(0)));
        return 0;
      case 'pulseIn':
        return this.runtime.pulseIn(
          arg(0),
          arg(1),
          args.length > 2 ? arg(2) : 1000000,
        );
      case 'millis':
        return this.runtime.millis();
      case 'micros':
        return this.runtime.millis() * 1000;
      case 'map':
        return mapRange(arg(0), arg(1), arg(2), arg(3), arg(4));
      case 'constrain':
        return Math.min(Math.max(arg(0), arg(1)), arg(2));
      case 'min':
        return Math.min(arg(0), arg(1));
      case 'max':
        return Math.max(arg(0), arg(1));
      case 'abs':
        return Math.abs(arg(0));
      case 'round':
        return Math.round(arg(0));
      case 'floor':
        return Math.floor(arg(0));
      case 'ceil':
        return Math.ceil(arg(0));
      case 'sqrt':
        return Math.sqrt(arg(0));
      case 'pow':
        return Math.pow(arg(0), arg(1));
      case 'sq':
        return arg(0) * arg(0);
      case 'tone':
        this.runtime.tone(arg(0), arg(1), arg(2));
        return 0;
      case 'noTone':
        this.runtime.noTone(arg(0));
        return 0;
      case 'random':
        return args.length > 1
          ? arg(0) + Math.floor(Math.random() * (arg(1) - arg(0)))
          : Math.floor(Math.random() * arg(0));
      case 'randomSeed':
        return 0;
      default:
        throw new ProgramError(`Fonction inconnue : ${name}().`);
    }
  }

  private async tick(): Promise<void> {
    if (this.shouldStop()) throw new StopSignal();
    this.ops++;
    if (this.ops >= 2000) {
      this.ops = 0;
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
      if (this.shouldStop()) throw new StopSignal();
    }
  }
}

export class Interpreter {
  constructor(private runtime: ArduinoRuntime) {}

  parse(code: string): ParsedProgram {
    return new Parser(code).parse();
  }

  async run(program: ParsedProgram, shouldStop: () => boolean): Promise<void> {
    await new Executor(program, this.runtime, shouldStop).run();
  }
}
