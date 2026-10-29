import type { Localized } from '../i18n';

export type LessonId = 'blink' | 'button' | 'pot';
export type ComponentId = 'led' | 'resistor' | 'button' | 'pot' | 'wires';

export interface ComponentInfo {
  name: Localized;
  role: Localized;
  color: string;
}

export const COMPONENTS: Record<ComponentId, ComponentInfo> = {
  led: {
    name: { fr: 'LED rouge', ar: 'مصباح LED أحمر' },
    role: {
      fr: 'Transforme un courant en lumière. La patte longue est l’anode (+).',
      ar: 'يحوّل التيار إلى ضوء. الساق الطويلة هي الأنود (+).',
    },
    color: '#e2543f',
  },
  resistor: {
    name: { fr: 'Résistance 220 Ω', ar: 'مقاومة 220 أوم' },
    role: {
      fr: 'Limite le courant pour protéger la LED et la carte.',
      ar: 'تحدّ من التيار لحماية المصباح واللوحة.',
    },
    color: '#c89b6d',
  },
  button: {
    name: { fr: 'Bouton poussoir', ar: 'زرّ ضغط' },
    role: {
      fr: 'Ferme ou ouvre un circuit quand on appuie dessus.',
      ar: 'يغلق الدائرة أو يفتحها عند الضغط عليه.',
    },
    color: '#4c5a68',
  },
  pot: {
    name: { fr: 'Potentiomètre 10 kΩ', ar: 'مقياس جهد 10 كيلو أوم' },
    role: {
      fr: 'Une résistance réglable : sa position devient une tension.',
      ar: 'مقاومة قابلة للضبط: يتحوّل موضعها إلى جهد كهربائي.',
    },
    color: '#3f7bd9',
  },
  wires: {
    name: { fr: 'Fils de liaison', ar: 'أسلاك التوصيل' },
    role: {
      fr: 'Relient les composants aux broches de la carte.',
      ar: 'تربط المكوّنات بمنافذ اللوحة.',
    },
    color: '#2f9e6f',
  },
};

export interface Lesson {
  id: LessonId;
  title: Localized;
  tagline: Localized;
  duration: number;
  level: Localized;
  description: Localized;
  objectives: { fr: string[]; ar: string[] };
  wiring: { fr: string[]; ar: string[] };
  challenge: Localized;
  hint: Localized;
  code: string;
  components: ComponentId[];
  highlightPins: string[];
}

export const LESSONS: Lesson[] = [
  {
    id: 'blink',
    title: { fr: 'Faire clignoter une LED', ar: 'إضاءة مصباح LED' },
    tagline: {
      fr: 'Votre premier circuit : une LED, une résistance et la broche 9.',
      ar: 'دائرتك الأولى: مصباح LED ومقاومة والمنفذ 9.',
    },
    duration: 8,
    level: { fr: 'Débutant', ar: 'مبتدئ' },
    description: {
      fr: 'La carte Arduino est un petit ordinateur qui parle au monde physique par ses broches. Dans cette leçon, vous allumez une LED branchée sur la broche 9, vous attendez, puis vous l’éteignez. Ce rythme est la base de presque tous les projets : une sortie, un délai, une répétition.',
      ar: 'لوحة أردوينو حاسوب صغير يتواصل مع العالم المادي عبر منافذه. في هذا الدرس تُضيء مصباح LED موصولًا بالمنفذ 9، تنتظر، ثم تُطفئه. هذه الإيقاعية هي أساس معظم المشاريع: خرج، ثم انتظار، ثم تكرار.',
    },
    objectives: {
      fr: [
        'Repérer une broche digitale et la masse (GND) sur la carte.',
        'Comprendre le rôle de setup() et de loop().',
        'Allumer et éteindre une LED avec digitalWrite() et delay().',
      ],
      ar: [
        'التعرّف على منفذ رقمي والأرضي (GND) على اللوحة.',
        'فهم دور setup() و loop().',
        'إضاءة المصباح وإطفاؤه باستخدام digitalWrite() و delay().',
      ],
    },
    wiring: {
      fr: [
        'Broche 9 → résistance 220 Ω.',
        'Résistance → anode de la LED (patte longue).',
        'Cathode de la LED → GND.',
      ],
      ar: [
        'المنفذ 9 ← مقاومة 220 أوم.',
        'المقاومة ← أنود المصباح (الساق الطويلة).',
        'كاثود المصباح ← GND.',
      ],
    },
    challenge: {
      fr: 'Changez les deux delay(600) : essayez 100 ms puis 1200 ms. Que se passe-t-il ?',
      ar: 'غيّر قيمتي delay(600): جرّب 100 مللي ثانية ثم 1200. ماذا يحدث؟',
    },
    hint: {
      fr: 'Lancez le code pour voir la LED clignoter.',
      ar: 'شغّل الكود لترى المصباح يومض.',
    },
    code: `// Leçon 1 — faire clignoter une LED

const int LED = 9;

void setup() {
  pinMode(LED, OUTPUT);
}

void loop() {
  digitalWrite(LED, HIGH);
  delay(600);

  digitalWrite(LED, LOW);
  delay(600);
}
`,
    components: ['led', 'resistor', 'wires'],
    highlightPins: ['9', 'GND'],
  },
  {
    id: 'button',
    title: { fr: 'Un bouton, deux états', ar: 'زرّ بحالتين' },
    tagline: {
      fr: 'Lire une entrée numérique et réagir à un appui.',
      ar: 'قراءة مدخل رقمي والتفاعل مع الضغط.',
    },
    duration: 10,
    level: { fr: 'Débutant', ar: 'مبتدئ' },
    description: {
      fr: 'Jusqu’ici, la carte parlait. Maintenant, elle écoute. Un bouton relié à la broche 2 et à la masse permet de lire un appui. Avec INPUT_PULLUP, la broche reste à l’état haut au repos et passe à l’état bas quand on appuie : inutile d’ajouter une résistance externe.',
      ar: 'حتى الآن كانت اللوحة تتكلّم. الآن ستستمع. زرّ موصول بالمنفذ 2 وبالأرضي يسمح بقراءة الضغط. باستخدام INPUT_PULLUP يبقى المنفذ في الحالة العالية عند الراحة وينتقل إلى الحالة المنخفضة عند الضغط: دون حاجة إلى مقاومة خارجية.',
    },
    objectives: {
      fr: [
        'Utiliser INPUT_PULLUP pour stabiliser une entrée.',
        'Lire l’état d’un bouton avec digitalRead().',
        'Prendre une décision avec if / else.',
      ],
      ar: [
        'استخدام INPUT_PULLUP لتثبيت المدخل.',
        'قراءة حالة الزرّ باستخدام digitalRead().',
        'اتخاذ قرار باستخدام if / else.',
      ],
    },
    wiring: {
      fr: [
        'Broche 2 → un côté du bouton.',
        'Autre côté du bouton → GND.',
        'La LED reste câblée sur la broche 9.',
      ],
      ar: [
        'المنفذ 2 ← أحد طرفي الزرّ.',
        'الطرف الآخر للزرّ ← GND.',
        'يبقى المصباح موصولًا بالمنفذ 9.',
      ],
    },
    challenge: {
      fr: 'Ajoutez un compteur d’appuis et affichez-le dans le moniteur série.',
      ar: 'أضف عدّادًا للضغطات واعرضه في مراقب المنفذ التسلسلي.',
    },
    hint: {
      fr: 'Cliquez sur le bouton dans la scène 3D.',
      ar: 'انقر على الزرّ في المشهد ثلاثي الأبعاد.',
    },
    code: `// Leçon 2 — un bouton, deux états

const int LED = 9;
const int BOUTON = 2;

int dernierEtat = HIGH;

void setup() {
  pinMode(LED, OUTPUT);
  pinMode(BOUTON, INPUT_PULLUP);
  Serial.begin(9600);
}

void loop() {
  int etat = digitalRead(BOUTON);

  if (etat != dernierEtat) {
    if (etat == LOW) {
      digitalWrite(LED, HIGH);
      Serial.println("LED allumee");
    } else {
      digitalWrite(LED, LOW);
      Serial.println("LED eteinte");
    }
    dernierEtat = etat;
  }

  delay(20);
}
`,
    components: ['button', 'led', 'resistor', 'wires'],
    highlightPins: ['9', '2', 'GND'],
  },
  {
    id: 'pot',
    title: { fr: 'Lire un potentiomètre', ar: 'قراءة مقياس الجهد' },
    tagline: {
      fr: 'Transformer une position en nombre, puis en luminosité.',
      ar: 'تحويل موضع إلى رقم ثم إلى سطوع.',
    },
    duration: 12,
    level: { fr: 'Intermédiaire', ar: 'متوسط' },
    description: {
      fr: 'Le potentiomètre divise une tension entre 0 et 5 V. La carte la mesure avec un convertisseur analogique-numérique : analogRead() renvoie une valeur entre 0 et 1023. On la convertit avec map(), puis on la renvoie en PWM sur la LED pour faire varier sa luminosité.',
      ar: 'يقسّم مقياس الجهد جهدًا بين 0 و5 فولت. تقيسه اللوحة بمحوّل تماثلي-رقمي: يُرجع analogRead() قيمة بين 0 و1023. نحوّلها باستخدام map()، ثم نرسلها كإشارة PWM إلى المصباح لتغيير سطوعه.',
    },
    objectives: {
      fr: [
        'Lire une tension analogique avec analogRead().',
        'Convertir une plage de valeurs avec map().',
        'Piloter la luminosité avec analogWrite() (PWM).',
      ],
      ar: [
        'قراءة جهد تماثلي باستخدام analogRead().',
        'تحويل مجال قيم باستخدام map().',
        'التحكم في السطوع باستخدام analogWrite() (PWM).',
      ],
    },
    wiring: {
      fr: [
        '5V → patte gauche du potentiomètre.',
        'GND → patte droite.',
        'Curseur (patte du milieu) → A0.',
      ],
      ar: [
        '5V ← الساق اليسرى لمقياس الجهد.',
        'GND ← الساق اليمنى.',
        'المنزلق (الساق الوسطى) ← A0.',
      ],
    },
    challenge: {
      fr: 'Affichez aussi le pourcentage (0–100 %) dans le moniteur série.',
      ar: 'اعرض أيضًا النسبة المئوية (0–100٪) في المراقب.',
    },
    hint: {
      fr: 'Faites glisser le potentiomètre et lancez le code.',
      ar: 'اسحب مقياس الجهد ثم شغّل الكود.',
    },
    code: `// Leçon 3 — lire un potentiomètre

const int LED = 9;
const int POT = A0;

void setup() {
  pinMode(LED, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  int mesure = analogRead(POT);
  int luminosite = map(mesure, 0, 1023, 0, 255);

  analogWrite(LED, luminosite);

  Serial.print("Potentiometre : ");
  Serial.print(mesure);
  Serial.print("  ->  LED : ");
  Serial.println(luminosite);

  delay(120);
}
`,
    components: ['pot', 'led', 'resistor', 'wires'],
    highlightPins: ['9', 'A0', '5V', 'GND'],
  },
];

export function getLesson(id: LessonId): Lesson {
  return LESSONS.find((lesson) => lesson.id === id) ?? LESSONS[0];
}
