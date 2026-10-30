import {
  COMPONENTS,
  LESSONS,
  getLesson,
  isLessonId,
  type ComponentId,
  type LessonId,
} from '../data/lessons';
import { BlockEditor } from '../blocks/BlockEditor';
import { starterFor } from '../blocks/definitions';
import { getPartInfo } from '../data/parts';
import { pick, t, ui, type Lang, type UIKey } from '../i18n';
import { ArduinoScene } from '../scene/ArduinoScene';
import { AudioEngine } from '../sim/AudioEngine';
import { Simulator } from '../sim/Simulator';

const TEMPLATE = `
<div class="app">
  <header class="topbar">
    <a class="brand" href="#" aria-label="Arduino Lab">
      <span class="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 40 40" fill="none">
          <rect x="2" y="2" width="36" height="36" rx="11" fill="currentColor"/>
          <rect x="11" y="16" width="18" height="8" rx="2.2" fill="#f6eddd"/>
          <circle cx="15.5" cy="20" r="1.5" fill="#0b7f8c"/>
          <circle cx="20" cy="20" r="1.5" fill="#0b7f8c"/>
          <circle cx="24.5" cy="20" r="1.5" fill="#0b7f8c"/>
          <path d="M17 9.5h6l-3 4.5z" fill="#e2543f"/>
        </svg>
      </span>
      <span class="brand-copy">
        <strong data-i18n="brand">Arduino Lab</strong>
        <small data-i18n="brandSub">électronique interactive</small>
      </span>
    </a>

    <nav class="main-nav" aria-label="Navigation">
      <button class="nav-link is-active" id="nav-lab" type="button" data-i18n="navLab">Laboratoire</button>
      <button class="nav-link" id="nav-lessons" type="button" data-i18n="navLessons">Leçons</button>
      <button class="nav-link" id="nav-components" type="button" data-i18n="navComponents">Composants</button>
    </nav>

    <div class="top-actions">
      <div class="progress-chip" aria-live="polite">
        <span class="progress-ring" id="progress-ring"></span>
        <span id="progress-count">0/3</span>
      </div>
      <button class="lang-toggle" id="lang-toggle" type="button" aria-label="Changer de langue">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
          <circle cx="12" cy="12" r="8.5"/>
          <path d="M3.5 12h17M12 3.5c2.4 2.5 3.6 5.4 3.6 8.5S14.4 18 12 20.5C9.6 18 8.4 15.1 8.4 12S9.6 6 12 3.5z"/>
        </svg>
        <span id="lang-label">AR</span>
      </button>
    </div>
  </header>

  <main class="layout">
    <aside class="lesson-rail" id="lesson-rail">
      <div class="rail-head">
        <span class="eyebrow" data-i18n="course">Parcours</span>
        <span class="rail-progress" id="rail-progress">0/3</span>
      </div>
      <ol class="lesson-list" id="lesson-list"></ol>
      <div class="rail-card">
        <span class="eyebrow" data-i18n="comingSoon">Bientôt</span>
        <p data-i18n="comingSoonText">Capteur de lumière, buzzer, servo…</p>
      </div>
      <div class="rail-foot" data-i18n="footerNote"></div>
    </aside>

    <section class="stage" id="stage">
      <div class="canvas-host" id="canvas-host"></div>

      <div class="hero">
        <span class="eyebrow" data-i18n="heroKicker">Arduino Uno · ATmega328P</span>
        <h1><span data-i18n="heroTitle">Apprendre</span> <em data-i18n="heroAccent">Arduino</em></h1>
        <p class="hero-tagline" data-i18n="heroTagline">Explorer · Comprendre · Construire</p>
        <div class="hero-hints">
          <span><b>⟲</b><span data-i18n="hintPan">Glisser pour déplacer</span></span>
          <span><b>⌨</b><span data-i18n="hintRotate">Q / E pour pivoter</span></span>
          <span><b>＋</b><span data-i18n="hintZoom">Molette pour zoomer</span></span>
        </div>
      </div>

      <div class="stage-status" id="stage-status">
        <span class="status-dot"></span>
        <span id="stage-status-text" data-i18n="simReady">Simulateur prêt</span>
      </div>

      <div class="stage-hint" id="stage-hint"></div>
      <div class="stage-legend" id="stage-legend"></div>

      <div class="part-card" id="part-card" hidden>
        <button class="part-close" id="part-close" type="button" aria-label="Fermer">×</button>
        <span class="eyebrow" data-i18n="partKicker">Composant</span>
        <strong id="part-name"></strong>
        <p id="part-role"></p>
      </div>

      <button class="view-reset" id="reset-view" type="button" title="Recentrer la vue" aria-label="Recentrer la vue">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <circle cx="12" cy="12" r="5.2"/>
          <path d="M12 2.5v3.4M12 18.1v3.4M2.5 12h3.4M18.1 12h3.4"/>
        </svg>
      </button>

      <button class="view-reset sound-toggle" id="sound-toggle" type="button" data-i18n-title="soundToggle" aria-pressed="false" hidden>🔊</button>
    </section>

    <aside class="workbench" id="workbench">
      <div class="lesson-head">
        <div class="lesson-kicker">
          <span id="lesson-number">Leçon 01</span>
          <span class="kicker-dot"></span>
          <span id="lesson-level">Débutant</span>
          <span class="kicker-dot"></span>
          <span id="lesson-duration">8 min</span>
        </div>
        <h2 id="lesson-title">Faire clignoter une LED</h2>
        <p class="lesson-tagline" id="lesson-tagline"></p>
      </div>

      <div class="lesson-scroll">
        <p class="lesson-description" id="lesson-description"></p>

        <section class="info-block">
          <h3><span class="info-icon">◎</span><span data-i18n="objectives">Objectifs</span></h3>
          <ul class="check-list" id="lesson-objectives"></ul>
        </section>

        <section class="info-block">
          <h3><span class="info-icon">⌁</span><span data-i18n="wiring">Câblage</span></h3>
          <ul class="wire-list" id="lesson-wiring"></ul>
        </section>

        <section class="challenge-card">
          <span class="eyebrow" data-i18n="challenge">Défi</span>
          <p id="lesson-challenge"></p>
        </section>

        <section class="pot-control" id="pot-control" hidden>
          <div class="pot-control-head">
            <span data-i18n="potLabel">Position du potentiomètre</span>
            <output id="pot-value">512</output>
          </div>
          <input id="pot-slider" type="range" min="0" max="1023" value="512" />
          <small data-i18n="potHint">Faites glisser le bouton du potentiomètre dans la scène.</small>
        </section>

        <section class="pot-control" id="sensor-control" hidden>
          <div class="pot-control-head">
            <span id="sensor-label"></span>
            <output id="sensor-value"></output>
          </div>
          <input id="sensor-slider" type="range" min="0" max="1023" value="650" />
          <small id="sensor-hint"></small>
        </section>
      </div>

      <div class="editor-card">
        <div class="mode-tabs" role="tablist">
          <button class="mode-tab" id="tab-blocks" type="button" role="tab" data-mode="blocks" data-i18n="modeBlocks">🧩 Blocs</button>
          <button class="mode-tab" id="tab-code" type="button" role="tab" data-mode="code" data-i18n="modeCode">{ } Code</button>
        </div>
        <div class="editor-bar">
          <span class="file-pill"><span class="file-dot"></span>sketch.ino</span>
          <div class="editor-actions">
            <button class="icon-btn" id="reset-code" type="button" title="Réinitialiser le code" data-i18n-title="resetCode">↺</button>
            <button class="run-btn" id="run-btn" type="button">
              <span class="run-icon" id="run-icon">▶</span>
              <span id="run-label">Lancer</span>
            </button>
          </div>
        </div>
        <p class="bk-hint" id="blocks-hint" data-i18n="blocksManual" hidden></p>
        <div id="blocks-host" hidden></div>
        <textarea id="code" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Code Arduino"></textarea>
        <div class="serial">
          <div class="serial-head">
            <span class="serial-title">
              <span class="serial-dot" id="serial-dot"></span>
              <span data-i18n="serialTitle">Moniteur série</span>
            </span>
            <div class="serial-actions">
              <span class="serial-status" id="serial-status">Arrêté</span>
              <button class="serial-clear" id="serial-clear" type="button" data-i18n="clear">Effacer</button>
            </div>
          </div>
          <div class="serial-output" id="serial-output"></div>
        </div>
      </div>

      <div class="workbench-foot">
        <button class="complete-btn" id="complete-btn" type="button">
          <span class="complete-icon">✓</span>
          <span id="complete-label">Marquer comme terminé</span>
        </button>
      </div>
    </aside>
  </main>

  <div class="modal" id="components-modal" hidden>
    <div class="modal-backdrop" data-close-modal></div>
    <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="components-title">
      <div class="modal-head">
        <h2 id="components-title" data-i18n="componentsTitle">Les composants du labo</h2>
        <button class="modal-close" id="modal-close" type="button" aria-label="Fermer">×</button>
      </div>
      <div class="component-grid" id="component-grid"></div>
    </div>
  </div>
</div>
`;

export class App {
  private readonly sim = new Simulator();
  private readonly scene: ArduinoScene;

  private lang: Lang = 'ar';
  private activeId: LessonId = 'blink';
  private readonly completed = new Set<LessonId>();
  private readonly audio = new AudioEngine();
  private toneFreq = 0;
  private selectedPart: string | null = null;
  private sensorKind: 'light' | 'distance' | 'temp' | 'servo' | 'buzzer' | null = null;
  private readonly codes = Object.fromEntries(
    LESSONS.map((lesson) => [lesson.id, lesson.code]),
  ) as Record<LessonId, string>;

  private hasRun = false;
  private persistTimer: number | null = null;
  private serialFrame: number | null = null;

  private readonly canvasHost: HTMLElement;
  private readonly lessonRail: HTMLElement;
  private readonly lessonList: HTMLOListElement;
  private readonly railProgress: HTMLElement;
  private readonly stageStatus: HTMLElement;
  private readonly stageStatusText: HTMLElement;
  private readonly stageHint: HTMLElement;
  private readonly stageLegend: HTMLElement;
  private readonly resetViewBtn: HTMLButtonElement;

  private readonly lessonNumber: HTMLElement;
  private readonly lessonLevel: HTMLElement;
  private readonly lessonDuration: HTMLElement;
  private readonly lessonTitle: HTMLElement;
  private readonly lessonTagline: HTMLElement;
  private readonly lessonDescription: HTMLElement;
  private readonly lessonObjectives: HTMLUListElement;
  private readonly lessonWiring: HTMLUListElement;
  private readonly lessonChallenge: HTMLElement;
  private readonly potControl: HTMLElement;
  private readonly potSlider: HTMLInputElement;
  private readonly potValue: HTMLOutputElement;

  private readonly partCard: HTMLElement;
  private readonly partName: HTMLElement;
  private readonly partRole: HTMLElement;
  private readonly sensorControl: HTMLElement;
  private readonly sensorLabel: HTMLElement;
  private readonly sensorValue: HTMLOutputElement;
  private readonly sensorSlider: HTMLInputElement;
  private readonly sensorHint: HTMLElement;
  private readonly soundToggle: HTMLButtonElement;

  private readonly codeEl: HTMLTextAreaElement;
  private readonly blocks: BlockEditor;
  private mode: 'blocks' | 'code' = 'blocks';
  private blockStates: Record<string, unknown> = {};
  private readonly manualEdits = new Set<LessonId>();
  private readonly runBtn: HTMLButtonElement;
  private readonly runIcon: HTMLElement;
  private readonly runLabel: HTMLElement;
  private readonly resetCodeBtn: HTMLButtonElement;
  private readonly serialOutput: HTMLElement;
  private readonly serialStatus: HTMLElement;
  private readonly serialDot: HTMLElement;
  private readonly serialClearBtn: HTMLButtonElement;
  private readonly completeBtn: HTMLButtonElement;
  private readonly completeLabel: HTMLElement;
  private readonly progressRing: HTMLElement;
  private readonly progressCount: HTMLElement;
  private readonly langToggle: HTMLButtonElement;
  private readonly langLabel: HTMLElement;
  private readonly componentsModal: HTMLElement;
  private readonly componentGrid: HTMLElement;
  private readonly modalCloseBtn: HTMLButtonElement;
  private readonly navLab: HTMLButtonElement;
  private readonly navLessons: HTMLButtonElement;
  private readonly navComponents: HTMLButtonElement;

  constructor(root: HTMLElement) {
    this.loadState();
    root.innerHTML = TEMPLATE;

    this.canvasHost = this.el('canvas-host');
    this.lessonRail = this.el('lesson-rail');
    this.lessonList = this.el<HTMLOListElement>('lesson-list');
    this.railProgress = this.el('rail-progress');
    this.stageStatus = this.el('stage-status');
    this.stageStatusText = this.el('stage-status-text');
    this.stageHint = this.el('stage-hint');
    this.stageLegend = this.el('stage-legend');
    this.resetViewBtn = this.el<HTMLButtonElement>('reset-view');

    this.lessonNumber = this.el('lesson-number');
    this.lessonLevel = this.el('lesson-level');
    this.lessonDuration = this.el('lesson-duration');
    this.lessonTitle = this.el('lesson-title');
    this.lessonTagline = this.el('lesson-tagline');
    this.lessonDescription = this.el('lesson-description');
    this.lessonObjectives = this.el<HTMLUListElement>('lesson-objectives');
    this.lessonWiring = this.el<HTMLUListElement>('lesson-wiring');
    this.lessonChallenge = this.el('lesson-challenge');
    this.potControl = this.el('pot-control');
    this.potSlider = this.el<HTMLInputElement>('pot-slider');
    this.potValue = this.el<HTMLOutputElement>('pot-value');

    this.partCard = this.el('part-card');
    this.partName = this.el('part-name');
    this.partRole = this.el('part-role');
    this.sensorControl = this.el('sensor-control');
    this.sensorLabel = this.el('sensor-label');
    this.sensorValue = this.el<HTMLOutputElement>('sensor-value');
    this.sensorSlider = this.el<HTMLInputElement>('sensor-slider');
    this.sensorHint = this.el('sensor-hint');
    this.soundToggle = this.el<HTMLButtonElement>('sound-toggle');

    this.codeEl = this.el<HTMLTextAreaElement>('code');
    this.blocks = new BlockEditor(this.el('blocks-host'), () => this.onBlocksChange());
    this.runBtn = this.el<HTMLButtonElement>('run-btn');
    this.runIcon = this.el('run-icon');
    this.runLabel = this.el('run-label');
    this.resetCodeBtn = this.el<HTMLButtonElement>('reset-code');
    this.serialOutput = this.el('serial-output');
    this.serialStatus = this.el('serial-status');
    this.serialDot = this.el('serial-dot');
    this.serialClearBtn = this.el<HTMLButtonElement>('serial-clear');
    this.completeBtn = this.el<HTMLButtonElement>('complete-btn');
    this.completeLabel = this.el('complete-label');
    this.progressRing = this.el('progress-ring');
    this.progressCount = this.el('progress-count');
    this.langToggle = this.el<HTMLButtonElement>('lang-toggle');
    this.langLabel = this.el('lang-label');
    this.componentsModal = this.el('components-modal');
    this.componentGrid = this.el('component-grid');
    this.modalCloseBtn = this.el<HTMLButtonElement>('modal-close');
    this.navLab = this.el<HTMLButtonElement>('nav-lab');
    this.navLessons = this.el<HTMLButtonElement>('nav-lessons');
    this.navComponents = this.el<HTMLButtonElement>('nav-components');

    this.scene = new ArduinoScene(this.canvasHost, this.sim.board);
    this.scene.onPartSelect = (key) => this.showPart(key);
    this.el('part-close').addEventListener('click', () => this.scene.clearSelection());
    this.bind();
    this.applyLanguage();

    this.codeEl.value = this.codes[this.activeId];
    this.blocks.load(this.blockStates[this.activeId] ?? starterFor(this.activeId));
    this.setMode(this.mode, false);
    this.updateLessonContent(true);
    this.updateProgress();
    this.updatePotUI(this.sim.board.potValue);
    this.renderSerial();
  }

  private el<T extends HTMLElement = HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Élément #${id} introuvable`);
    return element as T;
  }

  private loadState(): void {
    try {
      const storedLang = localStorage.getItem('arduino-lab:lang-v2');
      if (storedLang === 'fr' || storedLang === 'ar') this.lang = storedLang;

      const storedLesson = localStorage.getItem('arduino-lab:lesson');
      if (isLessonId(storedLesson)) this.activeId = storedLesson;

      const progress = localStorage.getItem('arduino-lab:progress');
      if (progress) {
        const parsed: unknown = JSON.parse(progress);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (isLessonId(item)) this.completed.add(item);
          }
        }
      }

      const storedMode = localStorage.getItem('arduino-lab:mode');
      if (storedMode === 'blocks' || storedMode === 'code') this.mode = storedMode;

      const blocks = localStorage.getItem('arduino-lab:blocks');
      if (blocks) {
        const parsed: unknown = JSON.parse(blocks);
        if (parsed && typeof parsed === 'object') this.blockStates = parsed as Record<string, unknown>;
      }

      const codes = localStorage.getItem('arduino-lab:codes');
      if (codes) {
        const parsed: unknown = JSON.parse(codes);
        if (parsed && typeof parsed === 'object') {
          const record = parsed as Record<string, unknown>;
          for (const lesson of LESSONS) {
            const value = record[lesson.id];
            if (typeof value === 'string') this.codes[lesson.id] = value;
          }
        }
      }
    } catch {
      // Stockage indisponible : on garde les valeurs par défaut.
    }
  }

  private persist(): void {
    try {
      localStorage.setItem('arduino-lab:lang-v2', this.lang);
      localStorage.setItem('arduino-lab:lesson', this.activeId);
      localStorage.setItem('arduino-lab:progress', JSON.stringify([...this.completed]));
      localStorage.setItem('arduino-lab:codes', JSON.stringify(this.codes));
      localStorage.setItem('arduino-lab:mode', this.mode);
      this.blockStates[this.activeId] = this.blocks.serialize();
      localStorage.setItem('arduino-lab:blocks', JSON.stringify(this.blockStates));
    } catch {
      // Stockage indisponible : le labo reste utilisable.
    }
  }

  private schedulePersist(): void {
    if (this.persistTimer !== null) window.clearTimeout(this.persistTimer);
    this.persistTimer = window.setTimeout(() => {
      this.persistTimer = null;
      this.persist();
    }, 350);
  }

  private bind(): void {
    this.langToggle.addEventListener('click', () => this.toggleLanguage());
    this.runBtn.addEventListener('click', () => this.toggleRun());
    this.resetCodeBtn.addEventListener('click', () => this.restoreCode());
    this.serialClearBtn.addEventListener('click', () => {
      this.sim.board.serial.clear();
      this.renderSerial();
    });
    this.completeBtn.addEventListener('click', () => this.toggleComplete());
    this.resetViewBtn.addEventListener('click', () => {
      this.scene.resetView();
      this.setNavActive(this.navLab);
    });

    this.navLab.addEventListener('click', () => {
      this.scene.resetView();
      this.setNavActive(this.navLab);
    });
    this.navLessons.addEventListener('click', () => {
      this.setNavActive(this.navLessons);
      this.lessonRail.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    this.navComponents.addEventListener('click', () => {
      this.setNavActive(this.navComponents);
      this.openModal();
    });

    this.modalCloseBtn.addEventListener('click', () => this.closeModal());
    this.componentsModal.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.dataset.closeModal !== undefined) this.closeModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.componentsModal.hidden) this.closeModal();
    });

    this.sensorSlider.addEventListener('input', () => {
      const value = Number(this.sensorSlider.value);
      if (this.sensorKind === 'distance') this.sim.board.setDistance(value);
      else if (this.sensorKind === 'temp') this.sim.board.setTemperature(value);
      else this.sim.board.setLight(value);
    });
    this.soundToggle.addEventListener('click', () => {
      const muted = this.audio.toggle();
      this.soundToggle.textContent = muted ? '🔇' : '🔊';
      this.soundToggle.setAttribute('aria-pressed', String(muted));
    });

    this.potSlider.addEventListener('input', () => {
      this.sim.board.setPot(Number(this.potSlider.value));
    });

    this.lessonList.addEventListener('click', (event) => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-lesson]');
      if (!target) return;
      const id = target.dataset.lesson;
      if (isLessonId(id)) this.selectLesson(id);
    });

    document.querySelectorAll<HTMLButtonElement>('.mode-tab').forEach((tab) => {
      tab.addEventListener('click', () => this.setMode(tab.dataset.mode === 'code' ? 'code' : 'blocks'));
    });

    this.codeEl.addEventListener('input', () => {
      this.manualEdits.add(this.activeId);
      this.codes[this.activeId] = this.codeEl.value;
      this.schedulePersist();
    });

    this.codeEl.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        event.preventDefault();
        const start = this.codeEl.selectionStart;
        const end = this.codeEl.selectionEnd;
        this.codeEl.setRangeText('  ', start, end, 'end');
        this.codes[this.activeId] = this.codeEl.value;
        this.schedulePersist();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        this.toggleRun();
      }
    });

    this.sim.subscribe((running) => {
      this.updateSimState(running);
      if (!running) this.sim.board.noTone(8);
    });
    this.sim.board.serial.subscribe(() => this.scheduleSerial());
    this.sim.board.subscribe((event) => {
      if (event.type === 'pot') this.updatePotUI(event.value);
      if (event.type === 'tone') {
        this.toneFreq = event.freq;
        this.audio.setTone(event.freq);
      }
      if (event.type === 'light' && this.sensorKind === 'light') this.sensorSlider.value = String(event.value);
      if (event.type === 'distance' && this.sensorKind === 'distance') this.sensorSlider.value = String(event.value);
      if (event.type === 'temp' && this.sensorKind === 'temp') this.sensorSlider.value = String(event.value);
      if (event.type === 'tone' || event.type === 'light' || event.type === 'servo' || event.type === 'distance' || event.type === 'temp') {
        this.updateSensorUI();
      }
    });
  }

  private applyLanguage(): void {
    document.documentElement.lang = this.lang;
    document.documentElement.dir = this.lang === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('is-ar', this.lang === 'ar');
    this.langLabel.textContent = this.lang === 'fr' ? 'AR' : 'FR';
    this.langToggle.setAttribute(
      'aria-label',
      this.lang === 'fr' ? 'Passer en arabe' : 'التبديل إلى الفرنسية',
    );

    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
      const key = element.dataset.i18n;
      if (key && key in ui) element.textContent = t(this.lang, key as UIKey);
    });

    document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((element) => {
      const key = element.dataset.i18nTitle;
      if (key && key in ui) element.title = t(this.lang, key as UIKey);
    });

    this.blocks.setLang(this.lang, t(this.lang, 'blocksEmpty'));
    this.renderLessonList();
    this.updateLessonContent(false);
    this.renderComponentsModal();
    this.updateProgress();
    this.renderSerial();
    this.renderPart();
    this.updateSimState(this.sim.running);
  }

  private toggleLanguage(): void {
    this.codes[this.activeId] = this.codeEl.value;
    this.lang = this.lang === 'fr' ? 'ar' : 'fr';
    this.persist();
    this.applyLanguage();
  }

  private renderLessonList(): void {
    this.lessonList.replaceChildren();

    LESSONS.forEach((lesson, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'lesson-item';
      button.dataset.lesson = lesson.id;
      if (lesson.id === this.activeId) button.classList.add('is-active');
      if (this.completed.has(lesson.id)) button.classList.add('is-done');

      const number = document.createElement('span');
      number.className = 'lesson-num';
      number.textContent = String(index + 1).padStart(2, '0');

      const copy = document.createElement('span');
      copy.className = 'lesson-copy';
      const title = document.createElement('strong');
      title.textContent = pick(this.lang, lesson.title);
      const tagline = document.createElement('small');
      tagline.textContent = pick(this.lang, lesson.tagline);
      copy.append(title, tagline);

      const state = document.createElement('span');
      state.className = 'lesson-state';
      state.textContent = this.completed.has(lesson.id) ? '✓' : '';

      button.append(number, copy, state);
      item.append(button);
      this.lessonList.append(item);
    });
  }

  private updateLessonContent(syncScene: boolean): void {
    const lesson = getLesson(this.activeId);
    const index = LESSONS.findIndex((item) => item.id === lesson.id);

    this.lessonNumber.textContent = `${t(this.lang, 'lesson')} ${String(index + 1).padStart(2, '0')}`;
    this.lessonLevel.textContent = pick(this.lang, lesson.level);
    this.lessonDuration.textContent = `${lesson.duration} ${t(this.lang, 'minutes')}`;
    this.lessonTitle.textContent = pick(this.lang, lesson.title);
    this.lessonTagline.textContent = pick(this.lang, lesson.tagline);
    this.lessonDescription.textContent = pick(this.lang, lesson.description);
    this.lessonChallenge.textContent = pick(this.lang, lesson.challenge);
    this.stageHint.textContent = pick(this.lang, lesson.hint);

    this.lessonObjectives.replaceChildren();
    for (const objective of lesson.objectives[this.lang]) {
      const item = document.createElement('li');
      item.textContent = objective;
      this.lessonObjectives.append(item);
    }

    this.lessonWiring.replaceChildren();
    for (const wire of lesson.wiring[this.lang]) {
      const item = document.createElement('li');
      item.textContent = wire;
      this.lessonWiring.append(item);
    }

    this.stageLegend.replaceChildren();
    for (const id of lesson.components) {
      const info = COMPONENTS[id];
      const chip = document.createElement('span');
      chip.className = 'legend-chip';
      const dot = document.createElement('span');
      dot.className = 'legend-dot';
      dot.style.background = info.color;
      const label = document.createElement('span');
      label.textContent = pick(this.lang, info.name);
      chip.append(dot, label);
      this.stageLegend.append(chip);
    }

    const has = (name: ComponentId): boolean => lesson.components.includes(name);
    this.potControl.hidden = !has('pot');
    const sensors = {
      light: ['lightLabel', 'lightHint'],
      distance: ['distLabel', 'distHint'],
      temp: ['tempLabel', 'tempHint'],
      servo: ['servoLabel', 'servoHint'],
      buzzer: ['toneLabel', 'toneHint'],
    } as const;
    this.sensorKind = has('ldr')
      ? 'light'
      : has('ultrasonic')
        ? 'distance'
        : has('tmp36')
          ? 'temp'
          : has('servo')
          ? 'servo'
          : has('buzzer')
            ? 'buzzer'
            : null;
    const sensor = this.sensorKind ? sensors[this.sensorKind] : null;
    this.sensorControl.hidden = sensor === null;
    const slider = {
      light: { min: 0, max: 1023, value: this.sim.board.lightValue },
      distance: { min: 2, max: 60, value: this.sim.board.distanceCm },
      temp: { min: -10, max: 50, value: this.sim.board.tempC },
    } as const;
    const range = this.sensorKind === 'light' || this.sensorKind === 'distance' || this.sensorKind === 'temp' ? slider[this.sensorKind] : null;
    this.sensorSlider.hidden = range === null;
    if (range) {
      this.sensorSlider.min = String(range.min);
      this.sensorSlider.max = String(range.max);
      this.sensorSlider.value = String(range.value);
      // A1 lit la photorésistance ou la sonde TMP36 selon la leçon : on « branche » la bonne.
      if (this.sensorKind === 'temp') this.sim.board.setTemperature(this.sim.board.tempC);
      if (this.sensorKind === 'light') this.sim.board.setLight(this.sim.board.lightValue);
    }
    this.soundToggle.hidden = !has('buzzer');
    if (sensor) {
      this.sensorLabel.textContent = t(this.lang, sensor[0]);
      this.sensorHint.textContent = t(this.lang, sensor[1]);
      this.updateSensorUI();
    }
    this.updateCompleteButton();

    if (syncScene) this.scene.setLesson(lesson.highlightPins, lesson.components);
  }

  private selectLesson(id: LessonId): void {
    if (id === this.activeId) return;

    this.codes[this.activeId] = this.codeEl.value;
    this.persist();
    this.sim.stop();
    this.sim.board.serial.clear();
    this.sim.board.setButton(false);
    this.sim.board.reset();

    this.blockStates[this.activeId] = this.blocks.serialize();

    this.activeId = id;
    this.hasRun = false;
    this.codeEl.value = this.codes[id];
    this.blocks.load(this.blockStates[id] ?? starterFor(id));
    this.updateModeUI();

    this.renderLessonList();
    this.updateLessonContent(true);
    this.updatePotUI(this.sim.board.potValue);
    this.renderSerial();
    this.updateSimState(false);
    this.persist();
  }

  private toggleRun(): void {
    if (this.sim.running) {
      this.sim.stop();
      this.sim.board.serial.system(t(this.lang, 'stopped'));
      return;
    }

    this.codes[this.activeId] = this.codeEl.value;
    this.persist();
    this.hasRun = true;
    this.sim.board.serial.clear();
    this.sim.board.serial.system(t(this.lang, 'uploading'));
    // En mode « Blocs », on exécute le programme généré par les blocs.
    void this.sim.start(this.mode === 'blocks' ? this.blocks.getCode() : this.codes[this.activeId]);
  }

  private restoreCode(): void {
    const lesson = getLesson(this.activeId);
    this.codes[this.activeId] = lesson.code;
    this.codeEl.value = lesson.code;
    this.manualEdits.delete(this.activeId);
    this.blocks.load(starterFor(this.activeId));
    this.updateModeUI();
    this.persist();
  }

  /** Les blocs ont changé : on régénère le code Arduino correspondant. */
  private onBlocksChange(): void {
    const code = this.blocks.getCode();
    this.codeEl.value = code;
    this.codes[this.activeId] = code;
    this.manualEdits.delete(this.activeId);
    this.updateModeUI();
    this.schedulePersist();
  }

  private setMode(mode: 'blocks' | 'code', persist = true): void {
    this.mode = mode;
    this.updateModeUI();
    if (persist) this.persist();
  }

  private updateModeUI(): void {
    const isBlocks = this.mode === 'blocks';
    this.el('blocks-host').hidden = !isBlocks;
    this.codeEl.hidden = isBlocks;
    this.el('blocks-hint').hidden = !(isBlocks && this.manualEdits.has(this.activeId));
    document.querySelectorAll<HTMLElement>('.mode-tab').forEach((tab) => {
      const active = tab.dataset.mode === this.mode;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
    });
  }

  private toggleComplete(): void {
    if (this.completed.has(this.activeId)) {
      this.completed.delete(this.activeId);
    } else {
      this.completed.add(this.activeId);
    }
    this.persist();
    this.renderLessonList();
    this.updateCompleteButton();
    this.updateProgress();
  }

  private updateCompleteButton(): void {
    const done = this.completed.has(this.activeId);
    this.completeBtn.classList.toggle('is-done', done);
    this.completeBtn.setAttribute('aria-pressed', String(done));
    this.completeLabel.textContent = done ? t(this.lang, 'completed') : t(this.lang, 'markComplete');
  }

  private updateProgress(): void {
    const count = this.completed.size;
    const total = LESSONS.length;
    const label = `${count}/${total}`;
    this.progressCount.textContent = label;
    this.railProgress.textContent = label;
    this.progressRing.style.setProperty('--p', String((count / total) * 100));
  }

  private updateSimState(running: boolean): void {
    this.runBtn.classList.toggle('is-running', running);
    this.runIcon.textContent = running ? '■' : '▶';
    this.runLabel.textContent = running ? t(this.lang, 'stop') : t(this.lang, 'run');
    this.serialStatus.textContent = running
      ? t(this.lang, 'serialRunning')
      : t(this.lang, 'serialStopped');
    this.serialDot.classList.toggle('is-on', running);
    this.stageStatus.classList.toggle('is-running', running);
    this.stageStatusText.textContent = running
      ? t(this.lang, 'simRunning')
      : this.hasRun
        ? t(this.lang, 'simStopped')
        : t(this.lang, 'simReady');
  }

  private updateSensorUI(): void {
    const board = this.sim.board;
    if (this.sensorKind === 'light') this.sensorValue.textContent = String(board.lightValue);
    else if (this.sensorKind === 'distance') this.sensorValue.textContent = `${board.distanceCm} cm`;
    else if (this.sensorKind === 'temp') this.sensorValue.textContent = `${board.tempC} °C`;
    else if (this.sensorKind === 'servo') this.sensorValue.textContent = `${board.servoAngle}°`;
    else if (this.sensorKind === 'buzzer') {
      this.sensorValue.textContent = this.toneFreq > 0 ? `${this.toneFreq} Hz` : '—';
    }
  }

  private updatePotUI(value: number): void {
    this.potSlider.value = String(value);
    this.potValue.textContent = String(value);
  }

  private scheduleSerial(): void {
    if (this.serialFrame !== null) return;
    this.serialFrame = window.requestAnimationFrame(() => {
      this.serialFrame = null;
      this.renderSerial();
    });
  }

  private renderSerial(): void {
    const lines = this.sim.board.serial.getLines();
    const partial = this.sim.board.serial.getPartial();
    this.serialOutput.replaceChildren();

    if (lines.length === 0 && partial.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'serial-empty';
      empty.textContent = t(this.lang, 'serialPlaceholder');
      this.serialOutput.append(empty);
      return;
    }

    for (const line of lines) {
      const row = document.createElement('div');
      row.className = `serial-line is-${line.kind}`;
      row.textContent = line.text || ' ';
      this.serialOutput.append(row);
    }

    if (partial.length > 0) {
      const row = document.createElement('div');
      row.className = 'serial-line is-out is-partial';
      row.textContent = partial;
      this.serialOutput.append(row);
    }

    this.serialOutput.scrollTop = this.serialOutput.scrollHeight;
  }

  private renderComponentsModal(): void {
    const ids: ComponentId[] = ['led', 'resistor', 'button', 'pot', 'buzzer', 'ldr', 'servo', 'ultrasonic', 'tmp36', 'lcd', 'wires'];
    this.componentGrid.replaceChildren();

    for (const id of ids) {
      const info = COMPONENTS[id];
      const card = document.createElement('div');
      card.className = 'component-card';

      const swatch = document.createElement('span');
      swatch.className = 'component-swatch';
      swatch.style.background = info.color;

      const title = document.createElement('h3');
      title.textContent = pick(this.lang, info.name);

      const role = document.createElement('p');
      role.textContent = pick(this.lang, info.role);

      card.append(swatch, title, role);
      this.componentGrid.append(card);
    }
  }

  private showPart(key: string | null): void {
    this.selectedPart = key;
    this.renderPart();
  }

  private renderPart(): void {
    const info = this.selectedPart ? getPartInfo(this.selectedPart) : null;
    this.partCard.hidden = info === null;
    if (!info) return;
    this.partName.textContent = pick(this.lang, info.name);
    this.partRole.textContent = pick(this.lang, info.role);
  }

  private openModal(): void {
    this.componentsModal.hidden = false;
    document.body.classList.add('modal-open');
    this.modalCloseBtn.focus();
  }

  private closeModal(): void {
    this.componentsModal.hidden = true;
    document.body.classList.remove('modal-open');
  }

  private setNavActive(active: HTMLButtonElement): void {
    for (const button of [this.navLab, this.navLessons, this.navComponents]) {
      button.classList.toggle('is-active', button === active);
    }
  }
}
