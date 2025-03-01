import { MultipartFile } from "@fastify/multipart";
import OpenAI from "openai";
import { extractDetailsFromLogPrompt, nutritionExpertPrompt } from "./prompt";
import { Tables } from "@/types/supabase-types";
import { supabase } from "@/lib/supabase";

const openai = new OpenAI({ apiKey: process.env.OPENAI_SECRET_KEY });

export const analyzeWithPerplexity = async (text: string) => {
  const body = {
    model: "sonar",
    messages: [
      {
        role: "system",
        content: nutritionExpertPrompt(),
      },
      {
        role: "user",
        content: text,
      },
    ],
    max_tokens: 200,
    temperature: 0.2,
    top_p: 0.9,
    search_domain_filter: null,
    return_images: false,
    return_related_questions: false,
    search_recency_filter: null,
    top_k: 0,
    stream: false,
    presence_penalty: 0,
    frequency_penalty: 1,
    response_format: null,
  };

  const options = {
    method: "POST",
    headers: {
      Authorization: `Bearer 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`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  };

  let perplexityRequest = await fetch(
    "https://api.perplexity.ai/chat/completions",
    options
  );

  const completion = await perplexityRequest.json();

  return completion.choices[0].message.content;
};

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

