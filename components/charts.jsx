"use client";

// Lightweight dependency-free SVG charts (same approach as the Pipe / Water
// Meter tools). All take data as [{ label, value, color? }].

export function BarChart({ data, height = 260, color = "#16a34a", emptyText = "No data" }) {
  if (!data || data.length === 0) return <Empty text={emptyText} />;
  const max = Math.max(...data.map((d) => d.value), 1);
  const padTop = 16, padBottom = 64, padX = 6;
  const barAreaH = height - padTop - padBottom;
  const W = 800;
  const barW = (W - padX * 2) / data.length;
  const innerW = barW * 0.68;

  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" style={{ minWidth: Math.max(W, data.length * 72) }} preserveAspectRatio="xMidYMid meet">
        {[0.25, 0.5, 0.75, 1].map((p) => (
          <line key={p} x1={padX} x2={W - padX} y1={padTop + barAreaH * (1 - p)} y2={padTop + barAreaH * (1 - p)} stroke="#e2e8f0" strokeWidth="1" />
        ))}
        {data.map((d, i) => {
          const h = (d.value / max) * barAreaH;
          const x = padX + i * barW + (barW - innerW) / 2;
          const y = padTop + barAreaH - h;
          return (
            <g key={i}>
              <rect x={x} y={y} width={innerW} height={Math.max(0, h)} rx="4" fill={d.color || color} opacity="0.9">
                <title>{d.label}: {d.value}</title>
              </rect>
              <text x={x + innerW / 2} y={y - 5} textAnchor="middle" fontSize="12" fill="#64748b" fontWeight="700">{d.value}</text>
              <text x={x + innerW / 2} y={padTop + barAreaH + 14} textAnchor="end" fontSize="11" fill="#64748b"
                transform={`rotate(-35 ${x + innerW / 2} ${padTop + barAreaH + 14})`}>
                {String(d.label).length > 18 ? String(d.label).slice(0, 16) + "…" : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function LineChart({ data, height = 220, color = "#16a34a", emptyText = "No data" }) {
  if (!data || data.length === 0) return <Empty text={emptyText} />;
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 800;
  const pad = { top: 14, right: 14, bottom: 30, left: 28 };
  const innerW = W - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const pts = data.map((d, i) => ({
    x: pad.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW),
    y: pad.top + innerH - (d.value / max) * innerH,
    d,
  }));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const area = `${path} L ${pts[pts.length - 1].x} ${pad.top + innerH} L ${pts[0].x} ${pad.top + innerH} Z`;
  const step = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <svg viewBox={`0 0 ${W} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {[0, 0.5, 1].map((p) => (
          <line key={p} x1={pad.left} x2={W - pad.right} y1={pad.top + innerH * (1 - p)} y2={pad.top + innerH * (1 - p)} stroke="#e2e8f0" strokeWidth="1" />
        ))}
        <path d={area} fill={color} opacity="0.12" />
        <path d={path} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill={color}><title>{p.d.label}: {p.d.value}</title></circle>
        ))}
        {pts.map((p, i) => i % step === 0 && (
          <text key={i} x={p.x} y={height - 10} textAnchor="middle" fontSize="10" fill="#64748b">{p.d.label}</text>
        ))}
      </svg>
    </div>
  );
}

export function DonutChart({ data, size = 200, emptyText = "No data" }) {
  const total = (data || []).reduce((s, d) => s + d.value, 0);
  if (!data || data.length === 0 || total === 0) return <Empty text={emptyText} />;
  const cx = size / 2, cy = size / 2, r = size / 2 - 10, ir = r * 0.6;
  const full = `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z M ${cx} ${cy - ir} A ${ir} ${ir} 0 1 0 ${cx - 0.01} ${cy - ir} Z`;
  let start = -Math.PI / 2;
  const slices = data.map((d) => {
    const ang = (d.value / total) * Math.PI * 2;
    const end = start + ang;
    const large = ang > Math.PI ? 1 : 0;
    const isFull = ang >= Math.PI * 2 - 1e-6;
    const p = isFull ? full :
      `M ${cx + r * Math.cos(start)} ${cy + r * Math.sin(start)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(end)} ${cy + r * Math.sin(end)} L ${cx + ir * Math.cos(end)} ${cy + ir * Math.sin(end)} A ${ir} ${ir} 0 ${large} 0 ${cx + ir * Math.cos(start)} ${cy + ir * Math.sin(start)} Z`;
    const s = { ...d, path: p, isFull, pct: (d.value / total) * 100 };
    start = end;
    return s;
  });
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} fillRule={s.isFull ? "evenodd" : "nonzero"}>
            <title>{s.label}: {s.value} ({s.pct.toFixed(1)}%)</title>
          </path>
        ))}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="22" fontWeight="800" fill="#0f172a">{total}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="#64748b">total</text>
      </svg>
      <ul className="space-y-1.5 text-sm">
        {slices.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded inline-block shrink-0" style={{ background: s.color }} />
            <span className="text-slate-700">{s.label}</span>
            <span className="text-slate-400 num">{s.value}</span>
            <span className="text-slate-400 num">({s.pct.toFixed(0)}%)</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Horizontal bar list (per-enumerator, per-village, distributions).
export function HBars({ data, color = "#16a34a", max: maxProp }) {
  if (!data || data.length === 0) return <Empty text="No data" />;
  const max = maxProp || Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-2">
      {data.map((d, i) => (
        <li key={i}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium text-slate-700 truncate pr-2">{d.label}</span>
            <span className="text-slate-500 num shrink-0">{d.value}</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: d.color || color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Empty({ text }) {
  return <div className="text-sm text-slate-400 text-center py-10">{text}</div>;
}
