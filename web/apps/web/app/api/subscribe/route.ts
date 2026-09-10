import { NextResponse } from "next/server";

// Forwards sign-ups to whatever list you use (Buttondown, Resend, a Sheet
// webhook…). Set NEWSLETTER_WEBHOOK_URL to a URL that accepts JSON {email}.
export async function POST(req: Request) {
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
