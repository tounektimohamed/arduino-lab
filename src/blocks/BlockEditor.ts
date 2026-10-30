import type { Lang } from '../i18n';
import {
  CATEGORIES,
  DEFS,
  catColor,
  emptyWorkspace,
  getDef,
  label,
  newBlock,
  optLabel,
  sanitizeWorkspace,
  type Block,
  type CategoryId,
  type Def,
  type Workspace,
} from './definitions';
import { generateCode } from './generator';

type Loc =
  | { type: 'stack'; arr: Block[] }
  | { type: 'slot'; owner: Block; key: string };

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  offX: number;
  offY: number;
  started: boolean;
  fromPalette: boolean;
  type: string; // type du bloc de la palette
  block: Block | null; // bloc de l'espace de travail
  loc: Loc | null;
  group: Block[]; // pile déplacée (le bloc et ceux qui le suivent)
  originIndex: number;
  ghost: HTMLElement | null;
  target: Target | null;
}

type Target =
  | { kind: 'stack'; arr: Block[]; index: number }
  | { kind: 'slot'; owner: Block; key: string }
  | { kind: 'trash' };

const DRAG_THRESHOLD = 5;

export class BlockEditor {
  private lang: Lang = 'fr';
  private ws: Workspace = emptyWorkspace();
  private category: CategoryId = 'pins';

  private readonly root: HTMLElement;
  private readonly cats: HTMLElement;
  private readonly list: HTMLElement;
  private readonly palette: HTMLElement;
  private readonly canvas: HTMLElement;

  private readonly stackOf = new WeakMap<HTMLElement, Block[]>();
  private readonly locOf = new WeakMap<HTMLElement, { block: Block; loc: Loc }>();
  private readonly slotOf = new WeakMap<HTMLElement, { owner: Block; key: string; kind: 'num' | 'bool' }>();

  private drag: DragState | null = null;
  emptyHint = 'Glissez des blocs ici';

  constructor(
    host: HTMLElement,
    private readonly onChange: () => void,
  ) {
    this.root = host;
    this.root.classList.add('bk');
    this.root.innerHTML = `
      <div class="bk-palette">
        <div class="bk-cats" role="tablist"></div>
        <div class="bk-list"></div>
      </div>
      <div class="bk-canvas"></div>`;
    this.palette = this.root.querySelector<HTMLElement>('.bk-palette')!;
    this.cats = this.root.querySelector<HTMLElement>('.bk-cats')!;
    this.list = this.root.querySelector<HTMLElement>('.bk-list')!;
    this.canvas = this.root.querySelector<HTMLElement>('.bk-canvas')!;

    this.cats.addEventListener('click', (event) => {
      const btn = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-cat]');
      if (!btn) return;
      this.category = btn.dataset.cat as CategoryId;
      this.renderPalette();
    });
    this.root.addEventListener('pointerdown', (event) => this.onPointerDown(event));
    window.addEventListener('pointermove', (event) => this.onPointerMove(event));
    window.addEventListener('pointerup', (event) => this.onPointerUp(event));
    window.addEventListener('pointercancel', (event) => this.onPointerUp(event, true));
    this.renderPalette();
    this.renderCanvas();
  }

  // ------------------------------------------------------------------ API

  setLang(lang: Lang, emptyHint: string): void {
    this.lang = lang;
    this.emptyHint = emptyHint;
    this.renderPalette();
    this.renderCanvas();
  }

  load(state: unknown | Workspace): void {
    this.ws = sanitizeWorkspace(state) ?? emptyWorkspace();
    this.renderCanvas();
  }

  serialize(): Workspace {
    return this.ws;
  }

  getCode(): string {
    return generateCode(this.ws);
  }

  // ------------------------------------------------------------- rendering

  private renderPalette(): void {
    this.cats.replaceChildren();
    for (const cat of CATEGORIES) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bk-cat' + (cat.id === this.category ? ' is-active' : '');
      btn.dataset.cat = cat.id;
      btn.style.setProperty('--c', cat.color);
      btn.textContent = label(cat, this.lang);
      this.cats.append(btn);
    }
    this.list.replaceChildren();
    for (const def of DEFS.filter((d) => d.cat === this.category)) {
      const el = this.renderBlock(newBlock(def.type), def, true);
      el.dataset.pal = def.type;
      this.list.append(el);
    }
  }

  private renderCanvas(): void {
    this.canvas.replaceChildren();
    for (const key of ['setup', 'loop'] as const) {
      const def = getDef(key)!;
      const hat = document.createElement('div');
      hat.className = 'bk-block bk-hat';
      hat.style.setProperty('--c', catColor(def));
      const head = document.createElement('div');
      head.className = 'bk-row';
      head.textContent = label(def.parts[0] as { fr: string; ar: string }, this.lang);
      const stack = this.renderStack(this.ws[key]);
      hat.append(head, stack);
      this.canvas.append(hat);
    }
  }

  private renderStack(arr: Block[]): HTMLElement {
    const stack = document.createElement('div');
    stack.className = 'bk-stack';
    if (arr.length === 0) stack.dataset.hint = this.emptyHint;
    this.stackOf.set(stack, arr);
    arr.forEach((block) => {
      const def = getDef(block.type);
      if (!def) return;
      const el = this.renderBlock(block, def, false);
      this.locOf.set(el, { block, loc: { type: 'stack', arr } });
      stack.append(el);
    });
    return stack;
  }

  private renderBlock(block: Block, def: Def, inPalette: boolean): HTMLElement {
    const el = document.createElement('div');
    el.className = `bk-block bk-${def.kind}`;
    el.style.setProperty('--c', catColor(def));
    el.dataset.type = def.type;

    let row = document.createElement('div');
    row.className = 'bk-row';
    el.append(row);
    let hasC = false;

    for (const part of def.parts) {
      switch (part.k) {
        case 't': {
          const span = document.createElement('span');
          span.className = 'bk-txt';
          span.textContent = label(part, this.lang);
          row.append(span);
          break;
        }
        case 'sel': {
          const select = document.createElement('select');
          select.className = 'bk-in';
          for (const opt of part.opts) {
            const o = document.createElement('option');
            o.value = opt[0];
            o.textContent = optLabel(opt, this.lang);
            select.append(o);
          }
          select.value = block.vals[part.key] ?? part.def;
          select.addEventListener('change', () => {
            block.vals[part.key] = select.value;
            this.onChange();
          });
          row.append(select);
          break;
        }
        case 's':
          row.append(this.renderInput(block, part.key, false));
          break;
        case 'n':
        case 'b': {
          const kind = part.k === 'n' ? 'num' : 'bool';
          const slot = document.createElement('span');
          slot.className = `bk-slot bk-slot-${kind}`;
          this.slotOf.set(slot, { owner: block, key: part.key, kind });
          const kid = block.kids[part.key];
          const kidDef = kid ? getDef(kid.type) : undefined;
          if (kid && kidDef) {
            const kidEl = this.renderBlock(kid, kidDef, inPalette);
            this.locOf.set(kidEl, { block: kid, loc: { type: 'slot', owner: block, key: part.key } });
            slot.append(kidEl);
          } else if (part.k === 'n') {
            slot.append(this.renderInput(block, part.key, true));
          }
          row.append(slot);
          break;
        }
        case 'c': {
          hasC = true;
          const stack = this.renderStack(block.stacks[part.key] ?? (block.stacks[part.key] = []));
          el.append(stack);
          row = document.createElement('div');
          row.className = 'bk-row';
          el.append(row);
          break;
        }
      }
    }
    if (hasC) {
      if (row.childElementCount === 0) row.classList.add('bk-foot');
      el.classList.add('bk-c');
    } else if (row.childElementCount === 0) {
      row.remove();
    }
    return el;
  }

  private renderInput(block: Block, key: string, numeric: boolean): HTMLInputElement {
    const input = document.createElement('input');
    input.className = 'bk-in';
    input.type = 'text';
    if (numeric) input.inputMode = 'decimal';
    input.value = block.vals[key] ?? '';
    const fit = (): void => {
      input.size = Math.max(2, Math.min(24, input.value.length + 1));
    };
    fit();
    input.addEventListener('input', () => {
      block.vals[key] = input.value;
      fit();
      this.onChange();
    });
    return input;
  }

  // ---------------------------------------------------------- drag & drop

  private onPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || this.drag) return;
    const target = event.target as HTMLElement;
    if (target.closest('input, select, button')) return;
    const el = target.closest<HTMLElement>('.bk-block');
    if (!el || el.classList.contains('bk-hat')) return;

    const rect = el.getBoundingClientRect();
    const base: DragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offX: event.clientX - rect.left,
      offY: event.clientY - rect.top,
      started: false,
      fromPalette: false,
      type: '',
      block: null,
      loc: null,
      group: [],
      originIndex: 0,
      ghost: null,
      target: null,
    };

    if (el.dataset.pal) {
      base.fromPalette = true;
      base.type = el.dataset.pal;
    } else {
      const info = this.locOf.get(el);
      if (!info) return;
      base.block = info.block;
      base.loc = info.loc;
    }
    this.drag = base;
    event.preventDefault();
  }

  private startDrag(drag: DragState): void {
    drag.started = true;
    if (drag.fromPalette) {
      drag.block = newBlock(drag.type);
      drag.group = [drag.block];
    } else if (drag.block && drag.loc) {
      if (drag.loc.type === 'stack') {
        const idx = drag.loc.arr.indexOf(drag.block);
        drag.originIndex = idx;
        drag.group = drag.loc.arr.splice(idx);
      } else {
        drag.loc.owner.kids[drag.loc.key] = null;
        drag.group = [drag.block];
      }
      this.renderCanvas();
      this.onChange();
    }

    const ghost = document.createElement('div');
    ghost.className = 'bk-ghost';
    for (const block of drag.group) {
      const def = getDef(block.type);
      if (def) ghost.append(this.renderBlock(block, def, true));
    }
    document.body.append(ghost);
    drag.ghost = ghost;
    this.root.classList.add('is-dragging');
  }

  private onPointerMove(event: PointerEvent): void {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!drag.started) {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < DRAG_THRESHOLD) return;
      this.startDrag(drag);
    }
    event.preventDefault();
    if (drag.ghost) {
      drag.ghost.style.left = `${event.clientX - drag.offX}px`;
      drag.ghost.style.top = `${event.clientY - drag.offY}px`;
    }
    this.updateTarget(drag, event.clientX, event.clientY);
  }

  private clearMarks(): void {
    this.root
      .querySelectorAll('.drop-before, .drop-end, .slot-hot')
      .forEach((n) => n.classList.remove('drop-before', 'drop-end', 'slot-hot'));
    this.palette.classList.remove('is-trash');
  }

  private updateTarget(drag: DragState, x: number, y: number): void {
    this.clearMarks();
    drag.target = null;
    const first = drag.group[0];
    const def = first ? getDef(first.type) : undefined;
    if (!def) return;

    const under = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!under) return;

    if (under.closest('.bk-palette')) {
      drag.target = { kind: 'trash' };
      this.palette.classList.add('is-trash');
      return;
    }
    if (!under.closest('.bk-canvas')) return;

    if (def.kind === 'stmt') {
      const stackEl = under.closest<HTMLElement>('.bk-stack');
      const arr = stackEl ? this.stackOf.get(stackEl) : undefined;
      if (!stackEl || !arr) return;
      const children = Array.from(stackEl.children).filter((c) =>
        c.classList.contains('bk-block'),
      ) as HTMLElement[];
      let index = children.length;
      for (let i = 0; i < children.length; i++) {
        const r = children[i]!.getBoundingClientRect();
        if (y < r.top + r.height / 2) {
          index = i;
          break;
        }
      }
      drag.target = { kind: 'stack', arr, index };
      if (index < children.length) children[index]!.classList.add('drop-before');
      else stackEl.classList.add('drop-end');
      return;
    }

    // Bloc « valeur » ou « condition » : on cherche un emplacement compatible.
    let node: HTMLElement | null = under;
    while (node) {
      const slot = node.classList.contains('bk-slot') ? this.slotOf.get(node) : undefined;
      if (slot && slot.kind === def.kind) {
        // On ne dépose pas un bloc dans l'un de ses propres emplacements.
        drag.target = { kind: 'slot', owner: slot.owner, key: slot.key };
        node.classList.add('slot-hot');
        return;
      }
      node = node.parentElement;
    }
  }

  private onPointerUp(event: PointerEvent, cancelled = false): void {
    const drag = this.drag;
    if (!drag || event.pointerId !== drag.pointerId) return;
    this.drag = null;
    if (!drag.started) return;

    this.clearMarks();
    drag.ghost?.remove();
    this.root.classList.remove('is-dragging');

    const target = cancelled ? null : drag.target;
    if (target?.kind === 'stack') {
      target.arr.splice(target.index, 0, ...drag.group);
    } else if (target?.kind === 'slot') {
      target.owner.kids[target.key] = drag.group[0] ?? null;
    } else if (target?.kind === 'trash') {
      // le bloc est supprimé
    } else if (!drag.fromPalette && drag.loc) {
      // Dépôt invalide : on remet le bloc à sa place d'origine.
      if (drag.loc.type === 'stack') drag.loc.arr.splice(drag.originIndex, 0, ...drag.group);
      else drag.loc.owner.kids[drag.loc.key] = drag.group[0] ?? null;
    }
    this.renderCanvas();
    this.onChange();
  }
}
