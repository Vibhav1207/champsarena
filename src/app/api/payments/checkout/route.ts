import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { createStripeCheckoutSession } from "@/lib/stripe";
import { createRazorpayOrder } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tournamentId, gateway } = await req.json();
    if (!tournamentId || !gateway) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Check if registration already exists
    let registration = await prisma.registration.findUnique({
      where: {
        userId_tournamentId: {
          userId: session.user.id,
          tournamentId,
        },
      },
    });

    if (registration) {
      if (registration.status === "APPROVED") {
        return NextResponse.json({ error: "Already registered and paid" }, { status: 400 });
      }
    } else {
      // Create pending registration
      registration = await prisma.registration.create({
        data: {
          userId: session.user.id,
          tournamentId,
          status: "PENDING",
        },
      });
    }

    const entryFee = tournament.entryFee;

    // Free tournament: Auto-approve registration
    if (entryFee <= 0) {
      await prisma.registration.update({
        where: { id: registration.id },
        data: { status: "APPROVED" },
      });
      return NextResponse.json({ success: true, message: "Free tournament registration approved" });
    }

    if (gateway === "STRIPE") {
      const checkoutSession = await createStripeCheckoutSession({
        userId: session.user.id,
        registrationId: registration.id,
        tournamentTitle: tournament.title,
        entryFee,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/tournaments/${tournamentId}?payment=success`,
        cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/tournaments/${tournamentId}?payment=cancel`,
      });

      // Create Payment record
      await prisma.payment.create({
        data: {
          userId: session.user.id,
          registrationId: registration.id,
          amount: entryFee,
          status: "PENDING",
          provider: "STRIPE",
          providerOrderId: checkoutSession.id,
        },
      });

      return NextResponse.json({ url: checkoutSession.url });
    } else if (gateway === "RAZORPAY") {
      const order = await createRazorpayOrder({
        registrationId: registration.id,
        amount: entryFee,
        currency: "INR",
      });

      // Create Payment record
      await prisma.payment.create({
        data: {
          userId: session.user.id,
          registrationId: registration.id,
          amount: entryFee,
          status: "PENDING",
          provider: "RAZORPAY",
          providerOrderId: order.id,
        },
      });

      return NextResponse.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy",
      });
    } else {
      return NextResponse.json({ error: "Invalid payment gateway" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Checkout session creation failed:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
