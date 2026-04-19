const STORAGE_KEY = "notes-theme";

export type ThemePreference = "light" | "dark" | "system";

export function getStoredTheme(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "light" || raw === "dark" || raw === "system") {
    return raw;
  }
  return "system";
}

export function isDarkForPreference(value: ThemePreference): boolean {
  if (value === "dark") return true;
  if (value === "light") return false;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Applies `dark` class on `document.documentElement` from preference. */
export function applyTheme(value: ThemePreference): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("dark", isDarkForPreference(value));
}

export function setStoredTheme(value: ThemePreference): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, value);
  applyTheme(value);
  window.dispatchEvent(new CustomEvent("notes-theme-change"));
}
