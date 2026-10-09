import { NextResponse } from "next/server";
import { getCurrentUser, getSettings, saveSettingsPatch } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (user.role === "guest") {
    let gp = {};
    try { gp = (await getSettings())?.guest?.profile || {}; } catch {}
    return NextResponse.json({
      profile: {
        role: "guest",
        name: gp.name || "Guest Viewer",
        photo: gp.photo || "",
        bio: gp.bio || "",
        phone: gp.phone || "",
        email: gp.email || "",
      },
    });
  }
  return NextResponse.json({ profile: user });
}

export async function PUT(request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const str = (v, fb) => (typeof v === "string" ? v : fb);

  if (user.role === "admin") {
    const profile = {
      name: (typeof body.name === "string" && body.name.trim()) || user.name || "Admin",
      photo: str(body.photo, user.photo || ""),
      bio: str(body.bio, user.bio || ""),
      phone: str(body.phone, user.phone || ""),
      email: str(body.email, user.email || ""),
    };
    const settings = await getSettings();
    const adminProfiles = { ...(settings.adminProfiles || {}), [user.adminId]: profile };
    try { await saveSettingsPatch({ adminProfiles }); }
    catch (e) { return NextResponse.json({ error: String(e.message || e) }, { status: 500 }); }
    return NextResponse.json({ ok: true });
  }

  if (user.role === "guest") {
    const settings = await getSettings();
    const guest = {
      ...(settings.guest || {}),
      profile: {
        name: body.name || "", photo: body.photo || "", bio: body.bio || "",
        phone: body.phone || "", email: body.email || "",
      },
    };
    try { await saveSettingsPatch({ guest }); }
    catch (e) { return NextResponse.json({ error: String(e.message || e) }, { status: 500 }); }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Not allowed" }, { status: 403 });
}
