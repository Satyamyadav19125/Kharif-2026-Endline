"use client";

import { useEffect, useState } from "react";
import AppFrame from "@/components/AppFrame";
import { BarChart, DonutChart, LineChart, HBars } from "@/components/charts";
import { fmtDate } from "@/app/ui";

export default function SummaryPage() {
  return <AppFrame>{() => <SummaryInner />}</AppFrame>;
}

function SummaryInner() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/summary", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
        return r.json();
      })
      .then(setData)
      .catch((e) => setErr(String(e.message || e)));
  }, []);

  if (err) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">{err}</div>;
  if (!data) return <div className="min-h-[40vh] grid place-items-center"><div className="spin" /></div>;

  const t = data.totals;
  const a = data.analytics || {};
  const villageBars = [...data.perVillage].filter((v) => v.surveyed > 0).sort((x, y) => y.surveyed - x.surveyed).map((v) => ({ label: v.label, value: v.surveyed }));

  const fmt1 = (n) => (n == null ? "—" : Number(n).toFixed(1));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Summary analytics</h1>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <Kpi label="Surveyed" value={`${t.surveyed}/${t.farms}`} color="bg-field-50 text-field-900" />
        <Kpi label="Complete" value={t.percent + "%"} color="bg-emerald-50 text-emerald-900" />
        <Kpi label="Total acres" value={a.acres?.total ?? "—"} color="bg-lime-50 text-lime-900" />
        <Kpi label="Avg hrs/acre" value={fmt1(a.hoursPerAcre)} color="bg-sky-50 text-sky-900" />
      </div>

      {/* Charts */}
      <Card title="Surveyed farms per village">
        <BarChart data={villageBars} color="#16a34a" />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="New vs returning">
          <DonutChart data={[
            { label: "Returning", value: t.returning, color: "#16a34a" },
            { label: "New", value: t.new, color: "#0ea5e9" },
          ]} />
        </Card>
        <Card title="Sowing method">
          <DonutChart data={(a.sowing || []).map((s, i) => ({ ...s, value: s.count, color: ["#16a34a", "#f59e0b", "#0ea5e9", "#7c3aed"][i % 4] }))} />
        </Card>
        <Card title="Rice varieties"><HBars data={(a.varieties || []).map((x) => ({ label: x.label, value: x.count }))} color="#16a34a" /></Card>
        <Card title="Soil types"><HBars data={(a.soil || []).map((x) => ({ label: x.label, value: x.count }))} color="#a16207" /></Card>
        <Card title="Farms per enumerator"><HBars data={data.leaderboard.map((l) => ({ label: l.name, value: l.count }))} color="#7c3aed" /></Card>
        <Card title="Daily submissions"><LineChart data={data.timeline.map((d) => ({ label: fmtDate(d.date), value: d.count }))} /></Card>
      </div>

      {/* Practice stats */}
      <Card title="Farm practices" subtitle="Across surveyed farms">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          <Stat label="Avg acres / farm" value={fmt1(a.acres?.avg)} />
          <Stat label="Avg Urea bags/acre" value={fmt1(a.urea)} />
          <Stat label="Avg DAP bags/acre" value={fmt1(a.dap)} />
          <Stat label="Used canal water" value={a.canal ?? 0} />
          <Stat label="PVC pipe fixed" value={a.pipeFix ?? 0} />
          <Stat label="Looked into pipe" value={a.pipeLooking ?? 0} />
          <Stat label="Pipe → irrigation decision" value={a.pipeDecision ?? 0} />
          <Stat label="Had fungi" value={a.fungi ?? 0} />
          <Stat label="Shared water OUT" value={a.sharingOut ?? 0} />
          <Stat label="Received water IN" value={a.sharingIn ?? 0} />
        </div>
      </Card>

      {/* Per-village table */}
      <Card title="Per-village progress">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3 font-semibold">Village</th>
                <th className="py-2 px-3 font-semibold text-right">Surveyed</th>
                <th className="py-2 px-3 font-semibold text-right">Total</th>
                <th className="py-2 px-3 font-semibold text-right">Pending</th>
                <th className="py-2 pl-3 font-semibold text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {[...data.perVillage].sort((x, y) => (x.surveyed / (x.total || 1)) - (y.surveyed / (y.total || 1))).map((v) => (
                <tr key={v.code} className="border-t border-slate-100">
                  <td className="py-2 pr-3 font-medium text-slate-800">{v.label}</td>
                  <td className="py-2 px-3 text-right num text-field-700 font-semibold">{v.surveyed}</td>
                  <td className="py-2 px-3 text-right num">{v.total}</td>
                  <td className="py-2 px-3 text-right num text-earth-700">{v.pending}</td>
                  <td className="py-2 pl-3 text-right num">{v.total ? Math.round((v.surveyed / v.total) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Data quality */}
      <Card title="Data checks">
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <Stat label="Duplicate farms" value={data.quality.duplicates.length} warn={data.quality.duplicates.length > 0} />
          <Stat label="Unlisted farm IDs" value={data.quality.unlistedIds.length} warn={data.quality.unlistedIds.length > 0} />
          <Stat label="Missing GPS" value={data.quality.missingGps} warn={data.quality.missingGps > 0} />
        </div>
      </Card>
    </div>
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
function Kpi({ label, value, color }) {
  return (
    <div className={`rounded-xl p-3 shadow-sm ${color}`}>
      <div className="text-2xl font-extrabold num">{value}</div>
      <div className="text-[11px] opacity-80 mt-0.5">{label}</div>
    </div>
  );
}
function Stat({ label, value, warn }) {
  return (
    <div className={`rounded-lg p-3 text-center ${warn ? "bg-amber-50 text-earth-800" : "bg-slate-50 text-slate-800"}`}>
      <div className="text-xl font-extrabold num">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
