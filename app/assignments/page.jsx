"use client";

import { useEffect, useState } from "react";
import AppFrame from "@/components/AppFrame";
import { buildPrefillUrl } from "@/lib/prefill";

export default function AssignmentsPage() {
  return <AppFrame>{(user, formUrl) => <AssignmentsInner user={user} formUrl={formUrl} />}</AppFrame>;
}

function AssignmentsInner({ user, formUrl }) {
  const [list, setList] = useState(null);
  const [perVillage, setPerVillage] = useState([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [openForms, setOpenForms] = useState(null);

  useEffect(() => {
    fetch("/api/assignments", { cache: "no-store" }).then((r) => r.json()).then((d) => setList(d.assignments || [])).catch(() => setList([]));
    fetch("/api/summary", { cache: "no-store" }).then((r) => r.json()).then((d) => { if (d?.perVillage) setPerVillage(d.perVillage); }).catch(() => {});
  }, []);

  if (user?.role !== "admin") {
    return <div className="bg-white rounded-xl shadow-sm p-6 text-sm text-slate-500">Assignments are managed by administrators.</div>;
  }
  if (!list) return <div className="min-h-[40vh] grid place-items-center"><div className="spin" /></div>;

  const villages = perVillage.map((v) => ({ code: v.code, label: v.label }));
  const byCode = Object.fromEntries(perVillage.map((v) => [v.code, v]));

  const up = (i, k, v) => setList(list.map((u, j) => (j === i ? { ...u, [k]: v } : u)));
  const toggleVillage = (i, code) => {
    const cur = list[i].villages || [];
    up(i, "villages", cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]);
  };

  // Every pending farm across a surveyor's assigned villages, as prefill links.
  const pendingFor = (u) => {
    const out = [];
    for (const code of u.villages || []) {
      const v = byCode[code];
      if (!v) continue;
      for (const f of v.farms || []) {
        if (!f.done) out.push({ village: v.label, vcode: code, id: f.id, farmer: f.farmer });
      }
    }
    return out;
  };

  async function save() {
    setSaving(true); setMsg("");
    const clean = list.filter((u) => (u.person || "").trim());
    const r = await fetch("/api/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignments: clean }) });
    setSaving(false);
    if (r.ok) { setMsg("Saved ✓"); setTimeout(() => setMsg(""), 3000); } else setMsg("Could not save.");
  }

  const inp = "px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-xl font-bold text-slate-900 flex-1">Assignments <span className="text-slate-400 text-base num">({list.length})</span></h1>
        {msg && <span className="text-sm font-medium text-field-700">{msg}</span>}
        <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg bg-field-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">{saving ? "Saving…" : "Save all"}</button>
      </div>
      <p className="text-sm text-slate-500">Give each surveyor a login password and the villages they cover. They log in with that password and see the dashboard focused on their villages. Open <b>Ready forms</b> to hand them pre-filled KoBo links for every farm still to survey.</p>

      <div className="space-y-3">
        {list.map((u, i) => {
          const pending = pendingFor(u);
          const formsOpen = openForms === i;
          return (
            <div key={i} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
              <div className="flex gap-2 flex-wrap">
                <input className={inp + " flex-1 min-w-[140px]"} placeholder="Surveyor name" value={u.person || ""} onChange={(e) => up(i, "person", e.target.value)} />
                <input className={inp + " flex-1 min-w-[120px]"} placeholder="Login password" value={u.password || ""} onChange={(e) => up(i, "password", e.target.value)} />
                <input className={inp + " flex-1 min-w-[120px]"} placeholder="Phone (optional)" value={u.phone || ""} onChange={(e) => up(i, "phone", e.target.value)} />
                <button onClick={() => setList(list.filter((_, j) => j !== i))} className="px-3 rounded-lg text-red-600 hover:bg-red-50">✕</button>
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-1.5">Assigned villages ({(u.villages || []).length})</div>
                <div className="flex flex-wrap gap-1.5">
                  {villages.map((v) => {
                    const on = (u.villages || []).includes(v.code);
                    return (
                      <button key={v.code} onClick={() => toggleVillage(i, v.code)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${on ? "bg-field-600 text-white border-field-600" : "bg-white text-slate-600 border-slate-300 hover:border-field-400"}`}>
                        {on ? "✓ " : ""}{v.label}
                      </button>
                    );
                  })}
                  {villages.length === 0 && <span className="text-xs text-slate-400">Villages load after the first data sync.</span>}
                </div>
              </div>

              {(u.villages || []).length > 0 && (
                <div>
                  <button onClick={() => setOpenForms(formsOpen ? null : i)} className="text-sm text-field-700 font-semibold">
                    {formsOpen ? "▴ Hide ready forms" : `▾ Ready forms (${pending.length} pending)`}
                  </button>
                  {formsOpen && (
                    <div className="mt-2 border border-slate-100 rounded-lg divide-y divide-slate-100 max-h-72 overflow-auto scrollbar-thin">
                      {pending.length === 0 && <div className="p-3 text-xs text-slate-400">All farms in these villages are surveyed. 🎉</div>}
                      {pending.map((f) => {
                        const url = formUrl ? buildPrefillUrl(formUrl, { village: f.vcode, id_farm: f.id }) : null;
                        return (
                          <div key={f.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-800 truncate">{f.farmer || "Unnamed farmer"}</div>
                              <div className="text-xs text-slate-400 num">{f.village} · {f.id}</div>
                            </div>
                            {url && <a href={url} target="_blank" rel="noreferrer" className="px-3 py-1 rounded-lg bg-field-600 text-white text-xs font-semibold hover:opacity-90">Survey →</a>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={() => setList([...list, { person: "", password: "", villages: [], phone: "" }])}
        className="text-sm text-field-700 font-semibold">+ Add surveyor</button>
    </div>
  );
}
