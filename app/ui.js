"use client";

export function cls(...a) {
  return a.filter(Boolean).join(" ");
}

export function fmtBytes(n) {
  if (n == null) return "—";
  if (n < 1024) return n + " B";
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + " KB";
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(1) + " MB";
  return (n / (1024 * 1024 * 1024)).toFixed(2) + " GB";
}

export function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d)) return String(s);
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

export function timeAgo(s) {
  if (!s) return "never";
  const d = new Date(s);
  if (isNaN(d)) return String(s);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return Math.floor(sec / 60) + " min ago";
  if (sec < 86400) return Math.floor(sec / 3600) + " hr ago";
  return Math.floor(sec / 86400) + " days ago";
}

// Circular progress ring (SVG).
export function Ring({ percent = 0, size = 148, stroke = 14, caption = "surveyed", trackColor = "#e2e8f0" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  const off = c * (1 - p / 100);
  const gid = "rg" + Math.round(size) + "_" + Math.round(stroke);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#4ade80" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`url(#${gid})`} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.7s ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="num font-extrabold leading-none" style={{ fontSize: size * 0.23 }}>{Math.round(p)}%</div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{caption}</div>
        </div>
      </div>
    </div>
  );
}

export function toggleTheme() {
  try {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    root.classList.toggle("dark", !isDark);
    localStorage.setItem("endline_theme", isDark ? "light" : "dark");
    return isDark ? "light" : "dark";
  } catch {
    return "light";
  }
}
