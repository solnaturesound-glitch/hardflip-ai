import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    priceId: null,
    features: [
      "1 active goal",
      "Basic check-ins",
      "AI coach (limited)",
    ],
    limits: {
      goals: 1,
      checkinFrequency: "weekly",
      emailNotifications: false,
    },
  },
  basic: {
    name: "Basic",
    price: 4.99,
    priceId: process.env.STRIPE_BASIC_PRICE_ID,
    features: [
      "3 active goals",
      "Daily check-ins",
      "Full AI coach access",
      "Progress milestones",
    ],
    limits: {
      goals: 3,
      checkinFrequency: "daily",
      emailNotifications: false,
    },
  },
  pro: {
    name: "Pro",
    price: 9.99,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      "10 active goals",
      "Hourly check-ins",
      "Email notifications",
      "Priority AI responses",
      "Advanced analytics",
    ],
    limits: {
      goals: 10,
      checkinFrequency: "hourly",
      emailNotifications: true,
    },
  },
  elite: {
    name: "Elite",
    price: 19.99,
    priceId: process.env.STRIPE_ELITE_PRICE_ID,
    features: [
      "Unlimited goals",
      "Real-time AI coach",
      "Email + SMS notifications",
      "Custom check-in schedule",
      "Priority support",
      "Accountability partner matching",
    ],
    limits: {
      goals: -1, // unlimited
      checkinFrequency: "realtime",
      emailNotifications: true,
    },
  },
} as const;

export type PlanName = keyof typeof PLANS;

export function getPlanLimits(plan: string) {
  return PLANS[plan as PlanName]?.limits ?? PLANS.free.limits;
}

export function canCreateGoal(plan: string, currentGoalCount: number): boolean {
  const limits = getPlanLimits(plan);
  if (limits.goals === -1) return true;
  return currentGoalCount < limits.goals;
}

export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  priceId: string,
  customerId?: string
): Promise<string> {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    metadata: { userId },
    subscription_data: {
      metadata: { userId },
    },
  };

  if (customerId) {
    sessionParams.customer = customerId;
  } else {
    sessionParams.customer_email = userEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session.url!;
}
