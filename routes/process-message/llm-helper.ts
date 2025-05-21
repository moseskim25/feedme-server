// Helper functions to extract information from messages

import { openai } from "@/lib/openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  extractFoodsPrompt,
  extractSymptomsPrompt,
  generateImagePrompt,
} from "./llm-prompts";
import { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentTime } from "@/lib/utils/date.utils";

export const extractFoodsFromMessages = async (
  messages: {
    role: "user" | "system";
    content: string;
  }[]
) => {
  try {
    const completion = await openai.responses.parse({
      model: "gpt-4o",
      input: [
        ...messages,
        {
          role: "user",
          content: extractFoodsPrompt,
        },
      ],
      text: {
        format: zodTextFormat(
          z.object({
            foods: z.array(z.string()),
          }),
          "listOfFoods"
        ),
      },
    });

    const content = completion.output_parsed;

    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const listOfFoods = content.foods;

    return listOfFoods;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to generate list of foods");
  }
};

export const extractSymptomsFromMessages = async (
  messages: {
    role: "user" | "system";
    content: string;
  }[]
) => {
  const completion = await openai.responses.parse({
    model: "gpt-4o",
    input: [...messages, { role: "user", content: extractSymptomsPrompt }],
    text: {
      format: zodTextFormat(
        z.object({
          symptoms: z.array(z.string()),
        }),
        "symptoms"
      ),
    },
  });

  const content = completion.output_parsed;

  if (!content) {
    throw new Error("No content received from OpenAI");
  }

  const symptoms = content.symptoms;

  console.log("symptoms", symptoms);

  return symptoms;
};

export const generateImage = async (food: string) => {
  try {
    const image = await openai.images.generate({
      model: "gpt-image-1",
      prompt: generateImagePrompt(food),
      size: "1024x1024",
      quality: "medium",
    });

    if (image?.data?.length) {
      return image;
    }

    throw new Error("No image data received from OpenAI");
  } catch (error) {
    console.error(error);
    throw new Error("Failed to generate image");
  }
};

export const generateFeedback = async (
  supabase: SupabaseClient,
  userId: string,
  logicalDate: string
) => {
  const messages = await supabase
    .from("message")
    .select("*")
    .eq("user_id", userId)
    .eq("logical_date", logicalDate)
    .is("is_processed", false)
    .order("created_at", { ascending: true });

  if (messages.error || !messages.data || messages.data.length === 0) {
    console.error(messages.error);
    throw new Error("Failed to get messages");
  }

  try {
    const feedbackChatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        ...messages.data.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        {
          role: "user",
          content: `Based on this conversation, provide feedback on my diet keeping in mind the time of day is ${getCurrentTime()}. Keep it relatively short and concise. Your response should be in one paragraph.`,
        },
      ],
    });

    const feedbackChatCompletionResponse =
      feedbackChatCompletion.choices[0].message.content;

    if (!feedbackChatCompletionResponse) {
      throw new Error("No feedback received from OpenAI");
    }

    return feedbackChatCompletionResponse;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to generate feedback");
  }
};
