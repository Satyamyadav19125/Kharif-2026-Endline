import { NextResponse } from "next/server";
import { getCurrentUser, getSettings } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DEFAULT_FORM_URL = "https://ee.kobotoolbox.org/x/cCn19CYK";

export async function GET() {
  const user = await getCurrentUser();
  let formUrl = DEFAULT_FORM_URL;
  try {
    const s = await getSettings();
    if (s?.project?.formUrl) formUrl = s.project.formUrl;
    else if (process.env.KOBO_FORM_URL) formUrl = process.env.KOBO_FORM_URL;
  } catch {}
  return NextResponse.json({ user, formUrl });
}
