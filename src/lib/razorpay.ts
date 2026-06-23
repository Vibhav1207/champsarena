import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_dummy";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "dummy-razorpay-secret";

export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export async function createRazorpayOrder(params: {
  registrationId: string;
  amount: number;
  currency?: string;
}) {
  const options = {
    amount: Math.round(params.amount * 100),
    currency: params.currency || "INR",
    receipt: `rcpt_${params.registrationId}`,
    notes: {
      registrationId: params.registrationId,
    },
  };

  const order = await razorpay.orders.create(options);
  return order;
}
