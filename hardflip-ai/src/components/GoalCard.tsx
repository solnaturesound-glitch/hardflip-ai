import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

interface Milestone {
  id: string;
  completed: boolean;
}

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

interface Goal {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  status: string;
  frequency: string;
  deadline?: Date | null;
  nextCheckinAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  milestones: Milestone[];
  messages?: Message[];
  _count?: {
    messages: number;
    milestones?: number;
  };
}

interface GoalCardProps {
  goal: Goal;
  overdue?: boolean;
}

export function GoalCard({ goal, overdue = false }: GoalCardProps) {
  const completedMilestones = goal.milestones.filter((m) => m.completed).length;
  const totalMilestones = goal.milestones.length;
  const progress =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  const statusConfig: Record<string, { color: "default" | "primary" | "accent" | "warning" | "danger"; label: string }> = {
    active: { color: "primary", label: "Active" },
    "in-progress": { color: "warning", label: "In Progress" },
    completed: { color: "accent", label: "Completed" },
    abandoned: { color: "danger", label: "Abandoned" },
  };

  const status = statusConfig[goal.status] || { color: "default" as const, label: goal.status };

  const getCheckinText = () => {
    if (!goal.nextCheckinAt) return null;
    const now = new Date();
    const checkin = new Date(goal.nextCheckinAt);
    const diff = checkin.getTime() - now.getTime();
    const hours = Math.floor(Math.abs(diff) / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (diff < 0) {
      if (days > 0) return `${days}d overdue`;
      return `${hours}h overdue`;
    }
    if (days > 0) return `in ${days}d`;
    if (hours > 0) return `in ${hours}h`;
    return "now";
  };

  const checkinText = getCheckinText();

  return (
    <Link
      href={`/goals/${goal.id}`}
      className={`block p-6 rounded-2xl border transition-all duration-200 card-hover ${
        overdue
          ? "bg-danger/5 border-danger/30 hover:border-danger/50"
          : "bg-surface border-border hover:border-primary/30"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant={status.color}>{status.label}</Badge>
            {goal.category && (
              <span className="text-xs text-text-muted">{goal.category}</span>
            )}
          </div>
          <h3 className="font-bold text-text-primary leading-snug line-clamp-2">
            {goal.title}
          </h3>
        </div>
        {overdue && (
          <span className="text-danger shrink-0 text-lg">⚠️</span>
        )}
      </div>

      {/* Description */}
      {goal.description && (
        <p className="text-text-secondary text-sm mb-4 line-clamp-2 leading-relaxed">
          {goal.description}
        </p>
      )}

      {/* Progress bar */}
      {totalMilestones > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-text-muted mb-1.5">
            <span>{completedMilestones}/{totalMilestones} milestones</span>
            <span className="font-semibold">{progress}%</span>
          </div>
          <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                progress === 100
                  ? "bg-accent"
                  : overdue
                  ? "bg-danger"
                  : "bg-primary"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center gap-3">
          {goal._count && (
            <span>💬 {goal._count.messages} messages</span>
          )}
          <span className="capitalize">📅 {goal.frequency}</span>
        </div>
        {checkinText && (
          <span className={overdue ? "text-danger font-semibold" : "text-text-secondary"}>
            Check-in {checkinText}
          </span>
        )}
      </div>
    </Link>
  );
}
