import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges className conflicts and ignores falsy values", () => {
    const result = cn("px-2", false && "py-2", "px-4", undefined, "text-sm");
    expect(result).toBe("px-4 text-sm");
  });
});
