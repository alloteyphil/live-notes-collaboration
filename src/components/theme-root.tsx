"use client";

import { useEffect } from "react";
import { applyTheme, getStoredTheme } from "@/lib/theme-storage";
import { applyUiPreferences, getMotionPreference } from "@/lib/ui-preferences";

/**
 * Syncs stored theme and UI preferences to `document.documentElement` on load and when
 * storage, custom events, or relevant system media queries change.
 */
export function ThemeRoot({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const sync = () => {
      applyTheme(getStoredTheme());
      applyUiPreferences();
    };

    sync();

    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith("notes-")) {
        sync();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("notes-theme-change", sync);
    window.addEventListener("notes-ui-prefs-change", sync);

    const colorMq = window.matchMedia("(prefers-color-scheme: dark)");
    const onColorScheme = () => {
      if (getStoredTheme() === "system") {
        applyTheme(getStoredTheme());
      }
    };
    colorMq.addEventListener("change", onColorScheme);

    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionScheme = () => {
      if (getMotionPreference() === "system") {
        applyUiPreferences();
      }
    };
    motionMq.addEventListener("change", onMotionScheme);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("notes-theme-change", sync);
      window.removeEventListener("notes-ui-prefs-change", sync);
      colorMq.removeEventListener("change", onColorScheme);
      motionMq.removeEventListener("change", onMotionScheme);
    };
  }, []);

  return <>{children}</>;
}
