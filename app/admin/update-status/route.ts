import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { phone, status } = body;

    const { error } = await supabaseAdmin!
      .from("leads")
      .update({
        status,
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
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update lead." },
      { status: 500 }
    );
  }
}