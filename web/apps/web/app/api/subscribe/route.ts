import { NextResponse } from "next/server";

// Forwards sign-ups to whatever list you use (Buttondown, Resend, a Sheet
// webhook…). Set NEWSLETTER_WEBHOOK_URL to a URL that accepts JSON {email}.

// ponytail: in-memory, per-instance — with minReplicas: 2 an attacker can
// get roughly 2x this by hitting different pods, not a global limit like
// the backend's Redis-backed one. Fine here: the blast radius is spam
// toward NEWSLETTER_WEBHOOK_URL, not account takeover or data exposure.
// Upgrade to Upstash (already used elsewhere) if that ever stops being true.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  // Unbounded growth guard — one IP's stale array shouldn't live forever,
  // and this is the one place that ever touches the map's size.
  if (hits.size > 10_000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const { email } = (await req.json().catch(() => ({}))) as { email?: unknown };
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "That doesn't look like an email address." }, { status: 400 });
  }

  const url = process.env.NEWSLETTER_WEBHOOK_URL;
  if (!url) {
    return NextResponse.json(
      { error: "The list isn't wired up yet — watch the GitHub repo for releases." },
      { status: 503 },
    );
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, source: "truelabel-web" }),
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Couldn't save that right now. Try again later." }, { status: 502 });
  }
  return NextResponse.json({ message: "You're in. We only write when there's a release." });
}
