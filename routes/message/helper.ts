import { MultipartFile } from "@fastify/multipart";
import OpenAI from "openai";
import { extractDetailsFromLogPrompt } from "./prompt";
import { Tables } from "@/types/supabase-types";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

export const extractDetailsFromLog = async (log: string) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: extractDetailsFromLogPrompt },
      {
        role: "user",
        content: log,
      },
    ],
  });

  return completion.choices[0].message.content;
};
