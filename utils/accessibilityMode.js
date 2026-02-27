export const ACCESSIBILITY_MODE = {
  DYSLEXIA: "dyslexia",
  DEAF: "deaf",
  SPEECH: "speech",
};

const DYSLEXIA_TERMS = ["dyslexia", "dyslexic", "read", "reading"];
const DEAF_TERMS = [
  "deaf",
  "hard of hearing",
  "hoh",
  "hearing",
  "mute",
];
const SPEECH_TERMS = ["speech", "speech impaired", "non verbal", "text"];

export const ACCESSIBILITY_OPTIONS = [
  {
    value: ACCESSIBILITY_MODE.DYSLEXIA,
    title: "Dyslexia Mode",
    subtitle: "Readable-first layout",
  },
  {
    value: ACCESSIBILITY_MODE.DEAF,
    title: "Deaf / HOH Mode",
    subtitle: "Visual-first interface",
  },
  {
    value: ACCESSIBILITY_MODE.SPEECH,
    title: "Speech Impaired Mode",
    subtitle: "Text interaction priority",
  },
];

export function normalizeAccessibilityMode(rawValue) {
  if (!rawValue || typeof rawValue !== "string") {
    return ACCESSIBILITY_MODE.DYSLEXIA;
  }

  const cleaned = rawValue.trim().toLowerCase();
  if (!cleaned) {
    return ACCESSIBILITY_MODE.DYSLEXIA;
  }

  if (
    cleaned === ACCESSIBILITY_MODE.DYSLEXIA ||
    DYSLEXIA_TERMS.some((term) => cleaned.includes(term))
  ) {
    return ACCESSIBILITY_MODE.DYSLEXIA;
  }

  if (
    cleaned === ACCESSIBILITY_MODE.DEAF ||
    DEAF_TERMS.some((term) => cleaned.includes(term))
  ) {
    return ACCESSIBILITY_MODE.DEAF;
  }

  if (
    cleaned === ACCESSIBILITY_MODE.SPEECH ||
    SPEECH_TERMS.some((term) => cleaned.includes(term))
  ) {
    return ACCESSIBILITY_MODE.SPEECH;
  }

  return ACCESSIBILITY_MODE.DYSLEXIA;
}

export function getAccessibilityModeLabel(mode) {
  const normalized = normalizeAccessibilityMode(mode);
  const selected = ACCESSIBILITY_OPTIONS.find(
    (option) => option.value === normalized,
  );
  return selected ? selected.title : "Dyslexia Mode";
}
