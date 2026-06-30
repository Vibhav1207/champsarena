import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    let isValid = false;

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");
      isValid = expectedSignature === signature;
    } else {
      // In development, bypass verification if webhook secret is not set
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(body);
    const event = payload.event;

    if (event === "order.paid") {
      const order = payload.payload.order.entity;
      const payment = payload.payload.payment?.entity;
      const orderId = order.id;

      // Find the corresponding payment record
      const dbPayment = await prisma.payment.findUnique({
        where: { providerOrderId: orderId },
      });

      if (dbPayment) {
        await prisma.$transaction(async (tx: Omit<typeof prisma, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
          // Update payment status
          await tx.payment.update({
            where: { id: dbPayment.id },
            data: {
              status: "SUCCESS",
              providerPaymentId: payment?.id || null,
            },
          });

          // Update registration status
          const updatedReg = await tx.registration.update({
            where: { id: dbPayment.registrationId },
            data: { status: "APPROVED" },
          });

          // If user is a captain of a squad, approve squad registration
          const squad = await tx.squad.findFirst({
            where: { captainId: dbPayment.userId },
          });

          if (squad && updatedReg.tournamentId) {
            await tx.squadRegistration.updateMany({
              where: {
                squadId: squad.id,
                tournamentId: updatedReg.tournamentId,
                status: "PENDING",
              },
              data: { status: "APPROVED" },
            });
          }

          // Create notification
          await tx.notification.create({
            data: {
              userId: dbPayment.userId,
              message: "Razorpay payment successful! Your tournament registration has been approved.",
              type: "PAYMENT",
            },
          });

          // Log audit log
          await tx.auditLog.create({
            data: {
              action: "RAZORPAY_PAYMENT_SUCCESS",
              userId: dbPayment.userId,
              details: `Razorpay order ${orderId} completed. Approved registration: ${dbPayment.registrationId}`,
            },
          });
        });

        console.log(`Razorpay Payment success processed for order: ${orderId}`);

        // Check and auto-generate bracket if capacity is reached
        try {
          const { checkAndAutoGenerateBrackets } = await import("@/lib/tournament/engine");
          if (dbPayment.registrationId) {
            const reg = await prisma.registration.findUnique({
              where: { id: dbPayment.registrationId },
              select: { tournamentId: true },
            });
            if (reg?.tournamentId) {
              await checkAndAutoGenerateBrackets(reg.tournamentId);
            }
          }
        } catch (err) {
          console.error("Auto bracket generation failed inside Razorpay webhook:", err);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Razorpay webhook error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
