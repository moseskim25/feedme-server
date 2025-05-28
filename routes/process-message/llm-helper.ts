// Helper functions to extract information from messages

import { openai } from "@/lib/openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  extractFoodsPrompt,
  extractSymptomsPrompt,
  generateFeedbackPrompt,
  generateImagePrompt,
  generateImageDescriptionPrompt,
} from "./llm-prompts";
import { SupabaseClient } from "@supabase/supabase-js";
import { getCurrentTime } from "@/lib/utils/date.utils";
import { Database, Tables } from "@/types/supabase.types";

export const extractFoodsFromMessage = async (message: Tables<"message">) => {
  try {
    const completion = await openai.responses.parse({
      model: "gpt-4o",
      input: [
        {
          role: message.role as "user" | "system",
          content: message.content,
        },
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

    console.log(listOfFoods);

    return listOfFoods;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to generate list of foods");
  }
};

export const extractSymptomsFromMessage = async (
  message: Tables<"message">
) => {
  const completion = await openai.responses.parse({
    model: "gpt-4o",
    input: [
      {
        role: message.role as "user" | "system",
        content: message.content,
      },
      { role: "user", content: extractSymptomsPrompt },
    ],
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

  return symptoms;
};

export const generateImageDescription = async (food: string) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: generateImageDescriptionPrompt(food) }],
  });

  const content = completion.choices[0].message.content;

  if (!content) {
    throw new Error("No content received from OpenAI");
  }

  return content;
};

export const generateImage = async (description: string) => {
  try {
    const image = await openai.images.generate({
      model: "gpt-image-1",
      prompt: description,
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
  supabase: SupabaseClient<Database>,
  userId: string,
  logicalDate: string
) => {
  const foods = await supabase
    .from("food")
    .select("*")
    .eq("user_id", userId)
    .eq("logical_date", logicalDate)
    .order("created_at", { ascending: true });

  if (foods.error || !foods.data) {
    console.error(foods.error);
    throw new Error("Failed to get foods");
  }

  try {
    const feedbackChatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        ...foods.data.map((food) => ({
          role: "user" as "user",
          content: food.description as string,
        })),
        {
          role: "user",
          content: generateFeedbackPrompt(),
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
