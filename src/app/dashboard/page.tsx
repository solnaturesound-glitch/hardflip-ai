import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GoalCard } from "@/components/GoalCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getPlanLimits } from "@/lib/stripe";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      goals: {
        include: {
          milestones: {
            orderBy: { order: "asc" },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: {
            select: { messages: true, milestones: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!user) redirect("/login");

  const now = new Date();
  const activeGoals = user.goals.filter((g) => g.status !== "completed" && g.status !== "abandoned");
  const completedGoals = user.goals.filter((g) => g.status === "completed");
  const overdueGoals = activeGoals.filter(
    (g) => g.nextCheckinAt && new Date(g.nextCheckinAt) < now
  );

  const planLimits = getPlanLimits(user.plan);
  const canAddGoal =
    planLimits.goals === -1 || activeGoals.length < planLimits.goals;

  const planColors: Record<string, string> = {
    free: "default",
    basic: "primary",
    pro: "accent",
    elite: "warning",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-black text-text-primary">
              {user.name ? `Hey, ${user.name.split(" ")[0]}.` : "Your Dashboard."}
            </h1>
            <p className="text-text-secondary mt-1">
              {overdueGoals.length > 0 ? (
                <span className="text-danger font-semibold">
                  ⚠️ {overdueGoals.length} goal
                  {overdueGoals.length > 1 ? "s are" : " is"} overdue for
                  check-in.
                </span>
              ) : activeGoals.length > 0 ? (
                "You're on track. Keep going."
              ) : (
                "No active goals. Time to set one."
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={planColors[user.plan] as "default" | "primary" | "accent" | "warning" | "danger"}>
              {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} Plan
            </Badge>
            {canAddGoal ? (
              <Link href="/goals/new">
                <Button variant="accent" size="md">
                  + New Goal
                </Button>
              </Link>
            ) : (
              <Link href="/pricing">
                <Button variant="outline" size="md">
                  Upgrade to Add More
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Active Goals", value: activeGoals.length, color: "text-primary" },
            {
              label: "Overdue Check-ins",
              value: overdueGoals.length,
              color: overdueGoals.length > 0 ? "text-danger" : "text-text-secondary",
            },
            { label: "Completed", value: completedGoals.length, color: "text-accent" },
            {
              label: "Goal Limit",
              value: planLimits.goals === -1 ? "∞" : planLimits.goals,
              color: "text-warning",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-5 rounded-xl bg-surface border border-border"
            >
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-text-secondary text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Overdue section */}
        {overdueGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-danger mb-4 flex items-center gap-2">
              <span>⚠️</span> Overdue Check-ins
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {overdueGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal as Parameters<typeof GoalCard>[0]["goal"]} overdue={true} />
              ))}
            </div>
          </div>
        )}

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4">Active Goals</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {activeGoals
                .filter((g) => !overdueGoals.find((o) => o.id === g.id))
                .map((goal) => (
                  <GoalCard key={goal.id} goal={goal as Parameters<typeof GoalCard>[0]["goal"]} />
                ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {user.goals.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-6">🎯</div>
            <h2 className="text-2xl font-black mb-3">No goals yet.</h2>
            <p className="text-text-secondary mb-8 max-w-md mx-auto">
              Every achievement starts with a goal. Set yours now, and your AI
              coach will make sure you follow through.
            </p>
            <Link href="/goals/new">
              <Button variant="accent" size="lg">
                Set Your First Goal
              </Button>
            </Link>
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-accent mb-4">
              ✅ Completed Goals ({completedGoals.length})
            </h2>
            <div className="grid md:grid-cols-2 gap-4 opacity-75">
              {completedGoals.map((goal) => (
                <GoalCard key={goal.id} goal={goal as Parameters<typeof GoalCard>[0]["goal"]} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
