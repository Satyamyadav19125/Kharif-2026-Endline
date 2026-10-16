"use client";

import { fmtBytes } from "@/app/ui";

// Friendly names for the known app databases sharing this Atlas cluster.
const FRIENDLY = {
  endline2026: "Endline 2026",
  kameti: "Committee",
  pipe_readings: "Pipe Readings",
  watermeter: "Water Meter",
  field_readings: "Field Atlas",
  "coaching-attendance": "Coaching Attendance",
  "shape-trade": "Yellow Points",
  test: "Test / scratch",
};

const COLORS = ["#16a34a", "#0ea5e9", "#f59e0b", "#7c3aed", "#ec4899", "#14b8a6", "#f43f5e", "#64748b"];

export default function ClusterStorage({ data }) {
  if (!data || data.error) return null;
  const dbs = data.databases || [];
  const limit = data.limitBytes || 512 * 1024 * 1024;
  const total = data.totalUsedBytes || 0;
  const pct = data.clusterPercent || 0;
  const max = Math.max(1, ...dbs.map((d) => d.used || 0));

  return (
    <div className="space-y-3">
      {/* Cluster total */}
      <div className="bg-slate-50 rounded-xl p-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Whole cluster used</div>
            <div className="text-2xl font-extrabold num text-slate-900">{fmtBytes(total)} <span className="text-base text-slate-400 font-semibold">/ {fmtBytes(limit)}</span></div>
          </div>
          <div className="text-right text-sm font-semibold num text-slate-600">{pct.toFixed(pct < 1 ? 2 : 1)}%</div>
        </div>
        <div className="mt-2 h-3 bg-slate-200 rounded-full overflow-hidden flex">
          {dbs.map((d, i) => (
            <div key={d.name} style={{ width: (d.used / limit) * 100 + "%", background: COLORS[i % COLORS.length] }} title={`${FRIENDLY[d.name] || d.name}: ${fmtBytes(d.used)}`} />
          ))}
        </div>
      </div>

      {/* Per-app breakdown */}
      <div className="space-y-2">
        {dbs.map((d, i) => (
          <div key={d.name}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                {FRIENDLY[d.name] || d.name}
                {d.isThisTool && <span className="px-1.5 py-0.5 rounded bg-field-50 text-field-700 text-[10px] font-semibold">this tool</span>}
              </span>
              <span className="num text-slate-500">{fmtBytes(d.used)}</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: (d.used / max) * 100 + "%", background: COLORS[i % COLORS.length] }} />
            </div>
          </div>
        ))}
      </div>

      {!data.listedAll && (
        <p className="text-xs text-slate-400">Showing this tool only — the database user doesn&apos;t have cluster-wide listing rights.</p>
      )}
    </div>
  );
}
