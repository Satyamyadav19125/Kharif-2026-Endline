"use client";

import { fmtDate } from "@/app/ui";
import { buildPrefillUrl } from "@/lib/prefill";

// Drill-in list of a village's farms. Done farms show who/when + a map pin;
// pending farms get a "Survey →" link that opens the KoBo form pre-filled with
// the village + farm ID (the surveyor only fills the answers).
export default function VillageSheet({ v, formUrl, onClose }) {
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
          {v.farms.map((f) => {
            const prefill = formUrl ? buildPrefillUrl(formUrl, { village: v.code, id_farm: f.id }) : null;
            return (
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
                  ) : prefill ? (
                    <a href={prefill} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-field-600 text-white font-semibold hover:opacity-90">Survey →</a>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-amber-50 text-earth-800 font-semibold">pending</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
