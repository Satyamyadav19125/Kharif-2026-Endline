"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart, DonutChart, LineChart, HBars } from "@/components/charts";
import { fmtDate } from "@/app/ui";
import VillageSheet from "@/components/VillageSheet";

export default function ClassicOverview({ data, user, formUrl }) {
  const t = data.totals;
  const a = data.analytics || {};
  const fmt1 = (n) => (n == null ? "—" : Number(n).toFixed(1));
  const [village, setVillage] = useState(null);

  const villagesSorted = [...data.perVillage].sort((x, y) => (x.surveyed / (x.total || 1)) - (y.surveyed / (y.total || 1)));
  const villageBars = [...data.perVillage].filter((v) => v.surveyed > 0).sort((x, y) => y.surveyed - x.surveyed).map((v) => ({ label: v.label, value: v.surveyed }));
  const returningDonut = [
    { label: "Returning", value: t.returning, color: "#16a34a" },
    { label: "New", value: t.new, color: "#0ea5e9" },
  ];
  const sowingDonut = (a.sowing || []).map((s, i) => ({ label: s.label, value: s.count, color: ["#16a34a", "#f59e0b", "#0ea5e9", "#7c3aed"][i % 4] }));
  const enumBars = data.leaderboard.map((l) => ({ label: l.name, value: l.count }));
  const dailyLine = data.timeline.map((d) => ({ label: fmtDate(d.date), value: d.count }));

  function download(fmt) {
    const el = document.createElement("a");
    el.href = `/api/download?format=${fmt}`;
    document.body.appendChild(el); el.click(); el.remove();
  }

  const canDownload = user?.role !== "guest";

  return (
    <div className="space-y-4">
      {/* Welcome + the 5-second headline */}
      <div className="bg-field-gradient border border-field-100 rounded-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="text-3xl shrink-0">🌾</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900">Welcome, {user?.name || "there"}!</h2>
            <p className="text-sm text-slate-600 mt-0.5">
              <b className="text-field-700 num">{t.surveyed}</b> of <b className="num">{t.farms}</b> farms surveyed ·{" "}
              <b className="num">{t.pending}</b> still to visit across <b className="num">{t.villages}</b> villages.
            </p>
            <div className="mt-2.5 h-3 bg-white/70 rounded-full overflow-hidden max-w-md">
              <div className="h-full rounded-full bg-gradient-to-r from-field-600 to-field-400 transition-all duration-700" style={{ width: t.percent + "%" }} />
            </div>
            <p className="text-xs text-slate-500 mt-1 num">{t.percent}% complete</p>
          </div>
          {canDownload && (
            <div className="hidden sm:flex flex-col gap-1.5">
              <button onClick={() => download("xlsx")} className="px-3 py-1.5 rounded-lg bg-field-600 text-white text-xs font-semibold hover:opacity-90">⤓ Excel</button>
              <button onClick={() => download("csv")} className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold hover:bg-slate-50">⤓ CSV</button>
            </div>
          )}
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
        <QuickLink href="/settings" icon="⚙️" label="Settings" />
        <QuickLink href="/profile" icon="👤" label="My profile" />
      </div>

      {/* THE overview graph */}
      <Card title="Surveyed farms per village" subtitle="Where the work stands">
        <BarChart data={villageBars} color="#16a34a" emptyText="No submissions yet" />
      </Card>

      {/* Analytics row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card title="New vs returning farms" subtitle={`${t.returning} returning · ${t.new} new`}>
          <DonutChart data={returningDonut} emptyText="No submissions yet" />
        </Card>
        <Card title="Sowing method" subtitle="DSR vs Paniri (TPR)">
          <DonutChart data={sowingDonut} emptyText="No submissions yet" />
        </Card>
        <Card title="Farms surveyed per enumerator" subtitle={`${data.leaderboard.length} enumerators`}>
          <HBars data={enumBars} color="#7c3aed" />
        </Card>
        <Card title="Rice varieties" subtitle="What farmers planted">
          <HBars data={(a.varieties || []).map((x) => ({ label: x.label, value: x.count }))} color="#16a34a" />
        </Card>
        <Card title="Soil types">
          <HBars data={(a.soil || []).map((x) => ({ label: x.label, value: x.count }))} color="#a16207" />
        </Card>
        {dailyLine.length > 0 && (
          <Card title="Daily submissions" subtitle="Momentum over time">
            <LineChart data={dailyLine} color="#16a34a" />
          </Card>
        )}
      </div>

      {/* Farm practices */}
      <Card title="Farm practices" subtitle="Across surveyed farms">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          <Mini label="Total acres" value={a.acres?.total ?? "—"} />
          <Mini label="Avg acres / farm" value={fmt1(a.acres?.avg)} />
          <Mini label="Avg hours / acre" value={fmt1(a.hoursPerAcre)} />
          <Mini label="Avg Urea bags/acre" value={fmt1(a.urea)} />
          <Mini label="Avg DAP bags/acre" value={fmt1(a.dap)} />
          <Mini label="Used canal water" value={a.canal ?? 0} />
          <Mini label="PVC pipe fixed" value={a.pipeFix ?? 0} />
          <Mini label="Looked into pipe" value={a.pipeLooking ?? 0} />
          <Mini label="Pipe → irrigation" value={a.pipeDecision ?? 0} />
          <Mini label="Had fungi" value={a.fungi ?? 0} />
          <Mini label="Shared water OUT" value={a.sharingOut ?? 0} />
          <Mini label="Received water IN" value={a.sharingIn ?? 0} />
        </div>
      </Card>

      {/* Per-village table */}
      <Card title="Village progress" subtitle="Least complete first — tap a village to survey its pending farms">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3 font-semibold">Village</th>
                <th className="py-2 px-3 font-semibold text-right">Surveyed</th>
                <th className="py-2 px-3 font-semibold text-right">Total</th>
                <th className="py-2 px-3 font-semibold text-right">Pending</th>
                <th className="py-2 pl-3 font-semibold w-28">Progress</th>
              </tr>
            </thead>
            <tbody>
              {villagesSorted.map((v) => {
                const pct = v.total ? Math.round((v.surveyed / v.total) * 100) : 0;
                return (
                  <tr key={v.code} onClick={() => setVillage(v)} className="border-t border-slate-100 cursor-pointer hover:bg-slate-50">
                    <td className="py-2 pr-3 font-medium text-slate-800">{v.label}</td>
                    <td className="py-2 px-3 text-right num text-field-700 font-semibold">{v.surveyed}</td>
                    <td className="py-2 px-3 text-right num">{v.total}</td>
                    <td className="py-2 px-3 text-right num text-earth-700">{v.pending}</td>
                    <td className="py-2 pl-3">
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-field-600 to-field-400" style={{ width: pct + "%" }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {village && <VillageSheet v={village} formUrl={formUrl} onClose={() => setVillage(null)} />}

      {/* Data checks */}
      {(() => {
        const ck = data.checks || { duplicates: true, unlisted: true, gps: true };
        const cards = [
          ck.duplicates && { v: data.quality.duplicates.length, l: "Duplicate farms" },
          ck.unlisted && { v: data.quality.unlistedIds.length, l: "Unlisted farm IDs" },
          ck.gps && { v: data.quality.missingGps, l: "Missing GPS" },
        ].filter(Boolean);
        if (!cards.length) return null;
        return (
          <Card title="Data checks" subtitle="Catch issues early">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {cards.map((c, i) => <Check key={i} value={c.v} label={c.l} />)}
            </div>
          </Card>
        );
      })()}

      <p className="text-center text-xs text-slate-500 num">
        Last synced {new Date(data.syncedAt).toLocaleString()} · {data.formName || "KoBo form"} ·
        <span className="ml-1">full analytics are in the downloaded Excel&apos;s Summary sheet</span>
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
function Mini({ label, value }) {
  return (
    <div className="rounded-lg p-3 text-center bg-slate-50 text-slate-800">
      <div className="text-xl font-extrabold num">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
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
