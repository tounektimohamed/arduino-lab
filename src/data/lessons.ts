import type { Localized } from '../i18n';

export type LessonId = 'blink' | 'button' | 'pot' | 'buzzer' | 'light' | 'servo';
export type ComponentId = 'led' | 'resistor' | 'button' | 'pot' | 'wires' | 'buzzer' | 'ldr' | 'servo';

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
  buzzer: {
    name: { fr: 'Buzzer piézo', ar: 'جرس بيزو' },
    role: {
      fr: 'Vibre à la fréquence reçue : chaque fréquence est une note.',
      ar: 'يهتزّ بالتردد المُرسَل إليه: كل تردد هو نغمة.',
    },
    color: '#2b2b2f',
  },
  ldr: {
    name: { fr: 'Photorésistance (LDR)', ar: 'مقاومة ضوئية (LDR)' },
    role: {
      fr: 'Sa résistance baisse quand la lumière augmente.',
      ar: 'تنخفض مقاومتها كلما زادت الإضاءة.',
    },
    color: '#c9a45c',
  },
  servo: {
    name: { fr: 'Servomoteur SG90', ar: 'محرّك مؤازر SG90' },
    role: {
      fr: 'Tourne à un angle précis, de 0° à 180°, selon la consigne.',
      ar: 'يدور إلى زاوية دقيقة من 0° إلى 180° حسب الأمر.',
    },
    color: '#3b6fb6',
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
    highlightPins: ['9', 'A0', '5V', 'GND', 'GND-F'],
  },
  {
    id: 'buzzer',
    title: { fr: 'Jouer une mélodie', ar: 'عزف لحن' },
    tagline: {
      fr: 'Un buzzer sur la broche 8 et la fonction tone().',
      ar: 'جرس على المنفذ 8 والدالة tone().',
    },
    duration: 12,
    level: { fr: 'Intermédiaire', ar: 'متوسط' },
    description: {
      fr: 'Un buzzer piézo vibre à la fréquence qu’on lui envoie : 262 Hz donne un do, 440 Hz un la. tone(broche, fréquence, durée) lance la note sans bloquer le programme, d’où le delay() qui laisse la note se jouer. Activez le son avec le bouton haut-parleur de la scène.',
      ar: 'يهتزّ جرس البيزو بالتردد الذي نرسله إليه: 262 هرتز يعطي نغمة دو و440 هرتز نغمة لا. تبدأ الدالة tone(منفذ، تردد، مدة) النغمة دون إيقاف البرنامج، ولهذا نستخدم delay() لتركها تُعزف. فعّل الصوت بزرّ مكبّر الصوت في المشهد.',
    },
    objectives: {
      fr: [
        'Piloter un buzzer avec tone() et noTone().',
        'Relier une fréquence (Hz) à une note de musique.',
        'Factoriser son code avec une fonction jouer().',
      ],
      ar: [
        'التحكم في الجرس باستخدام tone() وnoTone().',
        'ربط التردد (هرتز) بنغمة موسيقية.',
        'تنظيم الكود بدالة jouer().',
      ],
    },
    wiring: {
      fr: ['Broche 8 → patte + du buzzer.', 'Patte − du buzzer → GND.'],
      ar: ['المنفذ 8 ← ساق + للجرس.', 'ساق − للجرس ← GND.'],
    },
    challenge: {
      fr: 'Composez les 8 notes d’une gamme montante, de NOTE_C4 à NOTE_C5.',
      ar: 'ألّف 8 نغمات لسلّم صاعد من NOTE_C4 إلى NOTE_C5.',
    },
    hint: {
      fr: 'Lancez le code : les ondes sonores apparaissent autour du buzzer.',
      ar: 'شغّل الكود: تظهر الموجات الصوتية حول الجرس.',
    },
    code: `// Leçon 4 — jouer une mélodie\n\nconst int BUZZER = 8;\n\nvoid jouer(int note, int duree) {\n  tone(BUZZER, note, duree);\n  delay(duree + 60);\n}\n\nvoid setup() {\n  pinMode(BUZZER, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  Serial.println(\"Melodie...\");\n  jouer(NOTE_C4, 300);\n  jouer(NOTE_E4, 300);\n  jouer(NOTE_G4, 300);\n  jouer(NOTE_C5, 600);\n  noTone(BUZZER);\n  delay(1500);\n}\n`,
    components: ['buzzer', 'wires'],
    highlightPins: ['8', 'GND'],
  },
  {
    id: 'light',
    title: { fr: 'Veilleuse automatique', ar: 'مصباح ليلي تلقائي' },
    tagline: {
      fr: 'Une photorésistance pour allumer la LED quand il fait sombre.',
      ar: 'مقاومة ضوئية لإضاءة المصباح عند الظلام.',
    },
    duration: 14,
    level: { fr: 'Intermédiaire', ar: 'متوسط' },
    description: {
      fr: 'La photorésistance (LDR) et une résistance de 10 kΩ forment un pont diviseur : plus il y a de lumière, plus la tension sur A1 monte. analogRead() la mesure de 0 à 1023. On inverse ensuite la valeur avec map() pour que la LED brille quand la pièce s’assombrit. Déplacez le soleil dans la scène ou utilisez le curseur.',
      ar: 'تشكّل المقاومة الضوئية (LDR) ومقاومة 10 كيلو أوم مقسّم جهد: كلما زادت الإضاءة ارتفع الجهد على A1. يقيسه analogRead() من 0 إلى 1023. ثم نعكس القيمة بالدالة map() فيسطع المصباح عندما تظلم الغرفة. حرّك الشمس في المشهد أو استخدم المنزلق.',
    },
    objectives: {
      fr: [
        'Comprendre un pont diviseur de tension.',
        'Lire un capteur analogique sur A1.',
        'Inverser une plage avec map(valeur, 0, 1023, 255, 0).',
      ],
      ar: [
        'فهم مقسّم الجهد.',
        'قراءة حسّاس تماثلي على A1.',
        'عكس مجال القيم بـ map(valeur, 0, 1023, 255, 0).',
      ],
    },
    wiring: {
      fr: [
        '5V → première patte de la LDR.',
        'Seconde patte de la LDR → A1 et résistance 10 kΩ.',
        'Autre bout de la résistance → GND.',
      ],
      ar: [
        '5V ← الساق الأولى للـ LDR.',
        'الساق الثانية للـ LDR ← A1 ومقاومة 10 كيلو.',
        'الطرف الآخر للمقاومة ← GND.',
      ],
    },
    challenge: {
      fr: 'Allumez la LED à fond seulement sous le seuil de 300, sinon éteignez-la.',
      ar: 'أضئ المصباح بالكامل فقط تحت العتبة 300، وإلا أطفئه.',
    },
    hint: {
      fr: 'Faites glisser le soleil : la pièce s’assombrit et la LED s’allume.',
      ar: 'اسحب الشمس: تُظلم الغرفة ويُضاء المصباح.',
    },
    code: `// Leçon 5 — veilleuse automatique\n\nconst int LED = 9;\nconst int LDR = A1;\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int lumiere = analogRead(LDR);\n  int luminosite = map(lumiere, 0, 1023, 255, 0);\n\n  analogWrite(LED, luminosite);\n\n  Serial.print(\"Lumiere : \");\n  Serial.println(lumiere);\n\n  delay(150);\n}\n`,
    components: ['ldr', 'resistor', 'led', 'wires'],
    highlightPins: ['9', 'A1', '5V', 'GND', 'GND-F'],
  },
  {
    id: 'servo',
    title: { fr: 'Piloter un servomoteur', ar: 'التحكم في محرّك مؤازر' },
    tagline: {
      fr: 'Balayer un bras de 0° à 180° avec la bibliothèque Servo.',
      ar: 'تحريك ذراع من 0° إلى 180° بمكتبة Servo.',
    },
    duration: 14,
    level: { fr: 'Intermédiaire', ar: 'متوسط' },
    description: {
      fr: 'Un servomoteur ne tourne pas librement : il vise un angle. La bibliothèque Servo envoie à la broche 10 une impulsion dont la largeur code l’angle. Après attach(10), l’instruction write(angle) place le bras. Une boucle for fait varier l’angle pas à pas pour obtenir un balayage fluide.',
      ar: 'لا يدور المحرّك المؤازر بحرية: بل يستهدف زاوية. ترسل مكتبة Servo إلى المنفذ 10 نبضة يحمل عرضها الزاوية. بعد attach(10) تضع write(angle) الذراع. وتغيّر حلقة for الزاوية خطوة بخطوة للحصول على حركة سلسة.',
    },
    objectives: {
      fr: [
        'Inclure et déclarer un objet Servo.',
        'Positionner le bras avec write(angle).',
        'Animer un balayage avec une boucle for.',
      ],
      ar: [
        'تضمين كائن Servo والتصريح به.',
        'تحديد موضع الذراع بـ write(angle).',
        'تحريك المسح بحلقة for.',
      ],
    },
    wiring: {
      fr: [
        'Fil orange (signal) → broche 10.',
        'Fil rouge → 5V.',
        'Fil marron → GND.',
      ],
      ar: [
        'السلك البرتقالي (الإشارة) ← المنفذ 10.',
        'السلك الأحمر ← 5V.',
        'السلك البني ← GND.',
      ],
    },
    challenge: {
      fr: 'Faites aller le bras à 90° et attendez 2 secondes avant de repartir.',
      ar: 'اجعل الذراع يذهب إلى 90° وانتظر ثانيتين قبل المتابعة.',
    },
    hint: {
      fr: 'Lancez le code et regardez le bras balayer, en bas de la scène.',
      ar: 'شغّل الكود وراقب الذراع وهو يمسح، أسفل المشهد.',
    },
    code: `// Leçon 6 — piloter un servomoteur\n#include <Servo.h>\n\nServo bras;\n\nvoid setup() {\n  bras.attach(10);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  for (int angle = 0; angle <= 180; angle += 10) {\n    bras.write(angle);\n    Serial.println(angle);\n    delay(120);\n  }\n  for (int angle = 180; angle >= 0; angle -= 10) {\n    bras.write(angle);\n    Serial.println(angle);\n    delay(120);\n  }\n}\n`,
    components: ['servo', 'wires'],
    highlightPins: ['10', '5V', 'GND-F'],
  },
];

export function getLesson(id: LessonId): Lesson {
  return LESSONS.find((lesson) => lesson.id === id) ?? LESSONS[0];
}

export function isLessonId(value: unknown): value is LessonId {
  return LESSONS.some((lesson) => lesson.id === value);
}
