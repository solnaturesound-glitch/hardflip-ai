import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const COACH_SYSTEM_PROMPT = `You are an uncompromising accountability coach for Hardflip AI. Your job is to push the user to complete their goals. You are encouraging but ruthless — you won't accept excuses, and you'll call out when someone is about to quit. You ask tough questions, provide specific action steps, and follow up on previous commitments. Never let the user off the hook.

Key behaviors:
- Always reference the specific goal the user is working on
- Ask about previous action items before moving forward
- Provide concrete, specific next steps (not vague advice)
- Call out procrastination, excuses, or avoidance directly but with empathy
- Celebrate wins but immediately pivot to what's next
- Keep responses focused and actionable (aim for 150-300 words)
- End every response with a direct question or challenge that requires commitment

Remember: You are their coach, not their friend. Friends let you slide. Coaches make you better.`;

export const MODEL = "claude-sonnet-4-6";

export async function generateCoachResponse(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  goalContext: string
): Promise<string> {
  const systemWithContext = `${COACH_SYSTEM_PROMPT}

Current Goal Context:
${goalContext}`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemWithContext,
    messages,
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from AI");
  }

  return content.text;
}

export async function generateFollowUpSchedule(
  goalTitle: string,
  frequency: string,
  deadline: string | null
): Promise<{ nextCheckinAt: Date; schedule: string }> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [
      {
        role: "user",
        content: `For a goal titled "${goalTitle}" with ${frequency} check-ins${deadline ? ` and deadline ${deadline}` : ""}, when should the next check-in be? Reply in JSON format only: {"nextCheckinHours": <number>, "schedule": "<brief description>"}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  try {
    const parsed = JSON.parse(content.text.replace(/```json\n?|\n?```/g, "").trim());
    const nextCheckinAt = new Date();
    nextCheckinAt.setHours(nextCheckinAt.getHours() + (parsed.nextCheckinHours || 24));
    return { nextCheckinAt, schedule: parsed.schedule || `${frequency} check-in` };
  } catch {
    const nextCheckinAt = new Date();
    nextCheckinAt.setHours(nextCheckinAt.getHours() + (frequency === "daily" ? 24 : 168));
    return { nextCheckinAt, schedule: `${frequency} check-in` };
  }
}

export async function generateMilestones(
  goalTitle: string,
  goalDescription: string,
  deadline: string | null
): Promise<Array<{ title: string; order: number }>> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Break down this goal into 5 concrete, measurable milestones:
Goal: "${goalTitle}"
Description: "${goalDescription || "No description provided"}"
${deadline ? `Deadline: ${deadline}` : ""}

Reply in JSON format only: {"milestones": [{"title": "<milestone>", "order": <1-5>}, ...]}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type");
  }

  try {
    const parsed = JSON.parse(content.text.replace(/```json\n?|\n?```/g, "").trim());
    return parsed.milestones || [];
  } catch {
    return [
      { title: "Define initial action plan", order: 1 },
      { title: "Complete first 25% of work", order: 2 },
      { title: "Reach the halfway point", order: 3 },
      { title: "Complete 75% of work", order: 4 },
      { title: "Achieve final goal", order: 5 },
    ];
  }
}
