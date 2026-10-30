import type { Lang } from '../i18n';

export type Kind = 'hat' | 'stmt' | 'num' | 'bool';
export type CategoryId = 'pins' | 'control' | 'sound' | 'display' | 'sensing' | 'vars' | 'math';

type Opt = [value: string, fr: string, ar: string];

export type Part =
  | { k: 't'; fr: string; ar: string }
  | { k: 'n'; key: string; def: string } // nombre (accepte un bloc « valeur »)
  | { k: 's'; key: string; def: string } // texte libre
  | { k: 'b'; key: string } // condition (accepte un bloc « condition »)
  | { k: 'sel'; key: string; opts: Opt[]; def: string }
  | { k: 'c'; key: string }; // zone d'imbrication (blocs en pile)

export interface Def {
  type: string;
  cat: CategoryId | 'hat';
  kind: Kind;
  parts: Part[];
}

/** Un bloc posé dans l'espace de travail. */
export interface Block {
  type: string;
  vals: Record<string, string>;
  kids: Record<string, Block | null>;
  stacks: Record<string, Block[]>;
}

export interface Workspace {
  setup: Block[];
  loop: Block[];
}

export const CATEGORIES: { id: CategoryId; fr: string; ar: string; color: string }[] = [
  { id: 'pins', fr: 'Broches', ar: 'المنافذ', color: '#e2543f' },
  { id: 'control', fr: 'Contrôle', ar: 'التحكّم', color: '#e2a63c' },
  { id: 'sound', fr: 'Son', ar: 'الصوت', color: '#9a64d6' },
  { id: 'display', fr: 'Affichage', ar: 'العرض', color: '#0b7f8c' },
  { id: 'sensing', fr: 'Capteurs', ar: 'الحسّاسات', color: '#3f93d9' },
  { id: 'vars', fr: 'Variables', ar: 'المتغيّرات', color: '#e8772e' },
  { id: 'math', fr: 'Opérateurs', ar: 'العمليات', color: '#2f9e6f' },
];

export const HAT_COLOR = '#c0392b';

const range = (from: number, to: number): Opt[] =>
  Array.from({ length: to - from + 1 }, (_, i) => [String(from + i), String(from + i), String(from + i)] as Opt);

const DIGITAL = range(2, 13);
const PWM: Opt[] = [3, 5, 6, 9, 10, 11].map((n) => [String(n), String(n), String(n)] as Opt);
const ANALOG: Opt[] = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'].map((n) => [n, n, n] as Opt);
const LEVEL: Opt[] = [
  ['HIGH', 'allumé (HIGH)', 'مضاء (HIGH)'],
  ['LOW', 'éteint (LOW)', 'مطفأ (LOW)'],
];
const VARS: Opt[] = [
  ['compteur', 'compteur', 'عدّاد'],
  ['valeur', 'valeur', 'قيمة'],
  ['score', 'score', 'نقاط'],
  ['temps', 'temps', 'وقت'],
  ['angle', 'angle', 'زاوية'],
  ['etat', 'état', 'حالة'],
  ['dernier', 'dernier état', 'الحالة السابقة'],
  ['freq', 'fréquence', 'تردد'],
];

const T = (fr: string, ar: string): Part => ({ k: 't', fr, ar });
const N = (key: string, def: string): Part => ({ k: 'n', key, def });
const S = (key: string, def: string): Part => ({ k: 's', key, def });
const B = (key: string): Part => ({ k: 'b', key });
const SEL = (key: string, opts: Opt[], def: string): Part => ({ k: 'sel', key, opts, def });
const C = (key: string): Part => ({ k: 'c', key });

export const DEFS: Def[] = [
  // ------------------------------------------------------------ chapeaux
  { type: 'setup', cat: 'hat', kind: 'hat', parts: [T('Au démarrage (setup)', 'عند البدء (setup)'), C('body')] },
  { type: 'loop', cat: 'hat', kind: 'hat', parts: [T('Répéter toujours (loop)', 'كرّر دائمًا (loop)'), C('body')] },

  // -------------------------------------------------------------- broches
  { type: 'pin_mode', cat: 'pins', kind: 'stmt', parts: [T('broche', 'المنفذ'), SEL('pin', DIGITAL, '13'), T('en', 'يعمل'), SEL('mode', [['OUTPUT', 'sortie', 'كخرج'], ['INPUT', 'entrée', 'كدخل'], ['INPUT_PULLUP', 'entrée + pull-up', 'دخل + pull-up']], 'OUTPUT')] },
  { type: 'write', cat: 'pins', kind: 'stmt', parts: [T('mettre la broche', 'اجعل المنفذ'), SEL('pin', DIGITAL, '13'), T('à', 'على'), SEL('level', LEVEL, 'HIGH')] },
  { type: 'pwm', cat: 'pins', kind: 'stmt', parts: [T('luminosité broche', 'سطوع المنفذ'), SEL('pin', PWM, '9'), T('=', '='), N('v', '128')] },
  { type: 'servo', cat: 'pins', kind: 'stmt', parts: [T('servo broche', 'المحرّك المنفذ'), SEL('pin', DIGITAL, '10'), T('angle', 'الزاوية'), N('v', '90')] },

  // ------------------------------------------------------------- contrôle
  { type: 'wait', cat: 'control', kind: 'stmt', parts: [T('attendre', 'انتظر'), N('ms', '500'), T('ms', 'م.ث')] },
  { type: 'repeat', cat: 'control', kind: 'stmt', parts: [T('répéter', 'كرّر'), N('n', '10'), T('fois', 'مرّة'), C('body')] },
  { type: 'while', cat: 'control', kind: 'stmt', parts: [T('tant que', 'طالما'), B('cond'), C('body')] },
  { type: 'if', cat: 'control', kind: 'stmt', parts: [T('si', 'إذا'), B('cond'), T('alors', 'فإنّ'), C('body')] },
  { type: 'ifelse', cat: 'control', kind: 'stmt', parts: [T('si', 'إذا'), B('cond'), T('alors', 'فإنّ'), C('body'), T('sinon', 'وإلا'), C('else')] },
  { type: 'break', cat: 'control', kind: 'stmt', parts: [T('sortir de la boucle', 'اخرج من التكرار')] },

  // ------------------------------------------------------------------ son
  { type: 'tone', cat: 'sound', kind: 'stmt', parts: [T('jouer broche', 'شغّل نغمة المنفذ'), SEL('pin', DIGITAL, '8'), N('f', '440'), T('Hz pendant', 'هرتز لمدة'), N('ms', '200'), T('ms', 'م.ث')] },
  { type: 'note', cat: 'sound', kind: 'stmt', parts: [T('jouer note broche', 'شغّل نغمة المنفذ'), SEL('pin', DIGITAL, '8'), N('f', '440'), T('Hz,', 'هرتز،'), N('ms', '200'), T('ms + pause', 'م.ث + توقّف'), ] },
  { type: 'tone_on', cat: 'sound', kind: 'stmt', parts: [T('jouer en continu broche', 'شغّل باستمرار المنفذ'), SEL('pin', DIGITAL, '8'), N('f', '440'), T('Hz', 'هرتز')] },
  { type: 'notone', cat: 'sound', kind: 'stmt', parts: [T('couper le son broche', 'أوقف الصوت المنفذ'), SEL('pin', DIGITAL, '8')] },

  // ------------------------------------------------------------- affichage
  { type: 'say', cat: 'display', kind: 'stmt', parts: [T('moniteur série : écrire', 'المراقب: اكتب'), S('text', 'Bonjour')] },
  { type: 'print', cat: 'display', kind: 'stmt', parts: [T('moniteur : écrire (même ligne)', 'المراقب: اكتب (في نفس السطر)'), S('text', 'Valeur : ')] },
  { type: 'printval', cat: 'display', kind: 'stmt', parts: [T('moniteur : valeur (même ligne)', 'المراقب: القيمة (في نفس السطر)'), N('v', '0')] },
  { type: 'sayval', cat: 'display', kind: 'stmt', parts: [T('moniteur série : valeur', 'المراقب: القيمة'), N('v', '0')] },
  { type: 'lcd_clear', cat: 'display', kind: 'stmt', parts: [T('LCD : effacer', 'LCD: امسح الشاشة')] },
  { type: 'lcd_cursor', cat: 'display', kind: 'stmt', parts: [T('LCD : colonne', 'LCD: العمود'), N('c', '0'), T('ligne', 'السطر'), N('r', '0')] },
  { type: 'lcd_text', cat: 'display', kind: 'stmt', parts: [T('LCD : écrire', 'LCD: اكتب'), S('text', 'Salut !')] },
  { type: 'lcd_val', cat: 'display', kind: 'stmt', parts: [T('LCD : valeur', 'LCD: القيمة'), N('v', '0')] },

  // -------------------------------------------------------------- capteurs
  { type: 'read_digital', cat: 'sensing', kind: 'num', parts: [T('lire broche', 'اقرأ المنفذ'), SEL('pin', DIGITAL, '2')] },
  { type: 'read_analog', cat: 'sensing', kind: 'num', parts: [T('lire analogique', 'اقرأ التماثلي'), SEL('pin', ANALOG, 'A0')] },
  { type: 'pin_is', cat: 'sensing', kind: 'bool', parts: [T('broche', 'المنفذ'), SEL('pin', DIGITAL, '2'), T('est', 'هو'), SEL('level', LEVEL, 'HIGH')] },
  { type: 'ultra', cat: 'sensing', kind: 'stmt', parts: [T('mesurer la distance (cm) →', 'قِس المسافة (سم) ←'), SEL('name', VARS, 'valeur'), T('TRIG', 'TRIG'), SEL('trig', ANALOG, 'A2'), T('ECHO', 'ECHO'), SEL('echo', ANALOG, 'A3')] },
  { type: 'temp', cat: 'sensing', kind: 'num', parts: [T('température °C, capteur', 'درجة الحرارة °م، الحسّاس'), SEL('pin', ANALOG, 'A1')] },
  { type: 'millis', cat: 'sensing', kind: 'num', parts: [T('temps écoulé (ms)', 'الوقت المنقضي (م.ث)')] },

  // ------------------------------------------------------------- variables
  { type: 'set_var', cat: 'vars', kind: 'stmt', parts: [T('mettre', 'اجعل'), SEL('name', VARS, 'compteur'), T('à', 'يساوي'), N('v', '0')] },
  { type: 'change_var', cat: 'vars', kind: 'stmt', parts: [T('ajouter à', 'زِد'), SEL('name', VARS, 'compteur'), N('v', '1')] },
  { type: 'var', cat: 'vars', kind: 'num', parts: [SEL('name', VARS, 'compteur')] },

  // ------------------------------------------------------------ opérateurs
  { type: 'arith', cat: 'math', kind: 'num', parts: [N('a', '1'), SEL('op', [['+', '+', '+'], ['-', '−', '−'], ['*', '×', '×'], ['/', '÷', '÷']], '+'), N('b', '1')] },
  { type: 'map', cat: 'math', kind: 'num', parts: [T('convertir', 'حوّل'), N('v', '0'), T('de 0–1023 vers', 'من 0–1023 إلى'), N('c', '0'), T('–', '–'), N('d', '255')] },
  { type: 'random', cat: 'math', kind: 'num', parts: [T('aléatoire entre', 'عشوائي بين'), N('a', '0'), T('et', 'و'), N('b', '10')] },
  { type: 'cmp', cat: 'math', kind: 'bool', parts: [N('a', '0'), SEL('op', [['<', '<', '<'], ['>', '>', '>'], ['<=', '≤', '≤'], ['>=', '≥', '≥'], ['==', '=', '='], ['!=', '≠', '≠']], '>'), N('b', '0')] },
  { type: 'and', cat: 'math', kind: 'bool', parts: [B('a'), T('et', 'و'), B('b')] },
  { type: 'or', cat: 'math', kind: 'bool', parts: [B('a'), T('ou', 'أو'), B('b')] },
  { type: 'not', cat: 'math', kind: 'bool', parts: [T('non', 'ليس'), B('a')] },
];

const BY_TYPE = new Map(DEFS.map((d) => [d.type, d]));

export function getDef(type: string): Def | undefined {
  return BY_TYPE.get(type);
}

export function catColor(def: Def): string {
  if (def.cat === 'hat') return HAT_COLOR;
  return CATEGORIES.find((c) => c.id === def.cat)?.color ?? '#888';
}

export function label(part: { fr: string; ar: string }, lang: Lang): string {
  return part[lang];
}

export function optLabel(opt: Opt, lang: Lang): string {
  return lang === 'fr' ? opt[1] : opt[2];
}

export function newBlock(type: string): Block {
  const def = BY_TYPE.get(type);
  const block: Block = { type, vals: {}, kids: {}, stacks: {} };
  if (!def) return block;
  for (const part of def.parts) {
    if (part.k === 'n' || part.k === 's' || part.k === 'sel') block.vals[part.key] = part.def;
    if (part.k === 'n' || part.k === 'b') block.kids[part.key] = null;
    if (part.k === 'c') block.stacks[part.key] = [];
  }
  return block;
}

/** Valide et nettoie un bloc venant du stockage local. */
export function sanitizeBlock(raw: unknown, depth = 0): Block | null {
  if (!raw || typeof raw !== 'object' || depth > 40) return null;
  const input = raw as Partial<Block>;
  const def = typeof input.type === 'string' ? BY_TYPE.get(input.type) : undefined;
  if (!def || def.kind === 'hat') return null;
  const block = newBlock(def.type);
  for (const part of def.parts) {
    if (part.k === 'n' || part.k === 's') {
      const v = input.vals?.[part.key];
      if (typeof v === 'string') block.vals[part.key] = v.slice(0, 60);
    }
    if (part.k === 'sel') {
      const v = input.vals?.[part.key];
      if (typeof v === 'string' && part.opts.some((o) => o[0] === v)) block.vals[part.key] = v;
    }
    if (part.k === 'n' || part.k === 'b') {
      const kid = sanitizeBlock(input.kids?.[part.key], depth + 1);
      const wanted: Kind = part.k === 'n' ? 'num' : 'bool';
      block.kids[part.key] = kid && getDef(kid.type)?.kind === wanted ? kid : null;
    }
    if (part.k === 'c') {
      const list = input.stacks?.[part.key];
      block.stacks[part.key] = Array.isArray(list)
        ? list
            .map((item) => sanitizeBlock(item, depth + 1))
            .filter((b): b is Block => !!b && getDef(b.type)?.kind === 'stmt')
        : [];
    }
  }
  return block;
}

export function sanitizeWorkspace(raw: unknown): Workspace | null {
  if (!raw || typeof raw !== 'object') return null;
  const input = raw as Partial<Record<keyof Workspace, unknown>>;
  const clean = (list: unknown): Block[] =>
    Array.isArray(list)
      ? list
          .map((item) => sanitizeBlock(item))
          .filter((b): b is Block => !!b && getDef(b.type)?.kind === 'stmt')
      : [];
  return { setup: clean(input.setup), loop: clean(input.loop) };
}

export function emptyWorkspace(): Workspace {
  return { setup: [], loop: [] };
}
