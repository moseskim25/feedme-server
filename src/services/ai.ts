// Helper functions to extract information from messages

import { openai } from "@/lib/openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  extractFoodsPrompt,
  extractSymptomsPrompt,
  generateFeedbackPrompt,
  generateImageDescriptionPrompt,
} from "./ai-prompt";
import { Tables } from "@/types/supabase.types";
import { supabase } from "@/lib/supabase";

export const extractFoodsFromMessage = async (message: Tables<"message">) => {
  try {
    const completion = await openai.responses.parse({
      model: "gpt-4o",
      input: [
        {
          role: "user",
          content: extractFoodsPrompt(message.content),
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
    console.log(content);

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

export const extractSymptomsFromMessage = async (message: string) => {
  const completion = await openai.responses.parse({
    model: "gpt-4o",
    input: [{ role: "user", content: extractSymptomsPrompt(message) }],
    text: {
      format: zodTextFormat(
        z.object({
          symptoms: z.array(z.string()),
        }),
        "anything"
      ),
    },
  });

  const content = completion.output_parsed;
  console.log(content);

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

export const generateFeedback = async (userId: string, logicalDate: string) => {
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
        {
          role: "user",
          content: generateFeedbackPrompt(
            foods.data.map((food) => food.description as string)
          ),
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

const extractFoodGroupServings = async (foodDescription: string) => {
  const { data: foodGroups, error } = await supabase
    .from("food_group")
    .select("*");

  if (error) throw error;

  const foodGroupsForPrompt = foodGroups
    ?.map((foodGroup) => foodGroup.name)
    .join(", ");

  const completion = await openai.responses.parse({
    model: "gpt-4o",
    input: [
      {
        role: "user",
        content: `
      You are a helpful assistant that extracts the food group and servings from a food item.
      The description of the food item is ${foodDescription}.

      The food groups are: ${foodGroupsForPrompt}.
      
      Return servings as numbers for each applicable food group.
      Only include food groups that are present in the food item.
      `,
      },
    ],
    text: {
      format: zodTextFormat(
        z.object({
          servings: z.array(
            z.object({
              foodGroup: z.string(),
              servings: z.number(),
            })
          ),
        }),
        "foodGroupServings"
      ),
    },
  });

  const content = completion.output_parsed;

  if (!content) {
    throw new Error("No content received from OpenAI");
  }

  console.log(content);

  return content.servings;
};

export { extractFoodGroupServings };
