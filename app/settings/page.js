"use client";

import { useEffect, useState, useCallback } from "react";
import AppFrame from "@/components/AppFrame";
import StorageWidget from "@/components/StorageWidget";
import PhotoUpload from "@/components/PhotoUpload";
import { timeAgo, toggleTheme } from "@/app/ui";

const SECTIONS = [
  { id: "appearance", icon: "🎨", label: "Appearance", hint: "Design & theme" },
  { id: "profile", icon: "👤", label: "Admin profile", hint: "Your details", admin: true },
  { id: "security", icon: "🔐", label: "Admin passwords", hint: "Login passwords", admin: true },
  { id: "project", icon: "🌱", label: "Project info", hint: "Landing page", admin: true },
  { id: "contact", icon: "📬", label: "Contact", hint: "People on landing", admin: true },
  { id: "guest", icon: "👁️", label: "Guest viewer", hint: "Read-only access", admin: true },
  { id: "checks", icon: "✅", label: "Data checks", hint: "Which checks run", admin: true },
  { id: "kobo", icon: "📋", label: "KoBo & sync", hint: "Form & refresh" },
  { id: "storage", icon: "🗄️", label: "Data & storage", hint: "Database usage" },
];

export default function SettingsPage() {
  return <AppFrame>{(user) => <SettingsInner user={user} />}</AppFrame>;
}

function SettingsInner({ user }) {
  const isAdmin = user?.role === "admin";
  const [section, setSection] = useState("appearance");
  const [settings, setSettings] = useState(null);
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState("");
  const [design, setDesign] = useState("classic");
  const [dark, setDark] = useState(false);

  const load = useCallback(() => {
    fetch("/api/settings", { cache: "no-store" }).then((r) => r.json()).then(setSettings).catch(() => {});
    fetch("/api/profile", { cache: "no-store" }).then((r) => r.json()).then((d) => setProfile(d.profile || {})).catch(() => {});
    fetch("/api/status", { cache: "no-store" }).then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    try {
      setDesign(localStorage.getItem("endline_design") || "classic");
      setDark(document.documentElement.classList.contains("dark"));
    } catch {}
  }, []);

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  async function saveSettings(patch, okMsg) {
    const r = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    if (r.ok) { flash(okMsg || "Saved ✓"); load(); } else flash("Could not save.");
  }

  const visibleSections = SECTIONS.filter((s) => !s.admin || isAdmin);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Settings</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4">
        {/* Section nav */}
        <div className="flex lg:flex-col gap-1.5 overflow-x-auto scrollbar-thin lg:overflow-visible pb-1">
          {visibleSections.map((s) => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`shrink-0 text-left px-3 py-2 rounded-xl flex items-center gap-2.5 transition ${section === s.id ? "bg-field-600 text-white shadow-sm" : "bg-white hover:bg-slate-50 text-slate-700"}`}>
              <span className="text-lg">{s.icon}</span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{s.label}</span>
                <span className={`block text-[11px] ${section === s.id ? "text-white/80" : "text-slate-400"}`}>{s.hint}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Section content */}
        <div className="min-w-0 space-y-4">
          {msg && <div className="bg-field-50 border border-field-200 text-field-800 rounded-lg px-3 py-2 text-sm font-medium">{msg}</div>}

          {section === "appearance" && (
            <Panel title="Appearance" subtitle="How the dashboard looks.">
              <div className="text-sm text-slate-600 mb-2 font-medium">Overview design</div>
              <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1">
                <SegBtn on={design === "classic"} onClick={() => { setDesign("classic"); try { localStorage.setItem("endline_design", "classic"); } catch {} flash("Design: Classic"); }}>📊 Classic</SegBtn>
                <SegBtn on={design === "modern"} onClick={() => { setDesign("modern"); try { localStorage.setItem("endline_design", "modern"); } catch {} flash("Design: Modern"); }}>⭕ Modern</SegBtn>
              </div>
              <p className="text-xs text-slate-500 mt-2"><b>Classic</b> = KPI tiles + charts (like the Pipe & Water-Meter tools). <b>Modern</b> = the big progress-ring dashboard with insights.</p>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm text-slate-600">Dark mode</span>
                <button onClick={() => setDark(toggleTheme() === "dark")} className={`w-12 h-7 rounded-full transition relative ${dark ? "bg-field-600" : "bg-slate-300"}`}>
                  <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all ${dark ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            </Panel>
          )}

          {section === "profile" && isAdmin && <ProfileSection profile={profile} onSaved={() => { flash("Profile saved ✓"); load(); }} />}

          {section === "security" && isAdmin && settings && <PasswordsSection settings={settings} onSave={(list) => saveSettings({ security: { adminPasswords: list } }, "Admin passwords saved ✓")} />}

          {section === "project" && isAdmin && settings && <ProjectSection settings={settings} onSave={(project) => saveSettings({ project }, "Project info saved ✓")} />}

          {section === "contact" && isAdmin && settings && <ContactSection settings={settings} onSave={(contact) => saveSettings({ contact }, "Contact info saved ✓")} />}

          {section === "guest" && isAdmin && settings && <GuestSection settings={settings} onSave={(guest) => saveSettings({ guest }, "Guest access saved ✓")} />}

          {section === "checks" && isAdmin && settings && <ChecksSection settings={settings} onSave={(checks) => saveSettings({ checks }, "Data checks saved ✓")} />}

          {section === "kobo" && <KoboSection status={status} onSynced={load} flash={flash} />}

          {section === "storage" && (
            <Panel title="Data & storage" subtitle="Live MongoDB Atlas usage (free tier = 512 MB).">
              <div className="grid place-items-center"><StorageWidget /></div>
            </Panel>
          )}

          {!isAdmin && SECTIONS.find((s) => s.id === section)?.admin && (
            <Panel title="Admins only"><p className="text-sm text-slate-500">This section is only available to administrators.</p></Panel>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Sections ---------- */

function ProfileSection({ profile, onSaved }) {
  const [form, setForm] = useState({ name: "", photo: "", bio: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (profile) setForm({ name: profile.name || "", photo: profile.photo || "", bio: profile.bio || "", phone: profile.phone || "", email: profile.email || "" });
  }, [profile]);
  async function save() {
    setSaving(true);
    const r = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (r.ok) onSaved();
  }
  return (
    <Panel title="Admin profile" subtitle="Your name, photo and contact details (shown on the dashboard).">
      <div className="space-y-3">
        <Field label="Display name"><input className="inp" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Satyam Yadav" /></Field>
        <PhotoUpload value={form.photo} onChange={(url) => setForm({ ...form, photo: url })} label="Profile photo" />
        <Field label="Bio"><textarea className="inp" rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="e.g. Field coordinator, Endline survey" /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Phone"><input className="inp" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91…" /></Field>
          <Field label="Email"><input className="inp" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></Field>
        </div>
        <SaveBtn saving={saving} onClick={save} />
        <p className="text-xs text-slate-400">Your admin login password is set with the <code className="bg-slate-100 px-1 rounded">ADMIN_PASSWORD</code> env var (or in Admin passwords).</p>
      </div>
      <InpStyle />
    </Panel>
  );
}

function PasswordsSection({ settings, onSave }) {
  const [list, setList] = useState([]);
  useEffect(() => { setList((settings.security?.adminPasswords || []).filter(Boolean)); }, [settings]);
  return (
    <Panel title="Admin passwords" subtitle="Passwords that log in as ADMIN. Each one is a separate admin profile.">
      {settings.security?.envUsed && (
        <p className="text-xs text-earth-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
          Currently using the <code className="bg-amber-100 px-1 rounded">ADMIN_PASSWORD</code> env var. Add passwords here to manage them in-app instead (this overrides the env var).
        </p>
      )}
      <div className="space-y-2">
        {list.map((p, i) => (
          <div key={i} className="flex gap-2">
            <input className="inp flex-1" value={p} onChange={(e) => setList(list.map((x, j) => (j === i ? e.target.value : x)))} />
            <button onClick={() => setList(list.filter((_, j) => j !== i))} className="px-3 rounded-lg text-red-600 hover:bg-red-50">✕</button>
          </div>
        ))}
        <button onClick={() => setList([...list, ""])} className="text-sm text-field-700 font-semibold">+ Add admin password</button>
      </div>
      <div className="mt-3"><SaveBtn onClick={() => onSave(list.map((x) => x.trim()).filter(Boolean))} /></div>
      <InpStyle />
    </Panel>
  );
}

function ProjectSection({ settings, onSave }) {
  const p = settings.project || {};
  const [form, setForm] = useState({ name: "", tagline: "", description: "" });
  useEffect(() => { setForm({ name: p.name || "", tagline: p.tagline || "", description: p.description || "" }); }, [settings]); // eslint-disable-line
  return (
    <Panel title="Project info" subtitle="Shown on the public landing page.">
      <div className="space-y-3">
        <Field label="Project name"><input className="inp" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Kharif 2026 Endline Survey" /></Field>
        <Field label="Tagline"><input className="inp" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="End-of-season survey progress dashboard" /></Field>
        <Field label="Description"><textarea className="inp" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="A live dashboard for the Kharif 2026 Endline survey…" /></Field>
        <SaveBtn onClick={() => onSave(form)} />
      </div>
      <InpStyle />
    </Panel>
  );
}

function ContactSection({ settings, onSave }) {
  const c = settings.contact || {};
  const [people, setPeople] = useState([]);
  const [show, setShow] = useState(true);
  useEffect(() => { setPeople(Array.isArray(c.people) ? c.people : []); setShow(c.showOnLanding !== false); }, [settings]); // eslint-disable-line
  const up = (i, k, v) => setPeople(people.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  return (
    <Panel title="Contact" subtitle="People shown in the 'Get in touch' section of the landing page.">
      <label className="flex items-center gap-2 text-sm mb-3"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show contact section on the landing page</label>
      <div className="space-y-3">
        {people.map((p, i) => (
          <div key={i} className="border border-slate-200 rounded-xl p-3 space-y-2">
            <div className="flex gap-2">
              <input className="inp flex-1" placeholder="Name" value={p.name || ""} onChange={(e) => up(i, "name", e.target.value)} />
              <button onClick={() => setPeople(people.filter((_, j) => j !== i))} className="px-3 rounded-lg text-red-600 hover:bg-red-50">✕</button>
            </div>
            <input className="inp" placeholder="Designation (optional)" value={p.designation || ""} onChange={(e) => up(i, "designation", e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input className="inp" placeholder="Phone" value={p.phone || ""} onChange={(e) => up(i, "phone", e.target.value)} />
              <input className="inp" placeholder="Email" value={p.email || ""} onChange={(e) => up(i, "email", e.target.value)} />
              <input className="inp" placeholder="WhatsApp" value={p.whatsapp || ""} onChange={(e) => up(i, "whatsapp", e.target.value)} />
            </div>
          </div>
        ))}
        <button onClick={() => setPeople([...people, { name: "" }])} className="text-sm text-field-700 font-semibold">+ Add person</button>
      </div>
      <div className="mt-3"><SaveBtn onClick={() => onSave({ people, showOnLanding: show })} /></div>
      <InpStyle />
    </Panel>
  );
}

function GuestSection({ settings, onSave }) {
  const g = settings.guest || {};
  const [enabled, setEnabled] = useState(false);
  const [password, setPassword] = useState("");
  useEffect(() => { setEnabled(!!g.enabled); setPassword(g.password || ""); }, [settings]); // eslint-disable-line
  return (
    <Panel title="Guest viewer" subtitle="A read-only password you can share. Guests can view everything but can't download or change settings.">
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enable guest viewer</label>
      {enabled && <div className="mt-2"><Field label="Guest password"><input className="inp" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Guest password" /></Field></div>}
      <div className="mt-3"><SaveBtn onClick={() => onSave({ enabled, password: password.trim() })} /></div>
      <InpStyle />
    </Panel>
  );
}

function ChecksSection({ settings, onSave }) {
  const c = settings.checks || { duplicates: true, gps: true, unlisted: true };
  const [form, setForm] = useState(c);
  useEffect(() => { setForm(settings.checks || { duplicates: true, gps: true, unlisted: true }); }, [settings]); // eslint-disable-line
  const row = (k, label, hint) => (
    <label className="flex items-start gap-2 py-2 border-t border-slate-100 first:border-t-0">
      <input type="checkbox" className="mt-1" checked={!!form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.checked })} />
      <span><span className="text-sm font-medium text-slate-800 block">{label}</span><span className="text-xs text-slate-500">{hint}</span></span>
    </label>
  );
  return (
    <Panel title="Data checks" subtitle="Which quality checks to surface on the Overview.">
      {row("duplicates", "Duplicate farms", "Same farm ID submitted more than once")}
      {row("unlisted", "Unlisted farm IDs", "A submission's farm ID isn't in the master list")}
      {row("gps", "Missing GPS", "Submission has no interview location pin")}
      <div className="mt-3"><SaveBtn onClick={() => onSave(form)} /></div>
    </Panel>
  );
}

function KoboSection({ status, onSynced, flash }) {
  const [syncing, setSyncing] = useState(false);
  async function sync() {
    setSyncing(true);
    try {
      const r = await fetch("/api/sync?force=1", { method: "POST" });
      const j = await r.json();
      if (!r.ok || j.ok === false) throw new Error(j.error || "Sync failed");
      flash(j.skipped ? "Already up to date." : `Synced ${j.submissions} submissions ✓`);
      onSynced();
    } catch (e) { flash("Error: " + (e.message || e)); }
    finally { setSyncing(false); }
  }
  return (
    <Panel title="KoBo & sync" subtitle="Where the data comes from, and how to refresh it.">
      <Row k="Status" v={!status ? "Checking…" : status.kobo ? <Dot ok>Connected</Dot> : <Dot>Not connected</Dot>} />
      <Row k="Form" v={status?.formName || status?.form || "—"} />
      <Row k="Submissions on KoBo" v={status?.koboCount ?? "—"} />
      <Row k="API token" v={status?.tokenSet ? "set ✓" : "missing ✗"} />
      <Row k="MongoDB" v={!status ? "Checking…" : status.mongo ? <Dot ok>Connected</Dot> : <Dot>Error</Dot>} />
      <Row k="Last synced" v={timeAgo(status?.syncedAt)} />
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <button onClick={sync} disabled={syncing} className="px-4 py-2 rounded-lg bg-field-600 text-white font-semibold hover:opacity-90 disabled:opacity-50">{syncing ? "Syncing…" : "↻ Sync now"}</button>
        <span className="text-xs text-slate-500">Also runs automatically once a day.</span>
      </div>
    </Panel>
  );
}

/* ---------- Shared bits ---------- */

function Panel({ title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5">
      <h2 className="font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mb-3">{subtitle}</p>}
      {children}
    </div>
  );
}
function Field({ label, children }) {
  return <label className="block"><span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>{children}</label>;
}
function SaveBtn({ saving, onClick }) {
  return <button onClick={onClick} disabled={saving} className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>;
}
function SegBtn({ on, onClick, children }) {
  return <button onClick={onClick} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${on ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>{children}</button>;
}
function Row({ k, v }) {
  return <div className="flex justify-between gap-3 py-2 border-t border-slate-100 first:border-t-0 text-sm"><span className="text-slate-500">{k}</span><span className="font-medium text-right break-words">{v}</span></div>;
}
function Dot({ ok, children }) {
  return <span className={`inline-flex items-center gap-1.5 font-semibold ${ok ? "text-field-700" : "text-red-600"}`}><span className="w-2 h-2 rounded-full" style={{ background: ok ? "#16a34a" : "#dc2626" }} />{children}</span>;
}
function InpStyle() {
  return <style jsx global>{`.inp{width:100%;padding:0.5rem 0.65rem;border:1px solid #cbd5e1;border-radius:0.5rem;font-size:0.875rem;background:#fff}.inp:focus{outline:2px solid #22c55e;outline-offset:-1px}`}</style>;
}
