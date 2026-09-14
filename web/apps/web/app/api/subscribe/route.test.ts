import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

// Each test uses its own X-Forwarded-For so the module-level rate-limit
// map (keyed by IP) doesn't leak state between cases — that map has no
// reset hook by design (see route.ts), so distinct IPs are the isolation.
let ipCounter = 0;
function request(body: unknown, ip = `10.0.0.${++ipCounter}`) {
  return new Request("http://localhost/api/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": ip },
    body: JSON.stringify(body),
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/subscribe", () => {
  it("rejects a malformed email before touching the webhook", async () => {
    const res = await POST(request({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("rejects a missing email body", async () => {
    const res = await POST(request({}));
    expect(res.status).toBe(400);
  });

  it("returns 503 when NEWSLETTER_WEBHOOK_URL isn't configured", async () => {
    vi.stubEnv("NEWSLETTER_WEBHOOK_URL", "");
    const res = await POST(request({ email: "person@example.com" }));
    expect(res.status).toBe(503);
  });

  it("forwards a valid email to the configured webhook", async () => {
    vi.stubEnv("NEWSLETTER_WEBHOOK_URL", "https://list.example.com/hook");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));

    const res = await POST(request({ email: "person@example.com" }));

    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://list.example.com/hook",
      expect.objectContaining({ method: "POST" }),
    );
    const sentBody = JSON.parse(fetchSpy.mock.calls[0]![1]!.body as string);
    expect(sentBody).toEqual({ email: "person@example.com", source: "truelabel-web" });
  });

  it("returns 502 when the webhook itself rejects the request", async () => {
    vi.stubEnv("NEWSLETTER_WEBHOOK_URL", "https://list.example.com/hook");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 500 }));

    const res = await POST(request({ email: "person@example.com" }));
    expect(res.status).toBe(502);
  });

  it("allows 5 requests from one address, then 429s the 6th", async () => {
    const ip = "203.0.113.9";
    const results: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await POST(request({ email: "person@example.com" }, ip));
      results.push(res.status);
    }
    // First 5 reach real handling (503, webhook unconfigured in this test);
    // the 6th never gets that far.
    expect(results.slice(0, 5)).toEqual([503, 503, 503, 503, 503]);
    expect(results[5]).toBe(429);
  });

  it("rate-limits per address, not globally — a different IP is unaffected", async () => {
    const busyIp = "203.0.113.10";
    for (let i = 0; i < 6; i++) await POST(request({ email: "person@example.com" }, busyIp));

    const res = await POST(request({ email: "person@example.com" }, "203.0.113.11"));
    expect(res.status).toBe(503); // not 429 — a fresh address, not rate-limited
  });
});
