import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import GoalActions from "./GoalActions";

export default async function GoalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const goal = await prisma.goal.findUnique({
    where: { id: params.id, userId: session.user.id },
    include: {
      milestones: { orderBy: { order: "asc" } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      _count: { select: { messages: true } },
    },
  });

  if (!goal) notFound();

  const completedMilestones = goal.milestones.filter((m) => m.completed).length;
  const progress =
    goal.milestones.length > 0
      ? Math.round((completedMilestones / goal.milestones.length) * 100)
      : 0;

  const isOverdue =
    goal.nextCheckinAt && new Date(goal.nextCheckinAt) < new Date();

  const statusColors: Record<string, "default" | "primary" | "accent" | "warning" | "danger"> = {
    active: "primary",
    "in-progress": "warning",
    completed: "accent",
    abandoned: "danger",
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "None";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelative = (date: Date | null) => {
    if (!date) return null;
    const now = new Date();
    const diff = new Date(date).getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return "Due today";
    if (days === 1) return "Due tomorrow";
    return `${days} days remaining`;
  };

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back */}
        <Link
          href="/dashboard"
          className="text-text-secondary hover:text-text-primary text-sm inline-flex items-center gap-1 mb-6 transition-colors"
        >
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant={statusColors[goal.status] || "default"}>
                {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
              </Badge>
              {goal.category && (
                <Badge variant="default">{goal.category}</Badge>
              )}
              {isOverdue && (
                <Badge variant="danger">⚠️ Overdue Check-in</Badge>
              )}
            </div>
            <h1 className="text-3xl font-black text-text-primary">{goal.title}</h1>
            {goal.description && (
              <p className="text-text-secondary mt-2 leading-relaxed">
                {goal.description}
              </p>
            )}
          </div>
          <div className="flex gap-3 items-start">
            <Link href={`/goals/${goal.id}/coach`}>
              <Button variant="primary" size="md">
                💬 Talk to Coach
              </Button>
            </Link>
            <GoalActions goalId={goal.id} currentStatus={goal.status} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="md:col-span-2 space-y-6">
            {/* Progress */}
            {goal.milestones.length > 0 && (
              <div className="p-6 rounded-2xl bg-surface border border-border">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-bold text-lg">Progress</h2>
                  <span className="text-2xl font-black text-primary">{progress}%</span>
                </div>
                <div className="w-full h-3 bg-surface-2 rounded-full overflow-hidden mb-6">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <h3 className="font-semibold mb-4 text-text-secondary text-sm uppercase tracking-wide">
                  Milestones
                </h3>
                <div className="space-y-3">
                  {goal.milestones.map((milestone, index) => (
                    <div
                      key={milestone.id}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                        milestone.completed
                          ? "bg-accent/10 border border-accent/20"
                          : "bg-surface-2 border border-border"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          milestone.completed
                            ? "bg-accent text-white"
                            : "bg-border text-text-secondary"
                        }`}
                      >
                        {milestone.completed ? "✓" : index + 1}
                      </div>
                      <span
                        className={`text-sm ${
                          milestone.completed
                            ? "text-accent line-through opacity-75"
                            : "text-text-primary"
                        }`}
                      >
                        {milestone.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Conversation */}
            {goal._count.messages > 0 && (
              <div className="p-6 rounded-2xl bg-surface border border-border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-lg">Recent Coaching</h2>
                  <Link href={`/goals/${goal.id}/coach`}>
                    <button className="text-primary text-sm hover:underline">
                      View all {goal._count.messages} messages →
                    </button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {[...goal.messages].reverse().map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-xl text-sm ${
                        msg.role === "assistant"
                          ? "bg-primary/10 border border-primary/20 text-text-primary"
                          : "bg-surface-2 border border-border text-text-secondary"
                      }`}
                    >
                      <div className="font-semibold text-xs mb-1 uppercase tracking-wide opacity-60">
                        {msg.role === "assistant" ? "Coach" : "You"}
                      </div>
                      <p className="leading-relaxed line-clamp-3">{msg.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {goal._count.messages === 0 && (
              <div className="p-8 rounded-2xl bg-surface border border-border text-center">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="font-bold mb-2">Start Talking to Your Coach</h3>
                <p className="text-text-secondary text-sm mb-4">
                  Your AI accountability coach is ready to break down your goal
                  and get you started.
                </p>
                <Link href={`/goals/${goal.id}/coach`}>
                  <Button variant="primary">Start Coaching Session</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Details */}
            <div className="p-5 rounded-2xl bg-surface border border-border">
              <h3 className="font-bold mb-4 text-sm uppercase tracking-wide text-text-secondary">
                Goal Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Frequency</span>
                  <span className="font-semibold capitalize">{goal.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Deadline</span>
                  <span className="font-semibold">{formatDate(goal.deadline)}</span>
                </div>
                {goal.deadline && (
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Time left</span>
                    <span
                      className={`font-semibold ${
                        formatRelative(goal.deadline)?.includes("overdue")
                          ? "text-danger"
                          : "text-accent"
                      }`}
                    >
                      {formatRelative(goal.deadline)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-secondary">Next check-in</span>
                  <span
                    className={`font-semibold ${isOverdue ? "text-danger" : ""}`}
                  >
                    {goal.nextCheckinAt
                      ? new Date(goal.nextCheckinAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Not scheduled"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Sessions</span>
                  <span className="font-semibold">{goal._count.messages}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Created</span>
                  <span className="font-semibold">{formatDate(goal.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Quick action */}
            <div className="p-5 rounded-2xl bg-primary/10 border border-primary/30">
              <h3 className="font-bold mb-2 text-primary">Ready to check in?</h3>
              <p className="text-sm text-text-secondary mb-4">
                Your coach is waiting. Talk through your progress, blockers, or
                next steps.
              </p>
              <Link href={`/goals/${goal.id}/coach`} className="block">
                <Button variant="primary" className="w-full">
                  Open Coach →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
