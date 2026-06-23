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

    const isTeam = tournament.game === "FREE_FIRE";
    let squadId: string | null = null;

    if (isTeam) {
      // Get user details to verify captain role and squad
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { squadId: true },
      });

      if (!user || !user.squadId) {
        return NextResponse.json({ error: "You must create or join a squad first before registering." }, { status: 400 });
      }

      squadId = user.squadId;

      const squad = await prisma.squad.findUnique({
        where: { id: squadId },
        include: {
          members: { select: { id: true, name: true, username: true } },
        },
      });

      if (!squad) {
        return NextResponse.json({ error: "Squad not found." }, { status: 404 });
      }

      if (squad.captainId !== session.user.id) {
        return NextResponse.json({ error: "Only the Team Captain can register the squad for tournaments." }, { status: 403 });
      }

      // Validate squad size: standard 4 to 6 members
      if (squad.members.length < 4 || squad.members.length > 6) {
        return NextResponse.json({ error: `Your roster size is ${squad.members.length}. Free Fire squad tournaments require between 4 and 6 players.` }, { status: 400 });
      }

      // Check if squad already registered
      const existingSquadReg = await prisma.squadRegistration.findUnique({
        where: {
          squadId_tournamentId: {
            squadId: squad.id,
            tournamentId,
          },
        },
      });

      if (existingSquadReg && existingSquadReg.status === "APPROVED") {
        return NextResponse.json({ error: "Your squad is already registered and approved." }, { status: 400 });
      }

      // Check if any member of this squad is already registered in another squad for this tournament
      const approvedSquadRegs = await prisma.squadRegistration.findMany({
        where: {
          tournamentId,
          status: "APPROVED",
        },
        include: {
          squad: {
            include: {
              members: { select: { id: true } },
            },
          },
        },
      });

      const approvedMemberIds = new Set(approvedSquadRegs.flatMap(sr => sr.squad.members.map(m => m.id)));
      const overlapping = squad.members.filter(m => approvedMemberIds.has(m.id));

      if (overlapping.length > 0) {
        return NextResponse.json({
          error: `Registration failed. One or more roster players (${overlapping.map(m => m.name || m.username).join(", ")}) are already registered in another team.`,
        }, { status: 400 });
      }
    } else {
      // Check capacity for individual tournament
      const approvedCount = await prisma.registration.count({
        where: {
          tournamentId,
          status: "APPROVED",
        },
      });

      if (approvedCount >= tournament.maxPlayers) {
        return NextResponse.json({ error: "Tournament is full." }, { status: 400 });
      }
    }

    // Check / Create Captain or User Registration record
    let registration = await prisma.registration.findUnique({
      where: {
        userId_tournamentId: {
          userId: session.user.id,
          tournamentId,
        },
      },
    });

    if (!registration) {
      registration = await prisma.registration.create({
        data: {
          userId: session.user.id,
          tournamentId,
          status: "PENDING",
        },
      });
    }

    // Create Squad Registration record if squad tournament
    let squadRegistration = null;
    if (isTeam && squadId) {
      squadRegistration = await prisma.squadRegistration.findUnique({
        where: {
          squadId_tournamentId: {
            squadId,
            tournamentId,
          },
        },
      });

      if (!squadRegistration) {
        squadRegistration = await prisma.squadRegistration.create({
          data: {
            squadId,
            tournamentId,
            status: "PENDING",
          },
        });
      }
    }

    const entryFee = tournament.entryFee;

    // Free tournament: Auto-approve
    if (entryFee <= 0) {
      await prisma.$transaction(async (tx) => {
        await tx.registration.update({
          where: { id: registration.id },
          data: { status: "APPROVED" },
        });

        if (isTeam && squadId) {
          await tx.squadRegistration.update({
            where: {
              squadId_tournamentId: {
                squadId,
                tournamentId,
              },
            },
            data: { status: "APPROVED" },
          });
        }
      });

      // Auto generate brackets if full
      try {
        const { checkAndAutoGenerateBrackets } = await import("@/lib/tournament/engine");
        await checkAndAutoGenerateBrackets(tournamentId);
      } catch (err) {
        console.error("Auto bracket generation failed in checkout:", err);
      }

      return NextResponse.json({ success: true, message: "Registration approved successfully" });
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
