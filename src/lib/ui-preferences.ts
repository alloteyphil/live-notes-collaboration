const FONT_SCALE_KEY = "notes-font-scale";
const UI_DENSITY_KEY = "notes-ui-density";
const MOTION_KEY = "notes-motion";

export type FontScale = "sm" | "md" | "lg";
export type UiDensity = "comfortable" | "compact";
export type MotionPreference = "system" | "reduce";

export function getFontScale(): FontScale {
  if (typeof window === "undefined") return "md";
  const raw = localStorage.getItem(FONT_SCALE_KEY);
  if (raw === "sm" || raw === "md" || raw === "lg") return raw;
  return "md";
}

export function getUiDensity(): UiDensity {
  if (typeof window === "undefined") return "comfortable";
  const raw = localStorage.getItem(UI_DENSITY_KEY);
  if (raw === "compact" || raw === "comfortable") return raw;
  return "comfortable";
}

export function getMotionPreference(): MotionPreference {
  if (typeof window === "undefined") return "system";
  const raw = localStorage.getItem(MOTION_KEY);
  if (raw === "reduce" || raw === "system") return raw;
  return "system";
}

function dispatchUiPrefsChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("notes-ui-prefs-change"));
}

/** Applies font scale, density data attribute, and motion class on `document.documentElement`. */
export function applyUiPreferences(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const font = getFontScale();
  root.style.fontSize = font === "sm" ? "14px" : font === "lg" ? "18px" : "16px";
  root.dataset.fontScale = font;

  const density = getUiDensity();
  if (density === "compact") {
    root.dataset.uiDensity = "compact";
  } else {
    root.removeAttribute("data-ui-density");
  }

  const motion = getMotionPreference();
  const systemWantsReduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shouldReduce = motion === "reduce" || (motion === "system" && systemWantsReduce);
  root.classList.toggle("motion-reduce", shouldReduce);
}

export function setFontScale(value: FontScale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FONT_SCALE_KEY, value);
  applyUiPreferences();
  dispatchUiPrefsChange();
}

export function setUiDensity(value: UiDensity): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(UI_DENSITY_KEY, value);
  applyUiPreferences();
  dispatchUiPrefsChange();
}

export function setMotionPreference(value: MotionPreference): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOTION_KEY, value);
  applyUiPreferences();
  dispatchUiPrefsChange();
}
