import {
  applyUiPreferences,
  getFontScale,
  getMotionPreference,
  getUiDensity,
  setFontScale,
  setMotionPreference,
  setUiDensity,
} from "@/lib/ui-preferences";

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("ui-preferences", () => {
  it("uses defaults when storage is empty", () => {
    expect(getFontScale()).toBe("md");
    expect(getUiDensity()).toBe("comfortable");
    expect(getMotionPreference()).toBe("system");
  });

  it("applies font scale, density, and motion class", () => {
    window.localStorage.setItem("notes-font-scale", "lg");
    window.localStorage.setItem("notes-ui-density", "compact");
    window.localStorage.setItem("notes-motion", "system");
    mockMatchMedia(true);

    applyUiPreferences();

    expect(document.documentElement.style.fontSize).toBe("18px");
    expect(document.documentElement.dataset.fontScale).toBe("lg");
    expect(document.documentElement.dataset.uiDensity).toBe("compact");
    expect(document.documentElement.classList.contains("motion-reduce")).toBe(true);
  });

  it("stores preference changes and emits one event per setter", () => {
    const handler = vi.fn();
    window.addEventListener("notes-ui-prefs-change", handler);
    mockMatchMedia(false);

    setFontScale("sm");
    setUiDensity("compact");
    setMotionPreference("reduce");

    expect(window.localStorage.getItem("notes-font-scale")).toBe("sm");
    expect(window.localStorage.getItem("notes-ui-density")).toBe("compact");
    expect(window.localStorage.getItem("notes-motion")).toBe("reduce");
    expect(handler).toHaveBeenCalledTimes(3);
    expect(document.documentElement.style.fontSize).toBe("14px");
    expect(document.documentElement.classList.contains("motion-reduce")).toBe(true);
  });
});
