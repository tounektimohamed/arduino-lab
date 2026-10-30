export type Lang = 'fr' | 'ar';

export interface Localized {
  fr: string;
  ar: string;
}

export const ui = {
  brand: { fr: 'Arduino Lab', ar: 'مختبر أردوينو' },
  brandSub: { fr: 'électronique interactive', ar: 'إلكترونيات تفاعلية' },
  navLab: { fr: 'Laboratoire', ar: 'المختبر' },
  navLessons: { fr: 'Leçons', ar: 'الدروس' },
  navComponents: { fr: 'Composants', ar: 'المكوّنات' },
  course: { fr: 'Parcours', ar: 'المسار' },
  comingSoon: { fr: 'Bientôt', ar: 'قريبًا' },
  comingSoonText: {
    fr: 'Afficheur LCD, capteur de distance, moteur pas à pas…',
    ar: 'شاشة LCD، حسّاس المسافة، المحرّك الخطوي…',
  },
  heroKicker: { fr: 'Arduino Uno · ATmega328P', ar: 'أردوينو أونو · ATmega328P' },
  heroTitle: { fr: 'Apprendre', ar: 'تعلّم' },
  heroAccent: { fr: 'Arduino', ar: 'أردوينو' },
  heroTagline: { fr: 'Explorer · Comprendre · Construire', ar: 'استكشف · افهم · ابنِ' },
  heroStart: { fr: 'Commencer', ar: 'ابدأ' },
  heroContinue: { fr: 'Continuer', ar: 'واصل' },
  heroReview: { fr: 'Revoir', ar: 'راجع' },
  heroExplore: { fr: 'Voir les composants', ar: 'استكشف المكوّنات' },
  heroProgress: { fr: 'leçons terminées', ar: 'دروس مكتملة' },
  nextLesson: { fr: 'Leçon suivante', ar: 'الدرس التالي' },
  photoBy: { fr: 'Photo :', ar: 'الصورة:' },
  hintPan: { fr: 'Glisser pour déplacer', ar: 'اسحب للتحريك' },
  hintRotate: { fr: 'Q / E pour pivoter', ar: 'Q / E للتدوير' },
  hintZoom: { fr: 'Molette pour zoomer', ar: 'العجلة للتكبير' },
  simReady: { fr: 'Simulateur prêt', ar: 'المحاكي جاهز' },
  simRunning: { fr: 'Simulation en cours', ar: 'المحاكاة قيد التشغيل' },
  simStopped: { fr: 'Simulateur arrêté', ar: 'المحاكي متوقف' },
  objectives: { fr: 'Objectifs', ar: 'الأهداف' },
  wiring: { fr: 'Câblage', ar: 'التوصيلات' },
  challenge: { fr: 'Défi', ar: 'تحدٍّ' },
  run: { fr: 'Lancer', ar: 'تشغيل' },
  stop: { fr: 'Arrêter', ar: 'إيقاف' },
  resetCode: { fr: 'Réinitialiser le code', ar: 'إعادة تعيين الكود' },
  resetView: { fr: 'Recentrer la vue', ar: 'إعادة توسيط العرض' },
  serialTitle: { fr: 'Moniteur série', ar: 'مراقب المنفذ التسلسلي' },
  serialStopped: { fr: 'Arrêté', ar: 'متوقف' },
  serialRunning: { fr: 'En cours', ar: 'قيد التشغيل' },
  clear: { fr: 'Effacer', ar: 'مسح' },
  serialPlaceholder: {
    fr: 'La sortie du programme apparaîtra ici.',
    ar: 'سيظهر ناتج البرنامج هنا.',
  },
  uploading: { fr: 'Téléversement du programme…', ar: 'جارٍ تحميل البرنامج…' },
  started: { fr: 'Programme démarré.', ar: 'بدأ تشغيل البرنامج.' },
  stopped: { fr: 'Simulation arrêtée.', ar: 'تم إيقاف المحاكاة.' },
  markComplete: { fr: 'Marquer comme terminé', ar: 'علّم الدرس كمكتمل' },
  completed: { fr: 'Leçon terminée', ar: 'الدرس مكتمل' },
  lesson: { fr: 'Leçon', ar: 'الدرس' },
  beginner: { fr: 'Débutant', ar: 'مبتدئ' },
  minutes: { fr: 'min', ar: 'دقائق' },
  componentsTitle: { fr: 'Les composants du labo', ar: 'مكوّنات المختبر' },
  close: { fr: 'Fermer', ar: 'إغلاق' },
  componentLed: { fr: 'LED rouge', ar: 'مصباح LED أحمر' },
  componentResistor: { fr: 'Résistance 220 Ω', ar: 'مقاومة 220 أوم' },
  componentButton: { fr: 'Bouton poussoir', ar: 'زرّ ضغط' },
  componentPot: { fr: 'Potentiomètre 10 kΩ', ar: 'مقياس جهد 10 كيلو أوم' },
  componentWires: { fr: 'Fils de liaison', ar: 'أسلاك التوصيل' },
  componentLedRole: {
    fr: 'Transforme un courant en lumière. La patte longue est l’anode (+).',
    ar: 'يحوّل التيار إلى ضوء. الساق الطويلة هي الأنود (+).',
  },
  componentResistorRole: {
    fr: 'Limite le courant pour protéger la LED et la carte.',
    ar: 'يحدّ من التيار لحماية المصباح واللوحة.',
  },
  componentButtonRole: {
    fr: 'Ferme ou ouvre un circuit quand on appuie dessus.',
    ar: 'يغلق الدائرة أو يفتحها عند الضغط عليه.',
  },
  componentPotRole: {
    fr: 'Une résistance réglable : sa position devient une tension.',
    ar: 'مقاومة قابلة للضبط: يتحوّل موضعها إلى جهد كهربائي.',
  },
  componentWiresRole: {
    fr: 'Relient les composants aux broches de la carte.',
    ar: 'تربط المكوّنات بمنافذ اللوحة.',
  },
  potLabel: { fr: 'Position du potentiomètre', ar: 'موضع مقياس الجهد' },
  potHint: {
    fr: 'Faites glisser le bouton du potentiomètre dans la scène.',
    ar: 'اسحب مقبض مقياس الجهد في المشهد.',
  },
  hintButton: {
    fr: 'Cliquez sur le bouton dans la scène 3D.',
    ar: 'انقر على الزرّ في المشهد ثلاثي الأبعاد.',
  },
  hintLed: {
    fr: 'Lancez le code pour voir la LED clignoter.',
    ar: 'شغّل الكود لترى المصباح يومض.',
  },
  hintPot: {
    fr: 'Faites glisser le potentiomètre et lancez le code.',
    ar: 'اسحب مقياس الجهد ثم شغّل الكود.',
  },
  lightLabel: { fr: 'Lumière ambiante', ar: 'الإضاءة المحيطة' },
  lightHint: {
    fr: 'Faites glisser le soleil dans la scène, ou ce curseur.',
    ar: 'اسحب الشمس في المشهد أو هذا المنزلق.',
  },
  servoLabel: { fr: 'Angle du servomoteur', ar: 'زاوية المحرّك المؤازر' },
  servoHint: {
    fr: 'Le bras suit la valeur envoyée par write().',
    ar: 'يتبع الذراع القيمة المرسلة بـ write().',
  },
  toneLabel: { fr: 'Fréquence jouée', ar: 'التردد المُشغَّل' },
  toneHint: {
    fr: 'Activez le son avec le haut-parleur, en bas de la scène.',
    ar: 'فعّل الصوت بزرّ مكبّر الصوت أسفل المشهد.',
  },
  soundToggle: { fr: 'Activer / couper le son', ar: 'تشغيل / كتم الصوت' },
  distLabel: { fr: 'Distance de la balle', ar: 'مسافة الكرة' },
  distHint: {
    fr: 'Faites glisser la balle dans la scène, ou ce curseur.',
    ar: 'اسحب الكرة في المشهد أو هذا المنزلق.',
  },
  tempLabel: { fr: 'Température ambiante', ar: 'درجة الحرارة المحيطة' },
  tempHint: {
    fr: 'Réglez la température vue par la sonde TMP36 (−10 à 50 °C).',
    ar: 'اضبط الحرارة التي يقيسها الحسّاس TMP36 (من −10 إلى 50 °م).',
  },
  partKicker: { fr: 'Composant', ar: 'مكوّن' },
  partHint: { fr: 'Cliquez sur une pièce de la carte', ar: 'انقر على أي قطعة من اللوحة' },
  progress: { fr: 'progression', ar: 'التقدّم' },
  modeBlocks: { fr: '🧩 Blocs', ar: '🧩 بلوكات' },
  modeCode: { fr: '{ } Code', ar: '{ } كود' },
  blocksEmpty: { fr: 'Glissez des blocs ici', ar: 'اسحب البلوكات إلى هنا' },
  blocksManual: {
    fr: 'Le code a été modifié à la main. « Lancer » exécute les blocs ; modifier un bloc remplacera ce code.',
    ar: 'تم تعديل الكود يدويًا. زرّ «تشغيل» ينفّذ البلوكات، وتعديل أي بلوك سيستبدل هذا الكود.',
  },
  footerNote: {
    fr: 'Un labo d’électronique original, inspiré des bases de l’Arduino.',
    ar: 'مختبر إلكترونيات أصلي، مستوحى من أساسيات أردوينو.',
  },
} satisfies Record<string, Localized>;

export type UIKey = keyof typeof ui;

export function t(lang: Lang, key: UIKey): string {
  return ui[key][lang];
}

export function pick(lang: Lang, value: Localized): string {
  return value[lang];
}
