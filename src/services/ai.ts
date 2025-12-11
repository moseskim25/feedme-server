/**
 * AI Service Module
 *
 * This module provides AI-powered functionality for the food tracking application:
 * - Food extraction from text messages
 * - Symptom detection from text
 * - Image generation for food items (using Google's Gemini Nano Banana)
 * - Food group serving calculations
 * - Daily nutrition feedback generation
 *
 * Technologies:
 * - OpenAI GPT models for text analysis
 * - Google Gemini (Nano Banana) for image generation
 * - Zod for schema validation
 */

import { openai } from "@/lib/openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import {
  extractFoodsPrompt,
  extractSymptomsPrompt,
  generateImageDescriptionPrompt,
  extractFoodGroupsPrompt,
} from "./ai-prompt";
import { Tables } from "@/types/supabase.types";
import { supabase } from "@/lib/supabase";
import { GoogleGenAI } from "@google/genai";

/**
 * Extracts a list of food items from a user's message using AI
 * @param message - The message object from the database containing user's text
 * @returns Array of food item names (e.g., ["pizza", "salad"])
 */
export const extractFoodFromMessage = async (message: Tables<"message">) => {
  const aiStart = Date.now();
  try {
    const completion = await openai.responses.parse<{
      foods: string[];
    }>({
      model: "gpt-5.1-chat-latest",
      input: [
        {
          role: "system",
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
    console.log(`[AI TIMING] extractFoodFromMessage: ${Date.now() - aiStart}ms`);

    const content = completion.output_parsed;

    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const listOfFoods = content.foods;

    return listOfFoods;
  } catch (error) {
    console.error(`[AI TIMING] extractFoodFromMessage failed after ${Date.now() - aiStart}ms:`, error);
    throw new Error("Failed to generate list of foods");
  }
};

/**
 * Extracts a list of symptoms from a user's message using AI
 * @param message - The raw message text from the user
 * @returns Array of symptom descriptions (e.g., ["headache", "nausea"])
 */
export const extractSymptomsFromMessage = async (message: string) => {
  const aiStart = Date.now();
  try {
    const completion = await openai.responses.parse<{
      symptoms: string[];
    }>({
      model: "gpt-5.1-chat-latest",
      input: [
        { role: "system", content: extractSymptomsPrompt() },
        { role: "user", content: message },
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
    console.log(`[AI TIMING] extractSymptomsFromMessage: ${Date.now() - aiStart}ms`);

    const content = completion.output_parsed;

    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    return content.symptoms;
  } catch (error) {
    console.error(`[AI TIMING] extractSymptomsFromMessage failed after ${Date.now() - aiStart}ms:`, error);
    throw error;
  }
};

/**
 * Generates a detailed description for food image generation
 * @param food - The name of the food item
 * @returns A detailed description optimized for image generation
 */
export const generateImageDescription = async (food: string) => {
  const aiStart = Date.now();
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1-chat-latest",
      messages: [
        { role: "system", content: generateImageDescriptionPrompt() },
        {
          role: "user",
          content: food,
        },
      ],
    });
    console.log(`[AI TIMING] generateImageDescription: ${Date.now() - aiStart}ms`);

    const content = completion.choices[0].message.content;

    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    return content;
  } catch (error) {
    console.error(`[AI TIMING] generateImageDescription failed after ${Date.now() - aiStart}ms:`, error);
    throw error;
  }
};

/**
 * Generates a food image using OpenAI's image generation API (legacy)
 * Note: This function is currently not in use. Use generateImageUsingNanoBanana instead.
 * @param description - The description of the image to generate
 * @returns OpenAI image generation response
 */
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

/**
 * Generates a food image using Google's Gemini Nano Banana model
 * This is the primary image generation function used in production.
 *
 * Flow:
 * 1. Initializes GoogleGenAI client with API key
 * 2. Calls gemini-2.5-flash-image model with description
 * 3. Extracts base64 image data from response
 * 4. Converts to Buffer for upload
 *
 * @param description - Detailed description of the food image to generate
 * @returns Buffer containing the generated PNG image data
 * @throws Error if image generation fails or no image data is received
 */
export const generateImageUsingNanoBanana = async (description: string) => {
  const aiStart = Date.now();
  try {
    // Initialize Google GenAI client with API key from environment
    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
    });

    // Call Gemini API to generate image
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: description,
    });
    console.log(`[AI TIMING] generateImageUsingNanoBanana: ${Date.now() - aiStart}ms`);

    // Validate response has candidates (Gemini returns multiple generation options)
    if (!response.candidates || !response.candidates[0]) {
      throw new Error("No candidates received from Nano Banana");
    }

    const candidate = response.candidates[0];

    // Validate candidate has content parts
    if (!candidate.content || !candidate.content.parts) {
      throw new Error("No content parts received from Nano Banana");
    }

    // Extract image data from inline data (base64 encoded)
    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        return buffer;
      }
    }

    throw new Error("No image data received from Nano Banana");
  } catch (error) {
    console.error(`[AI TIMING] generateImageUsingNanoBanana failed after ${Date.now() - aiStart}ms:`, error);
    throw new Error("Failed to generate image using Nano Banana");
  }
};

// Zod schema for parsing food servings response from AI
const extractFoodGroupsFormat = zodTextFormat(
  z.object({
    servings: z.array(
      z.object({
        foodGroup: z.string(),
        servings: z.number(),
      })
    ),
  }),
  "servings"
);

/**
 * Type definition for a food serving entry
 * Represents how many servings of a particular food group
 */
export type ExtractedServing = {
  foodGroup: string;  // e.g., "Vegetables", "Protein"
  servings: number;   // e.g., 1.5
};

/**
 * Extracts food group servings from a food description using AI
 * @param foodDescription - Description of the food item
 * @returns Array of food group servings (e.g., [{ foodGroup: "Protein", servings: 1 }])
 */
const extractServings = async (
  foodDescription: string
): Promise<ExtractedServing[]> => {
  const aiStart = Date.now();
  try {
    const { data: foodGroups, error } = await supabase
      .from("food_group")
      .select("name, description");

    if (error) throw error;

    const foodGroupsForPrompt = foodGroups
      ?.map((foodGroup) => `${foodGroup.name}`)
      .join(", ") + ".";

    const completion = await openai.responses.parse<{
      servings: ExtractedServing[];
    }>({
      model: "gpt-5.1-chat-latest",
      input: [
        {
          role: "system",
          content: extractFoodGroupsPrompt(foodGroupsForPrompt),
        },
        {
          role: "user",
          content: foodDescription,
        },
      ],
      text: {
        format: extractFoodGroupsFormat,
      },
    });
    console.log(`[AI TIMING] extractServings (${foodDescription}): ${Date.now() - aiStart}ms`);

    const content = completion.output_parsed;

    if (!content) throw new Error("No content received from OpenAI");

    return content.servings;
  } catch (error) {
    console.error(`[AI TIMING] extractServings (${foodDescription}) failed after ${Date.now() - aiStart}ms:`, error);
    throw error;
  }
};

export { extractServings };
