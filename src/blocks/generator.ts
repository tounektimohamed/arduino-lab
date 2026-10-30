import { getDef, type Block, type Workspace } from './definitions';

interface Ctx {
  vars: Set<string>;
  servoPin: string | null;
  lcd: boolean;
  serial: boolean;
  loops: number;
  ultra: { trig: string; echo: string } | null;
}

const LOOP_NAMES = ['i', 'j', 'k', 'l', 'm'];

function num(raw: string | undefined): string {
  const n = Number.parseFloat((raw ?? '').replace(',', '.'));
  return Number.isFinite(n) ? String(n) : '0';
}

function text(raw: string | undefined): string {
  return (raw ?? '').replace(/[\\"]/g, ' ').replace(/[\r\n]+/g, ' ');
}

/** Valeur d'une liste déroulante, vérifiée par rapport aux options autorisées. */
function sel(block: Block, key: string): string {
  const def = getDef(block.type);
  const part = def?.parts.find((p) => p.k === 'sel' && p.key === key);
  const value = block.vals[key];
  if (part && part.k === 'sel') {
    return part.opts.some((o) => o[0] === value) ? value : part.def;
  }
  return '0';
}

function val(block: Block, key: string, ctx: Ctx): string {
  const kid = block.kids[key];
  return kid ? expr(kid, ctx) : num(block.vals[key]);
}

function cond(block: Block, key: string, ctx: Ctx): string {
  const kid = block.kids[key];
  return kid ? expr(kid, ctx) : 'false';
}

function expr(b: Block, ctx: Ctx): string {
  switch (b.type) {
    case 'read_digital':
      return `digitalRead(${sel(b, 'pin')})`;
    case 'read_analog':
      return `analogRead(${sel(b, 'pin')})`;
    case 'pin_is':
      return `(digitalRead(${sel(b, 'pin')}) == ${sel(b, 'level')})`;
    case 'millis':
      return 'millis()';
    case 'temp':
      return `round((analogRead(${sel(b, 'pin')}) * 5.0 / 1023.0 - 0.5) * 100.0)`;
    case 'var': {
      const name = sel(b, 'name');
      ctx.vars.add(name);
      return name;
    }
    case 'arith':
      return `(${val(b, 'a', ctx)} ${sel(b, 'op')} ${val(b, 'b', ctx)})`;
    case 'map':
      return `map(${val(b, 'v', ctx)}, 0, 1023, ${val(b, 'c', ctx)}, ${val(b, 'd', ctx)})`;
    case 'random':
      return `random(${val(b, 'a', ctx)}, ${val(b, 'b', ctx)})`;
    case 'cmp':
      return `(${val(b, 'a', ctx)} ${sel(b, 'op')} ${val(b, 'b', ctx)})`;
    case 'and':
      return `(${cond(b, 'a', ctx)} && ${cond(b, 'b', ctx)})`;
    case 'or':
      return `(${cond(b, 'a', ctx)} || ${cond(b, 'b', ctx)})`;
    case 'not':
      return `(!${cond(b, 'a', ctx)})`;
    default:
      return '0';
  }
}

function body(list: Block[], ctx: Ctx, ind: string): string[] {
  const out: string[] = [];
  for (const b of list) out.push(...stmt(b, ctx, ind));
  return out;
}

function stmt(b: Block, ctx: Ctx, ind: string): string[] {
  const inner = ind + '  ';
  switch (b.type) {
    case 'pin_mode':
      return [`${ind}pinMode(${sel(b, 'pin')}, ${sel(b, 'mode')});`];
    case 'write':
      return [`${ind}digitalWrite(${sel(b, 'pin')}, ${sel(b, 'level')});`];
    case 'pwm':
      return [`${ind}analogWrite(${sel(b, 'pin')}, ${val(b, 'v', ctx)});`];
    case 'servo':
      ctx.servoPin ??= sel(b, 'pin');
      return [`${ind}bras.write(${val(b, 'v', ctx)});`];
    case 'wait':
      return [`${ind}delay(${val(b, 'ms', ctx)});`];
    case 'repeat': {
      const i = ctx.loops++;
      const v = LOOP_NAMES[i] ?? `i${i}`;
      return [
        `${ind}for (int ${v} = 0; ${v} < ${val(b, 'n', ctx)}; ${v}++) {`,
        ...body(b.stacks.body ?? [], ctx, inner),
        `${ind}}`,
      ];
    }
    case 'while':
      return [`${ind}while (${cond(b, 'cond', ctx)}) {`, ...body(b.stacks.body ?? [], ctx, inner), `${ind}}`];
    case 'if':
      return [`${ind}if (${cond(b, 'cond', ctx)}) {`, ...body(b.stacks.body ?? [], ctx, inner), `${ind}}`];
    case 'ifelse':
      return [
        `${ind}if (${cond(b, 'cond', ctx)}) {`,
        ...body(b.stacks.body ?? [], ctx, inner),
        `${ind}} else {`,
        ...body(b.stacks.else ?? [], ctx, inner),
        `${ind}}`,
      ];
    case 'break':
      return [`${ind}break;`];
    case 'tone':
      return [`${ind}tone(${sel(b, 'pin')}, ${val(b, 'f', ctx)}, ${val(b, 'ms', ctx)});`];
    case 'note':
      return [
        `${ind}tone(${sel(b, 'pin')}, ${val(b, 'f', ctx)}, ${val(b, 'ms', ctx)});`,
        `${ind}delay(${val(b, 'ms', ctx)} + 60);`,
      ];
    case 'tone_on':
      return [`${ind}tone(${sel(b, 'pin')}, ${val(b, 'f', ctx)});`];
    case 'ultra': {
      const name = sel(b, 'name');
      const trig = sel(b, 'trig');
      const echo = sel(b, 'echo');
      ctx.vars.add(name);
      ctx.ultra ??= { trig, echo };
      return [
        `${ind}digitalWrite(${trig}, LOW);`,
        `${ind}delayMicroseconds(2);`,
        `${ind}digitalWrite(${trig}, HIGH);`,
        `${ind}delayMicroseconds(10);`,
        `${ind}digitalWrite(${trig}, LOW);`,
        `${ind}${name} = round(pulseIn(${echo}, HIGH) / 58.0);`,
      ];
    }
    case 'print':
      ctx.serial = true;
      return [`${ind}Serial.print("${text(b.vals.text)}");`];
    case 'printval':
      ctx.serial = true;
      return [`${ind}Serial.print(${val(b, 'v', ctx)});`];
    case 'notone':
      return [`${ind}noTone(${sel(b, 'pin')});`];
    case 'say':
      ctx.serial = true;
      return [`${ind}Serial.println("${text(b.vals.text)}");`];
    case 'sayval':
      ctx.serial = true;
      return [`${ind}Serial.println(${val(b, 'v', ctx)});`];
    case 'lcd_clear':
      ctx.lcd = true;
      return [`${ind}lcd.clear();`];
    case 'lcd_cursor':
      ctx.lcd = true;
      return [`${ind}lcd.setCursor(${val(b, 'c', ctx)}, ${val(b, 'r', ctx)});`];
    case 'lcd_text':
      ctx.lcd = true;
      return [`${ind}lcd.print("${text(b.vals.text)}");`];
    case 'lcd_val':
      ctx.lcd = true;
      return [`${ind}lcd.print(${val(b, 'v', ctx)});`];
    case 'set_var': {
      const name = sel(b, 'name');
      ctx.vars.add(name);
      return [`${ind}${name} = ${val(b, 'v', ctx)};`];
    }
    case 'change_var': {
      const name = sel(b, 'name');
      ctx.vars.add(name);
      return [`${ind}${name} += ${val(b, 'v', ctx)};`];
    }
    default:
      return [];
  }
}

/** Transforme l'espace de travail en code Arduino (C++) exécutable par le simulateur. */
export function generateCode(ws: Workspace): string {
  const ctx: Ctx = { vars: new Set(), servoPin: null, lcd: false, serial: false, loops: 0, ultra: null };
  const setupBody = body(ws.setup, ctx, '  ');
  ctx.loops = 0;
  const loopBody = body(ws.loop, ctx, '  ');

  const head: string[] = ['// Programme généré par les blocs'];
  if (ctx.servoPin !== null) head.push('#include <Servo.h>');
  if (ctx.lcd) head.push('#include <Wire.h>', '#include <LiquidCrystal_I2C.h>');
  head.push('');
  if (ctx.servoPin !== null) head.push('Servo bras;');
  if (ctx.lcd) head.push('LiquidCrystal_I2C lcd(0x27, 16, 2);');
  for (const name of ctx.vars) head.push(`int ${name} = 0;`);
  if (head[head.length - 1] !== '') head.push('');

  const init: string[] = [];
  if (ctx.serial) init.push('  Serial.begin(9600);');
  if (ctx.servoPin !== null) init.push(`  bras.attach(${ctx.servoPin});`);
  if (ctx.ultra) init.push(`  pinMode(${ctx.ultra.trig}, OUTPUT);`, `  pinMode(${ctx.ultra.echo}, INPUT);`);
  if (ctx.lcd) init.push('  lcd.init();', '  lcd.backlight();');

  return [
    ...head,
    'void setup() {',
    ...init,
    ...setupBody,
    '}',
    '',
    'void loop() {',
    ...loopBody,
    '}',
    '',
  ].join('\n');
}
