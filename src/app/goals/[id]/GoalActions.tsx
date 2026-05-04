"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface GoalActionsProps {
  goalId: string;
  currentStatus: string;
}

export default function GoalActions({ goalId, currentStatus }: GoalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const updateStatus = async (status: string) => {
    setLoading(true);
    try {
      await fetch(`/api/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const deleteGoal = async () => {
    if (!confirm("Delete this goal? This cannot be undone.")) return;
    setLoading(true);
    try {
      await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="md"
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
      >
        ⋯ Actions
      </Button>
      {showMenu && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-surface-2 border border-border rounded-xl shadow-xl z-10 overflow-hidden animate-fade-in">
          {currentStatus !== "in-progress" && (
            <button
              onClick={() => updateStatus("in-progress")}
              className="w-full px-4 py-3 text-left text-sm hover:bg-border transition-colors text-text-primary"
            >
              Mark In Progress
            </button>
          )}
          {currentStatus !== "completed" && (
            <button
              onClick={() => updateStatus("completed")}
              className="w-full px-4 py-3 text-left text-sm hover:bg-border transition-colors text-accent"
            >
              ✅ Mark Completed
            </button>
          )}
          {currentStatus !== "abandoned" && (
            <button
              onClick={() => updateStatus("abandoned")}
              className="w-full px-4 py-3 text-left text-sm hover:bg-border transition-colors text-warning"
            >
              Abandon Goal
            </button>
          )}
          {currentStatus !== "active" && (
            <button
              onClick={() => updateStatus("active")}
              className="w-full px-4 py-3 text-left text-sm hover:bg-border transition-colors text-primary"
            >
              Reactivate
            </button>
          )}
          <div className="border-t border-border" />
          <button
            onClick={deleteGoal}
            className="w-full px-4 py-3 text-left text-sm hover:bg-border transition-colors text-danger"
          >
            🗑️ Delete Goal
          </button>
        </div>
      )}
    </div>
  );
}
