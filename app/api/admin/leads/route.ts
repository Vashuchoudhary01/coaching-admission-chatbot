import { NextRequest, NextResponse } from "next/server";

import { hasSupabaseAdminConfig, supabaseAdmin } from "@/lib/supabase-admin";

type LeadRow = {
  name: string | null;
  phone: string | null;
  course: string | null;
  created_at?: string | null;
};

const isAuthorized = (request: NextRequest) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const providedPassword = request.headers.get("x-admin-password");

  return Boolean(adminPassword && providedPassword === adminPassword);
};

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { error: "Invalid admin password." },
        { status: 401 },
      );
    }

    if (!hasSupabaseAdminConfig || !supabaseAdmin) {
      return NextResponse.json(
        {
          error:
            "Missing SUPABASE_SERVICE_ROLE_KEY in .env.local. Add it from Supabase Project Settings > API.",
        },
        { status: 500 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("leads")
      .select("name,phone,course,status,notes,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (error) {
  console.error("FULL SUPABASE ERROR:", error);

  return NextResponse.json(
    {
      error: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    },
    { status: 500 }
  );
}

    return NextResponse.json({ leads: (data ?? []) as LeadRow[] });
  } catch (error) {
    console.error("Admin leads API failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected admin API error.",
      },
      { status: 500 },
    );
  }
}
