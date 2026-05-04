import Link from "next/link";
import { PricingCard } from "@/components/PricingCard";
import { PLANS } from "@/lib/stripe";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* Background glow effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            AI-Powered Accountability Coach
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Stop Quitting.
            <br />
            <span className="gradient-text">Start Finishing.</span>
          </h1>

          <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto mb-10 leading-relaxed">
            Hardflip AI is the accountability coach that calls you out when you
            make excuses, celebrates wins, and never — ever — lets you off the
            hook.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-primary hover:bg-primary-hover text-white font-bold text-lg rounded-xl transition-all duration-200 glow-blue hover:scale-105"
            >
              Start Free — No Credit Card
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 bg-surface-2 hover:bg-border text-text-primary font-semibold text-lg rounded-xl border border-border transition-all duration-200"
            >
              View Pricing →
            </Link>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-text-muted text-sm">
            Join 1,000+ people who stopped making excuses
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-surface">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">How It Works</h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Three steps to finally achieving what you keep putting off.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "🎯",
                title: "Set Your Goal",
                description:
                  "Define what you want to achieve with a deadline, frequency, and category. Be specific — vague goals get vague results.",
              },
              {
                step: "02",
                icon: "🤖",
                title: "Meet Your Coach",
                description:
                  "Your AI accountability coach breaks down your goal into milestones and creates a personalized check-in schedule.",
              },
              {
                step: "03",
                icon: "🔥",
                title: "Get Held Accountable",
                description:
                  "Regular check-ins, ruthless follow-up, and no excuses accepted. Your coach won't let you disappear on your goals.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative p-8 rounded-2xl bg-surface-2 border border-border card-hover"
              >
                <div className="text-6xl font-black text-border/50 absolute top-6 right-6">
                  {item.step}
                </div>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-text-secondary leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Built for{" "}
              <span className="text-accent">Relentless</span> Progress
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Every feature is designed to keep you moving forward, even when
              you want to give up.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: "💬",
                title: "AI Chat Coach",
                description:
                  "Have real conversations with your AI coach. It remembers your history, tracks your commitments, and calls you out on inconsistencies.",
                color: "primary",
              },
              {
                icon: "⚡",
                title: "Smart Check-ins",
                description:
                  "Automated check-ins based on your goal frequency. Miss one? Your coach will notice and won't let it slide.",
                color: "accent",
              },
              {
                icon: "📊",
                title: "Milestone Tracking",
                description:
                  "AI breaks down your goal into 5 concrete milestones. See exactly where you are and what's next.",
                color: "primary",
              },
              {
                icon: "🚨",
                title: "Overdue Alerts",
                description:
                  "Goals that miss check-ins get flagged in red. No more quietly abandoning your goals — accountability is built in.",
                color: "danger",
              },
              {
                icon: "📧",
                title: "Email Reminders",
                description:
                  "Pro users get email notifications for check-ins. Because sometimes you need a nudge from outside the app.",
                color: "accent",
              },
              {
                icon: "🔒",
                title: "Commitment Memory",
                description:
                  "Your AI coach remembers every commitment you make. Next check-in? It'll ask if you followed through.",
                color: "primary",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex gap-5 p-6 rounded-2xl bg-surface border border-border card-hover"
              >
                <div
                  className={`text-3xl w-12 h-12 flex items-center justify-center rounded-xl bg-${feature.color}/10 shrink-0`}
                >
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial / Quote */}
      <section className="py-24 px-6 bg-surface">
        <div className="max-w-4xl mx-auto text-center">
          <blockquote className="text-2xl md:text-3xl font-bold text-text-primary mb-6 leading-relaxed">
            &ldquo;I&apos;ve tried every todo app, habit tracker, and planner.
            Nothing worked until I had something that actually called me out on
            my BS.&rdquo;
          </blockquote>
          <cite className="text-text-secondary not-italic">
            — Hardflip AI Beta User
          </cite>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Simple Pricing</h2>
            <p className="text-text-secondary text-lg">
              Start free. Upgrade when you&apos;re serious.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <PricingCard
              name={PLANS.basic.name}
              price={PLANS.basic.price}
              features={PLANS.basic.features as unknown as string[]}
              planKey="basic"
              highlighted={false}
            />
            <PricingCard
              name={PLANS.pro.name}
              price={PLANS.pro.price}
              features={PLANS.pro.features as unknown as string[]}
              planKey="pro"
              highlighted={true}
            />
            <PricingCard
              name={PLANS.elite.name}
              price={PLANS.elite.price}
              features={PLANS.elite.features as unknown as string[]}
              planKey="elite"
              highlighted={false}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-surface">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            Ready to Stop Making Excuses?
          </h2>
          <p className="text-text-secondary text-xl mb-10">
            Your future self is waiting. Your AI coach is ready. The only
            question is — are you?
          </p>
          <Link
            href="/signup"
            className="inline-block px-10 py-5 bg-accent hover:bg-accent-hover text-white font-black text-xl rounded-xl transition-all duration-200 glow-green hover:scale-105"
          >
            Get Accountable Now — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="font-black text-xl">
            Hardflip<span className="text-accent">AI</span>
          </div>
          <div className="flex gap-6 text-text-secondary text-sm">
            <Link href="/pricing" className="hover:text-text-primary transition-colors">
              Pricing
            </Link>
            <Link href="/login" className="hover:text-text-primary transition-colors">
              Sign In
            </Link>
            <Link href="/signup" className="hover:text-text-primary transition-colors">
              Sign Up
            </Link>
          </div>
          <p className="text-text-muted text-sm">
            © 2024 Hardflip AI. No excuses.
          </p>
        </div>
      </footer>
    </div>
  );
}
