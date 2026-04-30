import { NextResponse } from "next/server";
import { connectDB } from "@/src/lib/db";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({ ok: true, db: "connected" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    return NextResponse.json({ ok: false, error: msg }, { status: 503 });
  }
}
