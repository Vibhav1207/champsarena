import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";
import { submitMatchResult } from "@/lib/tournament/engine";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session || !session.user || (session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const { p1Score, p2Score, winnerId } = await req.json();

    if (p1Score === undefined || p2Score === undefined || !winnerId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await submitMatchResult(id, parseInt(p1Score), parseInt(p2Score), winnerId);

    return NextResponse.json({ success: true, message: "Match result submitted and bracket updated" });
  } catch (error: any) {
    console.error("Match result submission failed:", error);
    return NextResponse.json({ error: error.message || "Failed to submit result" }, { status: 500 });
  }
}
