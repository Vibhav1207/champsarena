import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.name || typeof body.value !== "number") {
      return NextResponse.json({ error: "Invalid web vitals data" }, { status: 400 });
    }

    // Store in database (optional - you can also send to external analytics)
    // await prisma.webVital.create({
    //   data: {
    //     name: body.name,
    //     value: body.value,
    //     rating: body.rating,
    //     delta: body.delta,
    //     metricId: body.id,
    //     navigationType: body.navigationType,
    //     url: body.url,
    //     userAgent: body.userAgent,
    //   },
    // });

    // For now, just log and return success
    // In production, you'd want to send this to your analytics service
    console.log("[Web Vitals API]", body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to process web vitals:", error);
    return NextResponse.json({ error: "Failed to process web vitals" }, { status: 500 });
  }
}