import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const { phone, notes } = await request.json();

    const { error } = await supabaseAdmin!
      .from("leads")
      .update({
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("phone", phone);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to save notes." },
      { status: 500 }
    );
  }
}