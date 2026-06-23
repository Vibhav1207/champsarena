import { NextRequest, NextResponse } from "next/server";
import { verifyCaptcha } from "@/lib/captcha";
import { requestPasswordReset } from "@/app/actions/authActions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, captchaAnswer, captchaToken } = await req.json();

    if (!email || !captchaAnswer || !captchaToken) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Verify captcha
    if (!verifyCaptcha(captchaAnswer, captchaToken)) {
      return NextResponse.json({ error: "Security puzzle solved incorrectly. Please try again." }, { status: 400 });
    }

    const res = await requestPasswordReset(email);
    if (res.error) {
      return NextResponse.json({ error: res.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Password reset request failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
