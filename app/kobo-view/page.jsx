"use client";

import { useEffect, useMemo, useState } from "react";
import AppFrame from "@/components/AppFrame";

export default function KoboViewPage() {
  return <AppFrame>{(user) => <KoboInner user={user} />}</AppFrame>;
}

const pick = (s, n) => s["orientation/" + n] ?? s[n];

function KoboInner({ user }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);

  useEffect(() => {
    fetch("/api/kobo-raw", { cache: "no-store" })
      .then(async (r) => { if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Failed"); return r.json(); })
      .then(setData)
      .catch((e) => setErr(String(e.message || e)));
  }, []);

  const rows = data?.submissions || [];
  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.trim().toLowerCase();
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(s));
  }, [rows, q]);

  if (user?.role !== "admin") return <div className="bg-white rounded-xl shadow-sm p-6 text-sm text-slate-500">The Kobo view is available to administrators.</div>;
  if (err) return <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">{err}</div>;
  if (!data) return <div className="min-h-[40vh] grid place-items-center"><div className="spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-xl font-bold text-slate-900 flex-1">Kobo view <span className="text-slate-400 text-base num">({rows.length})</span></h1>
        <a href={data.dataTableUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-lg bg-field-600 text-white text-sm font-semibold hover:opacity-90">↗ Open in KoBo</a>
      </div>
      <p className="text-sm text-slate-500">The raw submissions exactly as KoBoToolbox stores them — every field, including the back-end ones. Tap a row to expand.</p>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search anything…" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" />

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-left text-xs uppercase tracking-wide">
                <th className="px-3 py-2.5 font-semibold">UID</th>
                <th className="px-3 py-2.5 font-semibold">Submitted</th>
                <th className="px-3 py-2.5 font-semibold">Village</th>
                <th className="px-3 py-2.5 font-semibold">Farm ID</th>
                <th className="px-3 py-2.5 font-semibold">Fields</th>
                <th className="px-3 py-2.5 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => {
                const isOpen = open === s._id;
                const entries = Object.entries(s).filter(([k]) => k !== "_attachments");
                return (
                  <>
                    <tr key={s._id} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer" onClick={() => setOpen(isOpen ? null : s._id)}>
                      <td className="px-3 py-2.5 num text-slate-500">{s._id}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{String(s._submission_time || "").replace("T", " ").slice(0, 16)}</td>
                      <td className="px-3 py-2.5">{pick(s, "village")}</td>
                      <td className="px-3 py-2.5 num text-slate-500">{pick(s, "id_farm")}</td>
                      <td className="px-3 py-2.5 num text-slate-400">{Object.keys(s).length}</td>
                      <td className="px-3 py-2.5">
                        <a href={`/api/kobo-open?id=${s._id}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-sky-600 font-semibold">↗ KoBo</a>
                        <span className="text-slate-400 ml-2">{isOpen ? "▴" : "▾"}</span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1">
                            {entries.map(([k, v]) => (
                              <div key={k} className="flex justify-between gap-3 py-1 border-b border-slate-100 text-xs">
                                <span className="text-slate-500 font-mono">{k}</span>
                                <span className="font-medium text-right break-all">{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
