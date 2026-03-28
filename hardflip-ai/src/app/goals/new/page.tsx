"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const CATEGORIES = [
  "Health & Fitness",
  "Career & Business",
  "Learning & Education",
  "Finance",
  "Relationships",
  "Creative Projects",
  "Personal Development",
  "Other",
];

const FREQUENCIES = [
  { value: "daily", label: "Daily", description: "Check in every day" },
  { value: "weekly", label: "Weekly", description: "Check in every week" },
  { value: "biweekly", label: "Bi-weekly", description: "Check in twice a week" },
];

export default function NewGoalPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    deadline: "",
    frequency: "daily",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Goal title is required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          category: form.category || undefined,
          deadline: form.deadline || undefined,
          frequency: form.frequency,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create goal.");
      } else {
        router.push(`/goals/${data.id}/coach`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-text-secondary hover:text-text-primary text-sm mb-4 inline-flex items-center gap-1 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black mt-4">Set a New Goal</h1>
          <p className="text-text-secondary mt-2">
            Be specific. Vague goals lead to vague results. Your AI coach will
            hold you to exactly what you write here.
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                What&apos;s your goal? <span className="text-danger">*</span>
              </label>
              <Input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g., Run a 5K in under 30 minutes by March"
                required
                autoFocus
              />
              <p className="text-xs text-text-muted mt-1">
                Be specific. &quot;Get fit&quot; is not a goal. &quot;Run 5K in under 30 min&quot; is.
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Why does this matter to you?
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Your motivation, context, or what success looks like..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
              />
              <p className="text-xs text-text-muted mt-1">
                Your coach will use this to push you harder on bad days.
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl bg-surface-2 border border-border text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="">Select a category...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Deadline
              </label>
              <Input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                min={minDate.toISOString().split("T")[0]}
              />
              <p className="text-xs text-text-muted mt-1">
                No deadline = no urgency. Set one.
              </p>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-semibold text-text-primary mb-3">
                Check-in Frequency
              </label>
              <div className="grid grid-cols-3 gap-3">
                {FREQUENCIES.map((freq) => (
                  <button
                    key={freq.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, frequency: freq.value }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.frequency === freq.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface-2 text-text-secondary hover:border-border/80"
                    }`}
                  >
                    <div className="font-semibold text-sm">{freq.label}</div>
                    <div className="text-xs mt-1 opacity-75">{freq.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
              variant="primary"
            >
              {loading
                ? "Setting up your goal..."
                : "Set Goal & Meet Your Coach →"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
