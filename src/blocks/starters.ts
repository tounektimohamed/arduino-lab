import { emptyWorkspace, newBlock, type Block, type Workspace } from './definitions';

type Vals = Record<string, string>;
type Kids = Record<string, Block | null>;
type Stacks = Record<string, Block[]>;

const mk = (type: string, vals: Vals = {}, kids: Kids = {}, stacks: Stacks = {}): Block => {
  const b = newBlock(type);
  Object.assign(b.vals, vals);
  Object.assign(b.kids, kids);
  Object.assign(b.stacks, stacks);
  return b;
};

// ---- raccourcis ---------------------------------------------------------
const mode = (pin: number, m: 'OUTPUT' | 'INPUT' | 'INPUT_PULLUP' = 'OUTPUT') => mk('pin_mode', { pin: String(pin), mode: m });
const on = (pin: number) => mk('write', { pin: String(pin), level: 'HIGH' });
const off = (pin: number) => mk('write', { pin: String(pin), level: 'LOW' });
const wait = (ms: number) => mk('wait', { ms: String(ms) });
const say = (text: string) => mk('say', { text });
const print = (text: string) => mk('print', { text });
const V = (name: string) => mk('var', { name });
const setv = (name: string, v: number | Block) => (typeof v === 'number' ? mk('set_var', { name, v: String(v) }) : mk('set_var', { name }, { v }));
const addv = (name: string, v: number) => mk('change_var', { name, v: String(v) });
const analog = (pin: string) => mk('read_analog', { pin });
const digital = (pin: number) => mk('read_digital', { pin: String(pin) });
const mapTo = (v: Block, c: number, d: number) => mk('map', { c: String(c), d: String(d) }, { v });
const cmp = (a: Block | number, op: string, b: Block | number) => {
  const kids: Kids = {};
  const vals: Vals = { op };
  if (typeof a === 'number') vals.a = String(a); else kids.a = a;
  if (typeof b === 'number') vals.b = String(b); else kids.b = b;
  return mk('cmp', vals, kids);
};
const and = (a: Block, b: Block) => mk('and', {}, { a, b });
const pinIs = (pin: number, level: 'HIGH' | 'LOW') => mk('pin_is', { pin: String(pin), level });
const rep = (n: number, body: Block[]) => mk('repeat', { n: String(n) }, {}, { body });
const iff = (cond: Block, body: Block[]) => mk('if', {}, { cond }, { body });
const ifelse = (cond: Block, body: Block[], other: Block[]) => mk('ifelse', {}, { cond }, { body, else: other });
const note = (f: number, d: number) => mk('note', { pin: '8', f: String(f), ms: String(d) });
const rest = (ms: number) => wait(ms);

type Tok = [number, number] | number;
const notes = (list: Tok[]): Block[] => list.map((t) => (Array.isArray(t) ? note(t[0], t[1]) : rest(t)));

const PART_A: Tok[] = [
  [392, 200], 200, [392, 300], [440, 100],
  [392, 200], 200, [392, 300], [440, 100],
  [494, 400], [440, 133], [494, 133], [440, 133],
  [392, 400], 300, [392, 100],
  [494, 400], [494, 300], [587, 100],
  [494, 400], [330, 300], [330, 100],
  [440, 400], [440, 300], [440, 100],
];
const END8: Tok[] = [[392, 200], 500, [392, 100]];
const PART_B: Tok[] = [
  [494, 400], [494, 300], [587, 100],
  [523, 400], [440, 300], [523, 100],
  [494, 400], [440, 133], [494, 133], [440, 133],
  [392, 400], 300, [392, 100],
  [494, 400], [494, 300], [587, 100],
  [494, 400], [330, 300], [330, 100],
  [440, 400], [440, 133], [494, 133], [440, 133],
];

const ws = (setup: Block[], loop: Block[]): Workspace => ({ setup, loop });

/** Blocs de départ équivalents au code de chaque leçon. */
export function starterFor(lessonId: string): Workspace {
  switch (lessonId) {
    case 'blink':
      return ws([mode(9)], [on(9), wait(600), off(9), wait(600)]);

    case 'button':
      return ws(
        [mode(9), mode(2, 'INPUT_PULLUP'), setv('dernier', 1)],
        [
          setv('etat', digital(2)),
          iff(cmp(V('etat'), '!=', V('dernier')), [
            ifelse(cmp(V('etat'), '==', 0), [on(9), say('LED allumee')], [off(9), say('LED eteinte')]),
            setv('dernier', V('etat')),
          ]),
          wait(20),
        ],
      );

    case 'pot':
      return ws(
        [mode(9)],
        [
          mk('pwm', { pin: '9' }, { v: mapTo(analog('A0'), 0, 255) }),
          print('Potentiometre : '),
          mk('printval', {}, { v: analog('A0') }),
          print('  ->  LED : '),
          mk('sayval', {}, { v: mapTo(analog('A0'), 0, 255) }),
          wait(120),
        ],
      );

    case 'buzzer':
      return ws(
        [mode(8)],
        [
          say('Melodie...'),
          note(294, 100),
          ...notes(PART_A), ...notes(END8),
          ...notes(PART_A), ...notes(END8),
          ...notes(PART_B), ...notes(END8),
          ...notes(PART_B), ...notes(END8),
          ...notes(PART_B), ...notes(END8),
          ...notes(PART_B),
          note(294, 100),
          ...notes(PART_A), ...notes(END8),
          ...notes(PART_A),
          note(392, 800),
          mk('notone', { pin: '8' }),
          wait(3000),
        ],
      );

    case 'light':
      return ws(
        [mode(9)],
        [
          mk('pwm', { pin: '9' }, { v: mapTo(analog('A1'), 255, 0) }),
          print('Lumiere : '),
          mk('sayval', {}, { v: analog('A1') }),
          wait(150),
        ],
      );

    case 'servo': {
      const step = (): Block[] => [mk('servo', { pin: '10' }, { v: V('angle') }), mk('sayval', {}, { v: V('angle') }), wait(120)];
      return ws(
        [],
        [setv('angle', 0), rep(19, [...step(), addv('angle', 10)]), setv('angle', 180), rep(19, [...step(), addv('angle', -10)])],
      );
    }

    case 'fade':
      return ws(
        [mode(9)],
        [
          setv('valeur', 0),
          rep(52, [mk('pwm', { pin: '9' }, { v: V('valeur') }), wait(20), addv('valeur', 5)]),
          setv('valeur', 255),
          rep(52, [mk('pwm', { pin: '9' }, { v: V('valeur') }), wait(20), addv('valeur', -5)]),
        ],
      );

    case 'sos': {
      const flash = (ms: number): Block[] => [on(9), wait(ms), off(9), wait(200)];
      return ws([mode(9)], [say('S O S'), rep(3, flash(200)), rep(3, flash(600)), rep(3, flash(200)), wait(2000)]);
    }

    case 'doorbell':
      return ws(
        [mode(2, 'INPUT_PULLUP'), mode(8)],
        [
          iff(pinIs(2, 'LOW'), [
            mk('tone', { pin: '8', f: '330', ms: '200' }),
            wait(260),
            mk('tone', { pin: '8', f: '262', ms: '400' }),
            wait(500),
          ]),
          wait(20),
        ],
      );

    case 'toggle':
      return ws(
        [mode(9), mode(2, 'INPUT_PULLUP'), setv('dernier', 1), setv('valeur', 0)],
        [
          setv('etat', digital(2)),
          iff(and(cmp(V('dernier'), '==', 1), cmp(V('etat'), '==', 0)), [
            setv('valeur', mk('arith', { op: '-', a: '1' }, { b: V('valeur') })),
            ifelse(cmp(V('valeur'), '==', 1), [on(9), say('ON')], [off(9), say('OFF')]),
          ]),
          setv('dernier', V('etat')),
          wait(20),
        ],
      );

    case 'theremin':
      return ws(
        [mode(8)],
        [
          setv('freq', mapTo(analog('A0'), 200, 1000)),
          mk('tone_on', { pin: '8' }, { f: V('freq') }),
          mk('sayval', {}, { v: V('freq') }),
          wait(40),
        ],
      );

    case 'servopot':
      return ws(
        [],
        [
          setv('angle', mapTo(analog('A0'), 0, 180)),
          mk('servo', { pin: '10' }, { v: V('angle') }),
          mk('sayval', {}, { v: V('angle') }),
          wait(30),
        ],
      );

    case 'alarm':
      return ws(
        [mode(8)],
        [
          setv('valeur', analog('A1')),
          ifelse(
            cmp(V('valeur'), '<', 300),
            [
              say('ALARME !'),
              setv('freq', 500),
              rep(11, [mk('tone_on', { pin: '8' }, { f: V('freq') }), wait(25), addv('freq', 50)]),
            ],
            [mk('notone', { pin: '8' })],
          ),
          wait(50),
        ],
      );

    case 'sunflower':
      return ws(
        [setv('angle', 90)],
        [
          setv('valeur', mapTo(analog('A1'), 0, 180)),
          iff(cmp(V('valeur'), '>', V('angle')), [addv('angle', 2)]),
          iff(cmp(V('valeur'), '<', V('angle')), [addv('angle', -2)]),
          mk('servo', { pin: '10' }, { v: V('angle') }),
          mk('sayval', {}, { v: V('angle') }),
          wait(30),
        ],
      );

    case 'reaction':
      return ws(
        [mode(9), mode(2, 'INPUT_PULLUP'), say('Attendez la LED...')],
        [
          off(9),
          mk('wait', {}, { ms: mk('random', { a: '1500', b: '4000' }) }),
          on(9),
          setv('valeur', mk('millis')),
          mk('while', {}, { cond: pinIs(2, 'HIGH') }, { body: [wait(1)] }),
          setv('temps', mk('arith', { op: '-' }, { a: mk('millis'), b: V('valeur') })),
          off(9),
          print('Reaction : '),
          mk('printval', {}, { v: V('temps') }),
          say(' ms'),
          wait(2000),
        ],
      );

    case 'lcd':
      return ws(
        [],
        [
          mk('lcd_cursor', { c: '0', r: '0' }),
          mk('lcd_text', { text: 'Arduino Lab' }),
          mk('lcd_cursor', { c: '0', r: '1' }),
          mk('lcd_text', { text: 'Compteur : ' }),
          mk('lcd_val', {}, { v: V('compteur') }),
          addv('compteur', 1),
          wait(500),
        ],
      );

    case 'distance':
      return ws(
        [],
        [
          mk('ultra', { name: 'valeur', trig: 'A2', echo: 'A3' }),
          mk('lcd_cursor', { c: '0', r: '0' }),
          mk('lcd_text', { text: 'Distance :' }),
          mk('lcd_cursor', { c: '0', r: '1' }),
          mk('lcd_val', {}, { v: V('valeur') }),
          mk('lcd_text', { text: ' cm   ' }),
          wait(200),
        ],
      );

    case 'thermo':
      return ws(
        [mode(8), mode(9)],
        [
          setv('valeur', mk('temp', { pin: 'A1' })),
          mk('lcd_cursor', { c: '0', r: '0' }),
          mk('lcd_text', { text: 'Temperature :' }),
          mk('lcd_cursor', { c: '0', r: '1' }),
          mk('lcd_val', {}, { v: V('valeur') }),
          mk('lcd_text', { text: ' C   ' }),
          ifelse(cmp(V('valeur'), '>=', 30), [on(9), mk('tone', { pin: '8', f: '880', ms: '150' })], [off(9), mk('notone', { pin: '8' })]),
          wait(300),
        ],
      );

    case 'dc-motor-shield':
      return ws(
        [mode(9), mode(8)],
        [
          mk('write', { pin: '8', level: 'HIGH' }),
          setv('vitesse', 150),
          mk('pwm', { pin: '9' }, { v: V('vitesse') }),
          print('Vitesse : '),
          mk('printval', {}, { v: V('vitesse') }),
          wait(200),
        ],
      );

    default:
      return emptyWorkspace();
  }
}
