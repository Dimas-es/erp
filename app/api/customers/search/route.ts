import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/src/lib/auth";
import { connectDB } from "@/src/lib/db";
import Customer from "@/src/models/Customer";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const q = req.nextUrl.searchParams.get("q") ?? "";
  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {};
  if (q.length >= 1) {
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
    ];
  }

  const rows = await Customer.find(query).sort({ name: 1 }).limit(40).lean();
  return NextResponse.json(
    rows.map((c) => ({ _id: c._id.toString(), name: c.name, phone: c.phone ?? "" }))
  );
}
