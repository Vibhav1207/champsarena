import Stripe from "stripe";

const stripeSecret = process.env.STRIPE_SECRET_KEY || "sk_test_dummy";
export const stripe = new Stripe(stripeSecret, {
  apiVersion: "2022-11-15" as any, // fallback api version
});

export async function createStripeCheckoutSession(params: {
  userId: string;
  registrationId: string;
  tournamentTitle: string;
  entryFee: number;
  successUrl: string;
  cancelUrl: string;
}) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Tournament entry fee: ${params.tournamentTitle}`,
            description: `Registration fee for ${params.tournamentTitle}`,
          },
          unit_amount: Math.round(params.entryFee * 100), // Stripe takes amounts in cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      userId: params.userId,
      registrationId: params.registrationId,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });

  return session;
}
