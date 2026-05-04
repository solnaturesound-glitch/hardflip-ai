import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession, PLANS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { plan } = await req.json();

    if (!plan || !["basic", "pro", "elite"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan selected." },
        { status: 400 }
      );
    }

    const planData = PLANS[plan as "basic" | "pro" | "elite"];

    if (!planData.priceId) {
      return NextResponse.json(
        {
          error: `Stripe Price ID for ${plan} plan is not configured. Please set STRIPE_${plan.toUpperCase()}_PRICE_ID in your environment.`,
        },
        { status: 500 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const checkoutUrl = await createCheckoutSession(
      user.id,
      user.email,
      planData.priceId,
      user.stripeCustomerId ?? undefined
    );

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
