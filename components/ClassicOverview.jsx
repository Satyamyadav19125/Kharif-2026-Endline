"use client";

import Link from "next/link";
import { BarChart, DonutChart, LineChart, HBars } from "@/components/charts";
import { fmtDate } from "@/app/ui";

export default function ClassicOverview({ data, user }) {
  const t = data.totals;
  const villages = [...data.perVillage].sort((a, b) => {
    const pa = a.total ? a.surveyed / a.total : 1;
    const pb = b.total ? b.surveyed / b.total : 1;
    return pa - pb;
  });

  const villageBars = [...data.perVillage]
    .filter((v) => v.surveyed > 0)
    .sort((a, b) => b.surveyed - a.surveyed)
    .map((v) => ({ label: v.label, value: v.surveyed }));
  const returningDonut = [
    { label: "Returning", value: t.returning, color: "#16a34a" },
    { label: "New", value: t.new, color: "#0ea5e9" },
  ];
  const enumBars = data.leaderboard.map((l) => ({ label: l.name, value: l.count }));
  const dailyLine = data.timeline.map((d) => ({ label: fmtDate(d.date), value: d.count }));

  return (
    <div className="space-y-4">
      {/* Welcome + the 5-second headline */}
      <div className="bg-field-gradient border border-field-100 rounded-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="text-3xl shrink-0">🌾</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900">Welcome, {user?.name || "there"}!</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              <b className="text-field-700 num">{t.surveyed}</b> of{" "}
              <b className="num">{t.farms}</b> farms surveyed · <b className="num">{t.pending}</b> still to visit
              across <b className="num">{t.villages}</b> villages.
            </p>
            <div className="mt-2.5 h-3 bg-white/70 rounded-full overflow-hidden max-w-md">
              <div className="h-full rounded-full bg-gradient-to-r from-field-600 to-field-400 transition-all duration-700"
                style={{ width: t.percent + "%" }} />
            </div>
            <p className="text-xs text-slate-500 mt-1 num">{t.percent}% complete</p>
          </div>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <Kpi label="✅ Surveyed" value={t.surveyed} color="bg-field-50 text-field-900" />
        <Kpi label="⏳ Pending" value={t.pending} color="bg-amber-50 text-earth-800" />
        <Kpi label="📊 Complete" value={t.percent + "%"} color="bg-emerald-50 text-emerald-900" />
        <Kpi label="🏡 Villages" value={t.villages} color="bg-sky-50 text-sky-900" />
        <Kpi label="👤 Enumerators" value={data.leaderboard.length} color="bg-violet-50 text-violet-900" />
        <Kpi label="🆕 New farms" value={t.new} color="bg-lime-50 text-lime-900" />
        <Kpi label="🔁 Returning" value={t.returning} color="bg-field-50 text-field-900" />
        <Kpi label="📋 Submissions" value={t.submissions} color="bg-slate-100 text-slate-900" />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-2">
        <QuickLink href="/submissions" icon="📋" label="Submissions" />
        <QuickLink href="/summary" icon="📊" label="Summary" />
        <QuickLink href="/settings" icon="⚙️" label="Settings" />
      </div>

      {/* THE overview graph — surveyed farms per village */}
      <Card title="Surveyed farms per village" subtitle="Where the work stands">
        <BarChart data={villageBars} color="#16a34a" emptyText="No submissions yet" />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="New vs returning farms" subtitle={`${t.returning} returning · ${t.new} new`}>
          <DonutChart data={returningDonut} emptyText="No submissions yet" />
        </Card>
        <Card title="Farms surveyed per enumerator" subtitle={`${data.leaderboard.length} enumerators`}>
          <HBars data={enumBars} color="#7c3aed" />
        </Card>
      </div>

      {dailyLine.length > 0 && (
        <Card title="Daily submissions" subtitle="Momentum over time">
          <LineChart data={dailyLine} color="#16a34a" />
        </Card>
      )}

      {/* Village progress list */}
      <Card title="Village progress" subtitle="Least complete first — tap through from Submissions">
        <ul className="divide-y divide-slate-100">
          {villages.map((v) => {
            const pct = v.total ? Math.round((v.surveyed / v.total) * 100) : 0;
            return (
              <li key={v.code} className="py-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{v.label}</span>
                  <span className="num text-slate-600">
                    <b className="text-field-700">{v.surveyed}</b>/{v.total}
                    {v.pending > 0 && <span className="ml-2 text-earth-700">· {v.pending} left</span>}
                  </span>
                </div>
                <div className="mt-1.5 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-field-600 to-field-400"
                    style={{ width: pct + "%" }} />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* Data checks */}
      <Card title="Data checks" subtitle="Catch issues early">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Check value={data.quality.duplicates.length} label="Duplicate farms" />
          <Check value={data.quality.unlistedIds.length} label="Unlisted farm IDs" />
          <Check value={data.quality.missingGps} label="Missing GPS" />
        </div>
      </Card>

      <p className="text-center text-xs text-slate-500 num">
        Last synced {new Date(data.syncedAt).toLocaleString()} · {data.formName || "KoBo form"}
      </p>
    </div>
  );
}

function Kpi({ label, value, color }) {
  return (
    <div className={`rounded-xl p-3 shadow-sm ${color}`}>
      <div className="text-2xl font-extrabold leading-tight num">{value}</div>
      <div className="text-[11px] opacity-80 mt-0.5">{label}</div>
    </div>
  );
}
function QuickLink({ href, icon, label }) {
  return (
    <Link href={href} className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition flex items-center gap-2 text-sm">
      <span className="text-xl">{icon}</span><span className="font-medium">{label}</span>
    </Link>
  );
}
function Card({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
      <div className="mb-3">
        <h3 className="font-semibold text-base text-slate-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
function Check({ value, label }) {
  const warn = value > 0;
  return (
    <div className={`rounded-lg p-3 text-center ${warn ? "bg-amber-50 text-earth-800" : "bg-field-50 text-field-900"}`}>
      <div className="text-2xl font-extrabold num">{value}</div>
      <div className="text-[11px] mt-0.5">{label}</div>
    </div>
  );
}
