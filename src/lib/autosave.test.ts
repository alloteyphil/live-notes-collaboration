import { RETRY_MAX_DELAY_MS, getRetryDelayMs } from "@/lib/autosave";

describe("getRetryDelayMs", () => {
  it("starts at base delay for first retry attempt", () => {
    expect(getRetryDelayMs(0)).toBe(1000);
    expect(getRetryDelayMs(1)).toBe(1000);
  });

  it("grows exponentially and is capped", () => {
    expect(getRetryDelayMs(2)).toBe(2000);
    expect(getRetryDelayMs(3)).toBe(4000);
    expect(getRetryDelayMs(100)).toBe(RETRY_MAX_DELAY_MS);
  });
});
