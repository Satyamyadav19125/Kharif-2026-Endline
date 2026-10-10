"use client";

import { useEffect, useState } from "react";
import AppFrame from "@/components/AppFrame";

export default function AssignmentsPage() {
  return <AppFrame>{(user) => <AssignmentsInner user={user} />}</AppFrame>;
}

function AssignmentsInner({ user }) {
  const [list, setList] = useState(null);
  const [villages, setVillages] = useState([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/assignments", { cache: "no-store" }).then((r) => r.json()).then((d) => setList(d.assignments || [])).catch(() => setList([]));
    fetch("/api/summary", { cache: "no-store" }).then((r) => r.json()).then((d) => {
      if (d?.perVillage) setVillages(d.perVillage.map((v) => ({ code: v.code, label: v.label })));
    }).catch(() => {});
  }, []);

  if (user?.role !== "admin") {
    return <div className="bg-white rounded-xl shadow-sm p-6 text-sm text-slate-500">Assignments are managed by administrators.</div>;
  }
  if (!list) return <div className="min-h-[40vh] grid place-items-center"><div className="spin" /></div>;

  const up = (i, k, v) => setList(list.map((u, j) => (j === i ? { ...u, [k]: v } : u)));
  const toggleVillage = (i, code) => {
    const cur = list[i].villages || [];
    up(i, "villages", cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]);
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
      <p className="text-sm text-slate-500">Give each surveyor a login password and the villages they cover. They log in with that password and see the dashboard focused on their villages.</p>

      <div className="space-y-3">
        {list.map((u, i) => (
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
          </div>
        ))}
      </div>

      <button onClick={() => setList([...list, { person: "", password: "", villages: [], phone: "" }])}
        className="text-sm text-field-700 font-semibold">+ Add surveyor</button>
    </div>
  );
}
