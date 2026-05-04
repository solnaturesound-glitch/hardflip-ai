import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goal = await prisma.goal.findUnique({
    where: { id: params.id, userId: session.user.id },
    include: {
      milestones: { orderBy: { order: "asc" } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!goal) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  }

  return NextResponse.json(goal);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      category,
      deadline,
      frequency,
      status,
      nextCheckinAt,
    } = body;

    const goal = await prisma.goal.findUnique({
      where: { id: params.id, userId: session.user.id },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found." }, { status: 404 });
    }

    const updated = await prisma.goal.update({
      where: { id: params.id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(category !== undefined && { category: category || null }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(frequency !== undefined && { frequency }),
        ...(status !== undefined && { status }),
        ...(nextCheckinAt !== undefined && {
          nextCheckinAt: nextCheckinAt ? new Date(nextCheckinAt) : null,
        }),
      },
      include: {
        milestones: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update goal error:", error);
    return NextResponse.json(
      { error: "Failed to update goal." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goal = await prisma.goal.findUnique({
    where: { id: params.id, userId: session.user.id },
  });

  if (!goal) {
    return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  }

  await prisma.goal.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}

// Milestone update endpoint
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { milestoneId, completed } = await req.json();

    const goal = await prisma.goal.findUnique({
      where: { id: params.id, userId: session.user.id },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found." }, { status: 404 });
    }

    const milestone = await prisma.milestone.update({
      where: { id: milestoneId, goalId: params.id },
      data: { completed },
    });

    // Update goal status to in-progress when first milestone is checked
    if (completed && goal.status === "active") {
      await prisma.goal.update({
        where: { id: params.id },
        data: { status: "in-progress" },
      });
    }

    return NextResponse.json(milestone);
  } catch (error) {
    console.error("Update milestone error:", error);
    return NextResponse.json(
      { error: "Failed to update milestone." },
      { status: 500 }
    );
  }
}
