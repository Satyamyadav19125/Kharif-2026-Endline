"use client";

import { useState } from "react";
import { Ring, fmtDate, timeAgo } from "@/app/ui";
import { HBars, LineChart, DonutChart } from "@/components/charts";

export default function ModernOverview({ data, user }) {
  const t = data.totals;
  const a = data.analytics || {};
  const [village, setVillage] = useState(null);
  const villages = [...data.perVillage].sort((x, y) => (x.surveyed / (x.total || 1)) - (y.surveyed / (y.total || 1)));

  // --- Computed insights (the "thinking" layer) ---
  const withWork = data.perVillage.filter((v) => v.total > 0);
  const mostComplete = [...withWork].sort((x, y) => (y.surveyed / y.total) - (x.surveyed / x.total))[0];
  const leastComplete = [...withWork].filter((v) => v.surveyed > 0).sort((x, y) => (x.surveyed / x.total) - (y.surveyed / y.total))[0];
  const busiest = [...data.timeline].sort((x, y) => y.count - x.count)[0];
  const topEnum = data.leaderboard[0];
  const activeDays = data.timeline.length;
  const perDay = activeDays ? (t.surveyed / activeDays) : 0;
  const daysLeft = perDay > 0 ? Math.ceil(t.pending / perDay) : null;
  const fmt1 = (n) => (n == null ? "—" : Number(n).toFixed(1));

  function download(fmt) {
    const el = document.createElement("a");
    el.href = `/api/download?format=${fmt}`;
    document.body.appendChild(el); el.click(); el.remove();
  }
  const canDownload = user?.role !== "guest";

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="bg-white rounded-2xl shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6">
        <Ring percent={t.percent} size={150} caption="surveyed" />
        <div className="flex-1 min-w-0 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            <span className="text-field-600 num">{t.surveyed}</span> of <span className="num">{t.farms}</span> farms surveyed
          </h1>
          <p className="text-slate-500 mt-1.5">
            {t.pending > 0
              ? <><b className="num">{t.pending}</b> farms still to visit across <b className="num">{t.villages}</b> villages{daysLeft ? <> · at the current pace, about <b className="num">{daysLeft}</b> more field-days</> : null}.</>
              : <>All farms surveyed across {t.villages} villages. 🎉</>}
          </p>
          {canDownload && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
              <button onClick={() => download("xlsx")} className="px-4 py-2 rounded-xl bg-gradient-to-r from-field-600 to-field-700 text-white font-semibold shadow-sm hover:opacity-90">⤓ Excel</button>
              <button onClick={() => download("csv")} className="px-4 py-2 rounded-xl bg-white border border-slate-200 font-semibold hover:bg-slate-50">⤓ CSV</button>
            </div>
          )}
        </div>
      </section>

      {/* Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile k="🏡 Villages" v={t.villages} />
        <Tile k="✅ Surveyed" v={<>{t.surveyed}<small className="text-slate-400 text-base"> /{t.farms}</small></>} />
        <Tile k="⏳ Pending" v={t.pending} accent="text-earth-700" />
        <Tile k="🔁 Returning · 🆕 New" v={<>{t.returning}<small className="text-slate-400 text-base"> · {t.new}</small></>} />
      </div>

      {/* Insights */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Insights</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Insight icon="🚀" title="Top enumerator" main={topEnum ? topEnum.name : "—"} sub={topEnum ? `${topEnum.count} farms surveyed` : ""} />
          <Insight icon="🏆" title="Most complete village" main={mostComplete ? mostComplete.label : "—"} sub={mostComplete ? `${Math.round((mostComplete.surveyed / mostComplete.total) * 100)}% · ${mostComplete.surveyed}/${mostComplete.total}` : ""} />
          <Insight icon="🎯" title="Needs attention" main={leastComplete ? leastComplete.label : "—"} sub={leastComplete ? `${leastComplete.pending} farms left` : "all caught up"} />
          <Insight icon="📅" title="Busiest day" main={busiest ? fmtDate(busiest.date) : "—"} sub={busiest ? `${busiest.count} submissions` : ""} />
          <Insight icon="💧" title="Avg irrigation" main={`${fmt1(a.hoursPerAcre)} h/acre`} sub={`avg ${fmt1(a.acres?.avg)} acres/farm`} />
          <Insight icon="🌱" title="Top variety" main={a.varieties?.[0]?.label || "—"} sub={a.varieties?.[0] ? `${a.varieties[0].count} farms` : ""} />
        </div>
      </section>

      {/* Villages */}
      <section>
        <div className="flex items-baseline gap-2 mb-2">
          <h2 className="text-lg font-bold text-slate-900">Villages</h2>
          <span className="text-xs text-slate-500">Tap a village to see its farms</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {villages.map((v) => {
            const pct = v.total ? Math.round((v.surveyed / v.total) * 100) : 0;
            return (
              <button key={v.code} onClick={() => setVillage(v)} className="text-left bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{v.label}</span>
                  <span className="font-extrabold num"><span className="text-field-600">{v.surveyed}</span>/{v.total}</span>
                </div>
                <div className="mt-2.5 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-field-600 to-field-400" style={{ width: pct + "%" }} />
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                  <span className="num">{pct}% done</span>
                  {v.pending > 0
                    ? <span className="px-2 py-0.5 rounded-full bg-amber-50 text-earth-800 font-semibold num">{v.pending} left</span>
                    : v.total > 0 ? <span className="px-2 py-0.5 rounded-full bg-field-50 text-field-700 font-semibold">complete</span> : "—"}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* People + momentum + composition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel title="Enumerators"><HBars data={data.leaderboard.map((l) => ({ label: l.name, value: l.count }))} color="#7c3aed" /></Panel>
        <Panel title="Daily submissions"><LineChart data={data.timeline.map((d) => ({ label: fmtDate(d.date), value: d.count }))} /></Panel>
        <Panel title="New vs returning"><DonutChart data={[{ label: "Returning", value: t.returning, color: "#16a34a" }, { label: "New", value: t.new, color: "#0ea5e9" }]} /></Panel>
        <Panel title="Sowing method"><DonutChart data={(a.sowing || []).map((s, i) => ({ label: s.label, value: s.count, color: ["#16a34a", "#f59e0b", "#0ea5e9"][i % 3] }))} /></Panel>
      </div>

      {/* Practices */}
      <Panel title="Farm practices">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <Mini label="Total acres" value={a.acres?.total ?? "—"} />
          <Mini label="Avg hrs/acre" value={fmt1(a.hoursPerAcre)} />
          <Mini label="Canal water" value={a.canal ?? 0} />
          <Mini label="Pipe fixed" value={a.pipeFix ?? 0} />
          <Mini label="Had fungi" value={a.fungi ?? 0} />
          <Mini label="Shared out" value={a.sharingOut ?? 0} />
        </div>
      </Panel>

      {/* Checks */}
      {(() => {
        const ck = data.checks || { duplicates: true, unlisted: true, gps: true };
        const cards = [
          ck.duplicates && { v: data.quality.duplicates.length, l: "Duplicate farms" },
          ck.unlisted && { v: data.quality.unlistedIds.length, l: "Unlisted farm IDs" },
          ck.gps && { v: data.quality.missingGps, l: "Missing GPS" },
        ].filter(Boolean);
        if (!cards.length) return null;
        return (
          <div className="grid grid-cols-3 gap-3">
            {cards.map((c, i) => <Check key={i} value={c.v} label={c.l} />)}
          </div>
        );
      })()}

      <p className="text-center text-xs text-slate-500">Last synced {timeAgo(data.syncedAt)} · {data.formName || "KoBo form"} · full analytics in the Excel Summary sheet</p>

      {village && <VillageSheet v={village} onClose={() => setVillage(null)} />}
    </div>
  );
}

function Tile({ k, v, accent }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <div className="text-xs text-slate-500 font-medium">{k}</div>
      <div className={`text-2xl font-extrabold mt-1 num ${accent || "text-slate-900"}`}>{v}</div>
    </div>
  );
}
function Insight({ icon, title, main, sub }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex items-start gap-3">
      <div className="text-2xl shrink-0">{icon}</div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">{title}</div>
        <div className="font-bold text-slate-900 truncate">{main}</div>
        <div className="text-xs text-slate-500">{sub}</div>
      </div>
    </div>
  );
}
function Panel({ title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
      <h3 className="font-semibold mb-3 text-slate-900">{title}</h3>
      {children}
    </div>
  );
}
function Mini({ label, value }) {
  return (
    <div className="rounded-lg p-3 text-center bg-slate-50 text-slate-800">
      <div className="text-lg font-extrabold num">{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
function Check({ value, label }) {
  const warn = value > 0;
  return (
    <div className={`rounded-xl p-3 text-center ${warn ? "bg-amber-50 text-earth-800" : "bg-field-50 text-field-900"}`}>
      <div className="text-2xl font-extrabold num">{value}</div>
      <div className="text-[11px] mt-0.5">{label}</div>
    </div>
  );
}

function VillageSheet({ v, onClose }) {
  return (
    <div className="fixed inset-0 z-[1200] bg-black/50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-xl sm:rounded-2xl rounded-t-2xl max-h-[88vh] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-lg font-bold text-slate-900">{v.label}</h3>
          <span className="px-2 py-0.5 rounded-full bg-field-50 text-field-700 text-xs font-semibold num">{v.surveyed} done</span>
          {v.pending > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-earth-800 text-xs font-semibold num">{v.pending} left</span>}
          <span className="flex-1" />
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">✕</button>
        </div>
        <div className="overflow-auto p-2 scrollbar-thin">
          {v.farms.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-2 py-2.5 border-b border-slate-50">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: f.done ? "#16a34a" : "#cbd5e1" }} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800 truncate">{f.farmer || "Unnamed farmer"}</div>
                <div className="text-xs text-slate-400 num">{f.id}</div>
              </div>
              <div className="text-right text-xs text-slate-500">
                {f.done ? (
                  <>
                    <div>
                      <span className="px-1.5 py-0.5 rounded bg-field-50 text-field-700 font-semibold">done</span>
                      {f.isReturning === false && <span className="ml-1 px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 font-semibold">new</span>}
                    </div>
                    <div className="mt-0.5">{f.enumerator || "—"} · {fmtDate(f.date)}</div>
                    {f.loc && <a href={`https://maps.google.com/?q=${f.loc.lat},${f.loc.lng}`} target="_blank" rel="noreferrer" className="text-sky-600 font-semibold">📍 map</a>}
                  </>
                ) : <span className="px-1.5 py-0.5 rounded bg-amber-50 text-earth-800 font-semibold">pending</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
