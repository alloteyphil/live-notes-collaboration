import {
  applyTheme,
  getStoredTheme,
  isDarkForPreference,
  setStoredTheme,
} from "@/lib/theme-storage";

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("theme-storage", () => {
  it("returns system when there is no stored theme", () => {
    expect(getStoredTheme()).toBe("system");
  });

  it("returns only valid stored themes", () => {
    window.localStorage.setItem("notes-theme", "dark");
    expect(getStoredTheme()).toBe("dark");

    window.localStorage.setItem("notes-theme", "invalid");
    expect(getStoredTheme()).toBe("system");
  });

  it("resolves dark preference correctly", () => {
    expect(isDarkForPreference("dark")).toBe(true);
    expect(isDarkForPreference("light")).toBe(false);

    mockMatchMedia(true);
    expect(isDarkForPreference("system")).toBe(true);

    mockMatchMedia(false);
    expect(isDarkForPreference("system")).toBe(false);
  });

  it("applies dark class based on preference", () => {
    mockMatchMedia(true);
    applyTheme("system");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("stores theme and dispatches theme change event", () => {
    const handler = vi.fn();
    window.addEventListener("notes-theme-change", handler);
    mockMatchMedia(false);

    setStoredTheme("dark");

    expect(window.localStorage.getItem("notes-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
