"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PricingCardProps {
  name: string;
  price: number;
  features: string[];
  planKey: string;
  highlighted?: boolean;
  currentPlan?: string;
  isLoggedIn?: boolean;
}

export function PricingCard({
  name,
  price,
  features,
  planKey,
  highlighted = false,
  currentPlan,
  isLoggedIn = false,
}: PricingCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isCurrent = currentPlan === planKey;

  const handleSubscribe = async () => {
    if (!isLoggedIn) {
      router.push(`/signup?plan=${planKey}`);
      return;
    }

    if (isCurrent) return;

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to create checkout session.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const planColors: Record<string, string> = {
    basic: "primary",
    pro: "accent",
    elite: "warning",
  };
  const color = planColors[planKey] || "primary";

  return (
    <div
      className={`relative p-6 rounded-2xl border transition-all duration-200 flex flex-col ${
        highlighted
          ? `border-${color} bg-${color}/5 shadow-lg shadow-${color}/10`
          : "border-border bg-surface"
      }`}
    >
      {/* Popular badge */}
      {highlighted && (
        <div
          className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-${color} text-white text-xs font-bold`}
        >
          MOST POPULAR
        </div>
      )}

      {/* Plan name */}
      <div className="mb-6">
        <h3 className={`text-lg font-black text-${color} mb-1`}>{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-text-primary">
            ${price}
          </span>
          <span className="text-text-secondary text-sm">/month</span>
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5 text-sm">
            <span className={`text-${color} shrink-0 font-bold`}>✓</span>
            <span className="text-text-secondary">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={handleSubscribe}
        disabled={loading || isCurrent}
        className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-60 ${
          isCurrent
            ? "bg-surface-2 text-text-secondary border border-border cursor-default"
            : highlighted
            ? `bg-${color} hover:opacity-90 text-white hover:scale-105`
            : `border-2 border-${color} text-${color} hover:bg-${color}/10`
        }`}
      >
        {loading
          ? "Loading..."
          : isCurrent
          ? "Current Plan"
          : isLoggedIn
          ? `Upgrade to ${name}`
          : `Get ${name}`}
      </button>
    </div>
  );
}
