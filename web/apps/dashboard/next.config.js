// The backend API sets a strict header set on every response (see
// backend/src/routes/mod.rs); this app never did, despite being the one
// place a real staff login form and session token live. Bearer tokens live
// in localStorage here (see lib/auth-context.tsx — deliberate, matching the
// backend's cookie-free, CSRF-structurally-impossible auth design), which
// means an XSS bug is the one thing that can steal a session — CSP's
// script-src is the actual backstop for that, not just clickjacking cover.
const apiOrigin = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

// React's dev-mode debugging (reconstructing stack traces across the
// Turbopack/HMR boundary) calls eval() — blocked without 'unsafe-eval',
// and confirmed dev-only straight from React's own console message:
// "React will never use eval() in production mode." So it's dev-only here.
const isProd = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  // 'unsafe-inline' is the one real gap here: Next's hydration payload and
  // this app's own theme-boot script (app/layout.tsx) are inline, and a
  // nonce-based CSP needs per-request middleware, not static config, to do
  // properly. Source-restricting script-src to 'self' still blocks loading
  // an attacker's own external script, which is most of what this buys.
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin}`,
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(!process.env.VERCEL && { output: "standalone" }),
  allowedDevOrigins: ['172.20.10.4'],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
