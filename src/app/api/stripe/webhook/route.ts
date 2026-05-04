import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

// Mapping from Stripe price IDs to plan names
function getPlanFromPriceId(priceId: string): string {
  const basicPriceId = process.env.STRIPE_BASIC_PRICE_ID;
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
  const elitePriceId = process.env.STRIPE_ELITE_PRICE_ID;

  if (priceId === basicPriceId) return "basic";
  if (priceId === proPriceId) return "pro";
  if (priceId === elitePriceId) return "elite";
  return "free";
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (!userId || !session.subscription || !session.customer) break;

        // Fetch the subscription to get price ID
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const priceId = subscription.items.data[0]?.price.id;
        const plan = getPlanFromPriceId(priceId);

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            subscriptionStatus: "active",
          },
        });
        console.log(`User ${userId} upgraded to ${plan} plan`);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) break;

        const priceId = subscription.items.data[0]?.price.id;
        const plan = getPlanFromPriceId(priceId);

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            subscriptionStatus: subscription.status,
          },
        });
        console.log(`Subscription updated for user ${userId}: ${plan} (${subscription.status})`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;

        if (!userId) break;

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "free",
            stripeSubscriptionId: null,
            subscriptionStatus: "canceled",
          },
        });
        console.log(`Subscription canceled for user ${userId}, reverted to free`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by Stripe customer ID
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        });

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: "past_due" },
          });
          console.log(`Payment failed for user ${user.id}`);
        }
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
