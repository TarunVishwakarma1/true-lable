// Server-safe theme constants. No "use client" here: layout.tsx inlines the boot script as a string.
export const ACCENT_KEY = "truelabel:accent";
export const DEFAULT_ACCENT = "emerald";

// Inline this in <head> so a stored accent applies before first paint.
export const ACCENT_BOOT_SCRIPT = `try{var a=localStorage.getItem("${ACCENT_KEY}");if(a&&a!=="${DEFAULT_ACCENT}"){document.documentElement.dataset.accent=a}}catch(e){}`;
