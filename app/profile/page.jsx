"use client";

import { useEffect, useState } from "react";
import AppFrame from "@/components/AppFrame";
import PhotoUpload from "@/components/PhotoUpload";

export default function ProfilePage() {
  return <AppFrame>{(user) => <ProfileInner user={user} />}</AppFrame>;
}

function ProfileInner({ user }) {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", photo: "", bio: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/profile", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        const p = d.profile || {};
        setProfile(p);
        setForm({ name: p.name || "", photo: p.photo || "", bio: p.bio || "", phone: p.phone || "", email: p.email || "" });
      })
      .catch(() => setProfile({}));
  }, []);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    const r = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (r.ok) { setMsg("Saved ✓"); setTimeout(() => setMsg(""), 3000); } else setMsg("Save failed");
  }

  const role = profile?.role || user?.role;
  const inp = "w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-white";

  if (!profile) return <div className="min-h-[40vh] grid place-items-center"><div className="spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          {form.photo
            ? <img src={form.photo} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-field-200" />
            : <div className="w-14 h-14 rounded-full bg-gradient-to-br from-field-100 to-earth-100 grid place-items-center text-2xl">{role === "admin" ? "👑" : "👁️"}</div>}
          <div>
            <h1 className="text-xl font-bold text-slate-900">{form.name || (role === "admin" ? "Admin" : "Guest Viewer")}</h1>
            <p className="text-xs text-slate-500">{role === "admin" ? "Administrator" : "Guest viewer · read-only"}</p>
          </div>
        </div>

        {msg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg px-3 py-2 text-sm mb-3">{msg}</div>}

        <form onSubmit={save} className="space-y-3">
          <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Display name</span>
            <input className={inp} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Satyam Yadav" /></label>
          <PhotoUpload value={form.photo} onChange={(url) => setForm({ ...form, photo: url })} label="Profile photo" />
          <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Bio</span>
            <textarea className={inp} rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="A short line about you" /></label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Phone</span>
              <input className={inp} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91…" /></label>
            <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">Email</span>
              <input className={inp} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>
          </div>
          <button type="submit" disabled={saving} className="w-full bg-field-600 text-white py-2.5 rounded-lg font-semibold hover:bg-field-700 disabled:opacity-50">
            {saving ? "Saving…" : "Save profile"}
          </button>
        </form>

        {role === "admin" && <p className="text-xs text-slate-400 mt-3">Your login password is managed in Settings → Admin passwords (or the ADMIN_PASSWORD env var).</p>}
      </div>
    </div>
  );
}
