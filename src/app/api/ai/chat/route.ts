import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCoachResponse, generateFollowUpSchedule } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { goalId, message } = await req.json();

    if (!goalId || !message?.trim()) {
      return NextResponse.json(
        { error: "goalId and message are required." },
        { status: 400 }
      );
    }

    // Fetch the goal and its history
    const goal = await prisma.goal.findUnique({
      where: { id: goalId, userId: session.user.id },
      include: {
        milestones: { orderBy: { order: "asc" } },
        messages: {
          orderBy: { createdAt: "asc" },
          take: 50, // Last 50 messages for context
        },
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found." }, { status: 404 });
    }

    // Build context string for the AI
    const completedMilestones = goal.milestones.filter((m) => m.completed);
    const pendingMilestones = goal.milestones.filter((m) => !m.completed);

    const goalContext = `
Goal: ${goal.title}
Description: ${goal.description || "No description provided"}
Category: ${goal.category || "Uncategorized"}
Status: ${goal.status}
Frequency: ${goal.frequency} check-ins
Deadline: ${goal.deadline ? goal.deadline.toLocaleDateString() : "No deadline set"}
Created: ${goal.createdAt.toLocaleDateString()}

Milestones Progress:
Completed (${completedMilestones.length}/${goal.milestones.length}):
${completedMilestones.map((m) => `  ✓ ${m.title}`).join("\n") || "  None yet"}

Pending:
${pendingMilestones.map((m, i) => `  ${i + 1}. ${m.title}`).join("\n") || "  No milestones defined"}

Last check-in was scheduled: ${goal.nextCheckinAt ? goal.nextCheckinAt.toLocaleDateString() : "Not yet scheduled"}
`.trim();

    // Build message history for AI
    const messageHistory = goal.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Add the new user message
    messageHistory.push({ role: "user", content: message.trim() });

    // Save user message to DB
    await prisma.message.create({
      data: {
        goalId,
        role: "user",
        content: message.trim(),
      },
    });

    // Generate AI response
    const aiResponse = await generateCoachResponse(messageHistory, goalContext);

    // Save AI response to DB
    const savedMessage = await prisma.message.create({
      data: {
        goalId,
        role: "assistant",
        content: aiResponse,
      },
    });

    // Update next check-in time and goal status
    const { nextCheckinAt } = await generateFollowUpSchedule(
      goal.title,
      goal.frequency,
      goal.deadline ? goal.deadline.toLocaleDateString() : null
    );

    await prisma.goal.update({
      where: { id: goalId },
      data: {
        nextCheckinAt,
        status: goal.status === "active" ? "in-progress" : goal.status,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: savedMessage.id,
      role: "assistant",
      content: aiResponse,
      createdAt: savedMessage.createdAt,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "Failed to get response from AI coach." },
      { status: 500 }
    );
  }
}
