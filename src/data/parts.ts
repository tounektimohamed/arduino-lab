import type { Localized } from '../i18n';
import { COMPONENTS } from './lessons';

export interface PartInfo {
  name: Localized;
  role: Localized;
}

/** Pièces de la carte Arduino Uno et de la platine, cliquables dans la scène 3D. */
export const BOARD_PARTS: Record<string, PartInfo> = {
  chip: {
    name: { fr: 'Microcontrôleur ATmega328P', ar: 'المتحكم الدقيق ATmega328P' },
    role: {
      fr: 'Le cerveau de la carte : il exécute votre programme (32 Ko de mémoire flash, 2 Ko de RAM).',
      ar: 'دماغ اللوحة: ينفّذ برنامجك (ذاكرة فلاش 32 كيلوبايت و2 كيلوبايت رام).',
    },
  },
  usbChip: {
    name: { fr: 'Convertisseur USB ATmega16U2', ar: 'محوّل USB ‏ATmega16U2' },
    role: {
      fr: 'Traduit l’USB de l’ordinateur en liaison série : téléversement du code et moniteur série.',
      ar: 'يحوّل USB الحاسوب إلى اتصال تسلسلي: رفع الكود ومراقب المنفذ التسلسلي.',
    },
  },
  usb: {
    name: { fr: 'Port USB-B', ar: 'منفذ USB-B' },
    role: {
      fr: 'Relie la carte à l’ordinateur : alimentation 5 V, téléversement et communication série.',
      ar: 'يربط اللوحة بالحاسوب: تغذية 5 فولت ورفع الكود والاتصال التسلسلي.',
    },
  },
  jack: {
    name: { fr: 'Prise d’alimentation DC', ar: 'مقبس التغذية DC' },
    role: {
      fr: 'Alimente la carte en 7–12 V (adaptateur ou pile) quand l’USB n’est pas branché.',
      ar: 'يغذّي اللوحة بجهد 7–12 فولت (محوّل أو بطارية) عند عدم توصيل USB.',
    },
  },
  reset: {
    name: { fr: 'Bouton Reset', ar: 'زرّ إعادة التشغيل Reset' },
    role: {
      fr: 'Redémarre le programme depuis le début, comme si on rebranchait la carte.',
      ar: 'يعيد تشغيل البرنامج من البداية كأنك أعدت توصيل اللوحة.',
    },
  },
  capacitors: {
    name: { fr: 'Condensateurs électrolytiques', ar: 'مكثفات إلكتروليتية' },
    role: {
      fr: 'Lissent la tension d’alimentation pour éviter parasites et redémarrages inattendus.',
      ar: 'تنعّم جهد التغذية لتفادي التشويش وإعادة التشغيل المفاجئة.',
    },
  },
  regulator: {
    name: { fr: 'Régulateur de tension 5 V', ar: 'منظّم الجهد 5 فولت' },
    role: {
      fr: 'Transforme la tension de la prise DC (7–12 V) en 5 V stables pour la puce.',
      ar: 'يحوّل جهد المقبس DC ‏(7–12 فولت) إلى 5 فولت ثابتة للشريحة.',
    },
  },
  crystal: {
    name: { fr: 'Quartz 16 MHz', ar: 'بلورة كوارتز 16 ميغاهرتز' },
    role: {
      fr: 'Donne le rythme à la puce : 16 millions de cycles par seconde.',
      ar: 'تعطي الشريحة إيقاعها: 16 مليون دورة في الثانية.',
    },
  },
  powerLed: {
    name: { fr: 'LED « ON »', ar: 'مصباح «ON»' },
    role: {
      fr: 'S’allume en vert dès que la carte est alimentée.',
      ar: 'يضيء بالأخضر بمجرّد تغذية اللوحة.',
    },
  },
  pin13Led: {
    name: { fr: 'LED « L » (broche 13)', ar: 'مصباح «L» (المنفذ 13)' },
    role: {
      fr: 'Reliée à la broche 13 : elle s’allume avec digitalWrite(13, HIGH).',
      ar: 'موصولة بالمنفذ 13: تُضاء بـ digitalWrite(13, HIGH).',
    },
  },
  txrxLed: {
    name: { fr: 'LED TX / RX', ar: 'مصباحا TX / RX' },
    role: {
      fr: 'Clignotent quand la carte envoie (TX) ou reçoit (RX) des données série.',
      ar: 'يومضان عندما ترسل اللوحة (TX) أو تستقبل (RX) بيانات تسلسلية.',
    },
  },
  digitalPins: {
    name: { fr: 'Broches numériques 0–13', ar: 'المنافذ الرقمية 0–13' },
    role: {
      fr: 'Lisent ou écrivent HIGH / LOW. Les broches 3, 5, 6, 9, 10 et 11 savent faire du PWM.',
      ar: 'تقرأ أو تكتب HIGH / LOW. المنافذ 3 و5 و6 و9 و10 و11 تدعم PWM.',
    },
  },
  analogPins: {
    name: { fr: 'Entrées analogiques A0–A5', ar: 'المداخل التماثلية A0–A5' },
    role: {
      fr: 'Mesurent une tension de 0 à 5 V avec analogRead() : une valeur de 0 à 1023.',
      ar: 'تقيس جهدًا من 0 إلى 5 فولت بـ analogRead(): قيمة من 0 إلى 1023.',
    },
  },
  powerPins: {
    name: { fr: 'Broches d’alimentation', ar: 'منافذ التغذية' },
    role: {
      fr: '5V, 3V3 et VIN alimentent vos composants ; GND est la masse commune du circuit.',
      ar: '‏5V و3V3 وVIN تغذّي مكوّناتك؛ و GND هو الأرضي المشترك للدائرة.',
    },
  },
  icsp: {
    name: { fr: 'Connecteur ICSP', ar: 'موصّل ICSP' },
    role: {
      fr: 'Permet de programmer directement le microcontrôleur avec un programmateur externe.',
      ar: 'يسمح ببرمجة المتحكم مباشرة بواسطة مبرمج خارجي.',
    },
  },
  smd: {
    name: { fr: 'Composants CMS', ar: 'مكوّنات السطح SMD' },
    role: {
      fr: 'Minuscules résistances et condensateurs soudés en surface : filtrage et protection.',
      ar: 'مقاومات ومكثفات صغيرة ملحومة على السطح: للتصفية والحماية.',
    },
  },
  breadboard: {
    name: { fr: 'Platine d’essai (breadboard)', ar: 'لوحة التجارب (بريدبورد)' },
    role: {
      fr: 'Câblage sans soudure : les 5 trous d’une même colonne sont reliés entre eux.',
      ar: 'توصيل دون لحام: الثقوب الخمسة في العمود الواحد متصلة ببعضها.',
    },
  },
};

export function getPartInfo(key: string): PartInfo | null {
  if (key in BOARD_PARTS) return BOARD_PARTS[key];
  if (key in COMPONENTS) return COMPONENTS[key as keyof typeof COMPONENTS];
  return null;
}
