import { afterEach } from "vitest";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  };
}

if (typeof window !== "undefined" && typeof window.localStorage?.getItem !== "function") {
  Object.defineProperty(window, "localStorage", {
    value: createMemoryStorage(),
    writable: true,
    configurable: true,
  });
}

afterEach(() => {
  if (typeof window !== "undefined" && typeof window.localStorage?.clear === "function") {
    window.localStorage.clear();
  }
  document.documentElement.className = "";
  document.documentElement.removeAttribute("data-ui-density");
  document.documentElement.removeAttribute("data-font-scale");
  document.documentElement.style.fontSize = "";
});
