"use client";

import { useEffect, useMemo, useState } from "react";
import AppFrame from "@/components/AppFrame";

export default function SubmissionsPage() {
  return <AppFrame>{(user) => <SubmissionsInner user={user} />}</AppFrame>;
}

function SubmissionsInner({ user }) {
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const [village, setVillage] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);

  useEffect(() => {
    fetch("/api/submissions", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed");
        return r.json();
      })
      .then((d) => setRows(d.rows || []))
      .catch((e) => setErr(String(e.message || e)));
  }, []);

  const villages = useMemo(
    () => [...new Set((rows || []).map((r) => r.village).filter(Boolean))].sort(),
    [rows]
  );
  const filtered = useMemo(() => {
    let out = rows || [];
    if (village) out = out.filter((r) => r.village === village);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      out = out.filter((r) =>
        [r.farm, r.farmer, r.enumerator, r.village].some((x) => String(x).toLowerCase().includes(s))
      );
    }
    return out;
  }, [rows, village, q]);

  function download(fmt) {
    const a = document.createElement("a");
    a.href = `/api/download?format=${fmt}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  if (err) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">{err}</div>;
  if (!rows) return <div className="min-h-[40vh] grid place-items-center"><div className="spin" /></div>;

  const canDownload = user?.role !== "guest";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold text-slate-900 flex-1">Submissions <span className="text-slate-400 text-base num">({filtered.length})</span></h1>
        {canDownload && (
          <>
            <button onClick={() => download("xlsx")} className="px-3 py-2 rounded-lg bg-field-600 text-white text-sm font-semibold hover:opacity-90">⤓ Excel</button>
            <button onClick={() => download("csv")} className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-semibold hover:bg-slate-50">⤓ CSV</button>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={village} onChange={(e) => setVillage(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
          <option value="">All villages</option>
          {villages.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search farm, farmer, enumerator…"
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 min-w-[180px]" />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-left text-xs uppercase tracking-wide">
                <th className="px-3 py-2.5 font-semibold">Date</th>
                <th className="px-3 py-2.5 font-semibold">Village</th>
                <th className="px-3 py-2.5 font-semibold">Farmer</th>
                <th className="px-3 py-2.5 font-semibold">Farm ID</th>
                <th className="px-3 py-2.5 font-semibold">Enumerator</th>
                <th className="px-3 py-2.5 font-semibold">Acres</th>
                <th className="px-3 py-2.5 font-semibold">Sowing</th>
                <th className="px-3 py-2.5 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <FarmRow key={r.uid} r={r} open={open === r.uid} onToggle={() => setOpen(open === r.uid ? null : r.uid)} />
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-slate-400">No submissions match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-slate-500">Showing data as filled by surveyors. Download for the full spreadsheet (UID + every surveyor field + a Summary sheet).</p>
    </div>
  );
}

function FarmRow({ r, open, onToggle }) {
  return (
    <>
      <tr className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={onToggle}>
        <td className="px-3 py-2.5 num whitespace-nowrap">{r.date}</td>
        <td className="px-3 py-2.5">{r.village}</td>
        <td className="px-3 py-2.5 font-medium text-slate-800">{r.farmer}</td>
        <td className="px-3 py-2.5 num text-slate-500 whitespace-nowrap">{r.farm}</td>
        <td className="px-3 py-2.5">{r.enumerator}</td>
        <td className="px-3 py-2.5 num">{r.acres}</td>
        <td className="px-3 py-2.5">
          {r.sowing && <span className="px-2 py-0.5 rounded-full bg-field-50 text-field-700 text-xs font-semibold">{r.sowing}</span>}
          {r.returning
            ? <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">returning</span>
            : <span className="ml-1 px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold">new</span>}
        </td>
        <td className="px-3 py-2.5 text-slate-400">{open ? "▴" : "▾"}</td>
      </tr>
      {open && (
        <tr className="bg-slate-50/60">
          <td colSpan={8} className="px-4 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5">
              <div className="flex justify-between gap-3 py-1 border-b border-slate-100">
                <span className="text-slate-500">UID</span><span className="num font-medium">{r.uid}</span>
              </div>
              {Object.entries(r.details).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-1 border-b border-slate-100">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-medium text-right break-words">{String(v)}</span>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
