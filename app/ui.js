"use client";

export function cls(...a) {
  return a.filter(Boolean).join(" ");
}

export function fmtBytes(n) {
  if (!n && n !== 0) return "—";
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

// Circular progress ring (SVG). size in px.
export function Ring({ percent = 0, size = 148, stroke = 14, caption = "surveyed" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, percent));
  const off = c * (1 - p / 100);
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg className="ring-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--ring-bg)" strokeWidth={stroke} />
        <defs>
          <linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringgrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
      </svg>
      <div className="ring-label">
        <div>
          <div className="pct num">{Math.round(p)}%</div>
          <div className="cap">{caption}</div>
        </div>
      </div>
    </div>
  );
}

// Mini bar for progress.
export function Bar({ value, total }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="bar" aria-label={`${pct}%`}>
      <span style={{ width: pct + "%" }} />
    </div>
  );
}

// Daily submissions sparkline.
export function Spark({ data = [] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const show = data.slice(-14);
  return (
    <div>
      <div className="spark">
        {show.map((d, i) => (
          <div
            key={i}
            className="col"
            style={{ height: Math.max(6, (d.count / max) * 100) + "%" }}
            title={`${d.date}: ${d.count}`}
          />
        ))}
      </div>
      <div className="spark-x">
        {show.map((d, i) => (
          <span key={i}>{i === 0 || i === show.length - 1 ? fmtDate(d.date) : ""}</span>
        ))}
      </div>
    </div>
  );
}

export function toggleTheme() {
  try {
    const root = document.documentElement;
    const isDark = root.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("endline_theme", next);
    return next;
  } catch (e) {
    return "light";
  }
}
