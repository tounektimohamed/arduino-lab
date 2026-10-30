import type { Localized } from '../i18n';

export type LessonId = 'blink' | 'button' | 'pot' | 'buzzer' | 'light' | 'servo' | 'fade' | 'sos' | 'doorbell' | 'toggle' | 'theremin' | 'servopot' | 'alarm' | 'sunflower' | 'reaction' | 'lcd' | 'distance' | 'thermo';
export type ComponentId = 'led' | 'resistor' | 'button' | 'pot' | 'wires' | 'buzzer' | 'ldr' | 'servo' | 'lcd' | 'ultrasonic' | 'tmp36';

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
  tmp36: {
    name: { fr: 'Capteur de température TMP36', ar: 'حسّاس الحرارة TMP36' },
    role: {
      fr: 'Sa tension de sortie vaut 0,5 V à 0 °C et augmente de 10 mV par degré : on la lit avec analogRead().',
      ar: 'جهد خرجه 0.5 فولت عند 0 °م ويزداد 10 ميلي فولت لكل درجة: نقرؤه بـ analogRead().',
    },
    color: '#1c1c20',
  },
  ultrasonic: {
    name: { fr: 'Capteur à ultrasons HC-SR04', ar: 'حسّاس الموجات فوق الصوتية HC-SR04' },
    role: {
      fr: 'Envoie une impulsion sonore (TRIG) et mesure le temps de l’écho (ECHO) : distance en cm = temps en µs ÷ 58.',
      ar: 'يرسل نبضة صوتية (TRIG) ويقيس زمن الصدى (ECHO): المسافة بالسنتيمتر = الزمن بالميكروثانية ÷ 58.',
    },
    color: '#2f6bb5',
  },
  lcd: {
    name: { fr: 'Écran LCD I2C', ar: 'شاشة LCD I2C' },
    role: {
      fr: 'Affiche du texte (2 lignes de 16 caractères) envoyé par le microcontrôleur via 2 fils seulement : SDA et SCL.',
      ar: 'تعرض نصًا (سطران من 16 حرفًا) يرسله المتحكم الدقيق عبر سلكين فقط: SDA وSCL.',
    },
    color: '#274060',
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
    highlightPins: ['9', '2', 'GND', 'GND-F'],
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
    code: `// Lecon 4 - Humat al-Hima (complet)\n// D4=294 E4=330 G4=392 A4=440 B4=494 C5=523 D5=587\n\nconst int BUZZER = 8;\n\nvoid jouer(int note, int duree) {\n  tone(BUZZER, note, duree);\n  delay(duree + 60);\n}\n\nvoid partieA() {\n  jouer(392, 200);\n  delay(200);\n  jouer(392, 300);\n  jouer(440, 100);\n\n  jouer(392, 200);\n  delay(200);\n  jouer(392, 300);\n  jouer(440, 100);\n\n  jouer(494, 400);\n  jouer(440, 133);\n  jouer(494, 133);\n  jouer(440, 133);\n\n  jouer(392, 400);\n  delay(300);\n  jouer(392, 100);\n\n  jouer(494, 400);\n  jouer(494, 300);\n  jouer(587, 100);\n\n  jouer(494, 400);\n  jouer(330, 300);\n  jouer(330, 100);\n\n  jouer(440, 400);\n  jouer(440, 300);\n  jouer(440, 100);\n}\n\nvoid fin8() {\n  jouer(392, 200);\n  delay(500);\n  jouer(392, 100);\n}\n\nvoid partieB() {\n  jouer(494, 400);\n  jouer(494, 300);\n  jouer(587, 100);\n\n  jouer(523, 400);\n  jouer(440, 300);\n  jouer(523, 100);\n\n  jouer(494, 400);\n  jouer(440, 133);\n  jouer(494, 133);\n  jouer(440, 133);\n\n  jouer(392, 400);\n  delay(300);\n  jouer(392, 100);\n\n  jouer(494, 400);\n  jouer(494, 300);\n  jouer(587, 100);\n\n  jouer(494, 400);\n  jouer(330, 300);\n  jouer(330, 100);\n\n  jouer(440, 400);\n  jouer(440, 133);\n  jouer(494, 133);\n  jouer(440, 133);\n}\n\nvoid setup() {\n  pinMode(BUZZER, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  Serial.println(\"Melodie...\");\n\n  jouer(294, 100);\n\n  partieA();\n  fin8();\n  partieA();\n  fin8();\n\n  partieB();\n  fin8();\n  partieB();\n  fin8();\n  partieB();\n  fin8();\n  partieB();\n\n  jouer(294, 100);\n  partieA();\n  fin8();\n  partieA();\n  jouer(392, 800);\n\n  noTone(BUZZER);\n  delay(3000);\n}\n`,
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
  {
    id: "fade",
    title: { fr: "La LED qui respire", ar: "مصباح يتنفّس" },
    tagline: { fr: "Un dégradé de luminosité avec une boucle for et analogWrite().", ar: "تدرّج في السطوع بحلقة for والدالة analogWrite()." },
    duration: 8,
    level: { fr: "Débutant", ar: "مبتدئ" },
    description: { fr: "Le PWM allume et éteint la LED très vite : plus l’impulsion est longue, plus elle paraît lumineuse. Deux boucles for font monter puis descendre la valeur de 0 à 255 pour un effet de respiration.", ar: "تشغّل تقنية PWM المصباح وتطفئه بسرعة كبيرة: كلما طالت النبضة بدا أسطع. حلقتا for ترفعان القيمة من 0 إلى 255 ثم تخفضانها لتأثير التنفّس." },
    objectives: { fr: ["Comprendre le PWM (modulation de largeur d’impulsion).", "Utiliser une boucle for avec un pas.", "Créer une animation fluide avec delay()."], ar: ["فهم تقنية PWM (تضمين عرض النبضة).", "استخدام حلقة for بخطوة محدّدة.", "صنع حركة سلسة باستخدام delay()."] },
    wiring: { fr: ["Broche 9 → résistance 220 Ω → LED (+).", "LED (−) → GND."], ar: ["المنفذ 9 ← مقاومة 220 أوم ← المصباح (+).", "المصباح (−) ← GND."] },
    challenge: { fr: "Ralentissez la respiration pour qu’un cycle complet dure environ 4 secondes.", ar: "أبطئ التنفّس ليستغرق الدورة الكاملة نحو 4 ثوانٍ." },
    hint: { fr: "Lancez le code : la LED monte puis descend en douceur.", ar: "شغّل الكود: يرتفع سطوع المصباح ثم ينخفض بلطف." },
    code: "// Leçon 7 — la LED qui respire\n\nconst int LED = 9;\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n}\n\nvoid loop() {\n  for (int v = 0; v <= 255; v += 5) {\n    analogWrite(LED, v);\n    delay(20);\n  }\n  for (int v = 255; v >= 0; v -= 5) {\n    analogWrite(LED, v);\n    delay(20);\n  }\n}\n",
    components: ['led', 'resistor', 'wires'],
    highlightPins: ['9', 'GND'],
  },
  {
    id: "sos",
    title: { fr: "Message SOS en morse", ar: "رسالة SOS بالمورس" },
    tagline: { fr: "Écrire ses propres fonctions pour émettre des signaux.", ar: "كتابة دوالّك الخاصة لإرسال الإشارات." },
    duration: 10,
    level: { fr: "Débutant", ar: "مبتدئ" },
    description: { fr: "Le SOS en morse, c’est trois signaux courts, trois longs, puis trois courts. Plutôt que de répéter le même code, on crée une fonction emettre(duree) que l’on appelle dans des boucles.", ar: "رسالة SOS بالمورس هي ثلاث إشارات قصيرة ثم ثلاث طويلة ثم ثلاث قصيرة. بدل تكرار الكود ننشئ دالة emettre(duree) ونستدعيها داخل حلقات." },
    objectives: { fr: ["Déclarer une fonction avec un paramètre.", "Répéter une séquence avec for.", "Afficher un message sur le moniteur série."], ar: ["التصريح بدالة ذات معامل.", "تكرار تسلسل باستخدام for.", "عرض رسالة على مراقب المنفذ التسلسلي."] },
    wiring: { fr: ["Broche 9 → résistance 220 Ω → LED (+).", "LED (−) → GND."], ar: ["المنفذ 9 ← مقاومة 220 أوم ← المصباح (+).", "المصباح (−) ← GND."] },
    challenge: { fr: "Ajoutez une pause plus longue entre chaque groupe de trois signaux.", ar: "أضف توقفًا أطول بين كل مجموعة من ثلاث إشارات." },
    hint: { fr: "Lancez le code et comptez les éclairs : 3 courts, 3 longs, 3 courts.", ar: "شغّل الكود وعدّ الومضات: 3 قصيرة و3 طويلة و3 قصيرة." },
    code: "// Leçon 8 — message SOS\n\nconst int LED = 9;\n\nvoid emettre(int duree) {\n  digitalWrite(LED, HIGH);\n  delay(duree);\n  digitalWrite(LED, LOW);\n  delay(200);\n}\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  Serial.println(\"S O S\");\n  for (int i = 0; i < 3; i++) {\n    emettre(200);\n  }\n  for (int i = 0; i < 3; i++) {\n    emettre(600);\n  }\n  for (int i = 0; i < 3; i++) {\n    emettre(200);\n  }\n  delay(2000);\n}\n",
    components: ['led', 'resistor', 'wires'],
    highlightPins: ['9', 'GND'],
  },
  {
    id: "doorbell",
    title: { fr: "Une sonnette", ar: "جرس باب" },
    tagline: { fr: "Un bouton qui déclenche une mélodie sur le buzzer.", ar: "زرّ يشغّل لحنًا على الجرس." },
    duration: 10,
    level: { fr: "Débutant", ar: "مبتدئ" },
    description: { fr: "On combine deux composants : le bouton sur la broche 2 (INPUT_PULLUP) et le buzzer sur la broche 8. Quand la broche passe à LOW, le bouton est pressé : on joue deux notes, comme une vraie sonnette.", ar: "نجمع مكوّنين: الزرّ على المنفذ 2 (INPUT_PULLUP) والجرس على المنفذ 8. عندما يصبح المنفذ LOW يكون الزرّ مضغوطًا فنعزف نغمتين كجرس حقيقي." },
    objectives: { fr: ["Combiner une entrée et une sortie.", "Déclencher un son avec if.", "Enchaîner deux notes avec tone()."], ar: ["الجمع بين مدخل ومخرج.", "تشغيل صوت باستخدام if.", "تتابع نغمتين بالدالة tone()."] },
    wiring: { fr: ["Broche 2 → bouton → GND.", "Broche 8 → buzzer (+), buzzer (−) → GND."], ar: ["المنفذ 2 ← الزرّ ← GND.", "المنفذ 8 ← الجرس (+) والجرس (−) ← GND."] },
    challenge: { fr: "Faites jouer trois notes différentes quand on appuie.", ar: "اجعل الجرس يعزف ثلاث نغمات مختلفة عند الضغط." },
    hint: { fr: "Activez le son, lancez le code puis cliquez sur le bouton.", ar: "فعّل الصوت وشغّل الكود ثم انقر على الزرّ." },
    code: "// Leçon 9 — une sonnette\n\nconst int BOUTON = 2;\nconst int BUZZER = 8;\n\nvoid setup() {\n  pinMode(BOUTON, INPUT_PULLUP);\n  pinMode(BUZZER, OUTPUT);\n}\n\nvoid loop() {\n  if (digitalRead(BOUTON) == LOW) {\n    tone(BUZZER, NOTE_E4, 200);\n    delay(260);\n    tone(BUZZER, NOTE_C4, 400);\n    delay(500);\n  }\n  delay(20);\n}\n",
    components: ['button', 'buzzer', 'wires'],
    highlightPins: ['2', '8', 'GND', 'GND-F'],
  },
  {
    id: "toggle",
    title: { fr: "Interrupteur à bascule", ar: "مفتاح تبديل" },
    tagline: { fr: "Un appui allume, le suivant éteint : mémoriser un état.", ar: "ضغطة تُضيء والتالية تُطفئ: تذكّر الحالة." },
    duration: 12,
    level: { fr: "Intermédiaire", ar: "متوسط" },
    description: { fr: "Une variable booléenne garde en mémoire l’état de la LED. On ne bascule qu’au moment précis où le bouton passe de HIGH à LOW : c’est la détection de front, qui évite les rebonds.", ar: "يحفظ متغيّر منطقي حالة المصباح. لا نبدّل الحالة إلا في اللحظة التي ينتقل فيها الزرّ من HIGH إلى LOW: وهذا هو كشف الحافة الذي يتفادى الارتداد." },
    objectives: { fr: ["Mémoriser un état avec une variable bool.", "Détecter un front descendant.", "Inverser une valeur avec l’opérateur !."], ar: ["حفظ حالة بمتغيّر bool.", "كشف الحافة الهابطة.", "عكس قيمة بالمعامل !."] },
    wiring: { fr: ["Broche 2 → bouton → GND.", "Broche 9 → résistance → LED → GND."], ar: ["المنفذ 2 ← الزرّ ← GND.", "المنفذ 9 ← مقاومة ← المصباح ← GND."] },
    challenge: { fr: "Comptez les appuis et affichez le total dans le moniteur série.", ar: "عُدّ الضغطات واعرض المجموع في مراقب المنفذ التسلسلي." },
    hint: { fr: "Cliquez une fois sur le bouton : la LED reste allumée.", ar: "انقر مرة على الزرّ: يبقى المصباح مضاءً." },
    code: "// Leçon 10 — interrupteur à bascule\n\nconst int LED = 9;\nconst int BOUTON = 2;\n\nbool allume = false;\nint dernier = HIGH;\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n  pinMode(BOUTON, INPUT_PULLUP);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int etat = digitalRead(BOUTON);\n\n  if (dernier == HIGH && etat == LOW) {\n    allume = !allume;\n    digitalWrite(LED, allume);\n    if (allume) {\n      Serial.println(\"ON\");\n    } else {\n      Serial.println(\"OFF\");\n    }\n  }\n\n  dernier = etat;\n  delay(20);\n}\n",
    components: ['button', 'led', 'resistor', 'wires'],
    highlightPins: ['9', '2', 'GND', 'GND-F'],
  },
  {
    id: "theremin",
    title: { fr: "Le thérémine", ar: "آلة الثيرمين" },
    tagline: { fr: "Faire varier la hauteur d’un son avec un potentiomètre.", ar: "تغيير حدّة الصوت بمقياس الجهد." },
    duration: 12,
    level: { fr: "Intermédiaire", ar: "متوسط" },
    description: { fr: "Le potentiomètre donne une valeur de 0 à 1023 que map() transforme en fréquence entre 200 et 1000 Hz. Appelé sans durée, tone() joue en continu : le son suit votre main, comme un instrument.", ar: "يعطي مقياس الجهد قيمة من 0 إلى 1023 تحوّلها map() إلى تردد بين 200 و1000 هرتز. وعند استدعاء tone() دون مدة يستمر الصوت: فيتبع حركة يدك كآلة موسيقية." },
    objectives: { fr: ["Relier une mesure analogique à une fréquence.", "Utiliser tone() en continu.", "Jouer en direct avec un capteur."], ar: ["ربط قياس تماثلي بتردد.", "استخدام tone() بشكل مستمر.", "العزف المباشر بحسّاس."] },
    wiring: { fr: ["A0 → curseur du potentiomètre (5V et GND aux extrémités).", "Broche 8 → buzzer (+), buzzer (−) → GND."], ar: ["A0 ← منزلق مقياس الجهد (5V وGND عند الطرفين).", "المنفذ 8 ← الجرس (+) والجرس (−) ← GND."] },
    challenge: { fr: "Limitez la plage de 262 Hz à 523 Hz pour rester dans une octave.", ar: "حدّد المجال بين 262 و523 هرتز لتبقى ضمن سلّم واحد." },
    hint: { fr: "Activez le son, lancez le code et faites glisser le potentiomètre.", ar: "فعّل الصوت وشغّل الكود ثم اسحب مقياس الجهد." },
    code: "// Leçon 11 — le thérémine\n\nconst int POT = A0;\nconst int BUZZER = 8;\n\nvoid setup() {\n  pinMode(BUZZER, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int mesure = analogRead(POT);\n  int freq = map(mesure, 0, 1023, 200, 1000);\n\n  tone(BUZZER, freq);\n  Serial.println(freq);\n\n  delay(40);\n}\n",
    components: ['pot', 'buzzer', 'wires'],
    highlightPins: ['A0', '5V', 'GND', 'GND-F', '8'],
  },
  {
    id: "servopot",
    title: { fr: "Servo piloté à la main", ar: "محرّك مؤازر بالتحكم اليدوي" },
    tagline: { fr: "Le potentiomètre commande directement l’angle du bras.", ar: "مقياس الجهد يتحكم مباشرة بزاوية الذراع." },
    duration: 12,
    level: { fr: "Intermédiaire", ar: "متوسط" },
    description: { fr: "On lit le potentiomètre (0–1023) et on le convertit en angle (0–180°) avec map(). Le bras du servomoteur suit alors votre geste en temps réel : c’est le principe d’une commande manuelle.", ar: "نقرأ مقياس الجهد (0–1023) ونحوّله إلى زاوية (0–180°) بالدالة map(). فيتبع ذراع المحرّك حركتك لحظيًا: وهذا مبدأ التحكم اليدوي." },
    objectives: { fr: ["Associer un capteur analogique à un actionneur.", "Convertir une plage avec map().", "Afficher l’angle commandé."], ar: ["ربط حسّاس تماثلي بمشغّل.", "تحويل مجال بـ map().", "عرض الزاوية المطلوبة."] },
    wiring: { fr: ["A0 → curseur du potentiomètre.", "Servo : signal → broche 10, rouge → 5V, marron → GND."], ar: ["A0 ← منزلق مقياس الجهد.", "المحرّك: الإشارة ← المنفذ 10، الأحمر ← 5V، البني ← GND."] },
    challenge: { fr: "Limitez l’angle entre 30° et 150° pour protéger un mécanisme.", ar: "حدّد الزاوية بين 30° و150° لحماية آلية ما." },
    hint: { fr: "Faites glisser le potentiomètre : le bras tourne en bas de la scène.", ar: "اسحب مقياس الجهد: يدور الذراع أسفل المشهد." },
    code: "// Leçon 12 — servo piloté à la main\n#include <Servo.h>\n\nServo bras;\nconst int POT = A0;\n\nvoid setup() {\n  bras.attach(10);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int mesure = analogRead(POT);\n  int angle = map(mesure, 0, 1023, 0, 180);\n\n  bras.write(angle);\n  Serial.println(angle);\n\n  delay(30);\n}\n",
    components: ['pot', 'servo', 'wires'],
    highlightPins: ['A0', '10', '5V', 'GND-F'],
  },
  {
    id: "alarm",
    title: { fr: "Alarme anti-obscurité", ar: "إنذار الظلام" },
    tagline: { fr: "La sirène retentit dès que la lumière tombe sous un seuil.", ar: "تنطلق الصفّارة عندما تنخفض الإضاءة عن عتبة." },
    duration: 14,
    level: { fr: "Intermédiaire", ar: "متوسط" },
    description: { fr: "On compare la mesure de la photorésistance à un seuil (300). Sous le seuil, une boucle fait monter la fréquence du buzzer pour imiter une sirène ; au-dessus, noTone() coupe le son.", ar: "نقارن قياس المقاومة الضوئية بعتبة (300). تحت العتبة ترفع حلقة تردد الجرس لمحاكاة صفّارة، وفوقها يوقف noTone() الصوت." },
    objectives: { fr: ["Comparer une mesure à un seuil avec if / else.", "Générer une sirène avec une boucle for.", "Couper le son avec noTone()."], ar: ["مقارنة قياس بعتبة بـ if / else.", "توليد صفّارة بحلقة for.", "إيقاف الصوت بـ noTone()."] },
    wiring: { fr: ["LDR : 5V → LDR → A1 et résistance 10 kΩ → GND.", "Broche 8 → buzzer (+), buzzer (−) → GND."], ar: ["LDR: ‏5V ← LDR ← A1 ومقاومة 10 كيلو ← GND.", "المنفذ 8 ← الجرس (+) والجرس (−) ← GND."] },
    challenge: { fr: "Faites aussi clignoter la LED de la broche 9 pendant l’alarme.", ar: "اجعل مصباح المنفذ 9 يومض أيضًا أثناء الإنذار." },
    hint: { fr: "Activez le son puis faites descendre le soleil pour assombrir la pièce.", ar: "فعّل الصوت ثم حرّك الشمس لتعتيم الغرفة." },
    code: "// Leçon 13 — alarme anti-obscurité\n\nconst int LDR = A1;\nconst int BUZZER = 8;\nconst int SEUIL = 300;\n\nvoid setup() {\n  pinMode(BUZZER, OUTPUT);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int lumiere = analogRead(LDR);\n\n  if (lumiere < SEUIL) {\n    Serial.println(\"ALARME !\");\n    for (int f = 500; f <= 1000; f += 50) {\n      tone(BUZZER, f);\n      delay(25);\n    }\n  } else {\n    noTone(BUZZER);\n  }\n\n  delay(50);\n}\n",
    components: ['ldr', 'buzzer', 'wires'],
    highlightPins: ['A1', '8', '5V', 'GND', 'GND-F'],
  },
  {
    id: "sunflower",
    title: { fr: "Le tournesol solaire", ar: "عبّاد الشمس الذكي" },
    tagline: { fr: "Un bras qui suit la lumière, comme un tracker solaire.", ar: "ذراع يتتبّع الضوء كمتتبّع شمسي." },
    duration: 15,
    level: { fr: "Avancé", ar: "متقدم" },
    description: { fr: "La valeur de la photorésistance est convertie en angle : plus il y a de lumière, plus le bras tourne. On lisse le mouvement en ne changeant l’angle que par petits pas, pour éviter les secousses.", ar: "تُحوَّل قيمة المقاومة الضوئية إلى زاوية: كلما زادت الإضاءة دار الذراع أكثر. ونسلّس الحركة بتغيير الزاوية بخطوات صغيرة فقط لتجنّب الاهتزاز." },
    objectives: { fr: ["Piloter un servo avec un capteur de lumière.", "Lisser un mouvement avec un pas maximal.", "Utiliser une variable globale pour mémoriser l’angle."], ar: ["التحكم في محرّك مؤازر بحسّاس ضوء.", "تسليس الحركة بخطوة قصوى.", "استخدام متغيّر عام لحفظ الزاوية."] },
    wiring: { fr: ["LDR : 5V → LDR → A1 et résistance 10 kΩ → GND.", "Servo : signal → broche 10, rouge → 5V, marron → GND."], ar: ["LDR: ‏5V ← LDR ← A1 ومقاومة 10 كيلو ← GND.", "المحرّك: الإشارة ← المنفذ 10، الأحمر ← 5V، البني ← GND."] },
    challenge: { fr: "Inversez le sens pour que le bras s’éloigne de la lumière.", ar: "اعكس الاتجاه ليبتعد الذراع عن الضوء." },
    hint: { fr: "Faites glisser le soleil : le bras se met à tourner.", ar: "حرّك الشمس: يبدأ الذراع بالدوران." },
    code: "// Leçon 14 — le tournesol solaire\n#include <Servo.h>\n\nServo bras;\nconst int LDR = A1;\n\nint angle = 90;\n\nvoid setup() {\n  bras.attach(10);\n  Serial.begin(9600);\n}\n\nvoid loop() {\n  int lumiere = analogRead(LDR);\n  int cible = map(lumiere, 0, 1023, 0, 180);\n\n  if (cible > angle) {\n    angle = angle + 2;\n  }\n  if (cible < angle) {\n    angle = angle - 2;\n  }\n\n  bras.write(angle);\n  Serial.println(angle);\n  delay(30);\n}\n",
    components: ['ldr', 'servo', 'wires'],
    highlightPins: ['A1', '10', '5V', 'GND-F'],
  },
  {
    id: "reaction",
    title: { fr: "Jeu de réflexes", ar: "لعبة سرعة الاستجابة" },
    tagline: { fr: "Mesurer en millisecondes votre temps de réaction.", ar: "قياس زمن استجابتك بالميلي ثانية." },
    duration: 15,
    level: { fr: "Avancé", ar: "متقدم" },
    description: { fr: "La LED s’allume après un délai aléatoire (random). Dès qu’elle s’allume, millis() note l’heure ; quand vous appuyez, on calcule la différence : c’est votre temps de réaction, affiché dans le moniteur série.", ar: "يضيء المصباح بعد مهلة عشوائية (random). بمجرّد إضاءته تسجّل millis() الوقت؛ وعند الضغط نحسب الفرق: هذا زمن استجابتك الذي يظهر في المراقب." },
    objectives: { fr: ["Générer un délai aléatoire avec random().", "Mesurer une durée avec millis().", "Attendre un événement avec while."], ar: ["توليد مهلة عشوائية بـ random().", "قياس مدة بـ millis().", "انتظار حدث باستخدام while."] },
    wiring: { fr: ["Broche 2 → bouton → GND.", "Broche 9 → résistance → LED → GND."], ar: ["المنفذ 2 ← الزرّ ← GND.", "المنفذ 9 ← مقاومة ← المصباح ← GND."] },
    challenge: { fr: "Gardez le meilleur temps et affichez-le après chaque manche.", ar: "احتفظ بأفضل زمن واعرضه بعد كل جولة." },
    hint: { fr: "Lancez le code, attendez la LED puis cliquez le plus vite possible.", ar: "شغّل الكود وانتظر المصباح ثم انقر بأسرع ما يمكن." },
    code: "// Leçon 15 — jeu de réflexes\n\nconst int LED = 9;\nconst int BOUTON = 2;\n\nvoid setup() {\n  pinMode(LED, OUTPUT);\n  pinMode(BOUTON, INPUT_PULLUP);\n  Serial.begin(9600);\n  Serial.println(\"Attendez la LED...\");\n}\n\nvoid loop() {\n  digitalWrite(LED, LOW);\n  delay(random(1500, 4000));\n\n  digitalWrite(LED, HIGH);\n  int debut = millis();\n\n  while (digitalRead(BOUTON) == HIGH) {\n    delay(1);\n  }\n\n  int temps = millis() - debut;\n  digitalWrite(LED, LOW);\n\n  Serial.print(\"Reaction : \");\n  Serial.print(temps);\n  Serial.println(\" ms\");\n\n  delay(2000);\n}\n",
    components: ['button', 'led', 'resistor', 'wires'],
    highlightPins: ['9', '2', 'GND', 'GND-F'],
  },
  {
    id: 'lcd',
    title: { fr: 'Afficher sur l’écran LCD', ar: 'عرض على شاشة LCD' },
    tagline: { fr: 'Un écran I2C pour afficher du texte avec LiquidCrystal.', ar: 'شاشة I2C لعرض النص مع LiquidCrystal.' },
    duration: 12,
    level: { fr: 'Intermédiaire', ar: 'متوسط' },
    description: {
      fr: 'L’écran LCD I2C reçoit les broches SDA et SCL (A4 et A5) et s’adresse par l’adresse 0x27. On déclare l’écran avec LiquidCrystal_I2C lcd(0x27, 16, 2) : adresse, colonnes, lignes. Ensuite init() le prépare, backlight() allume le rétroéclairage, setCursor(colonne, ligne) place le curseur et print() écrit.',
      ar: 'تستقبل شاشة LCD I2C منافذ SDA وSCL (A4 وA5) وتتواصل عبر العنوان 0x27. نصرّح بالشاشة بـ LiquidCrystal_I2C lcd(0x27, 16, 2): العنوان وعدد الأعمدة والأسطر. ثم تجهّزها init() وتُضيء الإضاءة الخلفية backlight() وتحدّد setCursor(عمود، سطر) المؤشر وتكتب print().',
    },
    objectives: {
      fr: [
        'Initialiser un écran LCD avec LiquidCrystal.',
        'Écrire du texte avec print().',
        'Placer le curseur avec setCursor().',
      ],
      ar: [
        'تهيئة شاشة LCD مع LiquidCrystal.',
        'كتابة النص بـ print().',
        'تحديد موضع المؤشر بـ setCursor().',
      ],
    },
    wiring: {
      fr: [
        'SDA (A4) → SDA du LCD.',
        'SCL (A5) → SCL du LCD.',
        'VCC (5V) → VCC du LCD.',
        'GND → GND du LCD.',
      ],
      ar: [
        'SDA (A4) ← SDA للشاشة.',
        'SCL (A5) ← SCL للشاشة.',
        'VCC (5V) ← VCC للشاشة.',
        'GND ← GND للشاشة.',
      ],
    },
    challenge: {
      fr: 'Affichez deux lignes de texte avec un changement de contenu dans loop().',
      ar: 'اعرض نصين في سطرين مع تغيير المحتوى داخل loop().',
    },
    hint: {
      fr: 'Lancez le code : le texte apparaît sur l’écran simulé.',
      ar: 'شغّل الكود: يظهر النص على الشاشة المحاكاة.',
    },
    code: `// Leçon 16 — afficher sur l’écran LCD\n#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\n\nLiquidCrystal_I2C lcd(0x27, 16, 2);\n\nint compteur = 0;\n\nvoid setup() {\n  lcd.init();\n  lcd.backlight();\n}\n\nvoid loop() {\n  lcd.setCursor(0, 0);\n  lcd.print("Arduino Lab");\n\n  lcd.setCursor(0, 1);\n  lcd.print("Compteur : ");\n  lcd.print(compteur);\n\n  compteur++;\n  delay(500);\n}\n`,
    components: ['lcd', 'wires'],
    highlightPins: ['A4', 'A5', '5V', 'GND-F'],
  },
  {
    id: 'distance',
    title: { fr: 'Radar de distance', ar: 'رادار قياس المسافة' },
    tagline: { fr: 'Un capteur à ultrasons mesure une balle et l’écran LCD affiche la distance.', ar: 'حسّاس فوق صوتي يقيس مسافة كرة وشاشة LCD تعرضها.' },
    duration: 18,
    level: { fr: 'Avancé', ar: 'متقدم' },
    description: {
      fr: 'Le HC-SR04 émet un « bip » ultrasonore quand TRIG passe à HIGH pendant 10 µs, puis ECHO reste à HIGH le temps que le son fasse l’aller-retour. pulseIn() mesure cette durée en microsecondes ; en la divisant par 58 on obtient la distance en centimètres, affichée sur l’écran LCD. Faites glisser la balle dans la scène.',
      ar: 'يُصدر HC-SR04 «صفيرًا» فوق صوتي عندما يصبح TRIG في الحالة HIGH لمدة 10 ميكروثانية، ثم يبقى ECHO في HIGH طوال ذهاب الصوت وإيابه. تقيس pulseIn() هذه المدة بالميكروثانية، وبقسمتها على 58 نحصل على المسافة بالسنتيمتر وتُعرض على شاشة LCD. اسحب الكرة في المشهد.',
    },
    objectives: {
      fr: ['Déclencher une mesure avec TRIG (impulsion de 10 µs).', 'Mesurer l’écho avec pulseIn().', 'Convertir un temps en distance et l’afficher sur le LCD.'],
      ar: ['بدء القياس بـ TRIG (نبضة 10 ميكروثانية).', 'قياس الصدى بـ pulseIn().', 'تحويل الزمن إلى مسافة وعرضها على الشاشة.'],
    },
    wiring: {
      fr: ['HC-SR04 : VCC → 5V, TRIG → A2, ECHO → A3, GND → GND.', 'LCD I2C : VCC → 5V, GND → GND, SDA → A4, SCL → A5.'],
      ar: ['HC-SR04: ‏VCC ← 5V، وTRIG ← A2، وECHO ← A3، وGND ← GND.', 'شاشة LCD I2C: ‏VCC ← 5V، وGND ← GND، وSDA ← A4، وSCL ← A5.'],
    },
    challenge: {
      fr: 'Affichez « Trop pres ! » sur la 2e ligne quand la balle est à moins de 10 cm.',
      ar: 'اعرض «Trop pres !» في السطر الثاني عندما تكون الكرة على بعد أقل من 10 سم.',
    },
    hint: {
      fr: 'Lancez le code puis faites glisser la balle : la distance change sur l’écran.',
      ar: 'شغّل الكود ثم اسحب الكرة: تتغيّر المسافة على الشاشة.',
    },
    code: `// Leçon 17 — radar de distance\n#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\n\nLiquidCrystal_I2C lcd(0x27, 16, 2);\n\nconst int TRIG = A2;\nconst int ECHO = A3;\n\nvoid setup() {\n  pinMode(TRIG, OUTPUT);\n  pinMode(ECHO, INPUT);\n  lcd.init();\n  lcd.backlight();\n}\n\nvoid loop() {\n  digitalWrite(TRIG, LOW);\n  delayMicroseconds(2);\n  digitalWrite(TRIG, HIGH);\n  delayMicroseconds(10);\n  digitalWrite(TRIG, LOW);\n\n  int duree = pulseIn(ECHO, HIGH);\n  int distance = round(duree / 58.0);\n\n  lcd.setCursor(0, 0);\n  lcd.print(\"Distance :\");\n  lcd.setCursor(0, 1);\n  lcd.print(distance);\n  lcd.print(\" cm   \");\n\n  delay(200);\n}\n`,
    components: ['ultrasonic', 'lcd', 'wires'],
    highlightPins: ['A2', 'A3', 'A4', 'A5', '5V', 'GND-F'],
  },
  {
    id: 'thermo',
    title: { fr: 'Station de température', ar: 'محطة قياس الحرارة' },
    tagline: { fr: 'Projet complet : sonde TMP36, écran LCD, LED et alarme buzzer.', ar: 'مشروع كامل: حسّاس TMP36 وشاشة LCD ومصباح وإنذار بالجرس.' },
    duration: 20,
    level: { fr: 'Avancé', ar: 'متقدم' },
    description: {
      fr: 'La sonde TMP36 donne une tension proportionnelle à la température : 0,5 V à 0 °C, plus 10 mV par degré. analogRead() la mesure de 0 à 1023, on la convertit en volts (× 5 ÷ 1023) puis en degrés ((V − 0,5) × 100). Le résultat s’affiche sur le LCD ; au-delà du seuil, la LED s’allume et le buzzer sonne. Réglez la température avec le curseur.',
      ar: 'يعطي الحسّاس TMP36 جهدًا يتناسب مع الحرارة: 0.5 فولت عند 0 °م زائد 10 ميلي فولت لكل درجة. يقيسه analogRead() من 0 إلى 1023 ونحوّله إلى فولت (× 5 ÷ 1023) ثم إلى درجات ((V − 0.5) × 100). تُعرض النتيجة على LCD، وعند تجاوز العتبة يُضاء المصباح ويدقّ الجرس. اضبط الحرارة بالمنزلق.',
    },
    objectives: {
      fr: ['Convertir une mesure analogique en volts puis en °C.', 'Afficher une valeur sur le LCD.', 'Déclencher une alarme (LED + buzzer) au-delà d’un seuil.'],
      ar: ['تحويل قياس تماثلي إلى فولت ثم إلى °م.', 'عرض قيمة على شاشة LCD.', 'تشغيل إنذار (مصباح + جرس) عند تجاوز عتبة.'],
    },
    wiring: {
      fr: ['TMP36 : patte gauche → 5V, patte centrale → A1, patte droite → GND.', 'LCD I2C : VCC → 5V, GND → GND, SDA → A4, SCL → A5.', 'Buzzer : broche 8 (+) et GND (−) ; LED : broche 9 via la résistance.'],
      ar: ['TMP36: الساق اليسرى ← 5V، والوسطى ← A1، واليمنى ← GND.', 'شاشة LCD I2C: ‏VCC ← 5V، وGND ← GND، وSDA ← A4، وSCL ← A5.', 'الجرس: المنفذ 8 (+) وGND (−)؛ المصباح: المنفذ 9 عبر المقاومة.'],
    },
    challenge: {
      fr: 'Ajoutez un deuxième seuil : la LED s’allume dès 25 °C, le buzzer seulement à 30 °C.',
      ar: 'أضف عتبة ثانية: يُضاء المصباح من 25 °م ويدقّ الجرس عند 30 °م فقط.',
    },
    hint: {
      fr: 'Lancez le code puis montez le curseur de température au-dessus de 30 °C.',
      ar: 'شغّل الكود ثم ارفع منزلق الحرارة فوق 30 °م.',
    },
    code: `// Leçon 18 — station de température\n#include <Wire.h>\n#include <LiquidCrystal_I2C.h>\n\nLiquidCrystal_I2C lcd(0x27, 16, 2);\n\nconst int SONDE = A1;\nconst int BUZZER = 8;\nconst int LED = 9;\nconst int SEUIL = 30;\n\nvoid setup() {\n  pinMode(BUZZER, OUTPUT);\n  pinMode(LED, OUTPUT);\n  lcd.init();\n  lcd.backlight();\n}\n\nvoid loop() {\n  int mesure = analogRead(SONDE);\n  float tension = mesure * 5.0 / 1023.0;\n  int temperature = round((tension - 0.5) * 100.0);\n\n  lcd.setCursor(0, 0);\n  lcd.print(\"Temperature :\");\n  lcd.setCursor(0, 1);\n  lcd.print(temperature);\n  lcd.print(\" C   \");\n\n  if (temperature >= SEUIL) {\n    digitalWrite(LED, HIGH);\n    tone(BUZZER, 880, 150);\n  } else {\n    digitalWrite(LED, LOW);\n    noTone(BUZZER);\n  }\n\n  delay(300);\n}\n`,
    components: ['tmp36', 'lcd', 'buzzer', 'led', 'resistor', 'wires'],
    highlightPins: ['A1', 'A4', 'A5', '5V', 'GND-F', '8', '9', 'GND'],
  },
];

export function getLesson(id: LessonId): Lesson {
  return LESSONS.find((lesson) => lesson.id === id) ?? LESSONS[0];
}

export function isLessonId(value: unknown): value is LessonId {
  return LESSONS.some((lesson) => lesson.id === value);
}
