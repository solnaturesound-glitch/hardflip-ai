import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canCreateGoal } from "@/lib/stripe";
import { generateFollowUpSchedule, generateMilestones } from "@/lib/anthropic";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    include: {
      milestones: { orderBy: { order: "asc" } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, category, deadline, frequency } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Goal title is required." },
        { status: 400 }
      );
    }

    // Check plan limits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        _count: {
          select: {
            goals: {
              where: { status: { in: ["active", "in-progress"] } },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (!canCreateGoal(user.plan, user._count.goals)) {
      return NextResponse.json(
        {
          error: `You've reached the goal limit for the ${user.plan} plan. Upgrade to add more goals.`,
          code: "PLAN_LIMIT",
        },
        { status: 403 }
      );
    }

    // Generate initial data with AI (in parallel)
    const deadlineStr = deadline
      ? new Date(deadline).toLocaleDateString()
      : null;

    const [scheduleResult, milestoneData] = await Promise.all([
      generateFollowUpSchedule(title, frequency || "daily", deadlineStr),
      generateMilestones(title, description || "", deadlineStr),
    ]);

    // Create goal with milestones
    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        category: category || null,
        deadline: deadline ? new Date(deadline) : null,
        frequency: frequency || "daily",
        status: "active",
        nextCheckinAt: scheduleResult.nextCheckinAt,
        milestones: {
          create: milestoneData.map((m) => ({
            title: m.title,
            order: m.order,
            completed: false,
          })),
        },
      },
      include: {
        milestones: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("Create goal error:", error);
    return NextResponse.json(
      { error: "Failed to create goal." },
      { status: 500 }
    );
  }
}
