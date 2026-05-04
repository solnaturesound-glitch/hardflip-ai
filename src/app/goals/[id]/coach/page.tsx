import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChatInterface } from "@/components/ChatInterface";
import { Badge } from "@/components/ui/Badge";

export default async function CoachPage({
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
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!goal) notFound();

  const isOverdue =
    goal.nextCheckinAt && new Date(goal.nextCheckinAt) < new Date();

  const completedMilestones = goal.milestones.filter((m) => m.completed).length;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center gap-4 px-6 py-4 bg-surface border-b border-border shrink-0">
        <Link
          href={`/goals/${goal.id}`}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          ←
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-black text-accent">HARDFLIP</span>
            <span className="text-text-muted text-xs">AI COACH</span>
          </div>
          <h1 className="font-bold text-text-primary truncate">{goal.title}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isOverdue && <Badge variant="danger">Overdue</Badge>}
          {goal.milestones.length > 0 && (
            <Badge variant="default">
              {completedMilestones}/{goal.milestones.length} milestones
            </Badge>
          )}
          <Badge variant="primary" className="capitalize">
            {goal.frequency} check-in
          </Badge>
        </div>
      </div>

      {/* Chat interface fills remaining height */}
      <div className="flex-1 min-h-0">
        <ChatInterface
          goalId={goal.id}
          initialMessages={goal.messages.map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
            createdAt: m.createdAt,
          }))}
          goalTitle={goal.title}
          milestones={goal.milestones}
        />
      </div>
    </div>
  );
}
