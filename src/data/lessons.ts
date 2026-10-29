import type { Localized } from '../i18n';

export type LessonId =
  | 'blink'
  | 'button'
  | 'pot'
  | 'traffic'
  | 'buzzer'
  | 'light'
  | 'temperature'
  | 'ultrasonic'
  | 'rgb'
  | 'servo'
  | 'lcd'
  | 'stepper';
export type ComponentId =
  | 'led'
  | 'resistor'
  | 'button'
  | 'pot'
  | 'wires'
  | 'buzzer'
  | 'ldr'
  | 'servo'
  | 'rgb'
  | 'temperature'
  | 'ultrasonic'
  | 'lcd'
  | 'stepper';

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
  rgb: {
    name: { fr: 'LED RGB', ar: 'مصباح LED ثلاثي الألوان' },
    role: {
      fr: 'Trois LED (rouge, vert, bleu) dans un seul boîtier : le mélange des trois donne toutes les couleurs.',
      ar: 'ثلاثة مصابيح (أحمر، أخضر، أزرق) في غلاف واحد: مزجها يعطي كل الألوان.',
    },
    color: '#b34fd4',
  },
  temperature: {
    name: { fr: 'Capteur TMP36', ar: 'حسّاس الحرارة TMP36' },
    role: {
      fr: 'Délivre une tension proportionnelle à la température : 10 mV par degré Celsius.',
      ar: 'يُخرج جهدًا يتناسب مع درجة الحرارة: 10 ميلي فولت لكل درجة مئوية.',
    },
    color: '#e07b39',
  },
  ultrasonic: {
    name: { fr: 'Capteur HC-SR04', ar: 'حسّاس المسافة HC-SR04' },
    role: {
      fr: 'Émet un ultrason et mesure le temps de retour pour calculer une distance.',
      ar: 'يُصدر موجة فوق صوتية ويقيس زمن عودتها لحساب المسافة.',
    },
    color: '#4b8fd6',
  },
  lcd: {
    name: { fr: 'Afficheur LCD I2C 16×2', ar: 'شاشة LCD I2C 16×2' },
    role: {
      fr: 'Affiche deux lignes de seize caractères avec seulement quatre fils.',
      ar: 'تعرض سطرين من ستة عشر حرفًا بأربعة أسلاك فقط.',
    },
    color: '#1f6f8b',
  },
  stepper: {
    name: { fr: 'Moteur pas à pas 28BYJ-48', ar: 'محرّك خطوي 28BYJ-48' },
    role: {
      fr: 'Tourne par petits pas précis, piloté par le driver ULN2003.',
      ar: 'يدور بخطوات صغيرة دقيقة عبر مشغّل ULN2003.',
    },
    color: '#2f6bb5',
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
  {
    id: 'traffic',
    title: { fr: 'Feu de circulation', ar: 'إشارة المرور' },
    tagline: {
      fr: 'Trois LED et une séquence : rouge, orange, vert.',
      ar: 'ثلاثة مصابيح وتسلسل: أحمر، برتقالي، أخضر.',
    },
    duration: 10,
    level: { fr: 'Débutant', ar: 'مبتدئ' },
    description: {
      fr: 'Un feu de circulation, c’est trois sorties qui s’allument dans un ordre précis. Vous pilotez trois LED sur les broches 9, 10 et 11. Une petite fonction allumer() évite de répéter trois digitalWrite() à chaque étape et rend la séquence lisible.',
      ar: 'إشارة المرور هي ثلاثة مخارج تضيء بترتيب محدد. ستتحكم في ثلاثة مصابيح على المنافذ 9 و10 و11. دالة صغيرة allumer() تجنّب تكرار ثلاث تعليمات digitalWrite() في كل مرحلة وتجعل التسلسل واضحًا.',
    },
    objectives: {
      fr: [
        'Piloter trois sorties numériques indépendantes.',
        'Construire une séquence avec delay().',
        'Factoriser une action répétée dans une fonction.',
      ],
      ar: [
        'التحكم في ثلاثة مخارج رقمية مستقلة.',
        'بناء تسلسل باستخدام delay().',
        'تجميع عمل متكرر داخل دالة.',
      ],
    },
    wiring: {
      fr: [
        'Broche 9 → résistance 220 Ω → anode de la LED rouge.',
        'Broche 10 → résistance 220 Ω → anode de la LED orange.',
        'Broche 11 → résistance 220 Ω → anode de la LED verte.',
        'Les trois cathodes → GND.',
      ],
      ar: [
        'المنفذ 9 ← مقاومة 220 أوم ← أنود المصباح الأحمر.',
        'المنفذ 10 ← مقاومة 220 أوم ← أنود المصباح البرتقالي.',
        'المنفذ 11 ← مقاومة 220 أوم ← أنود المصباح الأخضر.',
        'الكاثودات الثلاثة ← GND.',
      ],
    },
    challenge: {
      fr: 'Ajoutez un clignotement vert rapide avant de repasser à l’orange, comme un passage piéton.',
      ar: 'أضف وميضًا أخضر سريعًا قبل العودة إلى البرتقالي، مثل ممر المشاة.',
    },
    hint: {
      fr: 'Lancez le code : le feu passe du rouge au vert.',
      ar: 'شغّل الكود: تنتقل الإشارة من الأحمر إلى الأخضر.',
    },
    code: `// Leçon 7 — feu de circulation

const int ROUGE = 9;
const int ORANGE = 10;
const int VERT = 11;

void setup() {
  pinMode(ROUGE, OUTPUT);
  pinMode(ORANGE, OUTPUT);
  pinMode(VERT, OUTPUT);
}

void allumer(int led) {
  digitalWrite(ROUGE, led == ROUGE);
  digitalWrite(ORANGE, led == ORANGE);
  digitalWrite(VERT, led == VERT);
}

void loop() {
  allumer(ROUGE);
  delay(1500);
  allumer(ORANGE);
  delay(500);
  allumer(VERT);
  delay(1500);
  allumer(ORANGE);
  delay(500);
}
`,
    components: ['led', 'resistor', 'wires'],
    highlightPins: ['9', '10', '11', 'GND'],
  },
  {
    id: 'temperature',
    title: { fr: 'Mesurer la température', ar: 'قياس درجة الحرارة' },
    tagline: {
      fr: 'Un capteur TMP36 sur A2, de la tension à la température.',
      ar: 'حسّاس TMP36 على A2، من الجهد إلى درجة الحرارة.',
    },
    duration: 12,
    level: { fr: 'Intermédiaire', ar: 'متوسط' },
    description: {
      fr: 'Le TMP36 délivre une tension qui augmente de 10 mV par degré Celsius, avec un décalage de 0,5 V à 0 °C. La carte lit cette tension avec analogRead() sur A2, puis le programme la reconvertit en degrés. C’est le premier capteur analogique de ce parcours.',
      ar: 'يُخرج TMP36 جهدًا يزيد بمقدار 10 ميلي فولت لكل درجة مئوية، مع انحراف 0.5 فولت عند 0 °C. تقرأ اللوحة هذا الجهد بـ analogRead() على A2، ثم يعيد البرنامج تحويله إلى درجات. هذا أول حسّاس تماثلي في المسار.',
    },
    objectives: {
      fr: [
        'Lire une tension analogique sur A2.',
        'Convertir une valeur brute en tension puis en température.',
        'Afficher une mesure décimale dans le moniteur série.',
      ],
      ar: [
        'قراءة جهد تماثلي على A2.',
        'تحويل قيمة خام إلى جهد ثم إلى درجة حرارة.',
        'عرض قياس عشري في مراقب المنفذ التسلسلي.',
      ],
    },
    wiring: {
      fr: [
        '5V → patte gauche du TMP36 (face plate vers vous).',
        'A2 → patte du milieu (sortie du capteur).',
        'GND → patte droite.',
      ],
      ar: [
        '5V ← الساق اليسرى لـ TMP36 (الوجه المستوي نحوك).',
        'A2 ← الساق الوسطى (خرج الحسّاس).',
        'GND ← الساق اليمنى.',
      ],
    },
    challenge: {
      fr: 'Affichez aussi la température en Fahrenheit : °F = °C × 1,8 + 32.',
      ar: 'اعرض أيضًا درجة الحرارة بالفهرنهايت: °F = °C × 1.8 + 32.',
    },
    hint: {
      fr: 'Déplacez le curseur de température et lancez le code.',
      ar: 'حرّك منزلق درجة الحرارة ثم شغّل الكود.',
    },
    code: `// Leçon 8 — mesurer la température

const int CAPTEUR = A2;

void setup() {
  Serial.begin(9600);
}

void loop() {
  int lecture = analogRead(CAPTEUR);
  float tension = lecture * 5.0 / 1023.0;
  float temperature = (tension - 0.5) * 100.0;

  Serial.print("Temperature : ");
  Serial.print(temperature);
  Serial.println(" C");

  delay(500);
}
`,
    components: ['temperature', 'wires'],
    highlightPins: ['A2', '5V', 'GND-F'],
  },
  {
    id: 'ultrasonic',
    title: { fr: 'Mesurer une distance', ar: 'قياس المسافة' },
    tagline: {
      fr: 'Le capteur HC-SR04 envoie un ultrason et écoute son écho.',
      ar: 'حسّاس HC-SR04 يُصدر موجة فوق صوتية ويستمع إلى صدىها.',
    },
    duration: 14,
    level: { fr: 'Intermédiaire', ar: 'متوسط' },
    description: {
      fr: 'Le HC-SR04 émet une salve d’ultrasons sur TRIG, puis mesure la durée du retour sur ECHO avec pulseIn(). Le son parcourt 0,034 cm par microseconde : la distance vaut donc durée × 0,034 / 2, car l’onde fait l’aller-retour.',
      ar: 'يُصدر HC-SR04 دفعة موجات فوق صوتية على TRIG، ثم يقيس مدة العودة على ECHO باستخدام pulseIn(). تقطع الموجة 0.034 سم في كل ميكروثانية: إذن المسافة تساوي المدة × 0.034 / 2 لأن الموجة تذهب وتعود.',
    },
    objectives: {
      fr: [
        'Déclencher une mesure avec TRIG et ECHO.',
        'Mesurer une durée avec pulseIn().',
        'Convertir un temps en distance.',
      ],
      ar: [
        'بدء قياس باستخدام TRIG وECHO.',
        'قياس مدة باستخدام pulseIn().',
        'تحويل الزمن إلى مسافة.',
      ],
    },
    wiring: {
      fr: [
        'VCC du capteur → 5V.',
        'GND du capteur → GND.',
        'TRIG → broche 7.',
        'ECHO → broche 6.',
      ],
      ar: [
        'VCC للحسّاس ← 5V.',
        'GND للحسّاس ← GND.',
        'TRIG ← المنفذ 7.',
        'ECHO ← المنفذ 6.',
      ],
    },
    challenge: {
      fr: 'Allumez la LED si un obstacle est à moins de 15 cm.',
      ar: 'أضئ المصباح إذا كان العائق على بعد أقل من 15 سم.',
    },
    hint: {
      fr: 'Déplacez l’obstacle avec le curseur de distance.',
      ar: 'حرّك العائق باستخدام منزلق المسافة.',
    },
    code: `// Leçon 9 — mesurer une distance

const int TRIG = 7;
const int ECHO = 6;

void setup() {
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  long duree = pulseIn(ECHO, HIGH);
  float distance = duree * 0.034 / 2.0;

  Serial.print("Distance : ");
  Serial.print(distance);
  Serial.println(" cm");

  delay(300);
}
`,
    components: ['ultrasonic', 'wires'],
    highlightPins: ['7', '6', '5V', 'GND-F'],
  },
  {
    id: 'rgb',
    title: { fr: 'Mélanger les couleurs', ar: 'مزج الألوان' },
    tagline: {
      fr: 'Une LED RGB et trois sorties PWM pour créer toutes les couleurs.',
      ar: 'مصباح RGB وثلاثة مخارج PWM لإنشاء كل الألوان.',
    },
    duration: 12,
    level: { fr: 'Intermédiaire', ar: 'متوسط' },
    description: {
      fr: 'Une LED RGB contient trois LED : rouge, verte et bleue. En modulant leur intensité avec analogWrite() sur les broches 9, 10 et 11, on mélange la lumière. Rouge + vert donne jaune, vert + bleu donne cyan, et les trois à fond donnent blanc.',
      ar: 'يحتوي مصباح RGB على ثلاثة مصابيح: أحمر وأخضر وأزرق. بتغيير شدتها باستخدام analogWrite() على المنافذ 9 و10 و11 نمزج الضوء. الأحمر + الأخضر يعطي الأصفر، والأخضر + الأزرق يعطي السماوي، والثلاثة معًا تعطي الأبيض.',
    },
    objectives: {
      fr: [
        'Comprendre une LED à cathode commune.',
        'Utiliser analogWrite() pour régler chaque canal.',
        'Créer une couleur avec une fonction à trois paramètres.',
      ],
      ar: [
        'فهم مصباح LED بكاثود مشترك.',
        'استخدام analogWrite() لضبط كل قناة.',
        'إنشاء لون بدالة ذات ثلاثة معاملات.',
      ],
    },
    wiring: {
      fr: [
        'Broche 9 → résistance 220 Ω → patte rouge.',
        'Broche 10 → résistance 220 Ω → patte verte.',
        'Broche 11 → résistance 220 Ω → patte bleue.',
        'Cathode commune → GND.',
      ],
      ar: [
        'المنفذ 9 ← مقاومة 220 أوم ← الساق الحمراء.',
        'المنفذ 10 ← مقاومة 220 أوم ← الساق الخضراء.',
        'المنفذ 11 ← مقاومة 220 أوم ← الساق الزرقاء.',
        'الكاثود المشترك ← GND.',
      ],
    },
    challenge: {
      fr: 'Créez un orange (255, 80, 0) puis un violet (120, 0, 255).',
      ar: 'أنشئ لونًا برتقاليًا (255، 80، 0) ثم بنفسجيًا (120، 0، 255).',
    },
    hint: {
      fr: 'Lancez le code : la LED parcourt le cercle chromatique.',
      ar: 'شغّل الكود: يمرّ المصباح عبر دائرة الألوان.',
    },
    code: `// Leçon 10 — mélanger les couleurs

const int ROUGE = 9;
const int VERT = 10;
const int BLEU = 11;

void setup() {
  pinMode(ROUGE, OUTPUT);
  pinMode(VERT, OUTPUT);
  pinMode(BLEU, OUTPUT);
  Serial.begin(9600);
}

void couleur(int r, int v, int b) {
  analogWrite(ROUGE, r);
  analogWrite(VERT, v);
  analogWrite(BLEU, b);
  Serial.print("RGB ");
  Serial.print(r);
  Serial.print(", ");
  Serial.print(v);
  Serial.print(", ");
  Serial.println(b);
}

void loop() {
  couleur(255, 0, 0); delay(700);
  couleur(0, 255, 0); delay(700);
  couleur(0, 0, 255); delay(700);
  couleur(255, 255, 0); delay(700);
  couleur(0, 255, 255); delay(700);
  couleur(255, 0, 255); delay(700);
  couleur(255, 255, 255); delay(700);
  couleur(0, 0, 0); delay(700);
}
`,
    components: ['rgb', 'resistor', 'wires'],
    highlightPins: ['9', '10', '11', 'GND'],
  },
  {
    id: 'lcd',
    title: { fr: 'Afficher sur un LCD', ar: 'العرض على شاشة LCD' },
    tagline: {
      fr: 'Un écran 16×2 relié en I2C sur A4 et A5.',
      ar: 'شاشة 16×2 موصولة عبر I2C على A4 وA5.',
    },
    duration: 16,
    level: { fr: 'Avancé', ar: 'متقدم' },
    description: {
      fr: 'Un afficheur LCD 16×2 permet de sortir le programme du moniteur série. Le module I2C ne demande que quatre fils : alimentation, masse, SDA sur A4 et SCL sur A5. Après init() et backlight(), setCursor() place le curseur et print() écrit le texte.',
      ar: 'تسمح شاشة LCD 16×2 بإخراج البرنامج من مراقب المنفذ التسلسلي. لا تحتاج وحدة I2C سوى أربعة أسلاك: التغذية والأرضي وSDA على A4 وSCL على A5. بعد init() وbacklight() تضع setCursor() المؤشر وتكتب print() النص.',
    },
    objectives: {
      fr: [
        'Relier un module I2C sur SDA (A4) et SCL (A5).',
        'Initialiser l’écran et activer le rétroéclairage.',
        'Positionner et écrire du texte avec setCursor() et print().',
      ],
      ar: [
        'توصيل وحدة I2C على SDA (A4) وSCL (A5).',
        'تهيئة الشاشة وتشغيل الإضاءة الخلفية.',
        'تحديد الموضع وكتابة النص باستخدام setCursor() وprint().',
      ],
    },
    wiring: {
      fr: [
        'VCC du LCD → 5V.',
        'GND du LCD → GND.',
        'SDA → A4.',
        'SCL → A5.',
      ],
      ar: [
        'VCC للشاشة ← 5V.',
        'GND للشاشة ← GND.',
        'SDA ← A4.',
        'SCL ← A5.',
      ],
    },
    challenge: {
      fr: 'Affichez un compteur de secondes sur la deuxième ligne, sans effacer la première.',
      ar: 'اعرض عدّاد ثوانٍ على السطر الثاني دون مسح الأول.',
    },
    hint: {
      fr: 'L’écran LCD affiche le texte envoyé par le programme.',
      ar: 'تعرض الشاشة النص الذي يرسله البرنامج.',
    },
    code: `// Leçon 11 — afficher sur un LCD

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);

void setup() {
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Arduino Lab");
  lcd.setCursor(0, 1);
  lcd.print("Bonjour !");
}

void loop() {
  lcd.setCursor(0, 1);
  lcd.print("Temps: ");
  lcd.print(millis() / 1000);
  lcd.print(" s   ");
  delay(500);
}
`,
    components: ['lcd', 'wires'],
    highlightPins: ['A4', 'A5', '5V', 'GND-F'],
  },
  {
    id: 'stepper',
    title: { fr: 'Piloter un moteur pas à pas', ar: 'التحكم في محرّك خطوي' },
    tagline: {
      fr: 'Un 28BYJ-48 et son driver ULN2003, pilotés par la bibliothèque Stepper.',
      ar: 'محرّك 28BYJ-48 ومشغّله ULN2003 عبر مكتبة Stepper.',
    },
    duration: 16,
    level: { fr: 'Avancé', ar: 'متقدم' },
    description: {
      fr: 'Le moteur pas à pas 28BYJ-48 tourne par petits angles précis. Le driver ULN2003 amplifie les quatre commandes envoyées par les broches 8, 10, 9 et 11. La bibliothèque Stepper transforme un nombre de pas en rotation : 2048 pas font un tour complet.',
      ar: 'يدور المحرّك الخطوي 28BYJ-48 بزوايا صغيرة دقيقة. يضخّم مشغّل ULN2003 الأوامر الأربعة المرسلة من المنافذ 8 و10 و9 و11. تحوّل مكتبة Stepper عدد الخطوات إلى دوران: 2048 خطوة تكمل دورة كاملة.',
    },
    objectives: {
      fr: [
        'Relier un driver ULN2003 dans le bon ordre.',
        'Déclarer un objet Stepper et régler sa vitesse.',
        'Faire tourner le moteur dans les deux sens avec step().',
      ],
      ar: [
        'توصيل مشغّل ULN2003 بالترتيب الصحيح.',
        'تعريف كائن Stepper وضبط سرعته.',
        'تدوير المحرّك في الاتجاهين باستخدام step().',
      ],
    },
    wiring: {
      fr: [
        'IN1 → broche 8, IN2 → broche 10.',
        'IN3 → broche 9, IN4 → broche 11.',
        'VCC du driver → 5V, GND → GND.',
        'Connecteur blanc du moteur → driver.',
      ],
      ar: [
        'IN1 ← المنفذ 8، IN2 ← المنفذ 10.',
        'IN3 ← المنفذ 9، IN4 ← المنفذ 11.',
        'VCC للمشغّل ← 5V، GND ← GND.',
        'موصل المحرّك الأبيض ← المشغّل.',
      ],
    },
    challenge: {
      fr: 'Faites deux tours complets dans un sens, puis deux tours dans l’autre.',
      ar: 'أكمل دورتين كاملتين في اتجاه، ثم دورتين في الاتجاه المعاكس.',
    },
    hint: {
      fr: 'Le moteur tourne par petits pas, pas en continu.',
      ar: 'يدور المحرّك بخطوات صغيرة، وليس بشكل متواصل.',
    },
    code: `// Leçon 12 — moteur pas à pas

#include <Stepper.h>

const int TOURS = 2048;
Stepper moteur(TOURS, 8, 10, 9, 11);

void setup() {
  moteur.setSpeed(8);
  Serial.begin(9600);
}

void loop() {
  Serial.println("Sens horaire");
  moteur.step(512);
  delay(600);
  Serial.println("Sens anti-horaire");
  moteur.step(-512);
  delay(600);
}
`,
    components: ['stepper', 'wires'],
    highlightPins: ['8', '9', '10', '11', '5V', 'GND-F'],
  },
];

export function getLesson(id: LessonId): Lesson {
  return LESSONS.find((lesson) => lesson.id === id) ?? LESSONS[0];
}

export function isLessonId(value: unknown): value is LessonId {
  return LESSONS.some((lesson) => lesson.id === value);
}
