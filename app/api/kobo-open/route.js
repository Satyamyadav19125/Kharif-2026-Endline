import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { koboBase, koboForm, koboToken } from "@/lib/kobo";

export const dynamic = "force-dynamic";

// Deep-link one submission into the real KoBoToolbox site. The per-submission
// Enketo view URL comes from KoBo's API (needs the token, resolved server-side),
// so we 302-redirect. If KoBo refuses, fall back to the form's data table.
export async function GET(request) {
  const me = await getCurrentUser();
  if (!me || me.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 401 });

  const id = (new URL(request.url).searchParams.get("id") || "").trim();
  const base = koboBase();
  const uid = koboForm();
  const token = koboToken();
  const tableUrl = uid ? `${base}/#/forms/${uid}/data/table` : base;
  if (!id || !uid || !token) return NextResponse.redirect(tableUrl);

  try {
    const res = await fetch(`${base}/api/v2/assets/${uid}/data/${id}/enketo/view/`, {
      headers: { Authorization: `Token ${token}` },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.url) return NextResponse.redirect(data.url);
    }
  } catch {}
  return NextResponse.redirect(tableUrl);
}
