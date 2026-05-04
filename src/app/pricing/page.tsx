import { auth } from "@/lib/auth";
import { PLANS } from "@/lib/stripe";
import { PricingCard } from "@/components/PricingCard";

export default async function PricingPage() {
  const session = await auth();
  const currentPlan = session?.user?.plan ?? "free";

  return (
    <div className="min-h-screen bg-background py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-black mb-4">
            Invest in{" "}
            <span className="gradient-text">Accountability</span>
          </h1>
          <p className="text-text-secondary text-xl max-w-2xl mx-auto">
            Stop wasting money on gym memberships you don&apos;t use and courses you
            never finish. Start paying for the system that makes you follow
            through.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          <PricingCard
            name={PLANS.basic.name}
            price={PLANS.basic.price}
            features={PLANS.basic.features as unknown as string[]}
            planKey="basic"
            highlighted={false}
            currentPlan={currentPlan}
            isLoggedIn={!!session}
          />
          <PricingCard
            name={PLANS.pro.name}
            price={PLANS.pro.price}
            features={PLANS.pro.features as unknown as string[]}
            planKey="pro"
            highlighted={true}
            currentPlan={currentPlan}
            isLoggedIn={!!session}
          />
          <PricingCard
            name={PLANS.elite.name}
            price={PLANS.elite.price}
            features={PLANS.elite.features as unknown as string[]}
            planKey="elite"
            highlighted={false}
            currentPlan={currentPlan}
            isLoggedIn={!!session}
          />
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-black text-center mb-8">
            Common Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Can I cancel anytime?",
                a: "Yes. Cancel anytime from your account settings. You keep access until the end of your billing period.",
              },
              {
                q: "What happens if I hit my goal limit?",
                a: "You can still view existing goals but won't be able to create new ones until you upgrade or complete/abandon existing goals.",
              },
              {
                q: "How is this different from a todo app?",
                a: "Your AI coach actively follows up, calls out excuses, tracks your commitments, and won't let you quietly abandon goals. It's persistence built in.",
              },
              {
                q: "Can I upgrade or downgrade?",
                a: "Yes. Upgrades take effect immediately. Downgrades take effect at the end of your billing period.",
              },
              {
                q: "Is my data private?",
                a: "Yes. Your goals and conversations are private and used only to power your coaching experience.",
              },
            ].map((faq) => (
              <div
                key={faq.q}
                className="p-6 rounded-2xl bg-surface border border-border"
              >
                <h3 className="font-bold mb-2">{faq.q}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 p-8 rounded-2xl bg-surface border border-border">
          <h3 className="text-2xl font-black mb-2">
            Not sure which plan? Start free.
          </h3>
          <p className="text-text-secondary mb-6">
            The free plan lets you try everything with 1 goal. No credit card
            needed.
          </p>
          <a
            href="/signup"
            className="inline-block px-8 py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition-all duration-200 hover:scale-105"
          >
            Start Free →
          </a>
        </div>
      </div>
    </div>
  );
}
