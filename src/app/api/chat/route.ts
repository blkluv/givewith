import { NextRequest, NextResponse } from "next/server";
import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  type UIMessage,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { adminDb } from "@/lib/firebase-admin";
import { verifyAuth } from "@/lib/auth";
import { decrypt } from "@/lib/encrypt";
import { buildAgentTools } from "@/lib/agent/tools";
import { getSystemPrompt } from "@/lib/agent/system-prompt";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let decoded;
  try {
    decoded = await verifyAuth(req);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
  if (!userDoc.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const userData = userDoc.data()!;
  let userApiKey: string;
  try {
    userApiKey = decrypt(userData.locusApiKey as string);
  } catch {
    return NextResponse.json(
      { error: "Failed to decrypt user Locus API key" },
      { status: 500 },
    );
  }
  const platformApiKey = process.env.LOCUS_PLATFORM_API_KEY;
  const thesysApiKey = process.env.THESYS_API_KEY;

  if (!platformApiKey || !thesysApiKey) {
    return NextResponse.json(
      {
        error:
          "Server misconfigured: missing LOCUS_PLATFORM_API_KEY or THESYS_API_KEY",
      },
      { status: 500 },
    );
  }

  const body = (await req.json()) as { messages: UIMessage[] };
  const messages = body.messages ?? [];

  const tools = buildAgentTools(
    {
      userId: decoded.uid,
      userApiKey,
      platformApiKey,
    },
    // Actions are ephemeral per request; we no longer persist chat sessions
    // (hackathon scope — every page load is a fresh thread).
    () => undefined,
  );

  const model = createOpenAI({
    apiKey: thesysApiKey,
    baseURL: "https://api.thesys.dev/v1/embed",
  }).chat("c1/google/gemini-3-flash/v-20251230");

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model,
    system: getSystemPrompt(),
    messages: modelMessages,
    tools,
    // Cap the tool-calling loop to keep responses snappy for the demo.
    stopWhen: stepCountIs(6),
  });

  return result.toUIMessageStreamResponse();
}
