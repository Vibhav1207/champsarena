import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  let event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // Fallback/bypass for development if webhook secret is not set
      const parsedBody = JSON.parse(body);
      event = {
        type: parsedBody.type,
        data: parsedBody.data,
      };
    }
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const metadata = session.metadata;

    if (metadata && metadata.registrationId) {
      const regId = metadata.registrationId;
      const userId = metadata.userId;

      await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.updateMany({
          where: { providerOrderId: session.id },
          data: {
            status: "SUCCESS",
            providerPaymentId: session.payment_intent as string,
          },
        });

        // Update registration status
        await tx.registration.update({
          where: { id: regId },
          data: { status: "APPROVED" },
        });

        // Create notification
        await tx.notification.create({
          data: {
            userId,
            message: "Payment successful! Your tournament registration has been approved.",
            type: "PAYMENT",
          },
        });

        // Log audit log
        await tx.auditLog.create({
          data: {
            action: "STRIPE_PAYMENT_SUCCESS",
            userId,
            details: `Stripe checkout session ${session.id} completed. Approved registration: ${regId}`,
          },
        });
      });

      console.log(`Stripe Payment success processed for registration: ${regId}`);
    }
  }

  return NextResponse.json({ received: true });
}
