import { afterEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./api";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("api client", () => {
  it("returns the envelope's data on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ status: "success", data: { signed_out: true }, error: null }),
    );
    await expect(api.logout("tok")).resolves.toEqual({ signed_out: true });
  });

  it("throws ApiError with the envelope's message when status is 'error'", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ status: "error", data: null, error: "bad password" }, 401),
    );
    await expect(api.login({ email: "a@b.com", password: "x" })).rejects.toMatchObject(
      new ApiError("bad password", 401),
    );
  });

  it("throws a generic ApiError when the response isn't valid JSON at all", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("<html>502</html>", { status: 502 }));
    await expect(api.logout("tok")).rejects.toMatchObject({ status: 502 });
  });

  it("treats a non-ok HTTP status as an error even if the envelope looks like success", async () => {
    // A misbehaving proxy/edge could return 500 with a stale success body —
    // res.ok is checked independently of the envelope's own status field.
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ status: "success", data: {}, error: null }, 500),
    );
    await expect(api.logout("tok")).rejects.toMatchObject({ status: 500 });
  });

  it("sends the bearer token only when one is given", async () => {
    // A fresh Response per call — Response.json() can only drain the body
    // stream once, so a shared mockResolvedValue would make the second
    // call's .json() fail silently and this test would pass for the wrong
    // reason (or fail with an unrelated error, as it did before this fix).
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => jsonResponse({ status: "success", data: {}, error: null }));

    await api.me("secret-token");
    const [, meOpts] = fetchSpy.mock.calls[0]!;
    expect((meOpts!.headers as Record<string, string>).Authorization).toBe("Bearer secret-token");

    await api.login({ email: "a@b.com", password: "x" });
    const [, loginOpts] = fetchSpy.mock.calls[1]!;
    expect((loginOpts!.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("team.updateRole PATCHes the right URL with the role in the body", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ status: "success", data: {}, error: null }));

    await api.team.updateRole("tok", "user-123", "admin");

    const [url, opts] = fetchSpy.mock.calls[0]!;
    expect(url).toContain("/api/v1/admin/team/user-123/role");
    expect(opts!.method).toBe("PATCH");
    expect(JSON.parse(opts!.body as string)).toEqual({ role: "admin" });
  });

  it("crashReports.list only includes filters that are actually set", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(jsonResponse({ status: "success", data: { items: [], total: 0 }, error: null }));

    await api.crashReports.list("tok", { status: "in_review", limit: undefined });

    const [url] = fetchSpy.mock.calls[0]!;
    expect(url).toContain("status=in_review");
    expect(url).not.toContain("limit=");
  });
});
