import { NextRequest, NextResponse } from "next/server";
import { verifyCaptcha } from "@/lib/captcha";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { captchaAnswer, captchaToken } = await req.json();

    if (!captchaAnswer || !captchaToken) {
      return NextResponse.json({ error: "Missing CAPTCHA answers" }, { status: 400 });
    }

    if (!verifyCaptcha(captchaAnswer, captchaToken)) {
      return NextResponse.json({ error: "Security puzzle solved incorrectly. Please try again." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
