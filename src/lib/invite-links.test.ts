import { buildJoinAuthHref } from "@/lib/invite-links";

describe("buildJoinAuthHref", () => {
  it("builds sign-in redirect url for join page", () => {
    expect(buildJoinAuthHref("sign-in", "abc123")).toBe(
      "/sign-in?redirect_url=%2Fjoin%2Fabc123",
    );
  });

  it("trims and safely encodes token values", () => {
    expect(buildJoinAuthHref("sign-up", " tok en/1 ")).toBe(
      "/sign-up?redirect_url=%2Fjoin%2Ftok%2520en%252F1",
    );
  });
});
