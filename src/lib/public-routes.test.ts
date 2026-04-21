import { isPublicPath } from "@/lib/public-routes";

describe("isPublicPath", () => {
  it("allows anonymous routes", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/sign-in")).toBe(true);
    expect(isPublicPath("/sign-up/foo")).toBe(true);
    expect(isPublicPath("/join/abc123")).toBe(true);
  });

  it("protects app routes", () => {
    expect(isPublicPath("/dashboard")).toBe(false);
    expect(isPublicPath("/workspace/xyz")).toBe(false);
    expect(isPublicPath("/note/xyz")).toBe(false);
  });
});
