import { supabase } from "@/lib/supabase";
import { aiPrompt } from "./prompt";
import { openai } from "@/lib/openai";
import { Tables } from "@/types/supabase-types";
import { User } from "@supabase/supabase-js";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export const analyzeEntryUsingOpenAI = async (userId: User["id"]) => {
  const { data } = await supabase
    .from("message")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const previousMessages = (data ?? []).reverse();

  // Ensure first message is from user
  if (previousMessages.length > 0 && previousMessages[0].role !== "user") {
    previousMessages.shift();
  }

  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: aiPrompt(),
    },
    ...previousMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
  });

  const response = completion.choices[0].message.content;

  return response;
};
